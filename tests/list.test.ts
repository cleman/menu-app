import { describe, it, expect } from 'vitest';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';
import { parseText } from '../src/domain/parser';
import { applyStock, collectNeeds, mergeList } from '../src/domain/listBuild';
import { putAway, cookDeduct } from '../src/domain/stock';
import type { PlannedMeal, Recipe, StockItem } from '../src/db/types';

const cat = new Catalogue(parseCatalogue());
const R = (id: string, servings: number, text: string): Recipe =>
  ({ id, title: id, servings, tags: [], steps: '', source: 'user', updatedAt: 0, lines: parseText(text, cat) });
const M = (id: string, recipeId: string, servings: number, extra: Partial<PlannedMeal> = {}): PlannedMeal =>
  ({ id, periodId: 'p', recipeId, servings, status: 'planned', ...extra });

const recipes = new Map([
  ['a', R('a', 2, '200 g oignons\n400 g pâtes\nsel')],
  ['b', R('b', 4, '2 oignons\n1 boîte de tomates concassées\n1 c. à soupe huile d\'olive')],
]);

describe('list build', () => {
  const needs = collectNeeds([M('m1', 'a', 2), M('m2', 'b', 2), M('m3', 'a', 2, { leftoverOf: 'm1' })], recipes, cat);
  const by = (id: string) => needs.find(n => n.ingredientId === id)!;
  it('merges across recipes and converts pieces to grams', () => { expect(by('onion').qty).toBeCloseTo(200 + 1 * 110); expect(by('onion').unit).toBe('g'); });
  it('leftover meals create no demand', () => { expect(by('pasta').qty).toBe(400); });
  it('scales servings', () => { expect(by('crushed-tomatoes').qty).toBe(0.5); });
  it('subtracts stock and rounds', () => {
    const stock = new Map<string, StockItem>([
      ['pasta', { ingredientId: 'pasta', level: 'have', qty: 250, unit: 'g', updatedAt: 0 }],
      ['salt', { ingredientId: 'salt', level: 'have', alwaysHave: true, updatedAt: 0 }],
      ['olive-oil', { ingredientId: 'olive-oil', level: 'have', updatedAt: 0 }],
      ['onion', { ingredientId: 'onion', level: 'low', updatedAt: 0 }],
    ]);
    const res = applyStock(needs, stock); const g = (id: string) => res.find(n => n.ingredientId === id)!;
    expect(g('pasta').qty).toBe(150); expect(g('pasta').skip).toBeUndefined();
    expect(g('salt').skip).toBe('always'); expect(g('olive-oil').skip).toBe('have');
    expect(g('onion').qty).toBe(350); expect(g('onion').note).toBe('low at home');
    expect(g('crushed-tomatoes').qty).toBe(1);
  });
  it('rebuild keeps ticks, edits and manual items', () => {
    const fresh = applyStock(needs, new Map());
    const old = [
      { key: 'pasta', text: 'Pasta', qty: 1, unit: 'kg', aisle: 'dry', ticked: true, edited: true },
      { key: 'm:1', text: 'Coffee', aisle: 'other', ticked: false, manual: true },
      { key: 'gone', text: 'Old', aisle: 'other', ticked: false },
    ];
    const merged = mergeList(old, fresh);
    const pasta = merged.find(i => i.key === 'pasta')!;
    expect(pasta.ticked).toBe(true); expect(pasta.qty).toBe(1);
    expect(merged.some(i => i.key === 'm:1')).toBe(true); expect(merged.some(i => i.key === 'gone')).toBe(false);
  });
});

describe('stock', () => {
  it('put away adds compatible quantities', () => {
    const stock = new Map<string, StockItem>([['pasta', { ingredientId: 'pasta', level: 'low', qty: 100, unit: 'g', updatedAt: 0 }]]);
    const [s] = putAway([{ key: 'pasta', ingredientId: 'pasta', text: 'Pasta', qty: 500, unit: 'g', aisle: 'dry', ticked: true }], stock);
    expect(s).toMatchObject({ level: 'have', qty: 600, unit: 'g' });
  });
  it('cook deduct only touches known quantities', () => {
    const stock = new Map<string, StockItem>([
      ['pasta', { ingredientId: 'pasta', level: 'have', qty: 500, unit: 'g', updatedAt: 0 }],
      ['onion', { ingredientId: 'onion', level: 'have', updatedAt: 0 }],
    ]);
    const out = cookDeduct(recipes.get('a')!, 2, stock);
    expect(out).toHaveLength(1); expect(out[0].qty).toBe(100);
  });
});

import { addToCart } from '../src/domain/listBuild';
describe('cart', () => {
  it('merges same ingredient and unit family, keeps others separate', () => {
    const cart = addToCart([{ key: 'c:pasta:mass', stage: 'cart', ingredientId: 'pasta', text: 'Pâtes', qty: 500, unit: 'g', aisle: 'dry', ticked: true }],
      [{ key: 'pasta', ingredientId: 'pasta', text: 'Pâtes', qty: 1, unit: 'kg', aisle: 'dry', ticked: false },
       { key: 'egg', ingredientId: 'egg', text: 'Œuf', qty: 6, unit: 'pc', aisle: 'dairy', ticked: false }]);
    expect(cart).toHaveLength(2);
    expect(cart[0]).toMatchObject({ qty: 1500, unit: 'g', ticked: false });
    expect(cart[1]).toMatchObject({ stage: 'cart', ingredientId: 'egg' });
  });
});
describe('herbs', () => {
  it('spoons of fresh herbs become bunches', () => {
    const r = new Map([['h', R('h', 2, '3 c. à soupe de persil\n2 c. à café de persil')]]);
    const [n] = applyStock(collectNeeds([M('x', 'h', 2)], r, cat), new Map());
    expect(n).toMatchObject({ unit: 'bunch', qty: 1 });
  });
});
