// Splits a big text into small frames "id|i|n|data" (data channels like small messages) and puts them back together.
export function toFrames(text: string, id: string, size = 12000): string[] {
  const n = Math.max(1, Math.ceil(text.length / size));
  return Array.from({ length: n }, (_, i) => `${id}|${i}|${n}|${text.slice(i * size, (i + 1) * size)}`);
}
export class Reassembler {
  private parts = new Map<string, { n: number; got: Map<number, string> }>();
  /** Returns the full text when the last frame of a message arrives, otherwise null. */
  push(frame: string): string | null {
    const a = frame.indexOf('|'), b = frame.indexOf('|', a + 1), c = frame.indexOf('|', b + 1);
    if (a < 1 || b < 0 || c < 0) return null;
    const id = frame.slice(0, a), i = +frame.slice(a + 1, b), n = +frame.slice(b + 1, c), data = frame.slice(c + 1);
    if (!Number.isInteger(i) || !Number.isInteger(n) || n < 1 || i < 0 || i >= n) return null;
    const m = this.parts.get(id) || { n, got: new Map() }; this.parts.set(id, m); m.got.set(i, data);
    if (m.got.size < m.n) return null;
    this.parts.delete(id); return Array.from({ length: m.n }, (_, k) => m.got.get(k)!).join('');
  }
}
