import { it, expect } from 'vitest';
import { merge, normalize, starterId } from '../src/domain/backup';

const rec = (id: string, title: string, source: 'starter' | 'user', updatedAt = 1) => ({ id, title, servings: 4, tags: [], lines: [], steps: '', source, updatedAt });
const v1 = (over: any = {}) => ({ app: 'menu-planner', version: 1, exportedAt: 'x', recipes: [], periods: [], meals: [], stock: [], list: [], ingredients: [], kv: [], ...over });

it('starter ids depend only on the title', () => {
  expect(starterId("Tarte à l'oignon")).toBe(starterId("tarte a l'oignon"));
  expect(starterId('Poulet rôti')).toBe('s-poulet-roti');
});
it('v1 backup: starters get stable ids, meals follow, user recipes untouched', () => {
  const d = normalize(v1({ recipes: [rec('abc123', 'Poulet rôti', 'starter'), rec('zzz999', 'Ma recette', 'user')],
    meals: [{ id: 'm1', periodId: 'p', recipeId: 'abc123', servings: 2, status: 'planned' }, { id: 'm2', periodId: 'p', recipeId: 'zzz999', servings: 2, status: 'planned' }] }));
  expect(d.version).toBe(2);
  expect(d.recipes.map(r => r.id).sort()).toEqual(['s-poulet-roti', 'zzz999']);
  expect(d.meals.map(m => m.recipeId)).toEqual(['s-poulet-roti', 'zzz999']);
});
it('duplicate starters collapse and meals are re-pointed', () => {
  const d = normalize(v1({ recipes: [rec('a', 'Soupe', 'starter'), rec('b', 'soupe', 'starter')], meals: [{ id: 'm', periodId: 'p', recipeId: 'b', servings: 1, status: 'planned' }] }));
  expect(d.recipes).toHaveLength(1); expect(d.meals[0].recipeId).toBe('s-soupe');
});
it('does not mutate its input and rejects foreign / newer files', () => {
  const raw = v1({ recipes: [rec('a', 'Soupe', 'starter')] }); normalize(raw); expect(raw.recipes[0].id).toBe('a');
  expect(() => normalize({ app: 'other' })).toThrow(); expect(() => normalize(v1({ version: 3 }))).toThrow(/plus récente/);
});
it('merge keeps everything, newest recipe/stock wins, local wins elsewhere, device settings not copied', () => {
  const local = normalize(v1({ recipes: [rec('r1', 'A', 'user', 5), rec('r2', 'B', 'user', 1)], periods: [{ id: 'p1', start: '2026-11-01', end: '2026-11-07', createdAt: 1 }],
    meals: [{ id: 'm1', periodId: 'p1', servings: 2, status: 'cooked' }], stock: [{ ingredientId: 'salt', level: 'have', updatedAt: 9 }], kv: [{ key: 'household', value: 2 }, { key: 'firstUse', value: 1 }] }));
  const inc = normalize(v1({ recipes: [rec('r1', 'A-old', 'user', 2), rec('r2', 'B-new', 'user', 7), rec('r3', 'C', 'user')],
    meals: [{ id: 'm1', periodId: 'p1', servings: 2, status: 'planned' }, { id: 'm9', periodId: 'p1', servings: 2, status: 'planned' }],
    stock: [{ ingredientId: 'salt', level: 'out', updatedAt: 3 }, { ingredientId: 'rice', level: 'have', updatedAt: 3 }],
    kv: [{ key: 'household', value: 4 }, { key: 'cookDeduct', value: true }, { key: 'firstUse', value: 99 }] }));
  const { data, stats } = merge(local, inc);
  const byId = (xs: any[], k = 'id') => Object.fromEntries(xs.map(x => [x[k], x]));
  expect(byId(data.recipes).r1.title).toBe('A'); expect(byId(data.recipes).r2.title).toBe('B-new'); expect(data.recipes).toHaveLength(3);
  expect(byId(data.meals).m1.status).toBe('cooked'); expect(data.meals).toHaveLength(2);
  expect(byId(data.stock, 'ingredientId').salt.level).toBe('have'); expect(data.stock).toHaveLength(2);
  const kv = byId(data.kv, 'key'); expect(kv.household.value).toBe(2); expect(kv.cookDeduct.value).toBe(true); expect(kv.firstUse.value).toBe(1);
  expect(stats).toEqual({ added: 3, updated: 1 });   // r3, m9, rice added · r2 updated
});
