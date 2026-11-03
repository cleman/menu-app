import { useContext, useEffect, useState } from 'preact/hooks';
import { db } from '../db/db';
import { addMeal, createPeriod, fill, household, removeMeal, setStatus } from '../db/ops';
import type { Period, PlannedMeal, Recipe, Slot } from '../db/types';
import { addDays, diffDays, label, range, short, today } from '../domain/dates';
import { norm } from '../domain/catalogue';
import { CatCtx, Seg, Sheet, Stepper, toast } from './kit';
import { RecipeBody } from './RecipesScreen';

// ---------- pick what goes in a slot (or into Ideas) : 2 taps ----------
export function SlotPicker({ period, date, slot, meals, recipes, onClose }:
  { period: Period; date?: string; slot?: Slot; meals: PlannedMeal[]; recipes: Recipe[]; onClose: () => void }) {
  const [q, setQ] = useState(''); const [other, setOther] = useState('');
  const ideas = date ? meals.filter(m => !m.date && m.status === 'planned') : [];
  const byId = new Map(recipes.map(r => [r.id, r]));
  const leftovers = date ? meals.filter(m => m.extra && m.recipeId && !meals.some(x => x.leftoverOf === m.id) && (!m.date || m.date <= date)) : [];
  const nq = norm(q);
  const list = recipes.filter(r => !nq || norm(r.title).includes(nq) || r.tags.some(t => t.startsWith(nq))).sort((a, b) => a.title.localeCompare(b.title));
  const where = date ? `${slot === 'lunch' ? 'Lunch' : 'Dinner'} · ${label(date)}` : 'Ideas';
  const done = (msg: string, undo: () => unknown) => { toast(msg, () => { undo(); }); onClose(); };

  const pickRecipe = async (r: Recipe) => { const m = await addMeal(period.id, r.id, date, slot); done(`${r.title} → ${where}`, () => db.meals.delete(m.id)); };
  const pickIdea = async (m: PlannedMeal) => { await db.meals.update(m.id, { date, slot }); done('Moved to ' + where, () => db.meals.update(m.id, { date: undefined, slot: undefined })); };
  const pickLeft = async (m: PlannedMeal) => {
    const n: PlannedMeal = { id: crypto.randomUUID?.() || String(Date.now()), periodId: period.id, recipeId: m.recipeId, leftoverOf: m.id, date, slot, servings: await household(), status: 'planned' };
    await db.meals.put(n); done('Leftovers planned', () => db.meals.delete(n.id));
  };
  const pickOther = async () => { if (!other.trim()) return; const m = await addMeal(period.id, undefined, date, slot, other.trim()); done('Added', () => db.meals.delete(m.id)); };

  return <Sheet title={where} onClose={onClose}>
    <input class="search" type="search" placeholder="Search recipes or tags (veggie, quick…)" value={q} onInput={e => setQ(e.currentTarget.value)} />
    {!q && ideas.length > 0 && <><h4>From your ideas</h4><div class="chips">{ideas.map(m => <button class="chip" onClick={() => pickIdea(m)}>{byId.get(m.recipeId!)?.title || m.label}</button>)}</div></>}
    {!q && leftovers.length > 0 && <><h4>Leftovers</h4><div class="chips">{leftovers.map(m => <button class="chip leftover" onClick={() => pickLeft(m)}>Leftovers: {byId.get(m.recipeId!)?.title}</button>)}</div></>}
    <h4>Recipes</h4>
    <ul class="plist">{list.map(r => <li><button onClick={() => pickRecipe(r)}><span>{r.title}</span>
      <small>{r.minutes ? r.minutes + ' min · ' : ''}{r.tags.filter(t => ['veggie', 'quick', 'batch'].includes(t)).join(' · ')}</small></button></li>)}</ul>
    <h4>Something else</h4>
    <div class="row gap"><input placeholder="Eat out, sandwich, at friends…" value={other} onInput={e => setOther(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && pickOther()} />
      <button class="secondary" onClick={pickOther}>Add</button></div>
  </Sheet>;
}

// ---------- one planned meal ----------
export function MealMenu({ meal, recipes, period, onClose }: { meal?: PlannedMeal; recipes: Map<string, Recipe>; period: Period; onClose: () => void }) {
  const [hh, setHh] = useState(2); useEffect(() => { household().then(setHh); }, []);
  const [showRecipe, setShowRecipe] = useState(false);
  if (!meal) return null;
  const r = meal.recipeId ? recipes.get(meal.recipeId) : undefined;
  const title = meal.leftoverOf ? `Leftovers: ${r?.title}` : r?.title || meal.label || '';
  const upd = (ch: Partial<PlannedMeal>) => db.meals.update(meal.id, ch);
  const status = async (s: PlannedMeal['status']) => { const undo = await setStatus(meal, s); toast(s === 'cooked' ? 'Marked as cooked 👍' : s === 'skipped' ? 'Skipped' : 'Back to planned', undo); onClose(); };
  const move = (v: string) => v === 'idea' ? upd({ date: undefined, slot: undefined }) : upd({ date: v, slot: meal.slot || 'dinner' });

  return <Sheet title={title} onClose={onClose}>
    <div class="row gap wrap">
      <button class="primary" onClick={() => status('cooked')} disabled={meal.status === 'cooked'}>✓ Cooked</button>
      <button class="secondary" onClick={() => status('skipped')} disabled={meal.status === 'skipped'}>Skip</button>
      {meal.status !== 'planned' && <button class="ghost" onClick={() => status('planned')}>Undo status</button>}
    </div>
    {!meal.leftoverOf && meal.recipeId && <>
      <div class="field"><label>Servings</label><Stepper value={meal.servings} onChange={n => upd({ servings: n })} label="servings" /></div>
      <label class="check"><input type="checkbox" checked={!!meal.extra} onChange={e => upd({ extra: e.currentTarget.checked ? hh : 0 })} />
        Cook {hh} extra servings for leftovers <small class="muted">(then plan them in another slot)</small></label>
    </>}
    <div class="field"><label>Day</label>
      <select value={meal.date || 'idea'} onChange={e => move(e.currentTarget.value)}>
        <option value="idea">No day yet (Ideas)</option>
        {range(period.start, period.end).map(d => <option value={d}>{label(d)}</option>)}
      </select></div>
    {meal.date && <div class="field"><label>Meal</label><Seg value={meal.slot || 'dinner'} options={[['lunch', 'Lunch'], ['dinner', 'Dinner']]} onChange={s => upd({ slot: s })} /></div>}
    {r && <button class="ghost wide" onClick={() => setShowRecipe(!showRecipe)}>{showRecipe ? 'Hide recipe' : 'Show recipe'}</button>}
    {r && showRecipe && <RecipeBody r={r} servings={meal.servings + (meal.extra || 0)} />}
    <button class="danger wide" onClick={async () => { const undo = await removeMeal(meal.id); toast('Removed', undo); onClose(); }}>Remove from plan</button>
  </Sheet>;
}

// ---------- new plan of any length ----------
export function PeriodDialog({ prev, onDone, onClose }: { prev?: Period; onDone: (p: Period) => void; onClose: () => void }) {
  const t = today();
  const [start, setStart] = useState(prev && prev.end >= t ? addDays(prev.end, 1) : t);
  const [len, setLen] = useState<'7' | '14' | 'c'>('14');
  const [end, setEnd] = useState(addDays(start, 13));
  const [copy, setCopy] = useState(false);
  const realEnd = len === 'c' ? end : addDays(start, Number(len) - 1);
  const ok = realEnd >= start;
  return <Sheet title="New plan" onClose={onClose}>
    <div class="field"><label>From</label><input type="date" value={start} onInput={e => setStart(e.currentTarget.value)} /></div>
    <div class="field"><label>Length</label><Seg value={len} options={[['7', '1 week'], ['14', '2 weeks'], ['c', 'Other']]} onChange={setLen} /></div>
    {len === 'c' && <div class="field"><label>Until</label><input type="date" value={end} min={start} onInput={e => setEnd(e.currentTarget.value)} /></div>}
    <p class="muted">{short(start)} → {short(realEnd)} · {diffDays(start, realEnd) + 1} days</p>
    {prev && <label class="check"><input type="checkbox" checked={copy} onChange={e => setCopy(e.currentTarget.checked)} /> Copy meals from {short(prev.start)}–{short(prev.end)}</label>}
    <button class="primary wide" disabled={!ok} onClick={async () => onDone(await createPeriod(start, realEnd, copy ? prev : undefined))}>Create plan</button>
  </Sheet>;
}

// ---------- "Fill my period" ----------
export function FillSheet({ period, meals, onClose }: { period: Period; meals: PlannedMeal[]; onClose: () => void }) {
  const { cat } = useContext(CatCtx);
  const emptyDinners = range(period.start, period.end).filter(d => d >= today() && !meals.some(m => m.date === d && m.slot === 'dinner')).length;
  const [n, setN] = useState(Math.max(1, Math.min(emptyDinners || 4, 14)));
  const [place, setPlace] = useState<'p' | 'i'>(emptyDinners ? 'p' : 'i');
  return <Sheet title="Suggest meals" onClose={onClose}>
    <p class="muted">Picks recipes you haven't had lately, uses what you have at home, about half veggie, seasonal first.</p>
    <div class="field"><label>How many?</label><Stepper value={n} onChange={setN} label="number of meals" /></div>
    <div class="field"><label>Put them</label><Seg value={place} options={[['p', `On empty dinners (${emptyDinners})`], ['i', 'In ideas']]} onChange={setPlace} /></div>
    <button class="primary wide" onClick={async () => { const undo = await fill(period, n, place === 'p', cat); toast(`${n} meals suggested — tap one to change it`, undo); onClose(); }}>Suggest {n} meals</button>
  </Sheet>;
}

// ---------- end of period: close the loop, then plan the next one ----------
export function ReviewSheet({ period, meals, recipes, onNext, onCreated, onClose }:
  { period: Period; meals: PlannedMeal[]; recipes: Map<string, Recipe>; onNext: () => void; onCreated: (p: Period) => void; onClose: () => void }) {
  const real = meals.filter(m => !m.leftoverOf && (m.recipeId || m.label));
  const open = real.filter(m => m.status === 'planned');
  const cooked = real.filter(m => m.status === 'cooked');
  const distinct = new Set(cooked.map(m => m.recipeId).filter(Boolean)).size;
  const veg = cooked.filter(m => recipes.get(m.recipeId!)?.tags.includes('veggie')).length;
  const [carry, setCarry] = useState(true);
  const title = (m: PlannedMeal) => recipes.get(m.recipeId!)?.title || m.label;

  const next = async () => {
    const len = diffDays(period.start, period.end) + 1;
    const start = period.end >= today() ? addDays(period.end, 1) : today();
    const np = await createPeriod(start, addDays(start, len - 1));
    if (carry) await db.meals.bulkPut(open.map(m => ({ ...m, periodId: np.id, date: undefined, slot: undefined, listedAt: m.listedAt })));
    await db.periods.update(period.id, { reviewedAt: Date.now() });
    onCreated(np);
  };
  return <Sheet title={`Review ${short(period.start)}–${short(period.end)}`} onClose={onClose}>
    <div class="stats">
      <div><b>{cooked.length}</b>/{real.length}<small>meals cooked</small></div>
      <div><b>{distinct}</b><small>different recipes</small></div>
      <div><b>{veg}</b><small>veggie meals</small></div>
    </div>
    {open.length > 0 && <><h4>Did you cook these?</h4>
      <ul class="rlist">{open.map(m => <li><span>{title(m)}<small>{m.date ? ' · ' + label(m.date) : ''}</small></span>
        <span class="row gap"><button class="sm secondary" onClick={() => setStatus(m, 'cooked')}>Yes</button><button class="sm ghost" onClick={() => setStatus(m, 'skipped')}>No</button></span></li>)}</ul>
      <label class="check"><input type="checkbox" checked={carry} onChange={e => setCarry(e.currentTarget.checked)} /> Move the {open.length} not-cooked meals to the next plan's ideas</label></>}
    <p class="muted">No judgement — a plan you half-follow still beats no plan. Keep what worked.</p>
    <button class="primary wide" onClick={next}>Plan next {diffDays(period.start, period.end) + 1} days</button>
    <button class="ghost wide" onClick={async () => { await db.periods.update(period.id, { reviewedAt: Date.now() }); onNext(); }}>Other length / copy a plan…</button>
  </Sheet>;
}
