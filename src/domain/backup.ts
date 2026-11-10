// Backup format v2 · PURE logic (no database): validate/upgrade a backup file, and merge two backups.
// Used by db.ts for export / import (replace or merge) and for the one-time migration.
import type { KV, ListItem, Period, PlannedMeal, Recipe, StockItem } from '../db/types';
import type { Ingredient } from './catalogue';

export const BACKUP_VERSION = 2;
/** kv keys that describe THIS device, never copied from another device's backup. */
export const DEVICE_LOCAL_KV = ['lastExport', 'snoozeBackup', 'firstUse', 'onboarded', 'seeded', 'bankVersion', 'schemaVersion'];

export interface Backup {
  app: 'menu-planner'; version: number; exportedAt: string;
  recipes: Recipe[]; periods: Period[]; meals: PlannedMeal[]; stock: StockItem[]; list: ListItem[]; ingredients: Ingredient[]; kv: KV[];
}
export interface MergeStats { added: number; updated: number }

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Same recipe title → same id on every device (starter recipes are seeded separately on each device). */
export const starterId = (title: string) => 's-' + fold(title).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Validate a parsed backup file (v1 or v2) and bring it to the current shape. Never mutates the input. */
export function normalize(raw: any): Backup {
  if (raw?.app === 'menu-planner-sync') throw new Error("C'est un fichier de synchronisation, pas une sauvegarde : utilisez Réglages → Synchronisation → « Recevoir un fichier ».");
  if (!raw || raw.app !== 'menu-planner' || !Array.isArray(raw.recipes)) throw new Error("Ce fichier n'est pas une sauvegarde de Menu.");
  if ((Number(raw.version) || 1) > BACKUP_VERSION) throw new Error("Cette sauvegarde vient d'une version plus récente de Menu : mettez l'app à jour d'abord.");
  const arr = (k: string) => (Array.isArray(raw[k]) ? raw[k] : []);
  const remap = new Map<string, string>();
  const recipes = new Map<string, Recipe>();
  for (const r of arr('recipes') as Recipe[]) {
    let id = r.id;
    if (r.source === 'starter') {
      const want = starterId(r.title), seen = recipes.get(want);
      if (!seen) id = want;
      else if (fold(seen.title) === fold(r.title)) { remap.set(r.id, want); continue; }   // duplicate starter: collapse
    }
    if (id !== r.id) remap.set(r.id, id);
    recipes.set(id, { ...r, id });
  }
  const meals = (arr('meals') as PlannedMeal[]).map(m => (m.recipeId && remap.has(m.recipeId) ? { ...m, recipeId: remap.get(m.recipeId) } : m));
  return { app: 'menu-planner', version: BACKUP_VERSION, exportedAt: raw.exportedAt || new Date().toISOString(),
    recipes: [...recipes.values()], periods: arr('periods'), meals, stock: arr('stock'), list: arr('list'), ingredients: arr('ingredients'), kv: arr('kv') };
}

function mergeBy<T>(local: T[], incoming: T[], key: (t: T) => string, newer?: (inc: T, loc: T) => boolean) {
  const out = new Map(local.map(x => [key(x), x])); let added = 0, updated = 0;
  for (const x of incoming) {
    const k = key(x), cur = out.get(k);
    if (!cur) { out.set(k, x); added++; }
    else if (newer?.(x, cur)) { out.set(k, x); updated++; }
  }
  return { out: [...out.values()], added, updated };
}
const upd = (a: { updatedAt?: number }, b: { updatedAt?: number }) => (a.updatedAt || 0) > (b.updatedAt || 0);

/**
 * Add another device's data to this one without removing anything.
 * Same id on both sides: recipes and stock → the most recently edited wins; everything else → this device wins
 * (those records carry no edit time yet). Records only on the other side are added. Settings (kv) stay as they are.
 */
export function merge(local: Backup, inc: Backup): { data: Backup; stats: MergeStats } {
  const rec = mergeBy(local.recipes, inc.recipes, r => r.id, upd);
  const per = mergeBy(local.periods, inc.periods, p => p.id);
  const mea = mergeBy(local.meals, inc.meals, m => m.id);
  const sto = mergeBy(local.stock, inc.stock, s => s.ingredientId, upd);
  const lis = mergeBy(local.list, inc.list, i => i.key);
  const ing = mergeBy(local.ingredients, inc.ingredients, i => i.id);
  const have = new Set(local.kv.map(k => k.key));
  const kv = [...local.kv, ...inc.kv.filter(k => !have.has(k.key) && !DEVICE_LOCAL_KV.includes(k.key))];
  const all = [rec, per, mea, sto, lis, ing];
  return { data: { ...local, recipes: rec.out, periods: per.out, meals: mea.out, stock: sto.out, list: lis.out, ingredients: ing.out, kv },
    stats: { added: all.reduce((n, x) => n + x.added, 0), updated: all.reduce((n, x) => n + x.updated, 0) } };
}
