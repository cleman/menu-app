# MAP: meal planner (index of design-v2.md; read this first)
- Delivery [§2]: offline PWA (Vite+TS+Preact+Dexie+vite-plugin-pwa) on GitHub Pages, install from Chrome
  - Capacitor OPTIONAL (M8, only on eviction/install trouble; separate storage → JSON move)
  - Data safety: persist() + badge on Plan, export JSON, 3 rolling snapshots, dismissible banner w/ Export
- v0.1 = M0–M4 [§1]: recipes (paste, exact alias), 15 starters, periods + Lunch/Dinner + Ideas pool,
  aisle list (ticks, alwaysHave → Skipped, share text), backup+snapshots, Pages install
  - GATE: one real period of use before M5
- Build order [§11]: M0 scaffold+migration fixture · M0b Pages Action · M1 units/catalogue/parser
  · M2 recipes+starters+BACKUP · M3 plan (slots, Ideas, Move/Skip, copy, cue) · M4 list → v0.1
  · M5 stock/Check home · M6 leftovers + Suggest N + use-it-up · M7 review + cook-deduct opt-in · M8 Capacitor?
- Nav [§3]: Plan · Recipes · List · Stock(after gate); every gesture has a visible button; Undo ≥8 s
  - List: ONE contextual button: Make list → Check home first? → Put away N
  - Taps: new period 3 (presets) · add to slot 2 · make list 2 · check home ~5–8 · cooked 1
- src/db/: schema · repo (only DB layer) · seed · migrate · snapshots
- src/domain/ (pure)
  - units: g/ml/piece + packs; cs 15 ml, cc 5 ml
  - catalogue: ~80 items v0.1, script-drafted, grows via "create" in parser
  - parser: FR/EN, elision d'/de, ranges, decimal comma, NO fuzzy
  - listBuild: scope listedAt=null → scale → normalise → merge(id|rawKey,family) → stock → round → aisle
  - stock: Have/Low/Out, qty optional, Skipped, 30-day "Check these", put away, cook-deduct (off)
  - period: free dates, copy w/ offset, Move/Skip, carry-over
  - leftovers: "Cook for 4 (2 extra…)" → "Leftovers: Chili (2 left)" → leftoverOf
  - suggest: not-recent → use-it-up → veggie → mixed tags → season bonus
  - stats: cooked/planned, distinct recipes, veggie meals · backup: export/replace-import
- src/data/: ingredients.json · recipes.starter.json (15→25, ~half veggie) · aisles.ts (fixed FR order)
- src/ui/: PlanScreen PeriodDialog SlotPicker MealMenu RecipesScreen RecipeEdit ParsePreview
  ListScreen CheckHome StockScreen ReviewScreen BackupBanner Settings Toast
- scripts/: draftCatalogue · validateSeed (CI) · .github/workflows/deploy.yml
- tests/: parser listBuild stock backup (Vitest) + 1 Playwright smoke
- Entities [§7]
  - PlannedMeal{periodId, recipeId|eatout|free, date?, slot?, servings, status planned|cooked|skipped, listedAt?, leftoverOf?}
  - StockItem{ingredientId, level, qty?, unit?, alwaysHave, updatedAt}
  - ListItem{key, ingredientId?, text, qty, unit, aisle, ticked, manual, edited}
  - Recipe{lines[{ingredientId|null, raw, rawKey, qty, qty2, unit, note}]} · snapshots ≤3 · settings{cookDeduct=false}
- Key decisions
  - Qty-aware subtraction KEPT (C4b); re-ask/adaptive intervals cut
  - Cook-deduct opt-in, off by default
  - Leftover model kept (C5), shipped after gate
  - Never hide stock: visible "Skipped: you have these (N)", 1-tap Add
  - Rebuild keeps ticks/manual/edits; asks before rebuild once ticked
  - Unmatched lines merge on raw text + "N unmatched" badge; no composite lines
  - Slots fixed Lunch/Dinner; seasonal filter opt-in; aisle reorder later
  - Merge-import cut (replace + auto-snapshot); banner dismissible, not coercive
  - Review only at period end: Cooked? card → cooked/planned → variety → carry-over → new period
  - Planning cue in-app (default Sun 17:00 or period ends ≤2 days)
  - No calories, waste proxy, streaks, veg count
- Open questions
  - Store → aisle order; UI language EN/FR
  - Android PWA eviction (UNKNOWN); real C1 timing; household size
