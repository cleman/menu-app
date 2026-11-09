// The only database layer (Dexie / IndexedDB). UI talks to it through these helpers.
import Dexie, { type Table } from 'dexie';
import type { KV, ListItem, Period, PlannedMeal, Recipe, Snapshot, StockItem } from './types';
import type { Ingredient } from '../domain/catalogue';
import { Catalogue, parseCatalogue } from '../domain/catalogue';
import { parseText } from '../domain/parser';
import { migrateTags, parseBank } from '../domain/recipeText';
import { BACKUP_VERSION, merge, normalize, starterId, type Backup, type MergeStats } from '../domain/backup';

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
  await db.recipes.bulkPut(bank.map(d => ({ id: starterId(d.title), title: d.title, servings: d.servings, minutes: d.minutes, tags: d.tags,
    steps: d.steps.join('\n'), source: 'starter' as const, updatedAt: now, lines: parseText(d.ingredients.join('\n'), cat) })));
  if (!(await getKV('seeded', false))) {
    await db.stock.bulkPut(['salt', 'pepper-black', 'olive-oil'].map(id => ({ ingredientId: id, level: 'have' as const, alwaysHave: true, updatedAt: now })));
    await setKV('seeded', true);
  }
  await setKV('bankVersion', BANK_VERSION);
}

// ---------- backup: export / import (replace or merge) / 3 rolling snapshots / one-time migration ----------
const TABLES = ['recipes', 'periods', 'meals', 'stock', 'list', 'ingredients', 'kv'] as const;
const SCHEMA_VERSION = 2;

async function readAll(): Promise<Backup> {
  const data: Record<string, unknown> = { app: 'menu-planner', version: BACKUP_VERSION, exportedAt: new Date().toISOString() };
  for (const t of TABLES) data[t] = await (db as any)[t].toArray();
  return data as unknown as Backup;
}
async function writeAll(data: Backup) {
  await db.transaction('rw', TABLES.map(t => (db as any)[t]), async () => {
    for (const t of TABLES) { await (db as any)[t].clear(); await (db as any)[t].bulkPut((data as any)[t] || []); }
  });
}

export async function exportJSON(): Promise<string> { return JSON.stringify(await readAll()); }

/**
 * v0.3 migration (runs once, before anything else): starter recipes get the same id on every device
 * (needed for multi-device), and meals pointing to them are updated. A full snapshot is taken first.
 */
export async function migrate() {
  if ((await getKV('schemaVersion', 1)) >= SCHEMA_VERSION) return;
  if ((await db.recipes.count()) > 0) {
    await snapshot(true);
    const fixed = normalize(await readAll());
    await db.transaction('rw', db.recipes, db.meals, async () => {
      await db.recipes.clear(); await db.recipes.bulkPut(fixed.recipes);
      await db.meals.clear(); await db.meals.bulkPut(fixed.meals);
    });
  }
  await setKV('schemaVersion', SCHEMA_VERSION);
}

/** 'replace' = everything is replaced by the file · 'merge' = the file's data is added, nothing is removed. */
export async function importJSON(text: string, mode: 'replace' | 'merge' = 'replace'): Promise<MergeStats | null> {
  const incoming = normalize(JSON.parse(text));
  await snapshot(true);
  let stats: MergeStats | null = null;
  if (mode === 'merge') { const r = merge(normalize(await readAll()), incoming); stats = r.stats; await writeAll(r.data); }
  else await writeAll(incoming);
  await setKV('schemaVersion', SCHEMA_VERSION);
  return stats;
}

/** Keep the 3 most recent snapshots inside the app (undo for imports / mistakes). Daily, or forced. */
export async function snapshot(force = false) {
  const last = await db.snapshots.orderBy('at').last();
  if (!force && last && Date.now() - last.at < 864e5) return;
  await db.snapshots.add({ at: Date.now(), data: await exportJSON() });
  const all = await db.snapshots.orderBy('at').toArray();
  if (all.length > 3) await db.snapshots.bulkDelete(all.slice(0, all.length - 3).map(s => s.id!));
}
