import { useContext, useMemo, useState } from 'preact/hooks';
import { db, uid } from '../db/db';
import type { Recipe } from '../db/types';
import { AISLES } from '../data/ingredients';
import { slug } from '../domain/catalogue';
import { parseText } from '../domain/parser';
import { CATEGORIES, CUISINES, DIETS, parseFreeText, SEASONS, type RecipeDraft } from '../domain/recipeText';
import { formatQty } from '../domain/units';
import { CatCtx, Sheet, Stepper, toast } from './kit';

const TAG_GROUPS: [string, [string, string][]][] = [['Catégorie', CATEGORIES], ['Type', DIETS], ['Cuisine', CUISINES], ['Saison', SEASONS]];

/** "Paste a whole recipe": any text from a website, a note, a message. */
export function PasteSheet({ onDone, onClose }: { onDone: (d: RecipeDraft) => void; onClose: () => void }) {
  const { cat } = useContext(CatCtx);
  const [text, setText] = useState('');
  const paste = async () => { try { setText(await navigator.clipboard.readText()); } catch { toast('Collez avec un appui long dans la zone de texte'); } };
  return <Sheet title="Coller une recette" onClose={onClose}
    footer={<button class="primary wide" disabled={!text.trim()} onClick={() => onDone(parseFreeText(text, cat))}>Analyser la recette</button>}>
    <p class="muted">Copiez une recette entière (site web, note, message) : titre, ingrédients et étapes. L'app les sépare, vous vérifiez avant d'enregistrer.</p>
    <button class="secondary" onClick={paste}>📋 Coller depuis le presse-papiers</button>
    <textarea rows={12} value={text} onInput={e => setText(e.currentTarget.value)} placeholder={"Gratin dauphinois\nPour 6 personnes\nIngrédients\n1,5 kg de pommes de terre\n50 cl de crème liquide\n…\nPréparation\n1. Préchauffer le four…"} />
  </Sheet>;
}

export function RecipeEdit({ recipe, draft, onClose }: { recipe?: Recipe; draft?: RecipeDraft; onClose: () => void }) {
  const { cat, reloadCat } = useContext(CatCtx);
  const src = recipe ? { title: recipe.title, servings: recipe.servings, minutes: recipe.minutes, tags: recipe.tags, ingredients: recipe.lines.map(l => l.raw), steps: recipe.steps.split('\n') } : draft;
  const [title, setTitle] = useState(src?.title || '');
  const [servings, setServings] = useState(src?.servings || 4);
  const [minutes, setMinutes] = useState(src?.minutes ? String(src.minutes) : '');
  const [tags, setTags] = useState<string[]>(src?.tags || ['plat']);
  const [text, setText] = useState(src?.ingredients.join('\n') || '');
  const [steps, setSteps] = useState(src?.steps.filter(Boolean).join('\n') || '');
  const [newIng, setNewIng] = useState<{ name: string; aisle: string } | null>(null);
  const [v, setV] = useState(0);
  const lines = useMemo(() => parseText(text, cat), [text, cat, v]);
  const unmatched = lines.filter(l => !l.ingredientId);
  const catOf = (t: string) => CATEGORIES.some(([c]) => c === t);
  const toggleTag = (t: string) => {
    if (catOf(t)) setTags([...tags.filter(x => !catOf(x)), t]);
    else setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);
  };

  const save = async () => {
    if (!title.trim()) { toast('Donnez un titre'); return; }
    const r: Recipe = { id: recipe?.id || uid(), title: title.trim(), servings, minutes: Number(minutes) || undefined, tags, lines,
      steps: steps.trim(), source: recipe?.source || 'user', updatedAt: Date.now() };
    await db.recipes.put(r); toast(recipe ? 'Enregistré' : 'Recette ajoutée'); onClose();
  };
  const createIng = async () => {
    if (!newIng) return;
    const name = newIng.name.trim(); const id = 'u-' + slug(name);
    const ing = { id, en: name, fr: name, aisle: newIng.aisle, aliases: [], custom: true };
    await db.ingredients.put(ing); cat.add(ing); reloadCat(); setNewIng(null); setV(v + 1);
  };

  return <Sheet title={recipe ? 'Modifier la recette' : 'Nouvelle recette'} onClose={onClose}
    footer={<button class="primary wide" onClick={save}>Enregistrer la recette</button>}>
    {draft && !recipe && <p class="cue small">Vérifiez ce qui a été reconnu, puis enregistrez.</p>}
    <div class="field"><label>Titre</label><input value={title} onInput={e => setTitle(e.currentTarget.value)} placeholder="ex. Ratatouille de mamie" /></div>
    <div class="row gap wrap">
      <div class="field"><label>Personnes</label><Stepper value={servings} onChange={setServings} label="personnes" /></div>
      <div class="field"><label>Minutes</label><input type="number" inputMode="numeric" class="short" value={minutes} onInput={e => setMinutes(e.currentTarget.value)} /></div>
    </div>
    {TAG_GROUPS.map(([g, ts]) => <div class="tagrow"><small class="muted">{g}</small><div class="chips">{ts.map(([t, l]) =>
      <button class={'chip' + (tags.includes(t) ? ' on' : '')} aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>{l}</button>)}</div></div>)}
    <div class="field"><label>Ingrédients — un par ligne</label>
      <textarea rows={7} value={text} onInput={e => setText(e.currentTarget.value)} placeholder={"200 g de pâtes\n2 oignons\n1 c. à soupe d'huile d'olive\nsel, poivre"} /></div>
    {lines.length > 0 && <div class="preview">
      <small class="muted">{lines.length - unmatched.length}/{lines.length} reconnus{unmatched.length ? ' — touchez ⚠ pour créer un ingrédient' : ' ✓'}</small>
      <ul>{lines.map(l => <li class={l.ingredientId ? 'ok' : 'warn'}>
        {l.ingredientId ? '✓' : <button class="link" aria-label={'Créer ' + l.rawKey} onClick={() => setNewIng({ name: l.rawKey, aisle: 'other' })}>⚠</button>}
        <span>{l.ingredientId ? cat.name(l.ingredientId) : l.raw}</span>
        <b>{l.qty != null ? formatQty(l.qty, l.unit) + (l.qty2 ? `–${l.qty2}` : '') : ''}</b></li>)}</ul></div>}
    {newIng && <div class="card">
      <div class="field"><label>Nom du nouvel ingrédient</label><input value={newIng.name} onInput={e => setNewIng({ ...newIng, name: e.currentTarget.value })} /></div>
      <div class="field"><label>Rayon</label><select value={newIng.aisle} onChange={e => setNewIng({ ...newIng, aisle: e.currentTarget.value })}>
        {AISLES.map(a => <option value={a.id}>{a.name}</option>)}</select></div>
      <div class="row gap"><button class="primary sm" onClick={createIng}>Créer l'ingrédient</button><button class="ghost sm" onClick={() => setNewIng(null)}>Annuler</button></div>
    </div>}
    <div class="field"><label>Étapes (une par ligne)</label><textarea rows={6} value={steps} onInput={e => setSteps(e.currentTarget.value)} /></div>
  </Sheet>;
}
