import { useContext, useMemo, useState } from 'preact/hooks';
import { db, uid } from '../db/db';
import type { Recipe } from '../db/types';
import { AISLES } from '../data/ingredients';
import { slug } from '../domain/catalogue';
import { parseText } from '../domain/parser';
import { formatQty } from '../domain/units';
import { CatCtx, Sheet, Stepper, toast } from './kit';

const TAGS = ['veggie', 'quick', 'batch', 'autumn', 'winter', 'spring', 'summer'];

export function RecipeEdit({ recipe, onClose }: { recipe?: Recipe; onClose: () => void }) {
  const { cat, reloadCat } = useContext(CatCtx);
  const [title, setTitle] = useState(recipe?.title || '');
  const [servings, setServings] = useState(recipe?.servings || 2);
  const [minutes, setMinutes] = useState(recipe?.minutes ? String(recipe.minutes) : '');
  const [tags, setTags] = useState<string[]>(recipe?.tags || []);
  const [text, setText] = useState(recipe?.lines.map(l => l.raw).join('\n') || '');
  const [steps, setSteps] = useState(recipe?.steps || '');
  const [newIng, setNewIng] = useState<{ name: string; aisle: string } | null>(null);
  const [v, setV] = useState(0);   // re-parse after creating an ingredient
  const lines = useMemo(() => parseText(text, cat), [text, cat, v]);
  const unmatched = lines.filter(l => !l.ingredientId);

  const save = async () => {
    if (!title.trim()) { toast('Give it a title'); return; }
    const r: Recipe = { id: recipe?.id || uid(), title: title.trim(), servings, minutes: Number(minutes) || undefined, tags, lines,
      steps: steps.trim(), source: recipe?.source || 'user', updatedAt: Date.now() };
    await db.recipes.put(r); toast(recipe ? 'Saved' : 'Recipe added'); onClose();
  };
  const createIng = async () => {
    if (!newIng) return;
    const name = newIng.name.trim(); const id = 'u-' + slug(name);
    const ing = { id, en: name, fr: name, aisle: newIng.aisle, aliases: [], custom: true };
    await db.ingredients.put(ing); cat.add(ing); reloadCat(); setNewIng(null); setV(v + 1);
  };

  return <Sheet title={recipe ? 'Edit recipe' : 'New recipe'} onClose={onClose}>
    <div class="field"><label>Title</label><input value={title} onInput={e => setTitle(e.currentTarget.value)} placeholder="e.g. Grandma's ratatouille" /></div>
    <div class="row gap wrap">
      <div class="field"><label>Servings</label><Stepper value={servings} onChange={setServings} label="servings" /></div>
      <div class="field"><label>Minutes</label><input type="number" inputMode="numeric" class="short" value={minutes} onInput={e => setMinutes(e.currentTarget.value)} /></div>
    </div>
    <div class="chips">{TAGS.map(t => <button class={'chip' + (tags.includes(t) ? ' on' : '')} aria-pressed={tags.includes(t)}
      onClick={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}>{t}</button>)}</div>
    <div class="field"><label>Ingredients — paste them, one per line (French or English)</label>
      <textarea rows={7} value={text} onInput={e => setText(e.currentTarget.value)} placeholder={"200 g de pâtes\n2 oignons\n1 c. à soupe d'huile d'olive\nsel, poivre"} /></div>
    {lines.length > 0 && <div class="preview">
      <small class="muted">{lines.length - unmatched.length}/{lines.length} recognised{unmatched.length ? ' — tap ⚠ to add an ingredient' : ' ✓'}</small>
      <ul>{lines.map(l => <li class={l.ingredientId ? 'ok' : 'warn'}>
        {l.ingredientId ? '✓' : <button class="link" onClick={() => setNewIng({ name: l.rawKey, aisle: 'other' })}>⚠</button>}
        <span>{l.ingredientId ? cat.name(l.ingredientId) : l.raw}</span>
        <b>{l.qty != null ? formatQty(l.qty, l.unit) + (l.qty2 ? `–${l.qty2}` : '') : ''}</b></li>)}</ul></div>}
    {newIng && <div class="card">
      <div class="field"><label>New ingredient name</label><input value={newIng.name} onInput={e => setNewIng({ ...newIng, name: e.currentTarget.value })} /></div>
      <div class="field"><label>Shop aisle</label><select value={newIng.aisle} onChange={e => setNewIng({ ...newIng, aisle: e.currentTarget.value })}>
        {AISLES.map(a => <option value={a.id}>{a.name}</option>)}</select></div>
      <div class="row gap"><button class="primary sm" onClick={createIng}>Add ingredient</button><button class="ghost sm" onClick={() => setNewIng(null)}>Cancel</button></div>
    </div>}
    <div class="field"><label>Steps (one per line)</label><textarea rows={5} value={steps} onInput={e => setSteps(e.currentTarget.value)} /></div>
    <button class="primary wide" onClick={save}>Save recipe</button>
  </Sheet>;
}
