import { useContext, useMemo, useState } from 'preact/hooks';
import { db, snapshot } from '../db/db';
import type { ListItem, Level, StockItem } from '../db/types';
import { AISLES, PANTRY_AISLES } from '../data/ingredients';
import { applyStock, collectNeeds, listAsText, mergeList, type Need } from '../domain/listBuild';
import { parseLine } from '../domain/parser';
import { putAway } from '../domain/stock';
import { short, today } from '../domain/dates';
import { formatQty } from '../domain/units';
import { CatCtx, Empty, Seg, Sheet, toast, useLive } from './kit';

const aisleName = (id: string) => AISLES.find(a => a.id === id)?.name || 'Other';
const aisleOrder = (id: string) => AISLES.findIndex(a => a.id === id);

export function ListScreen() {
  const { cat } = useContext(CatCtx);
  const t = today();
  const periods = useLive(() => db.periods.filter(p => p.end >= t).toArray(), []) || [];
  const meals = useLive(() => db.meals.filter(m => m.status === 'planned' && !m.listedAt && !m.leftoverOf && !!m.recipeId).toArray(), []) || [];
  const recipes = useLive(() => db.recipes.toArray(), []) || [];
  const stockArr = useLive(() => db.stock.toArray(), []) || [];
  const list = useLive(() => db.list.toArray(), []);
  const [until, setUntil] = useState('');
  const [check, setCheck] = useState(false); const [done, setDone] = useState(false);
  const [showSkip, setShowSkip] = useState(false); const [manual, setManual] = useState('');

  const live = new Set(periods.map(p => p.id));
  const end = until || periods.map(p => p.end).sort()[0] || t;
  const scope = meals.filter(m => live.has(m.periodId) && (!m.date || (m.date >= t && m.date <= end)));
  const stock = useMemo(() => new Map(stockArr.map(s => [s.ingredientId, s])), [stockArr]);
  const needs = useMemo(() => applyStock(collectNeeds(scope, new Map(recipes.map(r => [r.id, r])), cat), stock),
    [scope.map(m => m.id + m.servings + (m.extra || 0)).join(), recipes, stock]);
  const skipped = needs.filter(n => n.skip && n.skip !== 'always');

  const build = async () => {
    const merged = mergeList(list || [], needs);
    await db.transaction('rw', db.list, async () => { await db.list.clear(); await db.list.bulkPut(merged); });
  };
  const tick = (i: ListItem) => db.list.update(i.key, { ticked: !i.ticked });
  const addBack = (n: Need) => db.list.put({ key: n.key, ingredientId: n.ingredientId, text: n.name, qty: n.qty, unit: n.unit, aisle: n.aisle, ticked: false, manual: true });
  const addManual = async () => {
    if (!manual.trim()) return; const l = parseLine(manual, cat);
    await db.list.put({ key: 'm:' + Date.now(), ingredientId: l.ingredientId, text: l.ingredientId ? cat.name(l.ingredientId) : manual.trim(),
      qty: l.qty, unit: l.qty != null ? l.unit : null, aisle: cat.aisle(l.ingredientId), ticked: false, manual: true });
    setManual('');
  };
  const edit = async (i: ListItem) => {
    const v = prompt('Change item (e.g. "1 kg pâtes")', `${i.qty != null ? formatQty(i.qty, i.unit) + ' ' : ''}${i.text}`);
    if (v == null) return; if (!v.trim()) { await db.list.delete(i.key); toast('Removed', () => db.list.put(i)); return; }
    const l = parseLine(v, cat);
    await db.list.update(i.key, { text: l.ingredientId ? cat.name(l.ingredientId) : v.trim(), qty: l.qty, unit: l.qty != null ? l.unit : null, edited: true });
  };
  const share = async () => {
    const txt = 'Shopping list\n\n' + listAsText(sorted, aisleName);
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast('Copied to clipboard'); } } catch { /* cancelled */ }
  };

  if (!list) return null;
  const sorted = [...list].sort((a, b) => aisleOrder(a.aisle) - aisleOrder(b.aisle) || a.text.localeCompare(b.text));
  const ticked = list.filter(i => i.ticked);
  const groups = AISLES.map(a => [a, sorted.filter(i => i.aisle === a.id)] as const).filter(([, xs]) => xs.length);

  return <section class="screen">
    <div class="topbar"><h1>Shopping list</h1>{list.length > 0 && <button class="icon" aria-label="Share list" onClick={share}>⤴</button>}</div>
    <div class="row gap scope"><small class="muted">{scope.length} meal{scope.length !== 1 ? 's' : ''} not shopped yet, until</small>
      <input type="date" class="short" value={end} min={t} onInput={e => setUntil(e.currentTarget.value)} /></div>

    {!list.length ? <Empty icon="🛒" title={scope.length ? 'Ready when you are' : 'Nothing to shop for'}>
      {scope.length ? <><p>The list adds up the ingredients of your planned meals and removes what you already have.</p>
        <button class="primary" onClick={() => setCheck(true)}>Check what I have first</button>
        <button class="ghost" onClick={build}>Make list now</button></>
        : <p>Plan a few meals first, then come back here.</p>}
    </Empty> : <>
      <div class="row gap actions">
        <button class="secondary" onClick={() => setCheck(true)}>🏠 Check home</button>
        <button class="ghost" onClick={async () => { await build(); toast('List updated (ticks kept)'); }}>↻ Update</button>
      </div>
      {groups.map(([a, xs]) => <div class="aisle"><h4>{a.name}</h4>
        <ul class="items">{xs.map(i => <li class={i.ticked ? 'done' : ''}>
          <label><input type="checkbox" checked={i.ticked} onChange={() => tick(i)} />
            <span class="it">{i.text}{i.note && <small> · {i.note}</small>}</span>
            <b>{i.qty != null ? formatQty(i.qty, i.unit) : ''}</b></label>
          <button class="icon sm" aria-label={'Edit ' + i.text} onClick={() => edit(i)}>✎</button></li>)}</ul></div>)}
      <div class="row gap"><input placeholder="Add an item (e.g. 6 œufs, coffee)" value={manual} onInput={e => setManual(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && addManual()} />
        <button class="secondary" onClick={addManual}>Add</button></div>
    </>}

    {skipped.length > 0 && <div class="card skipped">
      <button class="link wide left" aria-expanded={showSkip} onClick={() => setShowSkip(!showSkip)}>{showSkip ? '▾' : '▸'} Not on the list — you have these ({skipped.length})</button>
      {showSkip && <ul class="items">{skipped.map(n => <li><span class="it">{n.name}<small> · {n.skip === 'covered' ? 'enough at home' : 'at home'}</small></span>
        <b>{n.qty != null ? formatQty(n.qty, n.unit) : ''}</b><button class="sm ghost" onClick={() => addBack(n)}>+ Add</button></li>)}</ul>}
    </div>}

    {ticked.length > 0 && <div class="sticky"><button class="primary wide" onClick={() => setDone(true)}>Done shopping · put {ticked.length} away</button></div>}
    {check && <CheckHome needs={needs} stock={stock} onClose={async saved => { setCheck(false); if (saved) { await build(); toast('List updated with what you have'); } }} />}
    {done && <DoneShopping ticked={ticked} rest={list.filter(i => !i.ticked)} scopeIds={needs.flatMap(n => n.mealIds)} stock={stock} until={end} onClose={() => setDone(false)} />}
  </section>;
}

/** Quick pre-shopping pass: only items you might have at home; default = what the app believes. */
function CheckHome({ needs, stock, onClose }: { needs: Need[]; stock: Map<string, StockItem>; onClose: (saved: boolean) => void }) {
  const { cat } = useContext(CatCtx);
  const rows = needs.filter(n => n.ingredientId && n.skip !== 'always' && (stock.has(n.ingredientId) || PANTRY_AISLES.has(cat.aisle(n.ingredientId))))
    .filter((n, i, a) => a.findIndex(x => x.ingredientId === n.ingredientId) === i);
  const [lv, setLv] = useState<Record<string, Level>>(() => Object.fromEntries(rows.map(n => [n.ingredientId!, stock.get(n.ingredientId!)?.level || 'have'])));
  const save = async () => {
    const now = Date.now();
    await db.stock.bulkPut(rows.map(n => { const id = n.ingredientId!, s = stock.get(id), l = lv[id];
      return { ingredientId: id, level: l, qty: s && s.level === l ? s.qty : undefined, unit: s && s.level === l ? s.unit : undefined, alwaysHave: s?.alwaysHave, updatedAt: now }; }));
    onClose(true);
  };
  return <Sheet title="Check what you have" onClose={() => onClose(false)}>
    <p class="muted">Open the cupboards and change only what's wrong. <b>Have</b> = not on the list · <b>Low</b> / <b>Out</b> = buy.</p>
    {!rows.length && <p>Nothing to check: everything for these meals is fresh produce or already handled.</p>}
    <ul class="check-rows">{rows.map(n => <li><span>{n.name}<small>{n.qty != null ? ' · need ' + formatQty(n.qty, n.unit) : ''}</small></span>
      <Seg small value={lv[n.ingredientId!]} options={[['have', 'Have'], ['low', 'Low'], ['out', 'Out']]} onChange={v => setLv({ ...lv, [n.ingredientId!]: v })} /></li>)}</ul>
    <button class="primary wide" onClick={save}>Done — update my list</button>
  </Sheet>;
}

function DoneShopping({ ticked, rest, scopeIds, stock, until, onClose }:
  { ticked: ListItem[]; rest: ListItem[]; scopeIds: string[]; stock: Map<string, StockItem>; until: string; onClose: () => void }) {
  const finish = async () => {
    await snapshot(true);
    const now = Date.now(), prevStock = [...stock.values()], prevList = [...ticked, ...rest];
    const ids = [...new Set(scopeIds)], prevMeals = await db.meals.bulkGet(ids);
    await db.transaction('rw', db.stock, db.list, db.meals, async () => {
      await db.stock.bulkPut(putAway(ticked, stock, now));
      await db.list.bulkDelete(ticked.map(i => i.key));
      await db.list.bulkPut(rest.map(i => ({ ...i, manual: true })));   // not bought: stays on the list
      await Promise.all(ids.map(id => db.meals.update(id, { listedAt: now })));
    });
    toast(`${ticked.length} items put away at home`, async () => {
      await db.stock.clear(); await db.stock.bulkPut(prevStock); await db.list.bulkPut(prevList);
      await db.meals.bulkPut(prevMeals.filter(Boolean) as any);
    });
    onClose();
  };
  return <Sheet title="Done shopping?" onClose={onClose}>
    <p>{ticked.length} bought item{ticked.length > 1 ? 's' : ''} go to <b>At home</b>. Meals until {short(until)} are marked as shopped, so they won't come back on the next list.</p>
    {rest.length > 0 && <p class="muted">{rest.length} unticked item{rest.length > 1 ? 's stay' : ' stays'} on the list.</p>}
    <button class="primary wide" onClick={finish}>Put away</button>
  </Sheet>;
}
