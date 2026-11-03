import { it, expect } from 'vitest';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';
import { parseText } from '../src/domain/parser';
import { STARTERS } from '../src/data/recipes';
const cat = new Catalogue(parseCatalogue());
it('every starter ingredient matches the catalogue', () => {
  const miss = STARTERS.flatMap(s => parseText(s.ingredients, cat).filter(l => !l.ingredientId).map(l => `${s.title}: ${l.raw}`));
  expect(miss).toEqual([]);
});
it('about half veggie', () => { expect(STARTERS.filter(s => s.tags.includes('veggie')).length).toBeGreaterThanOrEqual(7); });
