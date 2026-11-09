// Pure: turns a plan (period + meals + recipes) into what the Menu page and the PDF display.
import type { Period, PlannedMeal, Recipe } from '../db/types';
import { longLabel, range, short } from './dates';

export interface MenuDay { date: string; label: string; lunch: string[]; dinner: string[]; other: string[] }
export interface MenuModel { title: string; days: MenuDay[]; ideas: string[] }

export function mealTitle(m: PlannedMeal, recipes: Map<string, Recipe>): string {
  const r = m.recipeId ? recipes.get(m.recipeId) : undefined;
  const t = r?.title || m.label || '?';
  return m.leftoverOf ? `Restes : ${t}` : t;
}

export function buildMenu(p: Period, meals: PlannedMeal[], recipes: Map<string, Recipe>): MenuModel {
  const shown = meals.filter(m => m.status !== 'skipped' && (m.recipeId || m.label));
  const titles = (xs: PlannedMeal[]) => xs.map(m => mealTitle(m, recipes));
  const days = range(p.start, p.end).map(d => {
    const mine = shown.filter(m => m.date === d);
    return { date: d, label: longLabel(d), lunch: titles(mine.filter(m => m.slot === 'lunch')), dinner: titles(mine.filter(m => m.slot === 'dinner')),
      other: titles(mine.filter(m => m.slot !== 'lunch' && m.slot !== 'dinner')) };
  });
  return { title: `Menu du ${short(p.start)} au ${short(p.end)}`, days, ideas: titles(shown.filter(m => !m.date)) };
}
