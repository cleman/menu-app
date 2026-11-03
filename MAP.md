# MAP — read this first, open files only when you change them

Purpose: retake control of meals. Loop = Recipes → Plan (any length) → List (needs − home stock) → Shop → Cook → Review → next plan.
Stack: Vite + TS + Preact + Dexie (IndexedDB) + vite-plugin-pwa. Offline, no account, no server. Hosted on GitHub Pages.
Design source: council-runs/meal-planner-20261029/design-v2.md (council verdict: verdict.md).

## Files (one module each, keep them small)
- src/domain/ — PURE logic, unit-tested (tests/*.test.ts)
  - units.ts      families mass g · vol ml · count pc · own families (can, clove, bunch…); roundUp; formatQty (spoons, plurals)
  - catalogue.ts  Catalogue class: alias index, norm(), singular(), match() exact→head→tail words, NO fuzzy
  - parser.ts     parseLine/parseText: FR+EN, fractions ½ 1/2, ranges 2-3, "d'", "une pincée", "sel, poivre" split
  - listBuild.ts  collectNeeds (servings+extra, leftovers=no demand, pieces→g via pieceG) → applyStock (always/have/covered/low) → mergeList (keeps ticks, edits, manual) → listAsText
  - stock.ts      putAway (bought→Have, adds compatible qty) · cookDeduct (opt-in, known qty only) · isStale (>30 d)
  - suggest.ts    score = not-recent + use-it-up(stock, non-pantry) + season; alternate veggie/other
  - dates.ts      'YYYY-MM-DD' helpers
- src/data/       ingredients.ts (compact "id|en|fr|aisle|pieceG|aliases", AISLES order, PANTRY_AISLES) · recipes.ts (15 original starters)
- src/db/         types.ts (entities) · db.ts (ONLY Dexie layer, seed, export/import, 3 rolling snapshots) · ops.ts (addMeal, removeMeal, setStatus, createPeriod+copy, fill)
- src/ui/         App (tabs) · kit (useLive, toast+Undo, Sheet, Seg, Stepper) · PlanScreen + PlanSheets (SlotPicker, MealMenu, PeriodDialog, FillSheet, ReviewSheet)
                  RecipesScreen (+RecipeBody) · RecipeEdit (paste + parse preview + create ingredient) · ListScreen (CheckHome, DoneShopping) · StockScreen · Settings (BackupBanner)
- src/styles.css  tokens on :root, dark mode, 48px targets
- tests/          parser · list (+stock) · seed (all starters parse) · e2e_smoke.py (Playwright, phone viewport)

## Entities (src/db/types.ts)
Recipe{lines[RecipeLine{ingredientId|null, raw, rawKey, qty, qty2, unit, note}]} · Period{start,end,reviewedAt}
PlannedMeal{periodId, recipeId|label, date?, slot? lunch|dinner, servings, extra, status planned|cooked|skipped, listedAt?, leftoverOf?}
StockItem{ingredientId, level have|low|out, qty?, unit? (base g/ml/pc), alwaysHave} · ListItem{key, ticked, manual, edited, mealIds}
kv: household, cookDeduct, lastExport, firstUse, snoozeBackup, seeded

## Key rules
- List scope = planned, not shopped (listedAt null), not leftovers, date today..until (or no date), period not over
- "Done shopping" → ticked to stock, all scoped meals get listedAt, unticked stay as manual
- Stock: Have (no qty) excludes the item; qty subtracts; Low/Out = buy; ★ staples never listed
- Every destructive action: toast with Undo (8 s); snapshot before import & before "Done shopping"

## Not done yet / ideas (see design-v2 §1 "later")
URL recipe import · French UI · aisle reorder per store · Capacitor APK (only if storage gets wiped) · cook mode (wake lock)
