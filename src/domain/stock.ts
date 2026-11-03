// Coarse home stock: Have / Low / Out, optional quantity (council: no per-gram inventory).
import type { ListItem, Recipe, StockItem } from '../db/types';
import { lineAmount } from './parser';
import { toBase, baseUnit } from './units';

const DAY = 864e5;

/** Bought items → stock "Have", adding quantities when units are compatible. */
export function putAway(items: ListItem[], stock: Map<string, StockItem>, now = Date.now()): StockItem[] {
  const out: StockItem[] = [];
  for (const i of items) {
    if (!i.ingredientId) continue;
    const s = stock.get(i.ingredientId);
    const next: StockItem = { ingredientId: i.ingredientId, level: 'have', alwaysHave: s?.alwaysHave, updatedAt: now };
    if (i.qty != null && i.unit) {
      const add = toBase(i.qty, i.unit);
      const prev = s && s.level !== 'out' && s.qty != null && s.unit ? toBase(s.qty, s.unit) : null;
      if (!s || s.level === 'out' || s.qty == null || (prev && prev.family === add.family)) {
        next.qty = add.qty + (prev && prev.family === add.family ? prev.qty : 0);
        next.unit = baseUnit(add.family);
      }
    }
    out.push(next);
  }
  return out;
}

/** Optional (setting, off by default): cooking deducts known quantities only. */
export function cookDeduct(r: Recipe, servings: number, stock: Map<string, StockItem>, now = Date.now()): StockItem[] {
  const f = servings / (r.servings || 1), out: StockItem[] = [];
  for (const l of r.lines) {
    const s = l.ingredientId && stock.get(l.ingredientId);
    const amt = lineAmount(l);
    if (!s || s.alwaysHave || s.qty == null || !s.unit || amt == null) continue;
    const have = toBase(s.qty, s.unit), use = toBase(amt * f, l.unit);
    if (have.family !== use.family) continue;
    const left = have.qty - use.qty;
    out.push(left > 0 ? { ...s, qty: left, unit: baseUnit(have.family), updatedAt: now }
      : { ...s, level: 'out', qty: undefined, unit: undefined, updatedAt: now });
  }
  return out;
}

/** "Have" for more than 30 days without a check → worth a look. */
export const isStale = (s: StockItem, now = Date.now()) => s.level === 'have' && !s.alwaysHave && now - s.updatedAt > 30 * DAY;
