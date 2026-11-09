import 'fake-indexeddb/auto';
import { it, expect, beforeEach } from 'vitest';
import { db, exportJSON, getKV, importJSON, migrate, seedIfEmpty, setKV } from '../src/db/db';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';

const rec = (id: string, title: string, source: 'starter' | 'user') => ({ id, title, servings: 4, tags: ['plat'], lines: [], steps: 'x', source, updatedAt: 1 });
const meal = (id: string, recipeId: string) => ({ id, periodId: 'p1', recipeId, servings: 2, status: 'planned' as const, date: '2026-11-10', slot: 'dinner' as const });

/** A device as v0.2 left it: random starter ids, no schemaVersion. */
async function oldDevice() {
  for (const t of ['recipes', 'periods', 'meals', 'stock', 'list', 'ingredients', 'kv', 'snapshots']) await (db as any)[t].clear();
  await db.recipes.bulkPut([rec('old1', 'Poulet rôti', 'starter'), rec('mine1', 'Gratin de maman', 'user')]);
  await db.periods.put({ id: 'p1', start: '2026-11-09', end: '2026-11-15', createdAt: 1 });
  await db.meals.bulkPut([meal('m1', 'old1'), meal('m2', 'mine1')]);
  await db.stock.put({ ingredientId: 'rice', level: 'have', qty: 500, unit: 'g', updatedAt: 1 });
  await setKV('household', 3); await setKV('bankVersion', 2); await setKV('seeded', true);
}
beforeEach(oldDevice);

it('migration keeps all data, fixes starter ids, snapshots first, and is idempotent', async () => {
  await migrate();
  expect((await db.recipes.toArray()).map(r => r.id).sort()).toEqual(['mine1', 's-poulet-roti']);
  expect((await db.meals.get('m1'))!.recipeId).toBe('s-poulet-roti');
  expect((await db.meals.get('m2'))!.recipeId).toBe('mine1');
  expect(await db.stock.count()).toBe(1); expect(await getKV('household', 0)).toBe(3);
  const snaps = await db.snapshots.toArray(); expect(snaps).toHaveLength(1);
  expect(JSON.parse(snaps[0].data).recipes.map((r: any) => r.id)).toContain('old1');   // the pre-migration state is recoverable
  const before = await exportJSON(); await migrate(); expect(JSON.parse(await exportJSON()).recipes).toEqual(JSON.parse(before).recipes);
  expect(await db.snapshots.count()).toBe(1);
});
it('fresh install: migration does nothing but mark the version', async () => {
  await db.recipes.clear(); await db.meals.clear(); await db.kv.clear(); await db.snapshots.clear();
  await migrate(); expect(await db.snapshots.count()).toBe(0); expect(await getKV('schemaVersion', 0)).toBe(2);
});
it('a v0.2 backup file can be restored (replace) on a new device', async () => {
  const file = JSON.stringify({ app: 'menu-planner', version: 1, exportedAt: 'x', recipes: [rec('rnd', 'Poulet rôti', 'starter')], periods: [{ id: 'p9', start: '2026-12-01', end: '2026-12-02', createdAt: 1 }],
    meals: [meal('mm', 'rnd')], stock: [], list: [], ingredients: [], kv: [{ key: 'household', value: 5 }] });
  await importJSON(file, 'replace');
  expect((await db.meals.get('mm'))!.recipeId).toBe('s-poulet-roti'); expect(await db.meals.count()).toBe(1);
  expect(await getKV('household', 0)).toBe(5); expect(await getKV('schemaVersion', 0)).toBe(2);
});
it('merge import adds the other device data and loses nothing', async () => {
  await migrate();
  const file = JSON.stringify({ app: 'menu-planner', version: 1, exportedAt: 'x', recipes: [rec('rnd', 'Poulet rôti', 'starter'), rec('tab1', 'Idée de la tablette', 'user')],
    periods: [{ id: 'p2', start: '2026-11-16', end: '2026-11-22', createdAt: 2 }], meals: [{ ...meal('t1', 'tab1'), periodId: 'p2' }], stock: [], list: [], ingredients: [], kv: [{ key: 'household', value: 9 }] });
  const st = await importJSON(file, 'merge');
  expect(st).toEqual({ added: 3, updated: 0 });          // recipe + period + meal; the starter already existed
  expect((await db.recipes.toArray()).map(r => r.id).sort()).toEqual(['mine1', 's-poulet-roti', 'tab1']);
  expect(await db.meals.count()).toBe(3); expect(await db.periods.count()).toBe(2);
  expect(await getKV('household', 0)).toBe(3);           // this device's settings are kept
});
it('seeding creates the same starter ids as the migration expects (and a second device would match)', async () => {
  await db.recipes.clear(); await db.kv.clear();
  await seedIfEmpty(new Catalogue(parseCatalogue()));
  const ids = (await db.recipes.toArray()).map(r => r.id); expect(ids.length).toBeGreaterThan(250);
  expect(ids.every(i => i.startsWith('s-'))).toBe(true); expect(new Set(ids).size).toBe(ids.length);
  const before = JSON.stringify(ids.sort()); await migrate(); expect(JSON.stringify((await db.recipes.toArray()).map(r => r.id).sort())).toBe(before);
});
