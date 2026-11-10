import 'fake-indexeddb/auto';
import { it, expect, beforeEach } from 'vitest';
import { db, setKV, getKV } from '../src/db/db';
import { NeedsJoin, applySyncFile, buildSyncFile, createGroup, getGroup, getSelf, leaveGroup, listConflicts, restoreConflict, setChief, setDeviceName, takeChief } from '../src/db/sync';
import { parseSyncFile, type SyncFile } from '../src/domain/sync';

// Several devices on one fake database: each device's tables are saved in S[name]; running something "on" a device loads its tables first and saves them after.
const ALL = ['recipes', 'periods', 'meals', 'stock', 'list', 'ingredients', 'kv', 'snapshots', 'sync', 'syncmeta', 'conflicts'];
type State = Record<string, any[]>; type Dev = 'A' | 'B' | 'C';
const S = {} as Record<Dev, State>;
const dump = async (): Promise<State> => Object.fromEntries(await Promise.all(ALL.map(async t => [t, await (db as any)[t].toArray()])));
const load = async (s: State) => { for (const t of ALL) { await (db as any)[t].clear(); await (db as any)[t].bulkPut(s[t]); } };
async function on<T>(d: Dev, fn: () => Promise<T>): Promise<T> { await load(S[d]); try { return await fn(); } finally { S[d] = await dump(); } }
const fileFrom = (d: Dev): Promise<SyncFile> => on(d, async () => parseSyncFile(JSON.stringify(await buildSyncFile())));   // through JSON, like a real file
const give = (to: Dev, f: SyncFile) => on(to, () => applySyncFile(f));
const view = (d: Dev) => on(d, async () => ({ r: (await db.recipes.toArray()).map(x => x.id).sort(), m: (await db.meals.toArray()).sort((a, b) => a.id.localeCompare(b.id)), kv: await getKV('household', 0) }));
const recipe = (id: string, title: string) => ({ id, title, servings: 4, tags: [], lines: [], steps: '', source: 'user' as const, updatedAt: 1 });
const meal = (id: string, o: any = {}) => ({ id, periodId: 'p1', servings: 2, status: 'planned' as const, date: '2026-11-10', slot: 'dinner' as const, ...o });

beforeEach(async () => {
  for (const [d, name] of [['A', 'Téléphone'], ['B', 'Tablette'], ['C', 'Autre']] as const) { await load(Object.fromEntries(ALL.map(t => [t, []]))); await getSelf(); await setDeviceName(name); S[d] = await dump(); }
});

/** A creates the group with some data, B joins empty (adopt) */
async function setup() {
  await on('A', async () => { await createGroup(); await db.recipes.put(recipe('r1', 'Gratin')); await db.periods.put({ id: 'p1', start: '2026-11-09', end: '2026-11-15', createdAt: 1 });
    await db.meals.bulkPut([meal('m1', { recipeId: 'r1' }), meal('m2', { label: 'Resto' })]); await setKV('household', 3); await setKV('lastExport', 5); });
  const f = await fileFrom('A');
  await on('B', async () => { await expect(applySyncFile(f)).rejects.toBeInstanceOf(NeedsJoin); await applySyncFile(f, { join: 'adopt' }); });
}
const idOf = (d: Dev) => on(d, async () => (await getSelf()).id);

it('a new device joins (adopt) and gets everything, but not device-only settings', async () => {
  await setup(); const b = await view('B');
  expect(b.r).toEqual(['r1']); expect(b.m.map(m => m.id)).toEqual(['m1', 'm2']); expect(b.kv).toBe(3);
  await on('B', async () => { expect(await getKV('lastExport', null)).toBeNull(); expect((await getGroup())!.chiefId).toBe(await idOf('A')); });
});
it('edits on different records on both sides are both kept, no conflict', async () => {
  await setup();
  await on('B', async () => { await db.meals.update('m1', { status: 'cooked' }); await db.recipes.put(recipe('r2', 'Idée tablette')); });
  await on('A', async () => { await db.meals.update('m2', { label: 'Pizza' }); await db.meals.put(meal('m3', { label: 'Soupe' })); });
  const fb = await fileFrom('B'), fa = await fileFrom('A');
  expect(await give('A', fb)).toMatchObject({ conflicts: 0 }); expect(await give('B', fa)).toMatchObject({ conflicts: 0 });
  const a = await view('A'); expect(a).toEqual(await view('B')); expect(a.r).toEqual(['r1', 'r2']);
  expect(a.m.map(m => [m.id, m.status, m.label])).toEqual([['m1', 'cooked', undefined], ['m2', 'planned', 'Pizza'], ['m3', 'planned', 'Soupe']]);
});
it('same record edited on both: the chief (A) wins, B version is kept and restorable, both converge', async () => {
  await setup();
  await on('A', () => db.meals.update('m1', { servings: 6 })); await on('B', () => db.meals.update('m1', { servings: 1 }));
  const fb = await fileFrom('B'), fa = await fileFrom('A');
  expect(await give('A', fb)).toMatchObject({ conflicts: 1, keptMine: 1 }); expect(await give('B', fa)).toMatchObject({ conflicts: 1, keptMine: 0 });
  for (const d of ['A', 'B'] as Dev[]) await on(d, async () => {
    expect((await db.meals.get('m1'))!.servings).toBe(6); const h = await listConflicts(); expect(h).toHaveLength(1); expect(h[0].data).toMatchObject({ servings: 1 }); expect(h[0].label).toMatch(/Gratin/);
  });
  await on('B', async () => { await restoreConflict((await listConflicts())[0]); });     // B restores its own version: a normal edit now
  expect(await give('A', await fileFrom('B'))).toMatchObject({ conflicts: 0 });
  await on('A', async () => expect((await db.meals.get('m1'))!.servings).toBe(1));
});
it('deletes propagate; delete vs edit is decided by the chief', async () => {
  await setup();
  await on('B', async () => { await db.meals.delete('m2'); await db.meals.update('m1', { status: 'cooked' }); });
  await on('A', async () => { await db.meals.update('m2', { label: 'Pizza' }); await db.meals.delete('m1'); });
  const fb = await fileFrom('B'), fa = await fileFrom('A'); await give('A', fb); await give('B', fa);
  const a = await view('A'), b = await view('B'); expect(a.m).toEqual(b.m); expect(a.m.map(m => m.id)).toEqual(['m2']); expect(a.m[0].label).toBe('Pizza');   // chief A: its delete of m1 and edit of m2 win
});
it('a plain delete (no concurrent edit) reaches the other device', async () => {
  await setup(); await on('B', () => db.meals.delete('m2')); await give('A', await fileFrom('B'));
  expect((await view('A')).m.map(m => m.id)).toEqual(['m1']);
});
it('applying the same file twice changes nothing', async () => {
  await setup(); const fa = await fileFrom('A');
  expect(await give('B', fa)).toMatchObject({ applied: 0, conflicts: 0 });
  const before = JSON.stringify(await view('A')); await give('A', fa); expect(JSON.stringify(await view('A'))).toBe(before);
});
it('starter recipes are not sent; an edited starter (now « perso ») is', async () => {
  await setup(); await on('A', () => db.recipes.bulkPut([{ ...recipe('s-poulet', 'Poulet'), source: 'starter' }, { ...recipe('s-soupe', 'Soupe'), source: 'user' }]));
  expect((await fileFrom('A')).entries.filter(e => e.t === 'recipes').map(e => e.k).sort()).toEqual(['r1', 's-soupe']);
});
it('settings: shared ones travel, device ones never', async () => {
  await setup(); expect((await view('B')).kv).toBe(3);
  await on('B', async () => { await setKV('household', 5); await setKV('snoozeBackup', 99); });
  const fb = await fileFrom('B'); expect(fb.entries.filter(e => e.t === 'kv').map(e => e.k)).toEqual(['household']);
  await give('A', fb); await on('A', async () => { expect(await getKV('household', 0)).toBe(5); expect(await getKV('snoozeBackup', null)).toBeNull(); });
});
it('chief: only the chief hands over; the new chief wins conflicts; taking over works', async () => {
  await setup(); const idB = await idOf('B');
  await on('B', async () => { await expect(setChief('x')).rejects.toThrow(/Seul le chef/); });
  await on('A', () => setChief(idB)); await give('B', await fileFrom('A')); await on('B', async () => expect((await getGroup())!.chiefId).toBe(idB));
  await on('A', () => db.meals.update('m1', { servings: 6 })); await on('B', () => db.meals.update('m1', { servings: 1 }));
  await give('A', await fileFrom('B')); await on('A', async () => expect((await db.meals.get('m1'))!.servings).toBe(1));      // B is chief now
  await on('A', async () => { await takeChief(); expect((await getGroup())!.chiefSeq).toBe(3); });
});
it('three devices converge, even when two non-chiefs edit the same record', async () => {
  await setup(); const fa0 = await fileFrom('A'); await on('C', async () => { await applySyncFile(fa0, { join: 'adopt' }); });
  await on('A', () => db.meals.put(meal('mA', { label: 'A' })));
  await on('B', async () => { await db.meals.put(meal('mB', { label: 'B' })); await db.meals.update('m1', { status: 'cooked' }); });
  await on('C', async () => { await db.meals.put(meal('mC', { label: 'C' })); await db.meals.update('m1', { servings: 9 }); });
  for (let round = 0; round < 2; round++) {
    const f = { A: await fileFrom('A'), B: await fileFrom('B'), C: await fileFrom('C') };
    await give('A', f.B); await give('A', f.C); await give('B', f.C); await give('B', f.A); await give('C', f.A); await give('C', f.B);
  }
  const a = await view('A'); expect(a).toEqual(await view('B')); expect(a).toEqual(await view('C')); expect(a.m.map(m => m.id)).toEqual(['m1', 'm2', 'mA', 'mB', 'mC']);
});
it('joining with merge keeps this device data; a foreign group is refused; leaving keeps data', async () => {
  await setup(); await on('C', () => db.recipes.put(recipe('rc', 'Mienne')));
  const fa = await fileFrom('A');
  await on('C', async () => { await applySyncFile(fa, { join: 'merge' }); });
  expect((await view('C')).r).toEqual(['r1', 'rc']);
  await expect(give('B', { ...fa, group: { ...fa.group, id: 'other' } })).rejects.toThrow(/autre groupe/);
  await on('B', async () => { await leaveGroup(); expect(await getGroup()).toBeUndefined(); expect((await db.meals.count())).toBe(2); await expect(buildSyncFile()).rejects.toThrow(); });
});
it('restoring a backup on a synced device counts as normal edits', async () => {
  await setup(); await fileFrom('B');
  await on('B', async () => { await db.meals.clear(); await db.meals.put(meal('mx', { label: 'Restauré' })); });
  await give('A', await fileFrom('B')); expect((await view('A')).m.map(m => m.id)).toEqual(['mx']);
});
it('joining with « replace » removes this device\'s own synced data, keeps starters and device settings, and keeps an undo copy', async () => {
  await setup();
  await on('C', async () => { await db.recipes.bulkPut([recipe('rc', 'Mienne'), { ...recipe('s-x', 'Starter'), source: 'starter' }]); await db.meals.put(meal('mc', { label: 'Perso' })); await setKV('lastExport', 7); });
  const fa = await fileFrom('A'); await on('C', async () => { await applySyncFile(fa, { join: 'adopt' }); });
  const c = await view('C'); expect(c.r).toEqual(['r1', 's-x']); expect(c.m.map(m => m.id)).toEqual(['m1', 'm2']);
  await on('C', async () => { expect(await getKV('lastExport', 0)).toBe(7); const snaps = await db.snapshots.toArray(); expect(snaps).toHaveLength(1); expect(JSON.parse(snaps[0].data).meals.map((m: any) => m.id)).toEqual(['mc']); });
});
