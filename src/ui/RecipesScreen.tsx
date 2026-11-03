import { useContext, useState } from 'preact/hooks';
import { db } from '../db/db';
import { addMeal } from '../db/ops';
import type { Recipe } from '../db/types';
import { norm } from '../domain/catalogue';
import { lineAmount } from '../domain/parser';
import { today } from '../domain/dates';
import { formatQty } from '../domain/units';
import { CatCtx, Empty, Sheet, Stepper, toast, useLive } from './kit';
import { RecipeEdit } from './RecipeEdit';

const FILTERS = ['veggie', 'quick', 'batch', 'autumn', 'winter', 'spring', 'summer'];

export function RecipesScreen() {
  const recipes = useLive(() => db.recipes.orderBy('title').toArray(), []) || [];
  const [q, setQ] = useState(''); const [tag, setTag] = useState('');
  const [open, setOpen] = useState<Recipe | null>(null); const [edit, setEdit] = useState<Recipe | 'new' | null>(null);
  const nq = norm(q);
  const shown = recipes.filter(r => (!tag || r.tags.includes(tag)) && (!nq || norm(r.title).includes(nq)
    || r.lines.some(l => norm(l.raw).includes(nq))));
  return <section class="screen">
    <div class="topbar"><h1>Recipes</h1><button class="primary sm" onClick={() => setEdit('new')}>+ New</button></div>
    <input class="search" type="search" placeholder="Search a recipe or an ingredient…" value={q} onInput={e => setQ(e.currentTarget.value)} />
    <div class="chips scroll">{FILTERS.map(t => <button class={'chip' + (tag === t ? ' on' : '')} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>{t}</button>)}</div>
    {!shown.length && <Empty icon="📖" title="No recipe found"><p>Try another word, or add your own recipe.</p></Empty>}
    <ul class="rcards">{shown.map(r => <li><button onClick={() => setOpen(r)}>
      <b>{r.title}</b><small>{r.minutes ? `${r.minutes} min · ` : ''}{r.servings} servings{r.tags.length ? ' · ' + r.tags.join(', ') : ''}</small></button></li>)}</ul>
    {open && <RecipeView r={recipes.find(x => x.id === open.id) || open} onEdit={() => { setEdit(open); setOpen(null); }} onClose={() => setOpen(null)} />}
    {edit && <RecipeEdit recipe={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
  </section>;
}

function RecipeView({ r, onEdit, onClose }: { r: Recipe; onEdit: () => void; onClose: () => void }) {
  const [servings, setServings] = useState(r.servings);
  const addToPlan = async () => {
    const t = today(); const periods = await db.periods.orderBy('start').toArray();
    const p = periods.find(x => x.start <= t && x.end >= t) || periods.find(x => x.start > t) || periods[periods.length - 1];
    if (!p) { toast('Create a plan first (Plan tab)'); return; }
    const m = await addMeal(p.id, r.id); toast(`Added to ideas of your plan`, () => db.meals.delete(m.id)); onClose();
  };
  const del = async () => { await db.recipes.delete(r.id); toast('Recipe deleted', () => db.recipes.put(r)); onClose(); };
  return <Sheet title={r.title} onClose={onClose}>
    <div class="row gap wrap"><button class="primary" onClick={addToPlan}>+ Add to plan</button>
      <button class="secondary" onClick={onEdit}>Edit</button><button class="ghost" onClick={del}>Delete</button></div>
    <div class="field"><label>Servings</label><Stepper value={servings} onChange={setServings} label="servings" /></div>
    <RecipeBody r={r} servings={servings} />
  </Sheet>;
}

export function RecipeBody({ r, servings }: { r: Recipe; servings: number }) {
  const { cat } = useContext(CatCtx);
  const f = servings / (r.servings || 1);
  return <div class="rbody">
    {r.minutes ? <p class="muted">{r.minutes} min</p> : null}
    <h4>Ingredients</h4>
    <ul class="ing">{r.lines.map(l => { const a = lineAmount(l);
      return <li><span>{l.ingredientId ? cat.name(l.ingredientId, l.raw) : l.raw}{l.note ? <small> ({l.note})</small> : null}</span>
        <b>{a != null ? formatQty(Math.round(a * f * 100) / 100, l.unit) : ''}</b></li>; })}</ul>
    {r.steps && <><h4>Steps</h4><ol class="steps">{r.steps.split('\n').filter(Boolean).map(s => <li>{s}</li>)}</ol></>}
  </div>;
}
