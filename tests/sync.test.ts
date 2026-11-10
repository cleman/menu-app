import { it, expect, describe } from 'vitest';
import { decide, hashRecord, isSyncable, mergeGroup, parseSyncFile, vvBump, vvCmp, vvMax, type Entry, type Meta } from '../src/domain/sync';

const meta = (vv: any, o: Partial<Meta> = {}): Meta => ({ id: 'meals:1', t: 'meals', k: '1', vv, ts: 10, dev: 'A', h: 1, ...o });
const ent = (vv: any, o: Partial<Entry> = {}): Entry => ({ t: 'meals', k: '1', vv, ts: 20, dev: 'B', h: 2, d: { id: '1' }, ...o });

describe('version vectors', () => {
  it('compares', () => {
    expect(vvCmp({ A: 1 }, { A: 1 })).toBe('eq'); expect(vvCmp({ A: 2 }, { A: 1 })).toBe('gt'); expect(vvCmp({ A: 1 }, { A: 1, B: 1 })).toBe('lt');
    expect(vvCmp({ A: 2 }, { A: 1, B: 1 })).toBe('cc'); expect(vvCmp({}, {})).toBe('eq');
  });
  it('max and bump do not mutate', () => {
    const a = { A: 1 }; expect(vvMax(a, { A: 3, B: 1 })).toEqual({ A: 3, B: 1 }); expect(vvBump(a, 'A')).toEqual({ A: 2 }); expect(a).toEqual({ A: 1 });
  });
});
describe('hash', () => {
  it('is stable across key order, undefined and updatedAt; changes with content', () => {
    expect(hashRecord({ a: 1, b: [1, { c: 2 }], d: undefined, updatedAt: 5 })).toBe(hashRecord({ b: [1, { c: 2 }], a: 1, updatedAt: 99 }));
    expect(hashRecord({ a: 1 })).not.toBe(hashRecord({ a: 2 }));
    expect(hashRecord(JSON.parse(JSON.stringify({ a: 1, q: undefined, n: null })))).toBe(hashRecord({ a: 1, q: undefined, n: null }));
  });
});
describe('decide', () => {
  it('unknown here → take', () => expect(decide(undefined, ent({ B: 1 }), 'A')).toEqual({ kind: 'take', vv: { B: 1 }, conflict: false }));
  it('same or older → skip', () => { expect(decide(meta({ A: 1 }), ent({ A: 1 }), 'A').kind).toBe('skip'); expect(decide(meta({ A: 2 }), ent({ A: 1 }), 'A').kind).toBe('skip'); });
  it('newer (fast-forward) → take, no conflict, whoever is chief', () => expect(decide(meta({ A: 1 }), ent({ A: 1, B: 1 }), 'A')).toEqual({ kind: 'take', vv: { A: 1, B: 1 }, conflict: false }));
  it('concurrent, identical content → just merge vectors', () => expect(decide(meta({ A: 1 }, { h: 7 }), ent({ B: 1 }, { h: 7 }), 'A')).toEqual({ kind: 'vvonly', vv: { A: 1, B: 1 } }));
  it('concurrent, remote is chief → remote wins', () => expect(decide(meta({ A: 1 }), ent({ B: 1 }), 'B')).toEqual({ kind: 'take', vv: { A: 1, B: 1 }, conflict: true }));
  it('concurrent, local is chief → local wins', () => expect(decide(meta({ A: 1 }), ent({ B: 1 }), 'A')).toEqual({ kind: 'keep', vv: { A: 1, B: 1 } }));
  it('concurrent, neither is chief → most recent wins, ties by device id', () => {
    expect(decide(meta({ A: 1 }), ent({ B: 1 }), 'Z').kind).toBe('take'); expect(decide(meta({ A: 1 }, { ts: 99 }), ent({ B: 1 }), 'Z').kind).toBe('keep');
    expect(decide(meta({ A: 1 }, { ts: 20 }), ent({ B: 1 }), 'Z').kind).toBe('take');
  });
  it('delete vs edit: the chief decides; both deleted → no conflict', () => {
    expect(decide(meta({ A: 1 }), ent({ B: 1 }, { del: true, d: undefined }), 'B')).toMatchObject({ kind: 'take', conflict: true });
    expect(decide(meta({ A: 1 }), ent({ B: 1 }, { del: true, d: undefined }), 'A').kind).toBe('keep');
    expect(decide(meta({ A: 1 }, { del: true }), ent({ B: 1 }, { del: true, d: undefined }), 'A').kind).toBe('vvonly');
  });
  it('both sides reach the same outcome (convergence)', () => {
    const a = meta({ A: 2 }, { dev: 'A', h: 1 }), b = meta({ B: 1 }, { dev: 'B', h: 2 }), asEntry = (m: Meta, d: string): Entry => ({ t: m.t, k: m.k, vv: m.vv, ts: m.ts, dev: m.dev, h: m.h, d });
    for (const chief of ['A', 'B', 'Z']) {
      const atA = decide(a, asEntry(b, 'b'), chief), atB = decide(b, asEntry(a, 'a'), chief);
      expect(atA.kind === 'take' ? 'b' : 'a').toBe(atB.kind === 'take' ? 'a' : 'b');
    }
  });
});
describe('misc', () => {
  it('group: highest chiefSeq wins, ties by id, id is kept', () => {
    const g = { id: 'g', chiefId: 'A', chiefSeq: 1 };
    expect(mergeGroup(g, { id: 'g', chiefId: 'B', chiefSeq: 2 })).toEqual({ id: 'g', chiefId: 'B', chiefSeq: 2 });
    expect(mergeGroup(g, { id: 'g', chiefId: 'B', chiefSeq: 0 })).toBe(g);
    expect(mergeGroup(g, { id: 'g', chiefId: 'B', chiefSeq: 1 }).chiefId).toBe('B');
  });
  it('starters and device-only settings are never synced', () => {
    expect(isSyncable('recipes', { source: 'starter' })).toBe(false); expect(isSyncable('recipes', { source: 'user' })).toBe(true);
    expect(isSyncable('kv', { key: 'household' })).toBe(true); expect(isSyncable('kv', { key: 'bankVersion' })).toBe(false); expect(isSyncable('meals', { id: 'x' })).toBe(true);
  });
  it('parseSyncFile: rejects backups/garbage and filters unsafe entries', () => {
    expect(() => parseSyncFile('nope')).toThrow(/synchronisation/); expect(() => parseSyncFile(JSON.stringify({ app: 'menu-planner' }))).toThrow(/sauvegarde/);
    const f = parseSyncFile(JSON.stringify({ app: 'menu-planner-sync', v: 1, at: 1, group: { id: 'g', chiefId: 'A', chiefSeq: 1 }, from: { id: 'A', name: 'x' }, devices: [],
      entries: [{ t: 'kv', k: 'bankVersion', vv: { A: 1 }, ts: 1, dev: 'A', h: 1, d: { key: 'bankVersion', value: 0 } }, { t: 'kv', k: 'household', vv: { A: 1 }, ts: 1, dev: 'A', h: 1, d: { key: 'household', value: 2 } },
        { t: 'recipes', k: 'r', vv: { A: 1 }, ts: 1, dev: 'A', h: 1, d: { id: 'r', source: 'starter' } }, { t: 'nope', k: 'x', vv: {}, ts: 1, dev: 'A', h: 1 }] }));
    expect(f.entries.map(e => e.k)).toEqual(['household']);
  });
});
