// Multi-device sync · PURE logic (no database). See MAP.md "Sync".
// Model: every synced record has a small "meta": a version vector (one counter per device), the last editor, a content hash.
// Two devices exchange their full synced state (a file). For each record: the newer version wins; if both devices edited it
// since they last met (vectors are incomparable) the CHIEF device's version wins and the other one is kept in a history.
import type { KV } from '../db/types';

export type SyncTable = 'recipes' | 'periods' | 'meals' | 'stock' | 'list' | 'ingredients' | 'kv';
export const SYNC_TABLES: SyncTable[] = ['recipes', 'periods', 'meals', 'stock', 'list', 'ingredients', 'kv'];
export const PK: Record<SyncTable, string> = { recipes: 'id', periods: 'id', meals: 'id', stock: 'ingredientId', list: 'key', ingredients: 'id', kv: 'key' };
/** Settings shared by all devices. Everything else in kv (lastExport, bankVersion…) belongs to one device. */
export const SYNC_KV = ['household', 'cookDeduct', 'proposalOff'];

export type VV = Record<string, number>;
export interface Meta { id: string; t: SyncTable; k: string; vv: VV; ts: number; dev: string; h: number; del?: boolean }
export interface Entry { t: SyncTable; k: string; vv: VV; ts: number; dev: string; h: number; del?: boolean; d?: any }
export interface GroupInfo { id: string; chiefId: string; chiefSeq: number }
export interface DeviceInfo { id: string; name: string }
export interface SyncFile { app: 'menu-planner-sync'; v: 1; at: number; group: GroupInfo; from: DeviceInfo; devices: DeviceInfo[]; entries: Entry[] }

export const metaId = (t: string, k: string) => t + ':' + k;

/** Starter recipes are identical on every device (seeded from the app) and stay out of sync until the user edits one (it then becomes « perso »). */
export function isSyncable(t: SyncTable, rec: any): boolean {
  if (!rec) return false;
  if (t === 'recipes') return rec.source !== 'starter';
  if (t === 'kv') return SYNC_KV.includes(rec.key);
  return true;
}
export const isSyncKey = (t: SyncTable, k: string) => t !== 'kv' || SYNC_KV.includes(k);

// ---------- version vectors ----------
export type Cmp = 'eq' | 'gt' | 'lt' | 'cc';
export function vvCmp(a: VV, b: VV): Cmp {
  let ag = false, bg = false;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k] || 0, y = b[k] || 0; if (x > y) ag = true; else if (y > x) bg = true; }
  return ag && bg ? 'cc' : ag ? 'gt' : bg ? 'lt' : 'eq';
}
export function vvMax(a: VV, b: VV): VV {
  const o: VV = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v); return o;
}
export const vvBump = (v: VV, dev: string): VV => ({ ...v, [dev]: (v[dev] || 0) + 1 });

// ---------- content hash (change detection; ignores updatedAt so identical seeds on two devices are not a conflict) ----------
export function stableStringify(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(x => stableStringify(x === undefined ? null : x)).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
export function hashRecord(rec: any): number { const { updatedAt, ...rest } = rec || {}; return cyrb53(stableStringify(rest)); }

// ---------- the merge rule ----------
export type Decision =
  | { kind: 'skip' }
  | { kind: 'vvonly'; vv: VV }                                  // same content: just merge the vectors
  | { kind: 'take'; vv: VV; conflict: boolean }                 // remote version replaces ours (conflict = ours is kept in history)
  | { kind: 'keep'; vv: VV };                                   // concurrent edit, ours wins (remote kept in history)

export function decide(local: Meta | undefined, e: Entry, chiefId: string | null): Decision {
  if (!local) return { kind: 'take', vv: e.vv, conflict: false };
  const c = vvCmp(e.vv, local.vv);
  if (c === 'eq' || c === 'lt') return { kind: 'skip' };
  if (c === 'gt') return { kind: 'take', vv: e.vv, conflict: false };
  const vv = vvMax(local.vv, e.vv);
  if ((e.del && local.del) || (!e.del && !local.del && e.h === local.h)) return { kind: 'vvonly', vv };
  const remoteWins = e.dev === chiefId ? true : local.dev === chiefId ? false : e.ts !== local.ts ? e.ts > local.ts : e.dev > local.dev;
  return remoteWins ? { kind: 'take', vv, conflict: true } : { kind: 'keep', vv };
}

/** The group's chief: the highest chiefSeq wins (only the chief, or someone taking over, raises it). */
export function mergeGroup(a: GroupInfo, b: GroupInfo): GroupInfo {
  return b.chiefSeq > a.chiefSeq || (b.chiefSeq === a.chiefSeq && b.chiefId > a.chiefId) ? { ...a, chiefId: b.chiefId, chiefSeq: b.chiefSeq } : a;
}

export function parseSyncFile(text: string): SyncFile {
  let f: any; try { f = JSON.parse(text); } catch { throw new Error("Ce fichier n'est pas un fichier de synchronisation de Menu."); }
  if (f?.app === 'menu-planner') throw new Error("C'est une sauvegarde, pas un fichier de synchronisation. Utilisez « Restaurer un fichier » dans les réglages.");
  if (f?.app !== 'menu-planner-sync' || !Array.isArray(f.entries) || !f.group?.id || !f.from?.id) throw new Error("Ce fichier n'est pas un fichier de synchronisation de Menu.");
  if (f.v > 1) throw new Error("Ce fichier vient d'une version plus récente de Menu : mettez l'app à jour d'abord.");
  f.entries = f.entries.filter((e: any) => e && SYNC_TABLES.includes(e.t) && typeof e.k === 'string' && e.vv && typeof e.vv === 'object' && isSyncKey(e.t, e.k) && (e.del || isSyncable(e.t, e.d)));
  return f as SyncFile;
}

/** Short human label of a record, for the conflict history. */
export function describe(t: SyncTable, rec: any, recipeTitle?: string): string {
  if (!rec) return '';
  switch (t) {
    case 'recipes': return 'Recette : ' + rec.title;
    case 'meals': return 'Repas : ' + (recipeTitle || rec.label || '?') + (rec.date ? ' (' + rec.date + ')' : '');
    case 'periods': return 'Plan : ' + rec.start + ' → ' + rec.end;
    case 'stock': return 'Maison : ' + rec.ingredientId;
    case 'list': return 'Courses : ' + rec.text;
    case 'ingredients': return 'Ingrédient : ' + (rec.fr || rec.en || rec.id);
    case 'kv': return 'Réglage : ' + rec.key;
  }
}
export type { KV };
