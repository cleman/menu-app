// Validates every recipe-bank file: ingredients recognised, tags known, one category, no duplicate titles.
import { describe, it, expect } from 'vitest';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';
import { parseLine } from '../src/domain/parser';
import { CATEGORIES, parseBank, unknownTags } from '../src/domain/recipeText';

const cat = new Catalogue(parseCatalogue());
const files = import.meta.glob('../src/data/bank/*.ts', { eager: true, import: 'default' }) as Record<string, string>;
const cats = new Set(CATEGORIES.map(([c]) => c));
const titles = new Map<string, string>();

for (const [path, text] of Object.entries(files)) {
  const theme = path.split('/').pop()!.replace('.ts', '');
  describe('bank ' + theme, () => {
    const recipes = parseBank(text);
    it('has recipes', () => expect(recipes.length).toBeGreaterThan(0));
    it('ingredients all recognised', () => {
      const miss = recipes.flatMap(r => r.ingredients.filter(i => !parseLine(i, cat).ingredientId).map(i => `${r.title}: ${i}`));
      expect(miss).toEqual([]);
    });
    it('tags valid, exactly one category, servings, minutes, ≥2 steps', () => {
      const bad = recipes.flatMap(r => {
        const e: string[] = [];
        if (unknownTags(r).length) e.push('unknown tags ' + unknownTags(r).join(','));
        if (r.tags.filter(t => cats.has(t)).length !== 1) e.push('needs exactly one category');
        if (!r.minutes) e.push('no minutes'); if (r.ingredients.length < 2) e.push('<2 ingredients'); if (r.steps.length < 2) e.push('<2 steps');
        return e.length ? [`${r.title}: ${e.join('; ')}`] : [];
      });
      expect(bad).toEqual([]);
    });
    it('no duplicate titles across bank', () => {
      const dup = recipes.filter(r => { const k = r.title.toLowerCase(); const o = titles.get(k); if (o && o !== theme) return true; titles.set(k, theme); return false; }).map(r => r.title);
      expect(dup).toEqual([]);
    });
  });
}
