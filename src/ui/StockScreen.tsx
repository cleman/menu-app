import { useContext, useState } from 'preact/hooks';
import { db } from '../db/db';
import type { Level, StockItem } from '../db/types';
import { AISLES } from '../data/ingredients';
import { parseLine } from '../domain/parser';
import { isStale } from '../domain/stock';
import { formatQty, toBase, baseUnit } from '../domain/units';
import { CatCtx, Empty, Seg, toast, useLive } from './kit';

export function StockScreen() {
  const { cat } = useContext(CatCtx);
  const stock = useLive(() => db.stock.toArray(), []) || [];
  const [add, setAdd] = useState('');
  const [showOut, setShowOut] = useState(false);
  const name = (s: StockItem) => cat.name(s.ingredientId, s.ingredientId);
  const set = (s: StockItem, ch: Partial<StockItem>) => db.stock.put({ ...s, ...ch, updatedAt: Date.now() });

  const addItem = async () => {
    const l = parseLine(add, cat);
    if (!l.ingredientId) { toast('Unknown ingredient — add it from a recipe first, or check spelling'); return; }
    const b = l.qty != null ? toBase(l.qty, l.unit) : null;
    await db.stock.put({ ingredientId: l.ingredientId, level: 'have', qty: b?.qty, unit: b ? baseUnit(b.family) : undefined, updatedAt: Date.now() });
    toast(`${cat.name(l.ingredientId)} added`); setAdd('');
  };
  const setQty = async (s: StockItem) => {
    const v = prompt(`How much ${name(s)}? (e.g. 500 g, 2, 1 l — empty = don't know)`, s.qty != null ? formatQty(s.qty, s.unit) : '');
    if (v == null) return;
    if (!v.trim()) return set(s, { qty: undefined, unit: undefined });
    const l = parseLine(v + ' x', cat); if (l.qty == null) return;
    const b = toBase(l.qty, l.unit); set(s, { qty: b.qty, unit: baseUnit(b.family), level: 'have' });
  };

  const staples = stock.filter(s => s.alwaysHave);
  const stale = stock.filter(s => isStale(s));
  const active = stock.filter(s => !s.alwaysHave && s.level !== 'out');
  const out = stock.filter(s => !s.alwaysHave && s.level === 'out');
  const sortN = (a: StockItem, b: StockItem) => name(a).localeCompare(name(b));

  const Row = ({ s }: { s: StockItem }) => <li>
    <span class="it">{name(s)}<button class="link sm" onClick={() => setQty(s)}>{s.qty != null ? formatQty(s.qty, s.unit) : 'qty?'}</button></span>
    <Seg small value={s.level} options={[['have', 'Have'], ['low', 'Low'], ['out', 'Out']] as [Level, string][]} onChange={l => set(s, { level: l, ...(l === 'out' ? { qty: undefined, unit: undefined } : {}) })} />
    <button class={'icon sm star' + (s.alwaysHave ? ' on' : '')} aria-label={s.alwaysHave ? 'Remove from staples' : 'Always have (staple)'} aria-pressed={!!s.alwaysHave}
      onClick={() => set(s, { alwaysHave: !s.alwaysHave, level: 'have' })}>★</button>
  </li>;

  return <section class="screen">
    <div class="topbar"><h1>At home</h1></div>
    <p class="muted intro">What you have. The shopping list subtracts it. Rough is fine — quantities only when you know them.</p>
    <datalist id="ings">{cat.all().map(i => <option value={i.fr === i.en ? i.en : `${i.en}`} />)}</datalist>
    <div class="row gap"><input list="ings" placeholder="I have… (e.g. 1 kg riz, eggs)" value={add} onInput={e => setAdd(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
      <button class="secondary" onClick={addItem}>Add</button></div>

    {!stock.length && <Empty icon="🏠" title="Nothing yet"><p>Things you buy get added automatically when you tap “Done shopping”.</p></Empty>}
    {stale.length > 0 && <div class="card warnc"><h3>Still there? ({stale.length})</h3><p class="muted">Marked “Have” for over a month.</p>
      <ul class="items">{stale.sort(sortN).map(s => <Row s={s} />)}</ul></div>}
    {AISLES.map(a => { const xs = active.filter(s => cat.aisle(s.ingredientId) === a.id && !stale.includes(s)).sort(sortN);
      return xs.length ? <div class="aisle"><h4>{a.name}</h4><ul class="items">{xs.map(s => <Row s={s} />)}</ul></div> : null; })}
    {staples.length > 0 && <div class="aisle"><h4>★ Staples — always have, never on the list</h4><ul class="items">{staples.sort(sortN).map(s => <Row s={s} />)}</ul></div>}
    {out.length > 0 && <div class="card"><button class="link wide left" aria-expanded={showOut} onClick={() => setShowOut(!showOut)}>{showOut ? '▾' : '▸'} Out ({out.length})</button>
      {showOut && <ul class="items">{out.sort(sortN).map(s => <Row s={s} />)}</ul>}
      {showOut && <button class="ghost sm" onClick={async () => { await db.stock.bulkDelete(out.map(s => s.ingredientId)); toast('Cleared', () => db.stock.bulkPut(out)); }}>Clear “Out” items</button>}</div>}
  </section>;
}
