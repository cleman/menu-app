// Shopping in 3 steps: 1) "À prévoir" = needs of planned meals − home stock, you keep only what you want
// 2) "Panier" = what you validated; tick what you really buy, fix sizes, remove 3) "Ranger" → At home.
import { useContext, useMemo, useState } from 'preact/hooks';
import { db, getKV, setKV, snapshot } from '../db/db';
import type { ListItem, Level, StockItem } from '../db/types';
import { AISLES, PANTRY_AISLES } from '../data/ingredients';
import { addToCart, applyStock, collectNeeds, listAsText, needToItem, type Need } from '../domain/listBuild';
import { parseLine } from '../domain/parser';
import { putAway } from '../domain/stock';
import { short, today } from '../domain/dates';
import { EDIT_UNITS, formatQty } from '../domain/units';
import { CatCtx, Empty, Loading, Seg, Sheet, toast, useLive } from './kit';

const aisleName = (id: string) => AISLES.find(a => a.id === id)?.name || 'Autre';
const aisleOrder = (id: string) => { const i = AISLES.findIndex(a => a.id === id); return i < 0 ? 99 : i; };
const byAisle = <X extends { aisle: string; text: string }>(xs: X[]) =>
  AISLES.map(a => [a, xs.filter(x => x.aisle === a.id).sort((p, q) => p.text.localeCompare(q.text, 'fr'))] as const).filter(([, v]) => v.length)
    .concat(xs.some(x => aisleOrder(x.aisle) === 99) ? [[{ id: 'other', name: 'Autre' }, xs.filter(x => aisleOrder(x.aisle) === 99)] as const] : []);

export function ListScreen() {
  const list = useLive(() => db.list.toArray(), []);
  const cartCount = (list || []).filter(i => i.stage !== 'proposal').length;
  const [view, setView] = useState<'plan' | 'cart' | null>(null);
  if (!list) return <section class="screen"><div class="topbar"><h1>Courses</h1></div><Loading /></section>;
  const v = view || (cartCount ? 'cart' : 'plan');
  return <section class="screen">
    <div class="topbar"><h1>Courses</h1></div>
    <div class="tabs2"><Seg value={v} options={[['plan', '1 · À prévoir'], ['cart', `2 · Panier${cartCount ? ` (${cartCount})` : ''}`]]} onChange={setView} /></div>
    {v === 'plan' ? <Proposal list={list} goCart={() => setView('cart')} /> : <Cart items={list.filter(i => i.stage !== 'proposal')} goPlan={() => setView('plan')} />}
  </section>;
}

// ---------------------------------------------------------------- 1. proposal
function Proposal({ list, goCart }: { list: ListItem[]; goCart: () => void }) {
  const { cat } = useContext(CatCtx);
  const t = today();
  const periods = useLive(() => db.periods.filter(p => p.end >= t).toArray(), []);
  const meals = useLive(() => db.meals.filter(m => m.status === 'planned' && !m.listedAt && !m.leftoverOf && !!m.recipeId).toArray(), []);
  const recipes = useLive(() => db.recipes.toArray(), []);
  const stockArr = useLive(() => db.stock.toArray(), []);
  const off = useLive(() => getKV<string[]>('proposalOff', []), []);
  const [until, setUntil] = useState('');
  const [check, setCheck] = useState(false); const [showSkip, setShowSkip] = useState(false); const [manual, setManual] = useState('');

  const stock = useMemo(() => new Map((stockArr || []).map(s => [s.ingredientId, s])), [stockArr]);
  const live = new Set((periods || []).map(p => p.id));
  const end = until || (periods || []).map(p => p.end).sort()[0] || t;
  const scope = (meals || []).filter(m => live.has(m.periodId) && (!m.date || (m.date >= t && m.date <= end)));
  const scopeKey = scope.map(m => m.id + ':' + m.servings + ':' + (m.extra || 0)).join();
  const needs = useMemo(() => recipes ? applyStock(collectNeeds(scope, new Map(recipes.map(r => [r.id, r])), cat), stock) : [],
    [scopeKey, recipes, stock, cat]);
  if (!periods || !meals || !recipes || !stockArr || !off) return <Loading />;

  const offSet = new Set(off);
  const extras = list.filter(i => i.stage === 'proposal');
  const shown = needs.filter(n => !n.skip);
  const skipped = needs.filter(n => n.skip && n.skip !== 'always');
  const rows: (ListItem & { need?: Need })[] = [...shown.map(n => ({ ...needToItem(n), need: n })), ...extras];
  const selected = rows.filter(r => !offSet.has(r.key));

  const toggle = (k: string) => setKV('proposalOff', offSet.has(k) ? off.filter(x => x !== k) : [...off, k]);
  const allOn = () => setKV('proposalOff', []);
  const allOff = () => setKV('proposalOff', rows.map(r => r.key));
  const addManual = async () => {
    if (!manual.trim()) return; const l = parseLine(manual, cat);
    await db.list.put({ key: 'p:' + Date.now(), stage: 'proposal', ingredientId: l.ingredientId, text: l.ingredientId ? cat.name(l.ingredientId) : manual.trim(),
      qty: l.qty, unit: l.qty != null ? l.unit : null, aisle: cat.aisle(l.ingredientId), ticked: false, manual: true });
    setManual('');
  };
  const addBack = (n: Need) => db.list.put({ ...needToItem(n), key: 'p:' + n.key, stage: 'proposal', manual: true });
  const validate = async () => {
    const cart = list.filter(i => i.stage !== 'proposal');
    const merged = addToCart(cart, selected.map(({ need, ...i }) => i));
    const now = Date.now(), ids = [...new Set(scope.map(m => m.id))];
    const prevList = list, prevMeals = scope;
    await db.transaction('rw', db.list, db.meals, db.kv, async () => {
      await db.list.clear(); await db.list.bulkPut(merged);
      await Promise.all(ids.map(id => db.meals.update(id, { listedAt: now })));
      await setKV('proposalOff', []);
    });
    toast(`${selected.length} article${selected.length > 1 ? 's' : ''} dans le panier`, async () => {
      await db.list.clear(); await db.list.bulkPut(prevList); await db.meals.bulkPut(prevMeals); await setKV('proposalOff', off);
    });
    goCart();
  };

  return <>
    <div class="row gap scope"><small class="muted">{scope.length} repas pas encore achetés, jusqu'au</small>
      <input type="date" class="short" value={end} min={t} onInput={e => setUntil(e.currentTarget.value)} /></div>
    {!rows.length ? <Empty icon="🛒" title={scope.length ? 'Tout est déjà à la maison 🎉' : 'Rien à prévoir'}>
      <p>{scope.length ? 'Les ingrédients de vos repas sont tous notés comme présents à la maison.' : 'Ajoutez des repas à votre plan : leurs ingrédients apparaîtront ici, moins ce que vous avez déjà.'}</p>
    </Empty> : <>
      <div class="row gap actions">
        <button class="secondary" onClick={() => setCheck(true)}>🏠 Vérifier ce que j'ai</button>
        <button class="ghost sm" onClick={selected.length === rows.length ? allOff : allOn}>{selected.length === rows.length ? 'Tout décocher' : 'Tout cocher'}</button>
      </div>
      <p class="muted small">Décochez ce que vous ne voulez pas acheter, puis validez.</p>
      {byAisle(rows).map(([a, xs]) => <div class="aisle"><h4>{a.name}</h4>
        <ul class="items">{xs.map(i => <li class={offSet.has(i.key) ? 'off' : ''}>
          <label><input type="checkbox" checked={!offSet.has(i.key)} onChange={() => toggle(i.key)} />
            <span class="it">{i.text}{i.note && <small> · {i.note}</small>}</span>
            <b>{i.qty != null ? formatQty(i.qty, i.unit) : ''}</b></label>
          {i.stage === 'proposal' && <button class="icon sm" aria-label={'Retirer ' + i.text} onClick={() => db.list.delete(i.key)}>✕</button>}
        </li>)}</ul></div>)}
    </>}
    <div class="row gap addrow"><input placeholder="Ajouter (ex. 6 œufs, café)" value={manual} onInput={e => setManual(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && addManual()} />
      <button class="secondary" onClick={addManual}>Ajouter</button></div>
    {skipped.length > 0 && <div class="card skipped">
      <button class="link wide left" aria-expanded={showSkip} onClick={() => setShowSkip(!showSkip)}>{showSkip ? '▾' : '▸'} Déjà à la maison ({skipped.length})</button>
      {showSkip && <ul class="items">{skipped.map(n => <li><span class="it">{n.name}<small> · {n.skip === 'covered' ? 'assez à la maison' : 'à la maison'}</small></span>
        <b>{n.qty != null ? formatQty(n.qty, n.unit) : ''}</b><button class="sm ghost" onClick={() => addBack(n)}>+ Acheter</button></li>)}</ul>}
    </div>}
    {selected.length > 0 && <div class="sticky"><button class="primary wide" onClick={validate}>Valider · {selected.length} article{selected.length > 1 ? 's' : ''} → panier</button></div>}
    {check && <CheckHome needs={needs} stock={stock} onClose={() => setCheck(false)} />}
  </>;
}

/** Quick pre-shopping pass: only things you might have; default = what the app believes. */
function CheckHome({ needs, stock, onClose }: { needs: Need[]; stock: Map<string, StockItem>; onClose: () => void }) {
  const { cat } = useContext(CatCtx);
  const rows = needs.filter(n => n.ingredientId && n.skip !== 'always' && (stock.has(n.ingredientId) || PANTRY_AISLES.has(cat.aisle(n.ingredientId))))
    .filter((n, i, a) => a.findIndex(x => x.ingredientId === n.ingredientId) === i);
  const [lv, setLv] = useState<Record<string, Level>>(() => Object.fromEntries(rows.map(n => [n.ingredientId!, stock.get(n.ingredientId!)?.level || 'have'])));
  const save = async () => {
    const now = Date.now();
    await db.stock.bulkPut(rows.map(n => { const id = n.ingredientId!, s = stock.get(id), l = lv[id];
      return { ingredientId: id, level: l, qty: s && s.level === l ? s.qty : undefined, unit: s && s.level === l ? s.unit : undefined, alwaysHave: s?.alwaysHave, updatedAt: now }; }));
    toast('Liste mise à jour avec ce que vous avez'); onClose();
  };
  return <Sheet title="Ce que j'ai déjà" onClose={onClose} footer={<button class="primary wide" onClick={save}>OK, mettre à jour la liste</button>}>
    <p class="muted">Ouvrez les placards et ne changez que ce qui est faux. <b>J'ai</b> = pas dans la liste · <b>Peu</b> / <b>Plus</b> = à acheter.</p>
    {!rows.length && <p>Rien à vérifier : ce sont surtout des produits frais.</p>}
    <ul class="check-rows">{rows.map(n => <li><span>{n.name}<small>{n.qty != null ? ' · besoin : ' + formatQty(n.qty, n.unit) : ''}</small></span>
      <Seg small value={lv[n.ingredientId!]} options={[['have', "J'ai"], ['low', 'Peu'], ['out', 'Plus']]} onChange={v => setLv({ ...lv, [n.ingredientId!]: v })} /></li>)}</ul>
  </Sheet>;
}

// ---------------------------------------------------------------- 2. cart
function Cart({ items, goPlan }: { items: ListItem[]; goPlan: () => void }) {
  const { cat } = useContext(CatCtx);
  const stockArr = useLive(() => db.stock.toArray(), []);
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [manual, setManual] = useState(''); const [done, setDone] = useState(false);
  if (!stockArr) return <Loading />;
  const bought = items.filter(i => i.ticked);

  const tick = (i: ListItem) => db.list.update(i.key, { ticked: !i.ticked });
  const remove = async (i: ListItem) => { await db.list.delete(i.key); toast(`${i.text} retiré`, () => db.list.put(i)); };
  const addManual = async () => {
    if (!manual.trim()) return; const l = parseLine(manual, cat);
    await db.list.put({ key: 'c:m' + Date.now(), stage: 'cart', ingredientId: l.ingredientId, text: l.ingredientId ? cat.name(l.ingredientId) : manual.trim(),
      qty: l.qty, unit: l.qty != null ? l.unit : null, aisle: cat.aisle(l.ingredientId), ticked: false, manual: true });
    setManual('');
  };
  const share = async () => {
    const txt = 'Courses\n\n' + listAsText(items, aisleName);
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast('Copié'); } } catch { /* cancelled */ }
  };

  if (!items.length) return <Empty icon="🧺" title="Panier vide">
    <p>Préparez la liste dans « À prévoir », puis validez : les articles arrivent ici.</p>
    <button class="secondary" onClick={goPlan}>Aller à « À prévoir »</button></Empty>;

  return <>
    <div class="row between actions"><small class="muted">Cochez ce que vous achetez vraiment · touchez la quantité pour mettre la taille du paquet.</small>
      <button class="icon" aria-label="Partager la liste" onClick={share}>⤴</button></div>
    {byAisle(items).map(([a, xs]) => <div class="aisle"><h4>{a.name}</h4>
      <ul class="items">{xs.map(i => <li class={i.ticked ? 'done' : ''}>
        <label><input type="checkbox" checked={i.ticked} onChange={() => tick(i)} /><span class="it">{i.text}{i.note && <small> · {i.note}</small>}</span></label>
        <button class="qty" aria-label={'Taille de ' + i.text} onClick={() => setEditing(i)}>{i.qty != null ? formatQty(i.qty, i.unit) : 'taille ?'}</button>
        <button class="icon sm" aria-label={'Retirer ' + i.text} onClick={() => remove(i)}>✕</button>
      </li>)}</ul></div>)}
    <div class="row gap addrow"><input placeholder="Ajouter au panier (ex. 1 kg de riz)" value={manual} onInput={e => setManual(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && addManual()} />
      <button class="secondary" onClick={addManual}>Ajouter</button></div>
    {bought.length > 0 && <div class="sticky"><button class="primary wide" onClick={() => setDone(true)}>🏠 Ranger {bought.length} article{bought.length > 1 ? 's' : ''} à la maison</button></div>}
    {editing && <SizeSheet item={editing} onClose={() => setEditing(null)} />}
    {done && <PutAway bought={bought} stock={new Map(stockArr.map(s => [s.ingredientId, s]))} rest={items.length - bought.length} onClose={() => setDone(false)} />}
  </>;
}

function SizeSheet({ item, onClose }: { item: ListItem; onClose: () => void }) {
  const [q, setQ] = useState(item.qty != null ? String(Math.round(item.qty * 100) / 100).replace('.', ',') : '');
  const [u, setU] = useState(item.unit || 'pc');
  const units = EDIT_UNITS.some(([k]) => k === u) ? EDIT_UNITS : [[u, u] as [string, string], ...EDIT_UNITS];
  const save = async () => {
    const n = Number(q.replace(',', '.'));
    await db.list.update(item.key, { qty: q.trim() && isFinite(n) ? n : null, unit: q.trim() ? u : null, edited: true, ticked: true });
    onClose();
  };
  return <Sheet title={item.text} onClose={onClose} footer={<button class="primary wide" onClick={save}>OK (et coché)</button>}>
    <p class="muted">Ce que vous achetez réellement : ex. 1 paquet de 500 g → 500 g.</p>
    <div class="row gap"><input inputMode="decimal" class="qtyin" value={q} placeholder="quantité" onInput={e => setQ(e.currentTarget.value)} autoFocus />
      <select value={u} onChange={e => setU(e.currentTarget.value)}>{units.map(([k, l]) => <option value={k}>{l}</option>)}</select></div>
    <div class="chips">{['250 g', '500 g', '1 kg', '1 l', '6 pc', '12 pc'].map(s => { const [n, un] = s.split(' ');
      return <button class="chip" onClick={() => { setQ(n); setU(un); }}>{un === 'pc' ? n + ' pièces' : s}</button>; })}</div>
  </Sheet>;
}

function PutAway({ bought, stock, rest, onClose }: { bought: ListItem[]; stock: Map<string, StockItem>; rest: number; onClose: () => void }) {
  const finish = async () => {
    await snapshot(true);
    const prevStock = [...stock.values()];
    await db.transaction('rw', db.stock, db.list, async () => {
      await db.stock.bulkPut(putAway(bought, stock));
      await db.list.bulkDelete(bought.map(i => i.key));
    });
    toast(`${bought.length} article${bought.length > 1 ? 's' : ''} rangé${bought.length > 1 ? 's' : ''} à la maison`, async () => {
      await db.stock.clear(); await db.stock.bulkPut(prevStock); await db.list.bulkPut(bought);
    });
    onClose();
  };
  return <Sheet title="Ranger à la maison ?" onClose={onClose} footer={<button class="primary wide" onClick={finish}>Ranger</button>}>
    <p>{bought.length} article{bought.length > 1 ? 's' : ''} coché{bought.length > 1 ? 's' : ''} → <b>Maison</b>, avec la quantité indiquée. Ils ne seront plus proposés tant qu'ils sont à la maison.</p>
    {rest > 0 && <p class="muted">{rest} article{rest > 1 ? 's non cochés restent' : ' non coché reste'} dans le panier pour la prochaine fois.</p>}
    <p class="muted small">Dernière mise à jour du stock : {short(today())}.</p>
  </Sheet>;
}
