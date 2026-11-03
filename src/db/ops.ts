// Write operations used by several screens (each returns an undo where useful).
import { db, getKV, uid } from './db';
import type { PlannedMeal, Period, Slot, StockItem } from './types';
import { addDays, diffDays, range, today } from '../domain/dates';
import { cookDeduct } from '../domain/stock';
import { suggest } from '../domain/suggest';
import type { Catalogue } from '../domain/catalogue';

export const household = () => getKV('household', 2);

export async function addMeal(periodId: string, recipeId: string | undefined, date?: string, slot?: Slot, label?: string) {
  const m: PlannedMeal = { id: uid(), periodId, recipeId, label, date, slot, servings: await household(), status: 'planned' };
  await db.meals.put(m); return m;
}

export async function removeMeal(id: string) {
  const m = await db.meals.get(id); if (!m) return () => {};
  const kids = await db.meals.filter(x => x.leftoverOf === id).toArray();
  await db.meals.bulkDelete([id, ...kids.map(k => k.id)]);
  return () => db.meals.bulkPut([m, ...kids]);
}

export async function setStatus(m: PlannedMeal, status: PlannedMeal['status']) {
  const prev = { ...m }; let stockPrev: StockItem[] = [];
  await db.meals.update(m.id, { status });
  if (status === 'cooked' && m.recipeId && await getKV('cookDeduct', false)) {
    const r = await db.recipes.get(m.recipeId); const stock = new Map((await db.stock.toArray()).map(s => [s.ingredientId, s]));
    if (r) { const upd = cookDeduct(r, m.servings + (m.extra || 0), stock); stockPrev = upd.map(u => stock.get(u.ingredientId)!); await db.stock.bulkPut(upd); }
  }
  return async () => { await db.meals.put(prev); if (stockPrev.length) await db.stock.bulkPut(stockPrev); };
}

export async function createPeriod(start: string, end: string, copyFrom?: Period): Promise<Period> {
  const p: Period = { id: uid(), start, end, createdAt: Date.now() };
  await db.periods.put(p);
  if (copyFrom) {
    const src = await db.meals.where('periodId').equals(copyFrom.id).filter(m => !m.leftoverOf && !!m.recipeId).toArray();
    const shift = diffDays(copyFrom.start, start), len = diffDays(start, end);
    await db.meals.bulkPut(src.map(m => {
      const d = m.date ? addDays(m.date, shift) : undefined;
      const inRange = d && diffDays(start, d) <= len;
      return { id: uid(), periodId: p.id, recipeId: m.recipeId, servings: m.servings, status: 'planned' as const,
        date: inRange ? d : undefined, slot: inRange ? m.slot : undefined };
    }));
  }
  return p;
}

/** Suggest n recipes; either into Ideas or onto empty dinners (first n). */
export async function fill(p: Period, n: number, place: boolean, cat: Catalogue) {
  const [recipes, history, stockArr, mine] = await Promise.all([db.recipes.toArray(), db.meals.toArray(),
    db.stock.toArray(), db.meals.where('periodId').equals(p.id).toArray()]);
  const picks = suggest(n, recipes, history, new Map(stockArr.map(s => [s.ingredientId, s])), cat, new Set(mine.map(m => m.recipeId!).filter(Boolean)));
  const taken = new Set(mine.filter(m => m.slot === 'dinner').map(m => m.date));
  const free = range(p.start, p.end).filter(d => d >= today() && !taken.has(d));
  const hh = await household();
  const meals: PlannedMeal[] = picks.map((r, i) => ({ id: uid(), periodId: p.id, recipeId: r.id, servings: hh, status: 'planned',
    ...(place && free[i] ? { date: free[i], slot: 'dinner' as Slot } : {}) }));
  await db.meals.bulkPut(meals);
  return () => db.meals.bulkDelete(meals.map(m => m.id));
}
