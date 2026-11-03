import { describe, it, expect } from 'vitest';
import { Catalogue, parseCatalogue } from '../src/domain/catalogue';
import { parseBank, parseFreeText } from '../src/domain/recipeText';

const cat = new Catalogue(parseCatalogue());

describe('bank format', () => {
  it('parses blocks', () => {
    const [r] = parseBank('## Dal | 4 | 30 | plat;vege\n- 250 g lentilles corail\n- 1 oignon\n> Faire revenir.\n> Mijoter.\n');
    expect(r).toMatchObject({ title: 'Dal', servings: 4, minutes: 30, tags: ['plat', 'vege'] });
    expect(r.ingredients).toHaveLength(2); expect(r.steps).toHaveLength(2);
  });
});

describe('free text', () => {
  it('website-like text with headers', () => {
    const r = parseFreeText(`Gratin dauphinois facile
Pour 6 personnes
Préparation : 20 min
Cuisson : 1 h
Ingrédients
1,5 kg de pommes de terre
50 cl de crème liquide
2 gousses d'ail
Sel, poivre
Préparation
1. Préchauffer le four à 180 °C.
2. Éplucher et couper les pommes de terre en fines rondelles.
3. Cuire 1 h.`, cat);
    expect(r.title).toBe('Gratin dauphinois facile'); expect(r.servings).toBe(6); expect(r.minutes).toBe(80);
    expect(r.ingredients).toHaveLength(4); expect(r.steps).toHaveLength(3);
    expect(r.steps[0]).toBe('Préchauffer le four à 180 °C.');
  });
  it('no headers: short qty lines are ingredients, sentences are steps', () => {
    const r = parseFreeText(`Omelette\n3 œufs\n20 g de beurre\nBattre les œufs avec une pincée de sel.\nCuire dans le beurre chaud.`, cat);
    expect(r.ingredients).toEqual(['3 œufs', '20 g de beurre']); expect(r.steps).toHaveLength(2);
  });
});

import { filterRecipes, parseJsonLdRecipe } from '../src/domain/recipeText';
describe('json-ld', () => {
  it('reads a Recipe in @graph', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"Quiche","recipeYield":"6 parts","totalTime":"PT1H5M",
      "recipeIngredient":["3 œufs","20 cl de crème"],"recipeInstructions":[{"@type":"HowToStep","text":"Battre."},{"@type":"HowToStep","text":"Cuire."}]}]}</script>`;
    expect(parseJsonLdRecipe(html)).toMatchObject({ title: 'Quiche', servings: 6, minutes: 65, ingredients: ['3 œufs', '20 cl de crème'], steps: ['Battre.', 'Cuire.'] });
  });
});
describe('filter', () => {
  const rs = [{ title: 'A', tags: ['plat', 'vege', 'hiver'], minutes: 20, lines: [{ raw: 'riz' }] }, { title: 'B', tags: ['dessert'], minutes: 60, lines: [] }];
  it('category + flags', () => {
    expect(filterRecipes(rs, { q: '', cat: 'plat', flags: ['vege', 'rapide'] }).map(r => r.title)).toEqual(['A']);
    expect(filterRecipes(rs, { q: 'riz', cat: '', flags: [] }).map(r => r.title)).toEqual(['A']);
    expect(filterRecipes(rs, { q: '', cat: '', flags: ['saison'] }, 0).map(r => r.title)).toEqual(['A']);
  });
});
