import { describe, it, expect } from 'vitest';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';
import { parseLine, parseText } from '../src/domain/parser';

const cat = new Catalogue(parseCatalogue());
const p = (s: string) => parseLine(s, cat);

describe('parser', () => {
  it.each([
    ["200 g d'oignons émincés", 'onion', 200, 'g'],
    ['200g oignons', 'onion', 200, 'g'],
    ["1 c. à soupe d'huile d'olive", 'olive-oil', 1, 'tbsp'],
    ['2 cuillères à café de cumin', 'cumin', 2, 'tsp'],
    ['2 carottes', 'carrot', 2, 'pc'],
    ['1/2 citron', 'lemon', 0.5, 'pc'],
    ['½ tsp paprika', 'paprika', 0.5, 'tsp'],
    ["3 gousses d'ail", 'garlic', 3, 'clove'],
    ['1,5 kg de pommes de terre', 'potato', 1.5, 'kg'],
    ['1 can (400 g) chopped tomatoes', 'crushed-tomatoes', 1, 'can'],
    ['3 eggs', 'egg', 3, 'pc'],
    ['3 œufs', 'egg', 3, 'pc'],
    ['une pincée de sel', 'salt', 1, 'pinch'],
    ['- 250 ml de lait', 'milk', 250, 'ml'],
    ['20 cl de crème liquide', 'cream', 20, 'cl'],
    ['400 g spaghetti', 'pasta', 400, 'g'],
    ['2 red onions, sliced', 'red-onion', 2, 'pc'],
  ])('%s', (line, id, qty, unit) => {
    const r = p(line);
    expect(r.ingredientId).toBe(id); expect(r.qty).toBeCloseTo(qty as number); expect(r.unit).toBe(unit);
  });
  it('range', () => { const r = p('2-3 gousses d\'ail'); expect(r.qty).toBe(2); expect(r.qty2).toBe(3); });
  it('unmatched keeps raw', () => { const r = p('100 g de gochujang'); expect(r.ingredientId).toBeNull(); expect(r.rawKey).toBe('gochujang'); });
  it('splits sel, poivre', () => { expect(parseText('Sel, poivre', cat).map(l => l.ingredientId)).toEqual(['salt', 'pepper-black']); });
  it('note', () => { expect(p('2 red onions, sliced').note).toBe('sliced'); });
});
