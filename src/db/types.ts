import type { RecipeLine } from '../domain/parser';
export type { RecipeLine };

export type Slot = 'lunch' | 'dinner';
export type Level = 'have' | 'low' | 'out';

export interface Recipe {
  id: string; title: string; servings: number; minutes?: number; tags: string[];
  lines: RecipeLine[]; steps: string; source: 'starter' | 'user'; updatedAt: number;
}
export interface Period { id: string; start: string; end: string; createdAt: number; reviewedAt?: number }
export interface PlannedMeal {
  id: string; periodId: string; recipeId?: string; label?: string;
  date?: string; slot?: Slot; servings: number;
  status: 'planned' | 'cooked' | 'skipped';
  listedAt?: number;          // set when shopping for it is done
  leftoverOf?: string;        // meal id that produced these leftovers (no shopping demand)
  extra?: number;             // extra servings cooked for leftovers
}
export interface StockItem { ingredientId: string; level: Level; qty?: number; unit?: string; alwaysHave?: boolean; updatedAt: number }
export interface ListItem {
  key: string; ingredientId?: string | null; text: string; qty?: number | null; unit?: string | null;
  aisle: string; ticked: boolean; manual?: boolean; edited?: boolean; mealIds?: string[]; note?: string;
}
export interface KV { key: string; value: unknown }
export interface Snapshot { id?: number; at: number; data: string }
