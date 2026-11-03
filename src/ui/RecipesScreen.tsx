import { useContext, useState } from 'preact/hooks';
import { db } from '../db/db';
import { addMeal } from '../db/ops';
import type { Recipe } from '../db/types';
import { lineAmount } from '../domain/parser';
import { filterRecipes, tagLabel, type RecipeDraft, type RecipeFilter } from '../domain/recipeText';
import { today } from '../domain/dates';
import { formatQty } from '../domain/units';
import { CatCtx, emptyFilter, Empty, FilterBar, Loading, Sheet, Stepper, toast, useLive } from './kit';
import { PasteSheet, RecipeEdit } from './RecipeEdit';

export function RecipesScreen({ shared, clearShared }: { shared?: RecipeDraft | null; clearShared?: () => void }) {
  const recipes = useLive(() => db.recipes.toArray(), []);
  const [f, setF] = useState<RecipeFilter>(emptyFilter());
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<Recipe | 'new' | null>(null);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [paste, setPaste] = useState(false);
  if (!recipes) return <section class="screen"><div class="topbar"><h1>Recettes</h1></div><Loading /></section>;
  const shown = filterRecipes(recipes, f);
  const current = recipes.find(r => r.id === open);
  const d = shared || draft;
  return <section class="screen">
    <div class="topbar"><h1>Recettes</h1>
      <button class="secondary sm" onClick={() => setPaste(true)}>📋 Coller</button>
      <button class="primary sm" onClick={() => setEdit('new')}>+ Nouvelle</button></div>
    <FilterBar f={f} set={setF} count={shown.length} />
    {!shown.length && <Empty icon="📖" title="Aucune recette"><p>Essayez un autre mot ou d'autres filtres, ou ajoutez votre recette.</p></Empty>}
    <ul class="rcards">{shown.map(r => <li><button onClick={() => setOpen(r.id)}>
      <b>{r.title}</b><small>{r.minutes ? `${r.minutes} min · ` : ''}{r.servings} pers.{r.tags.length ? ' · ' + r.tags.map(tagLabel).join(', ') : ''}{r.source === 'user' ? ' · ✎ perso' : ''}</small></button></li>)}</ul>
    {current && <RecipeView r={current} onEdit={() => { setEdit(current); setOpen(null); }} onClose={() => setOpen(null)} />}
    {paste && <PasteSheet onDone={dr => { setPaste(false); setDraft(dr); }} onClose={() => setPaste(false)} />}
    {(edit || d) && <RecipeEdit recipe={edit && edit !== 'new' ? edit : undefined} draft={d || undefined}
      onClose={() => { setEdit(null); setDraft(null); clearShared?.(); }} />}
  </section>;
}

function RecipeView({ r, onEdit, onClose }: { r: Recipe; onEdit: () => void; onClose: () => void }) {
  const [servings, setServings] = useState(r.servings);
  const addToPlan = async () => {
    const t = today(); const periods = await db.periods.orderBy('start').toArray();
    const p = periods.find(x => x.start <= t && x.end >= t) || periods.find(x => x.start > t) || periods[periods.length - 1];
    if (!p) { toast("Créez d'abord un plan (onglet Plan)"); return; }
    const m = await addMeal(p.id, r.id); toast('Ajouté aux idées du plan', () => db.meals.delete(m.id)); onClose();
  };
  const del = async () => { await db.recipes.delete(r.id); toast('Recette supprimée', () => db.recipes.put(r)); onClose(); };
  return <Sheet title={r.title} onClose={onClose}>
    <div class="row gap wrap"><button class="primary" onClick={addToPlan}>+ Au plan</button>
      <button class="secondary" onClick={onEdit}>Modifier</button><button class="ghost" onClick={del}>Supprimer</button></div>
    <div class="field"><label>Personnes</label><Stepper value={servings} onChange={setServings} label="personnes" /></div>
    <RecipeBody r={r} servings={servings} />
  </Sheet>;
}

export function RecipeBody({ r, servings }: { r: Recipe; servings: number }) {
  const { cat } = useContext(CatCtx);
  const f = servings / (r.servings || 1);
  return <div class="rbody">
    {r.minutes ? <p class="muted">{r.minutes} min{r.tags.length ? ' · ' + r.tags.map(tagLabel).join(', ') : ''}</p> : null}
    <h4>Ingrédients</h4>
    <ul class="ing">{r.lines.map(l => { const a = lineAmount(l);
      return <li><span>{l.ingredientId ? cat.name(l.ingredientId, l.raw) : l.raw}{l.note ? <small> ({l.note})</small> : null}</span>
        <b>{a != null ? formatQty(Math.round(a * f * 100) / 100, l.unit) : ''}</b></li>; })}</ul>
    {r.steps && <><h4>Étapes</h4><ol class="steps">{r.steps.split('\n').filter(Boolean).map(s => <li>{s}</li>)}</ol></>}
  </div>;
}
