import { it, expect } from 'vitest';
import { decodeCode, encodeCode } from '../src/domain/code';
import { Reassembler, toFrames } from '../src/domain/chunks';

const big = { entries: Array.from({ length: 400 }, (_, i) => ({ t: 'meals', k: 'id' + i, vv: { a: i }, d: { label: 'Gratin dauphinois à la crème – œuf ’ ✓ ' + i } })) };

it('codes round-trip (accents, symbols, big payloads) and are much smaller than the JSON', async () => {
  for (const obj of [{ a: 1 }, big]) {
    const c = await encodeCode('S', obj); expect(c).toMatch(/^MS1\.[A-Za-z0-9_-]+$/);
    expect(await decodeCode(c)).toEqual({ kind: 'S', obj });
  }
  expect((await encodeCode('S', big)).length).toBeLessThan(JSON.stringify(big).length / 3);
});
it('reading a code ignores spaces and line breaks added by a messenger', async () => {
  const c = await encodeCode('H', { s: 'v=0\r\no=- 1 2 IN IP4 127.0.0.1' });
  const wrapped = '  ' + c.replace(/(.{40})/g, '$1\n') + '\n ';
  expect((await decodeCode(wrapped)).obj.s).toContain('v=0');
});
it('bad codes give a clear message, not a crash', async () => {
  await expect(decodeCode('hello')).rejects.toThrow(/pas un code Menu/);
  const c = await encodeCode('S', big); await expect(decodeCode(c.slice(0, c.length - 40))).rejects.toThrow(/incomplet/);
  await expect(decodeCode('MS1.@@@@')).rejects.toThrow(/pas un code Menu/);
});

it('frames: split, reorder, interleave, and "|" inside data', () => {
  const text = JSON.stringify({ x: 'a|b|c'.repeat(5000) }), frames = toFrames(text, 'm1', 1000);
  expect(frames.length).toBeGreaterThan(5);
  const re = new Reassembler(); let out: string | null = null;
  for (const f of [...frames].reverse()) { const r = re.push(f); if (r != null) out = r; }
  expect(out).toBe(text);
  const re2 = new Reassembler(), a = toFrames('AAAA', 'a', 2), b = toFrames('BBBB', 'b', 2), got: string[] = [];
  for (const f of [a[0], b[0], b[1], a[1]]) { const r = re2.push(f); if (r != null) got.push(r); }
  expect(got).toEqual(['BBBB', 'AAAA']);
});
it('frames: garbage and an empty message are handled', () => {
  const re = new Reassembler(); expect(re.push('nonsense')).toBeNull(); expect(re.push('x|9|2|d')).toBeNull(); expect(re.push('|0|1|d')).toBeNull();
  expect(re.push(toFrames('', 'e')[0])).toBe('');
});
