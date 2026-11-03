import { UNIT_ALIASES } from './units';
import { Catalogue, norm, singular } from './catalogue';

export interface RecipeLine {
  ingredientId: string | null; raw: string; rawKey: string;
  qty: number | null; qty2?: number | null; unit: string | null; note?: string;
}

const FRACTIONS: Record<string, string> = { '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅓': ' 1/3', '⅔': ' 2/3', '⅛': ' 1/8' };
const NUM = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)`;
const QTY_RE = new RegExp(String.raw`^${NUM}(?:\s*(?:-|–|a|à|to|ou|or)\s*${NUM})?\s*`);
const ARTICLE_RE = /^(?:a|an|one|un|une)\s+/;
const UNIT_KEYS = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length);

function num(s: string): number {
  s = s.trim().replace(',', '.');
  return s.split(/\s+/).reduce((t, part) => {
    if (part.includes('/')) { const [a, b] = part.split('/').map(Number); return t + a / b; }
    return t + Number(part);
  }, 0);
}

function takeUnit(s: string): [string | null, string] {
  for (const k of UNIT_KEYS) {
    if (s.startsWith(k)) {
      const rest = s.slice(k.length);
      if (rest === '' || /^[\s.'’(]/.test(rest) || /^(de|d')/.test(rest.trim()) ) {
        return [UNIT_ALIASES[k], rest.replace(/^\.?\s*/, '')];
      }
    }
  }
  return [null, s];
}

const stripOf = (s: string) => s.replace(/^(?:de la |de l'|du |des |de |d'|of )/, '').trim();

/** Parse one ingredient line (French or English). */
export function parseLine(rawIn: string, cat: Catalogue): RecipeLine {
  const raw = rawIn.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, '').trim();
  let s = norm(raw.replace(/[½¼¾⅓⅔⅛]/g, m => FRACTIONS[m]));
  let qty: number | null = null, qty2: number | null = null, unit: string | null = null;

  const m = s.match(QTY_RE);
  if (m) { qty = num(m[1]); qty2 = m[2] ? num(m[2]) : null; s = s.slice(m[0].length); }
  else if (ARTICLE_RE.test(s)) {
    const after = s.replace(ARTICLE_RE, '');
    const [u] = takeUnit(after);
    if (u) { qty = 1; s = after; }
  }
  if (qty != null) { const [u, rest] = takeUnit(s); unit = u; s = rest; }
  s = stripOf(s);

  // note: "(400 g)", ", chopped", " - finely"
  let note = '';
  const paren = s.match(/\(([^)]*)\)/);
  if (paren) { note = paren[1]; s = s.replace(paren[0], ' ').replace(/\s+/g, ' ').trim(); }
  const comma = s.search(/,| - /);
  if (comma > 0) { note = [s.slice(comma).replace(/^(,| - )\s*/, ''), note].filter(Boolean).join('; '); s = s.slice(0, comma).trim(); }
  s = stripOf(s);

  if (qty != null && !unit) unit = 'pc';
  const ingredientId = cat.match(s);
  return { ingredientId, raw, rawKey: singular(s), qty, qty2, unit, note: note || undefined };
}

/** Parse pasted text: one ingredient per line; qty-less "sel, poivre" lines split on commas. */
export function parseText(text: string, cat: Catalogue): RecipeLine[] {
  const out: RecipeLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || /^(ingr[eé]dients?|pour \d|for \d)\b/i.test(line.trim())) continue;
    const p = parseLine(line, cat);
    if (p.qty == null && line.includes(',')) {
      const parts = line.split(/,| et | and /).map(x => parseLine(x, cat));
      if (parts.length > 1 && parts.every(x => x.ingredientId)) { out.push(...parts); continue; }
    }
    out.push(p);
  }
  return out;
}

/** Scale a line's amount: qty2 (range) is averaged for shopping. */
export const lineAmount = (l: RecipeLine): number | null =>
  l.qty == null ? null : l.qty2 ? (l.qty + l.qty2) / 2 : l.qty;
