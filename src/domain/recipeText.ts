// Whole-recipe text → structured draft. Used for (1) the built-in recipe bank, (2) "paste a whole recipe",
// (3) text shared from Chrome. Pure, tested.
import { Catalogue, norm } from './catalogue';
import { parseLine } from './parser';

export interface RecipeDraft { title: string; servings: number; minutes?: number; tags: string[]; ingredients: string[]; steps: string[] }

// ---------- tag vocabulary (French) ----------
export const CATEGORIES: [string, string][] = [
  ['plat', 'Plats'], ['soupe', 'Soupes'], ['salade', 'Salades'], ['tarte', 'Tartes, quiches & pizzas'],
  ['accompagnement', 'Accompagnements'], ['sauce', 'Sauces'], ['dessert', 'Desserts'], ['petit-dej', 'Petit-déj & goûter'],
];
export const DIETS: [string, string][] = [['vege', 'Végé'], ['viande', 'Viande'], ['volaille', 'Volaille'], ['poisson', 'Poisson'], ['batch', 'Batch cooking'], ['leger', 'Léger']];
export const CUISINES: [string, string][] = [['francaise', 'Française'], ['italienne', 'Italienne'], ['asiatique', 'Asiatique'],
  ['indienne', 'Indienne'], ['orientale', 'Orientale'], ['mexicaine', 'Mexicaine'], ['monde', 'Autres pays']];
export const SEASONS: [string, string][] = [['printemps', 'Printemps'], ['ete', 'Été'], ['automne', 'Automne'], ['hiver', 'Hiver']];
const ALL_TAGS = new Set([...CATEGORIES, ...DIETS, ...CUISINES, ...SEASONS].map(([t]) => t));
export const tagLabel = (t: string) => [...CATEGORIES, ...DIETS, ...CUISINES, ...SEASONS].find(([k]) => k === t)?.[1] || t;
export const SEASON_OF_MONTH = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'];

/** v0.1 English tags → French tags. */
const OLD: Record<string, string> = { veggie: 'vege', autumn: 'automne', winter: 'hiver', spring: 'printemps', summer: 'ete', quick: '' };
export const migrateTags = (tags: string[]) => [...new Set(tags.map(t => (t in OLD ? OLD[t] : t)).filter(Boolean))];

// ---------- bank format ----------
// ## Titre | 4 | 30 | plat;vege;francaise;hiver
// - 250 g lentilles corail
// > Étape…
export function parseBank(text: string): RecipeDraft[] {
  return text.split(/^##\s+/m).slice(1).map(block => {
    const [head, ...rest] = block.split('\n');
    const [title, serv, min, tags] = head.split('|').map(s => s.trim());
    return {
      title, servings: Number(serv) || 4, minutes: Number(min) || undefined,
      tags: (tags || '').split(/[;,]/).map(t => t.trim()).filter(Boolean),
      ingredients: rest.filter(l => /^\s*-\s+/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim()),
      steps: rest.filter(l => /^\s*>\s*/.test(l)).map(l => l.replace(/^\s*>\s*/, '').trim()).filter(Boolean),
    };
  });
}
export const unknownTags = (d: RecipeDraft) => d.tags.filter(t => !ALL_TAGS.has(t));

// ---------- free text (pasted / shared) ----------
const ING_HEAD = /^\s*(ingr[ée]dients?|il vous faut|ingredients?)\b/i;
const STEP_HEAD = /^\s*(pr[ée]paration|[ée]tapes?|instructions?|recette|d[ée]roul[ée]|directions?|method|steps?|r[ée]alisation)\b\s*:?\s*$/i;
const NOISE = /^(publicit|jump to|imprimer|print|partager|share|note|avis|commentaire|\d+(,\d)?\s*\/\s*5)/i;
const STEP_NUM = /^\s*(?:[ée]tape\s*\d+\s*[:.-]?|step\s*\d+\s*[:.-]?|\d+\s*[.)-]\s+)/i;

export function parseFreeText(raw: string, cat: Catalogue): RecipeDraft {
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l && !/^https?:\/\/\S+$/.test(l));
  let title = '', servings = 0, minutes = 0, mode: 'auto' | 'ing' | 'step' = 'auto';
  const ingredients: string[] = [], steps: string[] = [];
  const tminutes: number[] = [];
  for (const l of lines) {
    const n = norm(l);
    const sv = n.match(/(?:pour|for|serves|portions?\s*:?)\s*(\d+)|(\d+)\s*(?:personnes?|pers\b|parts?\b|portions?|servings?|people|couverts?)/);
    if (sv && l.length < 60) { servings = servings || Number(sv[1] || sv[2]); if (l.length < 30) continue; }
    const tm = n.match(/(?:total|preparation|prep|cuisson|cook|temps)[^0-9]{0,20}(\d+)\s*(h|min)/);
    if (tm && l.length < 60) { const v = Number(tm[1]) * (tm[2] === 'h' ? 60 : 1); if (/total/.test(n)) minutes = v; else tminutes.push(v); continue; }
    if (ING_HEAD.test(l) && l.length < 40) { mode = 'ing'; continue; }
    if (STEP_HEAD.test(l)) { mode = 'step'; continue; }
    if (NOISE.test(n)) continue;
    if (!title) { title = l.replace(/^#+\s*/, '').replace(/\s*[-|–]\s*(marmiton|750g|cuisine az|recette).*$/i, ''); continue; }
    if (mode === 'step') { const s = l.replace(STEP_NUM, ''); if (s) steps.push(s); continue; }
    const p = parseLine(l, cat);
    const looksIng = l.length <= 70 && (p.qty != null || !!p.ingredientId) && !/[.!]$/.test(l) || /^[-•*·]\s/.test(l) && l.length <= 80;
    if (mode === 'ing') { if (looksIng || l.length <= 50) ingredients.push(l.replace(/^[-•*·]\s*/, '')); else { mode = 'step'; steps.push(l.replace(STEP_NUM, '')); } }
    else if (looksIng && !steps.length) ingredients.push(l.replace(/^[-•*·]\s*/, ''));
    else steps.push(l.replace(STEP_NUM, ''));
  }
  if (!minutes && tminutes.length) minutes = tminutes.reduce((a, b) => a + b, 0);
  return { title: title || 'Nouvelle recette', servings: servings || 4, minutes: minutes || undefined, tags: [], ingredients, steps };
}

// ---------- filtering (picker + recipes screen) ----------
export interface RecipeFilter { q: string; cat: string; flags: string[] }   // flags: diet/cuisine tags, 'rapide', 'saison'
export function filterRecipes<T extends { title: string; tags: string[]; minutes?: number; lines: { raw: string }[] }>(rs: T[], f: RecipeFilter, month = new Date().getMonth()): T[] {
  const q = norm(f.q), season = SEASON_OF_MONTH[month];
  return rs.filter(r => (!f.cat || r.tags.includes(f.cat))
    && f.flags.every(fl => fl === 'rapide' ? (r.minutes ?? 99) <= 30 : fl === 'saison' ? r.tags.includes(season) : r.tags.includes(fl))
    && (!q || norm(r.title).includes(q) || r.lines.some(l => norm(l.raw).includes(q))))
    .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}

// ---------- schema.org Recipe in a web page (when "Share" gives only a URL and the site allows reading it) ----------
const isoMin = (d?: string) => { const m = d?.match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/); return m ? (Number(m[1] || 0) * 60 + Number(m[2] || 0)) || undefined : undefined; };
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
export function parseJsonLdRecipe(html: string): RecipeDraft | null {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const find = (o: any): any => {
    if (!o || typeof o !== 'object') return null;
    if (Array.isArray(o)) { for (const x of o) { const r = find(x); if (r) return r; } return null; }
    const t = o['@type']; if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return o;
    return find(o['@graph']) || null;
  };
  for (const b of blocks) {
    let r: any; try { r = find(JSON.parse(b)); } catch { continue; }
    if (!r) continue;
    const steps: string[] = [];
    const walk = (x: any) => { if (!x) return; if (typeof x === 'string') steps.push(...strip(x).split(/(?<=\.)\s+(?=[A-ZÉÀ])/)); else if (Array.isArray(x)) x.forEach(walk); else if (x.itemListElement) walk(x.itemListElement); else if (x.text) steps.push(strip(x.text)); };
    walk(r.recipeInstructions);
    const y = Array.isArray(r.recipeYield) ? r.recipeYield.join(' ') : String(r.recipeYield ?? '');
    return { title: strip(String(r.name || 'Recette')), servings: Number(y.match(/\d+/)?.[0]) || 4,
      minutes: isoMin(r.totalTime) || ((isoMin(r.prepTime) || 0) + (isoMin(r.cookTime) || 0)) || undefined,
      tags: [], ingredients: (r.recipeIngredient || []).map((s: string) => strip(String(s))), steps: steps.filter(Boolean) };
  }
  return null;
}
