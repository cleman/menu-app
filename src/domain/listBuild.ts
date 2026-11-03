// Shopping list = needs of planned meals − home stock. Pure functions (tested).
import type { ListItem, PlannedMeal, Recipe, StockItem } from '../db/types';
import { Catalogue } from './catalogue';
import { lineAmount } from './parser';
import { baseUnit, formatQty, roundUp, toBase } from './units';

export interface Need {
  key: string; ingredientId: string | null; name: string; qty: number | null; unit: string | null;
  aisle: string; mealIds: string[]; note?: string;
  skip?: 'always' | 'have' | 'covered';   // why it is not on the list
}

interface Acc { id: string | null; name: string; fam: Map<string, number>; noQty: boolean; meals: Set<string> }

export function collectNeeds(meals: PlannedMeal[], recipes: Map<string, Recipe>, cat: Catalogue): Need[] {
  const acc = new Map<string, Acc>();
  for (const m of meals) {
    if (m.status !== 'planned' || m.leftoverOf || !m.recipeId) continue;
    const r = recipes.get(m.recipeId); if (!r) continue;
    const f = (m.servings + (m.extra || 0)) / (r.servings || 1);   // extra = cooked for leftovers
    for (const l of r.lines) {
      const key = l.ingredientId ?? 'raw:' + l.rawKey;
      let a = acc.get(key);
      if (!a) acc.set(key, a = { id: l.ingredientId, name: l.ingredientId ? cat.name(l.ingredientId) : cap(l.rawKey), fam: new Map(), noQty: false, meals: new Set() });
      a.meals.add(m.id);
      const amt = lineAmount(l);
      if (amt == null) { a.noQty = true; continue; }
      const b = toBase(amt * f, l.unit);
      a.fam.set(b.family, (a.fam.get(b.family) || 0) + b.qty);
    }
  }
  const out: Need[] = [];
  for (const [key, a] of acc) {
    const piece = a.id ? cat.byId.get(a.id)?.pieceG : undefined;
    if (piece && a.fam.has('mass') && a.fam.has('count')) {   // 2 onions + 200 g onions → grams
      a.fam.set('mass', a.fam.get('mass')! + a.fam.get('count')! * piece); a.fam.delete('count');
    }
    const base = { ingredientId: a.id, name: a.name, aisle: cat.aisle(a.id), mealIds: [...a.meals] };
    if (a.fam.size === 0) out.push({ ...base, key, qty: null, unit: null });
    let i = 0;
    for (const [family, q] of a.fam) {
      out.push({ ...base, key: i++ ? `${key}|${family}` : key, qty: q, unit: baseUnit(family) });
    }
  }
  return out;
}

/** Subtract stock, then round up to buyable amounts. */
export function applyStock(needs: Need[], stock: Map<string, StockItem>): Need[] {
  return needs.map(n => {
    const s = n.ingredientId ? stock.get(n.ingredientId) : undefined;
    let res: Need = { ...n };
    if (s?.alwaysHave) res.skip = 'always';
    else if (s && s.level !== 'out') {
      if (s.qty != null && s.unit && n.qty != null) {
        const b = toBase(s.qty, s.unit), fam = toBase(1, n.unit).family;
        if (b.family === fam) {
          const left = n.qty - b.qty;
          if (left <= 0) res.skip = 'covered';
          else { res.qty = left; res.note = `have ${formatQty(s.qty, s.unit)}`; }
        } else if (s.level === 'have') res.skip = 'have';
      } else if (s.level === 'have') res.skip = 'have';
      else res.note = 'low at home';
    }
    if (res.qty != null && res.unit) res.qty = roundUp(res.qty, toBase(1, res.unit).family);
    // fresh herbs measured in spoons are bought by the bunch (~150 ml chopped per bunch)
    if (res.aisle === 'veg' && res.unit === 'ml' && res.qty != null) res = { ...res, qty: Math.max(1, Math.ceil(res.qty / 150)), unit: 'bunch' };
    return res;
  });
}

/** Rebuild keeps ticks, manual items and user edits (council decision). */
export function mergeList(old: ListItem[], fresh: Need[]): ListItem[] {
  const byKey = new Map(old.map(o => [o.key, o]));
  const out: ListItem[] = [];
  for (const n of fresh.filter(f => !f.skip)) {
    const o = byKey.get(n.key); byKey.delete(n.key);
    const item: ListItem = { key: n.key, ingredientId: n.ingredientId, text: n.name, qty: n.qty, unit: n.unit,
      aisle: n.aisle, ticked: !!o?.ticked, mealIds: n.mealIds, note: n.note };
    if (o?.edited) Object.assign(item, { text: o.text, qty: o.qty, unit: o.unit, edited: true });
    out.push(item);
  }
  for (const o of byKey.values()) if (o.manual || o.ticked) out.push(o);
  return out;
}

export function listAsText(items: ListItem[], aisleName: (id: string) => string): string {
  const groups = new Map<string, ListItem[]>();
  items.filter(i => !i.ticked).forEach(i => groups.set(i.aisle, [...(groups.get(i.aisle) || []), i]));
  return [...groups].map(([a, xs]) => `${aisleName(a)}\n` + xs.map(i => `- ${i.text}${i.qty != null ? ' ' + formatQty(i.qty, i.unit) : ''}`).join('\n')).join('\n\n');
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Proposal → cart. Same ingredient + same unit family: quantities add up; otherwise a new line. */
export function addToCart(cart: ListItem[], items: ListItem[]): ListItem[] {
  const out = cart.map(c => ({ ...c }));
  for (const it of items) {
    const same = out.find(c => (it.ingredientId ? c.ingredientId === it.ingredientId : c.text.toLowerCase() === it.text.toLowerCase())
      && (c.qty == null || it.qty == null || toBase(1, c.unit).family === toBase(1, it.unit).family));
    if (same) {
      if (same.qty != null && it.qty != null) {
        const sum = toBase(same.qty, same.unit).qty + toBase(it.qty, it.unit).qty, fam = toBase(1, same.unit).family;
        Object.assign(same, { qty: sum, unit: baseUnit(fam) });
      } else if (same.qty == null) Object.assign(same, { qty: it.qty, unit: it.unit });
      same.ticked = false;
    } else out.push({ ...it, key: 'c:' + (it.ingredientId || it.text.toLowerCase()) + ':' + toBase(1, it.unit).family, stage: 'cart', ticked: false });
  }
  return out;
}

export const needToItem = (n: Need): ListItem =>
  ({ key: n.key, ingredientId: n.ingredientId, text: n.name, qty: n.qty, unit: n.unit, aisle: n.aisle, ticked: false, mealIds: n.mealIds, note: n.note });
