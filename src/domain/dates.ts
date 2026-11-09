// Local dates as 'YYYY-MM-DD' strings (no time zones in storage).
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => iso(new Date());
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export function range(start: string, end: string): string[] {
  const out: string[] = []; for (let d = start; d <= end; d = addDays(d, 1)) out.push(d); return out;
}
export const label = (s: string) => parse(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
export const short = (s: string) => parse(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const longLabel = (s: string) => parse(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
