import { useContext, useEffect, useState } from 'preact/hooks';
import { db, uid } from '../db/db';
import { addMeal, createPeriod, fill, household, removeMeal, setStatus } from '../db/ops';
import type { Period, PlannedMeal, Recipe, Slot } from '../db/types';
import { addDays, diffDays, label, range, short, today } from '../domain/dates';
import { filterRecipes, tagLabel, type RecipeFilter } from '../domain/recipeText';
import { CatCtx, emptyFilter, FilterBar, Seg, Sheet, Stepper, toast } from './kit';
import { RecipeBody } from './RecipesScreen';

const slotName = (s?: Slot) => (s === 'lunch' ? 'Déjeuner' : 'Dîner');
let lastFilter: RecipeFilter = emptyFilter('plat');   // remembered while the app is open

// ---------- pick recipes: for a slot = 1 tap and close · for Ideas = multi-select, stays open ----------
export function SlotPicker({ period, date, slot, meals, recipes, onClose }:
  { period: Period; date?: string; slot?: Slot; meals: PlannedMeal[]; recipes: Recipe[]; onClose: () => void }) {
  const [f, setF] = useState<RecipeFilter>(lastFilter);
  const [other, setOther] = useState('');
  const multi = !date;
  const setFilter = (x: RecipeFilter) => { lastFilter = x; setF(x); };
  const byId = new Map(recipes.map(r => [r.id, r]));
  const ideas = date ? meals.filter(m => !m.date && m.status === 'planned') : [];
  const leftovers = date ? meals.filter(m => m.extra && m.recipeId && !meals.some(x => x.leftoverOf === m.id) && (!m.date || m.date <= date)) : [];
  const inIdeas = new Map(meals.filter(m => !m.date && m.recipeId).map(m => [m.recipeId!, m.id]));
  const list = filterRecipes(recipes, f);
  const where = date ? `${slotName(slot)} · ${label(date)}` : 'Ajouter aux idées';
  const added = meals.filter(m => !m.date).length;

  const pickRecipe = async (r: Recipe) => {
    if (multi) {
      const existing = inIdeas.get(r.id);
      if (existing) await db.meals.delete(existing); else await addMeal(period.id, r.id);
      return;
    }
    const m = await addMeal(period.id, r.id, date, slot); toast(`${r.title} → ${where}`, () => db.meals.delete(m.id)); onClose();
  };
  const pickIdea = async (m: PlannedMeal) => { await db.meals.update(m.id, { date, slot }); toast('Placé : ' + where, () => db.meals.update(m.id, { date: undefined, slot: undefined })); onClose(); };
  const pickLeft = async (m: PlannedMeal) => {
    const n: PlannedMeal = { id: uid(), periodId: period.id, recipeId: m.recipeId, leftoverOf: m.id, date, slot, servings: await household(), status: 'planned' };
    await db.meals.put(n); toast('Restes prévus', () => db.meals.delete(n.id)); onClose();
  };
  const pickOther = async () => { if (!other.trim()) return; const m = await addMeal(period.id, undefined, date, slot, other.trim()); setOther(''); if (!multi) { toast('Ajouté', () => db.meals.delete(m.id)); onClose(); } };

  return <Sheet title={where} onClose={onClose}
    footer={multi ? <button class="primary wide" onClick={onClose}>Terminé · {added} idée{added > 1 ? 's' : ''}</button> : undefined}>
    {ideas.length > 0 && <><h4>Depuis vos idées</h4><div class="chips">{ideas.map(m => <button class="chip" onClick={() => pickIdea(m)}>{byId.get(m.recipeId!)?.title || m.label}</button>)}</div></>}
    {leftovers.length > 0 && <><h4>Restes</h4><div class="chips">{leftovers.map(m => <button class="chip leftover" onClick={() => pickLeft(m)}>Restes : {byId.get(m.recipeId!)?.title}</button>)}</div></>}
    {multi && <p class="muted small">Touchez les recettes pour les ajouter ou les retirer. La liste reste ouverte.</p>}
    <FilterBar f={f} set={setFilter} count={list.length} />
    <ul class="plist">{list.map(r => { const on = multi && inIdeas.has(r.id);
      return <li><button class={on ? 'on' : ''} aria-pressed={multi ? on : undefined} onClick={() => pickRecipe(r)}>
        {multi && <span class="tick" aria-hidden="true">{on ? '✓' : '+'}</span>}
        <span class="pl"><span>{r.title}</span>
          <small>{r.minutes ? r.minutes + ' min · ' : ''}{r.tags.filter(t => !['printemps', 'ete', 'automne', 'hiver'].includes(t)).map(tagLabel).join(' · ')}</small></span>
      </button></li>; })}</ul>
    {!list.length && <p class="muted">Aucune recette avec ces filtres.</p>}
    <h4>Autre chose</h4>
    <div class="row gap"><input placeholder="Restaurant, sandwich, chez des amis…" value={other} onInput={e => setOther(e.currentTarget.value)} onKeyDown={e => e.key === 'Enter' && pickOther()} />
      <button class="secondary" onClick={pickOther}>Ajouter</button></div>
  </Sheet>;
}

// ---------- one planned meal ----------
export function MealMenu({ meal, recipes, period, onClose }: { meal?: PlannedMeal; recipes: Map<string, Recipe>; period: Period; onClose: () => void }) {
  const [hh, setHh] = useState(2); useEffect(() => { household().then(setHh); }, []);
  const [showRecipe, setShowRecipe] = useState(false);
  if (!meal) return null;
  const r = meal.recipeId ? recipes.get(meal.recipeId) : undefined;
  const title = meal.leftoverOf ? `Restes : ${r?.title}` : r?.title || meal.label || '';
  const upd = (ch: Partial<PlannedMeal>) => db.meals.update(meal.id, ch);
  const status = async (s: PlannedMeal['status']) => { const undo = await setStatus(meal, s); toast(s === 'cooked' ? 'Cuisiné 👍' : s === 'skipped' ? 'Passé' : 'Remis au plan', undo); onClose(); };
  const move = (v: string) => v === 'idea' ? upd({ date: undefined, slot: undefined }) : upd({ date: v, slot: meal.slot || 'dinner' });

  return <Sheet title={title} onClose={onClose}>
    <div class="row gap wrap">
      <button class="primary" onClick={() => status('cooked')} disabled={meal.status === 'cooked'}>✓ Cuisiné</button>
      <button class="secondary" onClick={() => status('skipped')} disabled={meal.status === 'skipped'}>Pas fait</button>
      {meal.status !== 'planned' && <button class="ghost" onClick={() => status('planned')}>Remettre au plan</button>}
    </div>
    {!meal.leftoverOf && meal.recipeId && <>
      <div class="field"><label>Nombre de personnes</label><Stepper value={meal.servings} onChange={n => upd({ servings: n })} label="personnes" /></div>
      <label class="check"><input type="checkbox" checked={!!meal.extra} onChange={e => upd({ extra: e.currentTarget.checked ? hh : 0 })} />
        Cuisiner {hh} parts de plus pour des restes <small class="muted">(à placer ensuite sur un autre repas)</small></label>
    </>}
    <div class="field"><label>Jour</label>
      <select value={meal.date || 'idea'} onChange={e => move(e.currentTarget.value)}>
        <option value="idea">Pas encore de jour (idées)</option>
        {range(period.start, period.end).map(d => <option value={d}>{label(d)}</option>)}
      </select></div>
    {meal.date && <div class="field"><label>Repas</label><Seg value={meal.slot || 'dinner'} options={[['lunch', 'Déjeuner'], ['dinner', 'Dîner']]} onChange={s => upd({ slot: s })} /></div>}
    {r && <button class="ghost wide" onClick={() => setShowRecipe(!showRecipe)}>{showRecipe ? 'Masquer la recette' : 'Voir la recette'}</button>}
    {r && showRecipe && <RecipeBody r={r} servings={meal.servings + (meal.extra || 0)} />}
    <button class="danger wide" onClick={async () => { const undo = await removeMeal(meal.id); toast('Retiré du plan', undo); onClose(); }}>Retirer du plan</button>
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
  return <Sheet title="Nouveau plan" onClose={onClose}
    footer={<button class="primary wide" disabled={!ok} onClick={async () => onDone(await createPeriod(start, realEnd, copy ? prev : undefined))}>Créer le plan</button>}>
    <div class="field"><label>À partir du</label><input type="date" value={start} onInput={e => setStart(e.currentTarget.value)} /></div>
    <div class="field"><label>Durée</label><Seg value={len} options={[['7', '1 semaine'], ['14', '2 semaines'], ['c', 'Autre']]} onChange={setLen} /></div>
    {len === 'c' && <div class="field"><label>Jusqu'au</label><input type="date" value={end} min={start} onInput={e => setEnd(e.currentTarget.value)} /></div>}
    <p class="muted">{short(start)} → {short(realEnd)} · {diffDays(start, realEnd) + 1} jours</p>
    {prev && <label class="check"><input type="checkbox" checked={copy} onChange={e => setCopy(e.currentTarget.checked)} /> Copier les repas du plan {short(prev.start)}–{short(prev.end)}</label>}
  </Sheet>;
}

// ---------- "Fill my period" ----------
export function FillSheet({ period, meals, onClose }: { period: Period; meals: PlannedMeal[]; onClose: () => void }) {
  const { cat } = useContext(CatCtx);
  const emptyDinners = range(period.start, period.end).filter(d => d >= today() && !meals.some(m => m.date === d && m.slot === 'dinner')).length;
  const [n, setN] = useState(Math.max(1, Math.min(emptyDinners || 4, 14)));
  const [place, setPlace] = useState<'p' | 'i'>(emptyDinners ? 'p' : 'i');
  return <Sheet title="Proposer des repas" onClose={onClose}
    footer={<button class="primary wide" onClick={async () => { const undo = await fill(period, n, place === 'p', cat); toast(`${n} repas proposés — touchez-en un pour le changer`, undo); onClose(); }}>Proposer {n} repas</button>}>
    <p class="muted">Choisit des plats pas mangés récemment, qui utilisent ce que vous avez à la maison, environ moitié végé, de saison d'abord.</p>
    <div class="field"><label>Combien ?</label><Stepper value={n} onChange={setN} label="nombre de repas" /></div>
    <div class="field"><label>Où ?</label><Seg value={place} options={[['p', `Dîners libres (${emptyDinners})`], ['i', 'Dans les idées']]} onChange={setPlace} /></div>
  </Sheet>;
}

// ---------- end of period: close the loop, then plan the next one ----------
export function ReviewSheet({ period, meals, recipes, onNext, onCreated, onClose }:
  { period: Period; meals: PlannedMeal[]; recipes: Map<string, Recipe>; onNext: () => void; onCreated: (p: Period) => void; onClose: () => void }) {
  const real = meals.filter(m => !m.leftoverOf && (m.recipeId || m.label));
  const open = real.filter(m => m.status === 'planned');
  const cooked = real.filter(m => m.status === 'cooked');
  const distinct = new Set(cooked.map(m => m.recipeId).filter(Boolean)).size;
  const veg = cooked.filter(m => recipes.get(m.recipeId!)?.tags.includes('vege')).length;
  const [carry, setCarry] = useState(true);
  const title = (m: PlannedMeal) => recipes.get(m.recipeId!)?.title || m.label;
  const len = diffDays(period.start, period.end) + 1;

  const next = async () => {
    const start = period.end >= today() ? addDays(period.end, 1) : today();
    const np = await createPeriod(start, addDays(start, len - 1));
    if (carry) await db.meals.bulkPut(open.map(m => ({ ...m, periodId: np.id, date: undefined, slot: undefined })));
    await db.periods.update(period.id, { reviewedAt: Date.now() });
    onCreated(np);
  };
  return <Sheet title={`Bilan ${short(period.start)}–${short(period.end)}`} onClose={onClose}
    footer={<><button class="primary wide" onClick={next}>Planifier les {len} jours suivants</button>
      <button class="ghost wide" onClick={async () => { await db.periods.update(period.id, { reviewedAt: Date.now() }); onNext(); }}>Autre durée / copier un plan…</button></>}>
    <div class="stats">
      <div><b>{cooked.length}</b>/{real.length}<small>repas cuisinés</small></div>
      <div><b>{distinct}</b><small>recettes différentes</small></div>
      <div><b>{veg}</b><small>repas végé</small></div>
    </div>
    {open.length > 0 && <><h4>Les avez-vous cuisinés ?</h4>
      <ul class="rlist">{open.map(m => <li><span>{title(m)}<small>{m.date ? ' · ' + label(m.date) : ''}</small></span>
        <span class="row gap"><button class="sm secondary" onClick={() => setStatus(m, 'cooked')}>Oui</button><button class="sm ghost" onClick={() => setStatus(m, 'skipped')}>Non</button></span></li>)}</ul>
      <label class="check"><input type="checkbox" checked={carry} onChange={e => setCarry(e.currentTarget.checked)} /> Reporter les {open.length} repas non faits dans les idées du prochain plan</label></>}
    <p class="muted">Pas de jugement : un plan suivi à moitié vaut mieux que pas de plan. Gardez ce qui a marché.</p>
  </Sheet>;
}
