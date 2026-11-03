// "Fill my period": rank recipes by not-recently-eaten, use-it-up (stock), variety, season.
import type { PlannedMeal, Recipe, StockItem } from '../db/types';
import { PANTRY_AISLES } from '../data/ingredients';
import type { Catalogue } from './catalogue';

const SEASON = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];

export function suggest(n: number, recipes: Recipe[], history: PlannedMeal[], stock: Map<string, StockItem>,
  cat: Catalogue, exclude = new Set<string>(), month = new Date().getMonth()): Recipe[] {
  const last = new Map<string, number>();
  history.forEach(m => m.recipeId && m.date && last.set(m.recipeId, Math.max(last.get(m.recipeId) || 0, Date.parse(m.date))));
  const season = SEASON[month];
  const scored = recipes.filter(r => !exclude.has(r.id)).map(r => {
    const days = last.has(r.id) ? (Date.now() - last.get(r.id)!) / 864e5 : 60;
    const useUp = r.lines.filter(l => {
      const s = l.ingredientId && stock.get(l.ingredientId);
      return s && !s.alwaysHave && s.level !== 'out' && !PANTRY_AISLES.has(cat.aisle(l.ingredientId));
    }).length;
    const score = Math.min(days, 60) / 10 + useUp * 3 + (r.tags.includes(season) ? 2 : 0) + Math.random() * 2;
    return { r, score };
  }).sort((a, b) => b.score - a.score);
  // variety: alternate veggie / not when possible, about half veggie
  const veg = scored.filter(x => x.r.tags.includes('veggie')), other = scored.filter(x => !x.r.tags.includes('veggie'));
  const out: Recipe[] = [];
  while (out.length < n && (veg.length || other.length)) {
    const pick = (out.length % 2 === 0 ? veg.shift() || other.shift() : other.shift() || veg.shift())!;
    out.push(pick.r);
  }
  return out;
}
