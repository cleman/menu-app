// Sync · database side. Reads/writes the synced tables and the sync bookkeeping (sync, syncmeta, conflicts).
// No hooks: before every send/receive, reconcile() compares each record with its stored hash to find what changed here.
import { db, snapshot, uid } from './db';
import type { Conflict } from './types';
import { PK, SYNC_TABLES, decide, describe, hashRecord, isSyncKey, isSyncable, mergeGroup, metaId, vvBump,
  type DeviceInfo, type Entry, type GroupInfo, type Meta, type SyncFile, type SyncTable } from '../domain/sync';

const tbl = (t: SyncTable) => (db as any)[t];
const rd = async <T>(key: string): Promise<T | undefined> => (await db.sync.get(key))?.value as T | undefined;
const wr = (key: string, value: unknown) => db.sync.put({ key, value });

export interface Peer { name: string; lastSyncAt?: number }
export interface ApplyResult { applied: number; conflicts: number; keptMine: number; joined: boolean; from: string }
export class NeedsJoin extends Error { constructor(public file: SyncFile) { super('join'); } }

// ---------- identity & group ----------
export async function getSelf(): Promise<DeviceInfo> {
  let s = await rd<DeviceInfo>('self');
  if (!s) { const id = uid() + uid(); s = { id, name: 'Appareil ' + id.slice(0, 3).toUpperCase() }; await wr('self', s); }
  return s;
}
/** Read-only (safe inside liveQuery): undefined until getSelf() has created the identity. */
export const peekSelf = () => rd<DeviceInfo>('self');
export const getGroup = () => rd<GroupInfo>('group');
export const getPeers = async () => (await rd<Record<string, Peer>>('peers')) || {};
export async function setDeviceName(name: string) { await wr('self', { ...(await getSelf()), name: name.trim() || 'Appareil ' + (await getSelf()).id.slice(0, 3).toUpperCase() }); }

export async function createGroup(): Promise<GroupInfo> {
  const me = await getSelf(), g: GroupInfo = { id: uid() + uid(), chiefId: me.id, chiefSeq: 1 };
  await wr('group', g); await reconcile(me.id); return g;
}
export async function leaveGroup() {
  await db.transaction('rw', db.sync, db.syncmeta, db.conflicts, async () => {
    await db.sync.delete('group'); await db.sync.delete('peers'); await db.syncmeta.clear(); await db.conflicts.clear();
  });
}
/** Only the chief hands the role over. */
export async function setChief(id: string) {
  const g = (await getGroup())!, me = await getSelf();
  if (g.chiefId !== me.id) throw new Error('Seul le chef peut choisir le chef.');
  await wr('group', { ...g, chiefId: id, chiefSeq: g.chiefSeq + 1 });
}
/** Recovery, e.g. the chief device is lost. */
export async function takeChief() { const g = (await getGroup())!, me = await getSelf(); await wr('group', { ...g, chiefId: me.id, chiefSeq: g.chiefSeq + 1 }); }

// ---------- finding local changes ----------
export async function reconcile(me: string) {
  const now = Date.now(), puts: Meta[] = [];
  for (const t of SYNC_TABLES) {
    const metas = new Map((await db.syncmeta.where('t').equals(t).toArray()).map(m => [m.k, m]));
    const seen = new Set<string>();
    for (const rec of await tbl(t).toArray()) {
      if (!isSyncable(t, rec)) continue;
      const k = String(rec[PK[t]]), h = hashRecord(rec), m = metas.get(k); seen.add(k);
      if (!m) puts.push({ id: metaId(t, k), t, k, vv: { [me]: 1 }, ts: now, dev: me, h });
      else if (m.del || m.h !== h) puts.push({ ...m, vv: vvBump(m.vv, me), ts: now, dev: me, h, del: false });
    }
    for (const [k, m] of metas) if (!seen.has(k) && !m.del) puts.push({ ...m, vv: vvBump(m.vv, me), ts: now, dev: me, h: 0, del: true });
  }
  if (puts.length) await db.syncmeta.bulkPut(puts);
}

// ---------- send ----------
export async function buildSyncFile(): Promise<SyncFile> {
  const group = await getGroup(); if (!group) throw new Error("Cet appareil n'est dans aucun groupe.");
  const me = await getSelf(); await reconcile(me.id);
  const metas = await db.syncmeta.toArray(), entries: Entry[] = [];
  for (const t of SYNC_TABLES) {
    const mine = metas.filter(m => m.t === t), live = mine.filter(m => !m.del);
    const recs = await tbl(t).bulkGet(live.map(m => m.k)), byKey = new Map(live.map((m, i) => [m.k, recs[i]]));
    for (const m of mine) {
      const d = m.del ? undefined : byKey.get(m.k); if (!m.del && !d) continue;
      entries.push({ t, k: m.k, vv: m.vv, ts: m.ts, dev: m.dev, h: m.h, ...(m.del ? { del: true } : { d }) });
    }
  }
  const peers = await getPeers();
  return { app: 'menu-planner-sync', v: 1, at: Date.now(), group, from: me,
    devices: [me, ...Object.entries(peers).map(([id, p]) => ({ id, name: p.name }))], entries };
}
export async function markSent() { await wr('lastSentAt', Date.now()); }

// ---------- receive ----------
export async function applySyncFile(file: SyncFile, opts: { join?: 'adopt' | 'merge' } = {}): Promise<ApplyResult> {
  const me = await getSelf(); let group = await getGroup(), joined = false;
  if (!group) {
    if (!opts.join) throw new NeedsJoin(file);
    group = { ...file.group }; joined = true;
    await wr('group', group);
  } else if (group.id !== file.group.id) throw new Error("Ce fichier vient d'un autre groupe. Quittez d'abord le groupe actuel pour rejoindre celui-ci.");
  else { const g = mergeGroup(group, file.group); if (g !== group) { group = g; await wr('group', g); } }
  const adopt = joined && opts.join === 'adopt';
  if (adopt) await snapshot(true); else { await snapshot(false, 36e5); await reconcile(me.id); }     // undo point (adopt: always, otherwise at most hourly)

  // adopt = this device takes the group's data as is: nothing local counts, and local synced records the group does not have are removed (in the same transaction, so the UI never sees an empty state)
  const metas = adopt ? new Map<string, Meta>() : new Map((await db.syncmeta.toArray()).map(m => [m.id, m]));
  const byT = Object.fromEntries(SYNC_TABLES.map(t => [t, { put: [] as any[], del: [] as string[] }])) as Record<SyncTable, { put: any[]; del: string[] }>;
  const newMeta: Meta[] = [], lost: { t: SyncTable; k: string; dev: string; data: any | null; label?: string }[] = [], localLosers: Entry[] = [];
  let applied = 0, conflicts = 0, keptMine = 0;
  for (const e of file.entries) {
    const id = metaId(e.t, e.k), L = metas.get(id), d = decide(L, e, group.chiefId);
    if (d.kind === 'skip') continue;
    if (d.kind === 'vvonly') { newMeta.push({ ...L!, vv: d.vv }); continue; }
    if (d.kind === 'keep') { newMeta.push({ ...L!, vv: d.vv }); conflicts++; keptMine++; lost.push({ t: e.t, k: e.k, dev: e.dev, data: e.del ? null : e.d }); continue; }
    if (d.conflict) { conflicts++; localLosers.push(e); }
    else applied++;
    if (e.del) { byT[e.t].del.push(e.k); newMeta.push({ id, t: e.t, k: e.k, vv: d.vv, ts: e.ts, dev: e.dev, h: 0, del: true }); }
    else { byT[e.t].put.push(e.d); newMeta.push({ id, t: e.t, k: e.k, vv: d.vv, ts: e.ts, dev: e.dev, h: hashRecord(e.d) }); }
  }
  // our versions that are about to lose a conflict → history
  for (const e of localLosers) {
    const rec = await tbl(e.t).get(e.k);
    lost.push({ t: e.t, k: e.k, dev: me.id, data: rec ?? null });
  }
  const extraDel = Object.fromEntries(SYNC_TABLES.map(t => [t, [] as string[]])) as Record<SyncTable, string[]>;
  if (adopt) {
    const keep = new Set(file.entries.filter(e => !e.del).map(e => metaId(e.t, e.k)));
    for (const t of SYNC_TABLES) for (const r of await tbl(t).toArray()) if (isSyncable(t, r) && !keep.has(metaId(t, String(r[PK[t]])))) extraDel[t].push(r[PK[t]]);
  }
  const conflictRows: Conflict[] = [];
  for (const l of lost) {
    const title = l.t === 'meals' && l.data?.recipeId ? (await db.recipes.get(l.data.recipeId))?.title : undefined;
    conflictRows.push({ t: l.t, k: l.k, at: Date.now(), dev: l.dev, data: l.data, label: describe(l.t, l.data, title) || (l.t + ' ' + l.k) });
  }
  await db.transaction('rw', [...SYNC_TABLES.map(tbl), db.syncmeta, db.conflicts], async () => {
    if (adopt) await db.syncmeta.clear();
    for (const t of SYNC_TABLES) { if (extraDel[t].length) await tbl(t).bulkDelete(extraDel[t]); if (byT[t].put.length) await tbl(t).bulkPut(byT[t].put); if (byT[t].del.length) await tbl(t).bulkDelete(byT[t].del); }
    if (newMeta.length) await db.syncmeta.bulkPut(newMeta);
    if (conflictRows.length) await db.conflicts.bulkAdd(conflictRows);
    const all = await db.conflicts.orderBy('at').toArray();
    if (all.length > 100) await db.conflicts.bulkDelete(all.slice(0, all.length - 100).map(c => c.id!));
  });
  // who we know
  const peers = await getPeers(), now = Date.now();
  for (const d of [...file.devices, file.from]) if (d.id !== me.id) peers[d.id] = { ...peers[d.id], name: d.name };
  peers[file.from.id] = { ...peers[file.from.id], name: file.from.name, lastSyncAt: now };
  await wr('peers', peers); await wr('lastReceivedAt', now);
  return { applied, conflicts, keptMine, joined, from: file.from.name };
}

// ---------- conflict history ----------
export const listConflicts = () => db.conflicts.orderBy('at').reverse().toArray();
/** Put an older version back as a normal edit (it will travel to the other devices at the next sync). */
export async function restoreConflict(c: Conflict) {
  if (!isSyncKey(c.t as SyncTable, c.k)) return;
  if (c.data === null) await tbl(c.t as SyncTable).delete(c.k); else await tbl(c.t as SyncTable).put(c.data);
  await db.conflicts.delete(c.id!);
}
export const dismissConflict = (id: number) => db.conflicts.delete(id);
export const lastTimes = async () => ({ sent: await rd<number>('lastSentAt'), received: await rd<number>('lastReceivedAt') });
