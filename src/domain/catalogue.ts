import { RAW_CATALOGUE } from '../data/ingredients';

export interface Ingredient {
  id: string; en: string; fr: string; aisle: string; pieceG?: number; aliases: string[]; custom?: boolean;
}

/** lowercase, strip accents, œ→oe, collapse spaces. */
export function norm(s: string): string {
  return s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
}

/** naive FR/EN singular: drop trailing s/x on each word (not on short words). */
export const singular = (s: string) =>
  s.split(' ').map(w => /oes$/.test(w) ? w.slice(0, -2) : (w.length > 3 && /[sx]$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w)).join(' ');

export function parseCatalogue(raw = RAW_CATALOGUE): Ingredient[] {
  return raw.trim().split('\n').map(line => {
    const [id, en, fr, aisle, piece, extra] = line.split('|');
    return { id, en, fr, aisle, pieceG: piece ? Number(piece) : undefined,
      aliases: (extra || '').split(';').filter(Boolean) };
  });
}

export class Catalogue {
  byId = new Map<string, Ingredient>();
  private index = new Map<string, string>();
  constructor(items: Ingredient[]) { items.forEach(i => this.add(i)); }

  add(i: Ingredient) {
    this.byId.set(i.id, i);
    for (const a of [i.en, i.fr, i.id.replace(/-/g, ' '), ...i.aliases]) {
      const n = norm(a);
      if (!this.index.has(n)) this.index.set(n, i.id);
      const s = singular(n);
      if (!this.index.has(s)) this.index.set(s, i.id);
    }
  }

  /** Exact alias match (accent/plural-insensitive), then longest leading word run
   *  ("oignons émincés" → oignon). No fuzzy matching (council decision). */
  match(name: string): string | null {
    const n = norm(name).replace(/[.,;:!]+$/, '');
    if (!n) return null;
    const direct = this.index.get(n) ?? this.index.get(singular(n));
    if (direct) return direct;
    const words = n.split(' ');
    for (let k = words.length - 1; k >= 1; k--) {
      const head = words.slice(0, k).join(' ');
      const hit = this.index.get(head) ?? this.index.get(singular(head));
      if (hit) return hit;
    }
    // trailing run ("fresh basil", "big carrots")
    for (let k = 1; k < words.length; k++) {
      const tail = words.slice(k).join(' ');
      const hit = this.index.get(tail) ?? this.index.get(singular(tail));
      if (hit) return hit;
    }
    return null;
  }

  name(id: string | null | undefined, fallback = ''): string {
    const n = (id && this.byId.get(id)?.en) || fallback;
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  aisle(id: string | null | undefined): string { return (id && this.byId.get(id)?.aisle) || 'other'; }
  all(): Ingredient[] { return [...this.byId.values()].sort((a, b) => a.en.localeCompare(b.en)); }
}

export const slug = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
