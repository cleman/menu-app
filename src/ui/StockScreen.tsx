import { useContext, useState } from 'preact/hooks';
import { db } from '../db/db';
import type { Level, StockItem } from '../db/types';
import { AISLES } from '../data/ingredients';
import { parseLine } from '../domain/parser';
import { isStale } from '../domain/stock';
import { EDIT_UNITS, formatQty, toBase, baseUnit } from '../domain/units';
import { CatCtx, Empty, Loading, Seg, Sheet, toast, useLive } from './kit';

const LV: [Level, string][] = [['have', "J'ai"], ['low', 'Peu'], ['out', 'Plus']];

export function StockScreen() {
  const { cat } = useContext(CatCtx);
  const stock = useLive(() => db.stock.toArray(), []);
  const [add, setAdd] = useState('');
  const [showOut, setShowOut] = useState(false);
  const [qtyOf, setQtyOf] = useState<StockItem | null>(null);
  if (!stock) return <section class="screen"><div class="topbar"><h1>Maison</h1></div><Loading /></section>;
  const name = (s: StockItem) => cat.name(s.ingredientId, s.ingredientId);
  const set = (s: StockItem, ch: Partial<StockItem>) => db.stock.put({ ...s, ...ch, updatedAt: Date.now() });

  const addItem = async () => {
    const l = parseLine(add, cat);
    if (!l.ingredientId) { toast('Ingrédient inconnu — vérifiez l’orthographe ou créez-le depuis une recette'); return; }
    const b = l.qty != null ? toBase(l.qty, l.unit) : null;
    await db.stock.put({ ingredientId: l.ingredientId, level: 'have', qty: b?.qty, unit: b ? baseUnit(b.family) : undefined, updatedAt: Date.now() });
    toast(`${cat.name(l.ingredientId)} ajouté`); setAdd('');
  };

  const staples = stock.filter(s => s.alwaysHave);
  const stale = stock.filter(s => isStale(s));
  const active = stock.filter(s => !s.alwaysHave && s.level !== 'out');
  const out = stock.filter(s => !s.alwaysHave && s.level === 'out');
  const sortN = (a: StockItem, b: StockItem) => name(a).localeCompare(name(b), 'fr');

  const Row = ({ s }: { s: StockItem }) => <li>
    <span class="it">{name(s)}<button class="link sm" onClick={() => setQtyOf(s)}>{s.qty != null ? formatQty(s.qty, s.unit) : 'qté ?'}</button></span>
    <Seg small value={s.level} options={LV} onChange={l => set(s, { level: l, ...(l === 'out' ? { qty: undefined, unit: undefined } : {}) })} />
    <button class={'icon sm star' + (s.alwaysHave ? ' on' : '')} aria-label={s.alwaysHave ? 'Retirer des basiques' : 'Toujours en stock (basique)'} aria-pressed={!!s.alwaysHave}
      onClick={() => set(s, { alwaysHave: !s.alwaysHave, level: 'have' })}>★</button>
  </li>;

  return <section class="screen">
    <div class="topbar"><h1>Maison</h1></div>
    <p class="muted intro">Ce que vous avez. Les courses le déduisent. Approximatif, c'est très bien — une quantité seulement si vous la connaissez.</p>
    <datalist id="ings">{cat.all().map(i => <option value={i.fr} />)}</datalist>
    <div class="row gap"><input list="ings" placeholder="J'ai… (ex. 1 kg de riz, œufs)" value={add} onInput={e => setAdd(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
      <button class="secondary" onClick={addItem}>Ajouter</button></div>

    {!stock.length && <Empty icon="🏠" title="Rien pour l'instant"><p>Ce que vous rangez depuis le panier arrive ici automatiquement.</p></Empty>}
    {stale.length > 0 && <div class="card warnc"><h3>Toujours là ? ({stale.length})</h3><p class="muted">Notés « J'ai » depuis plus d'un mois.</p>
      <ul class="items">{stale.sort(sortN).map(s => <Row s={s} />)}</ul></div>}
    {AISLES.map(a => { const xs = active.filter(s => cat.aisle(s.ingredientId) === a.id && !stale.includes(s)).sort(sortN);
      return xs.length ? <div class="aisle"><h4>{a.name}</h4><ul class="items">{xs.map(s => <Row s={s} />)}</ul></div> : null; })}
    {staples.length > 0 && <div class="aisle"><h4>★ Basiques — toujours là, jamais dans les courses</h4><ul class="items">{staples.sort(sortN).map(s => <Row s={s} />)}</ul></div>}
    {out.length > 0 && <div class="card"><button class="link wide left" aria-expanded={showOut} onClick={() => setShowOut(!showOut)}>{showOut ? '▾' : '▸'} Plus en stock ({out.length})</button>
      {showOut && <ul class="items">{out.sort(sortN).map(s => <Row s={s} />)}</ul>}
      {showOut && <button class="ghost sm" onClick={async () => { await db.stock.bulkDelete(out.map(s => s.ingredientId)); toast('Effacés', () => db.stock.bulkPut(out)); }}>Effacer cette liste</button>}</div>}
    {qtyOf && <QtySheet s={qtyOf} name={name(qtyOf)} onClose={() => setQtyOf(null)} />}
  </section>;
}

function QtySheet({ s, name, onClose }: { s: StockItem; name: string; onClose: () => void }) {
  const [q, setQ] = useState(s.qty != null ? String(s.qty).replace('.', ',') : '');
  const [u, setU] = useState(s.unit || 'g');
  const save = async () => {
    const n = Number(q.replace(',', '.'));
    if (!q.trim() || !isFinite(n)) await db.stock.put({ ...s, qty: undefined, unit: undefined, updatedAt: Date.now() });
    else { const b = toBase(n, u); await db.stock.put({ ...s, qty: b.qty, unit: baseUnit(b.family), level: 'have', updatedAt: Date.now() }); }
    onClose();
  };
  return <Sheet title={name} onClose={onClose} footer={<button class="primary wide" onClick={save}>OK</button>}>
    <p class="muted">Combien en avez-vous ? Laissez vide si vous ne savez pas.</p>
    <div class="row gap"><input inputMode="decimal" class="qtyin" value={q} placeholder="quantité" onInput={e => setQ(e.currentTarget.value)} autoFocus />
      <select value={u} onChange={e => setU(e.currentTarget.value)}>{EDIT_UNITS.map(([k, l]) => <option value={k}>{l}</option>)}</select></div>
  </Sheet>;
}
