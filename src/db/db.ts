// The only database layer (Dexie / IndexedDB). UI talks to it through these helpers.
import Dexie, { type Table } from 'dexie';
import type { KV, ListItem, Period, PlannedMeal, Recipe, Snapshot, StockItem } from './types';
import type { Ingredient } from '../domain/catalogue';
import { Catalogue, parseCatalogue } from '../domain/catalogue';
import { parseText } from '../domain/parser';
import { migrateTags, parseBank } from '../domain/recipeText';

class MenuDB extends Dexie {
  recipes!: Table<Recipe, string>;
  periods!: Table<Period, string>;
  meals!: Table<PlannedMeal, string>;
  stock!: Table<StockItem, string>;
  list!: Table<ListItem, string>;
  ingredients!: Table<Ingredient, string>;   // user-created only
  kv!: Table<KV, string>;
  snapshots!: Table<Snapshot, number>;
  constructor() {
    super('menu-planner');
    this.version(1).stores({
      recipes: 'id, title', periods: 'id, start', meals: 'id, periodId, date, recipeId',
      stock: 'ingredientId', list: 'key', ingredients: 'id', kv: 'key', snapshots: '++id, at',
    });
  }
}
export const db = new MenuDB();
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function loadCatalogue(): Promise<Catalogue> {
  return new Catalogue([...parseCatalogue(), ...(await db.ingredients.toArray())]);
}

export async function getKV<T>(key: string, def: T): Promise<T> {
  const r = await db.kv.get(key); return r ? (r.value as T) : def;
}
export const setKV = (key: string, value: unknown) => db.kv.put({ key, value });

const BANK_VERSION = 2;

/** Loads the built-in recipe bank (lazy chunk). v0.1 English starters are replaced unless used in a plan. */
export async function seedIfEmpty(cat: Catalogue) {
  if ((await getKV('bankVersion', 0)) >= BANK_VERSION) return;
  const files = import.meta.glob('../data/bank/*.ts', { import: 'default' });
  const texts = await Promise.all(Object.values(files).map(f => f() as Promise<string>));
  const now = Date.now();
  const used = new Set((await db.meals.toArray()).map(m => m.recipeId));
  const old = await db.recipes.toArray();
  await db.recipes.bulkDelete(old.filter(r => r.source === 'starter' && !used.has(r.id)).map(r => r.id));
  await db.recipes.bulkPut(old.filter(r => r.source !== 'starter' || used.has(r.id)).map(r => ({ ...r, tags: migrateTags(r.tags) })));
  const have = new Set((await db.recipes.toArray()).map(r => r.title.toLowerCase()));
  const bank = texts.flatMap(parseBank).filter(d => !have.has(d.title.toLowerCase()));
  await db.recipes.bulkPut(bank.map(d => ({ id: uid(), title: d.title, servings: d.servings, minutes: d.minutes, tags: d.tags,
    steps: d.steps.join('\n'), source: 'starter' as const, updatedAt: now, lines: parseText(d.ingredients.join('\n'), cat) })));
  if (!(await getKV('seeded', false))) {
    await db.stock.bulkPut(['salt', 'pepper-black', 'olive-oil'].map(id => ({ ingredientId: id, level: 'have' as const, alwaysHave: true, updatedAt: now })));
    await setKV('seeded', true);
  }
  await setKV('bankVersion', BANK_VERSION);
}

// ---------- backup: export / replace-import / 3 rolling snapshots ----------
const TABLES = ['recipes', 'periods', 'meals', 'stock', 'list', 'ingredients', 'kv'] as const;

export async function exportJSON(): Promise<string> {
  const data: Record<string, unknown> = { app: 'menu-planner', version: 1, exportedAt: new Date().toISOString() };
  for (const t of TABLES) data[t] = await (db as any)[t].toArray();
  return JSON.stringify(data);
}

export async function importJSON(text: string) {
  const data = JSON.parse(text);
  if (data.app !== 'menu-planner' || !Array.isArray(data.recipes)) throw new Error('Not a menu-planner backup file');
  await snapshot(true);
  await db.transaction('rw', TABLES.map(t => (db as any)[t]), async () => {
    for (const t of TABLES) { await (db as any)[t].clear(); await (db as any)[t].bulkPut(data[t] || []); }
  });
}

/** Keep the 3 most recent snapshots inside the app (undo for imports / mistakes). Daily, or forced. */
export async function snapshot(force = false) {
  const last = await db.snapshots.orderBy('at').last();
  if (!force && last && Date.now() - last.at < 864e5) return;
  await db.snapshots.add({ at: Date.now(), data: await exportJSON() });
  const all = await db.snapshots.orderBy('at').toArray();
  if (all.length > 3) await db.snapshots.bulkDelete(all.slice(0, all.length - 3).map(s => s.id!));
}
