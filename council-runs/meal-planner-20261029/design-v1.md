# Design v1: meal planner (2026-10-29)

R = research.md, A = expert-A, B = expert-B; [Cx] = criterion served.

## 1. Purpose, principles, scope [all; C12]
1. **Tap cost beats features.** Effort is the main barrier to food-waste habits (A §2, CREDIBLE) and data entry is where apps fail (R §1).
2. **Flexible, never locked.** Rigid plans are a top complaint (Mealime, Plan to Eat; B §2, CREDIBLE).
3. **Stock coarse, list exact.** Exact inventories are abandoned (B §3, CORROBORATED). Track levels and use a check pass.
4. **Lapses are fine.** One missed day barely hurts habit (A §3); no streaks.
5. **Control without counting.** No calories; risk lies in calorie/weight tracking (A §4, CONTESTED).

**MVP:** periods + plan, recipes (starter library + paste entry), shopping list, staples stock + pre-shop check, mark cooked, JSON backup, review card.
**Later:** URL import (B §1), list sharing, Capacitor APK, French UI, rotation templates. **Never:** calories, barcodes, accounts, per-gram inventory.

## 2. Delivery decision [C8, C9, C11]
**Recommend: offline PWA** (Vite + TypeScript + Preact + Dexie/IndexedDB + vite-plugin-pwa), then **Capacitor** on the user's Ubuntu (R §2, ALLEGED, needs JDK/SDK).
- Buildable and testable here; native cannot even compile here, so bugs would surface only on the user's machine (charter).
- TWA is rejected because it needs a hosted site + assetlinks (R §2, CORROBORATED).

**Case against:** IndexedDB is best-effort storage (R §2, CORROBORATED). WebView feel is less native. Capacitor does not by itself remove eviction risk (R, UNKNOWN). Native Room storage would be sturdier.

**Eviction mitigations:** (1) `navigator.storage.persist()` at first launch, result shown in Settings; (2) install prompt, since installation favours the grant (R §2); (3) one-tap **Export JSON** (download/Web Share); (4) banner when last export >7 days or >30 edits, dismissible but returns; (5) validated import, *replace* or *merge*; (6) Capacitor phase: weekly auto-backup to Documents.

## 3. Screens & flows [C1, C2, C4, C4b, C11]
Bottom nav with 4 tabs: **Plan · Recipes · List · Stock**. Settings and backup sit behind a cog on Plan. Primary actions in the bottom third, targets ≥48 px, dark mode follows system. Destructive actions are never at the thumb edge and always offer Undo (Paprika mis-tap complaint, B §4, ALLEGED).

- **Plan:** period header + review card, "To cook" pool, days × slots; swipe changes period.
- **Recipes:** search, tag chips, seasonal filter (default on), + (paste form).
- **List:** aisle sections; tap ticks, long-press edits; *Build*, *Check home*, *Put away*.
- **Stock:** staples by aisle, 3-state chip have/low/out, optional qty.

| Task | Taps |
|---|---|
| New period | Plan → "New" (1) → dates prefilled today+13, adjust start/end (0–2) → Create (1) = **2–4** |
| Copy previous | in the New dialog, "Copy from…" (1) → choose period (1) = **+2** |
| Add recipe to slot | tap empty slot (1) → tap recipe in the suggestion list or pool (1) = **2**; with search **3** |
| Generate list | List (1) → Build (range defaults to the current period; 1) = **2** |
| Pre-shop check | Check home (1) → one tap per uncertain item (~15–25 items, <2 min) |
| Mark cooked | tap the meal's circle (1) = **1**; deduction is automatic with an Undo toast |

C1 estimate: 14 meals × ~2.5 taps ≈ 6–8 min (to verify by timing test).

## 4. Planning model [C1, C2, C5]
- **Period:** `start` and `end` are any dates and periods may not overlap (no app documents this well, R §1).
- **Decision: hybrid.** Each `PlannedMeal` has an optional `date` + `slot`. Without them it lives in the period's **"To cook" pool**. Plan to Eat documents "add 3–4 recipes, pick each day by mood" and Mumsnet planners echo it (B §4, CREDIBLE). Slots serve C2; a tap moves a meal between pool and slot.
- **Slots:** the defaults are Lunch and Dinner, configurable as up to 4 named slots. "Eat out", "Leftovers" and "Free" are pseudo-recipes that cost nothing on the list.
- **Servings:** each planned meal has `servings`, defaulting to `settings.household` (asked at onboarding, default 1) [C5].
- **Leftovers:** if servings exceed the household, the extra portions become a **leftover chip** under the meal. A later slot can take "Leftovers of X" (`leftoverOf`, no ingredient demand). Leftovers are the top practice (A §2, CORROBORATED) and serve batch cooking.
- **Copy period:** clone with date offset; meals past the new end go to the pool; cooked flags cleared.
- **End of period:** uncooked meals can be sent to the next period's pool in 1 tap.

## 5. Home stock [C4, C4b]
Exact quantities are abandoned; Plan to Eat dropped its pantry because wrong stock hid needed items (B §3, CORROBORATED). So:
- **StockItem** = `{ingredientId, level: have|low|out, qty?, unit?, staple: bool, checkedAt}`. Only staples and bought items enter stock; qty only when known (packs, freezer), as R §1 suggests.
- **Subtraction** per needed ingredient: qty in same unit family → need − qty (drop if ≤0); `have` without qty → **"Probably at home"** section, excluded by default; `low` → kept with badge; `out`/none → kept.
- **Excluded pantry items** (salt, oil) = `alwaysHave`: hidden unless low/out [C4].
- **Pre-shop check:** this is the cupboard look, the only reliable method (B §3, CORROBORATED, two origins). A full-screen list shows (a) "Probably at home" items and (b) staples not confirmed for ≥14 days. Rows have **Have / Need**; Need adds to the list; both update `checkedAt`. Mirepoix-style growing intervals later (B, ALLEGED).
- **Bought → stock:** *Put away* is 1 tap. It moves all ticked lines into stock (level=have, qty += bought qty if quantity-aware) and clears them.
- **Cooked → deduct:** only quantity-aware stock is deducted. Level-only items are untouched because cooking-time weighing is impractical (B §3, ALLEGED). If a deducted qty reaches ≤0, the item becomes `out`. The Undo toast reverts all of this.

## 6. Shopping-list algorithm [C3, C4]
1. Collect lines from PlannedMeals in range (skip leftovers/pseudo), scaled by meal ÷ recipe servings.
2. **Normalise:** each recipe line stores an `ingredientId` from a ~250-item catalogue with FR+EN aliases/plurals; "Chopped onion", "oignons émincés" → `onion`; preparation words go to `note`. (fixes Plan to Eat's title-merge failure, R §1).
3. **Unit families:** mass (g), volume (ml), count (piece), plus named packs (gousse, botte, boîte, sachet) that are kept as their own units. Conversions: kg→g, l/cl/dl→ml, c. à soupe = 15 ml, c. à café = 5 ml, cup = 240 ml. "Pincée"/"to taste" → qty null, shown without quantity.
4. **Merge** by `(ingredientId, family)`. Different families stay on one line as a composite ("2 pcs + 200 g"), unless the ingredient has `pieceWeight` (top ~50: onion 150 g, carrot 100 g, potato 170 g…), in which case they convert to the ingredient's `preferredUnit` (R §3).
5. Subtract stock (§5).
6. **Round up** to purchase sense: g → next 50 g (next 100 g above 500 g); ml → next 50 ml; pieces → ceil. If `packSize` is known, the line shows "≈ 2 packs".
7. **Group** lines by `ingredient.aisle` in a user-reorderable aisle order (aisle grouping is praised, B §1). Default French order: fruits & légumes, boulangerie, frais, boucherie/poisson, épicerie salée/sucrée, conserves, surgelés, boissons, maison, autre.
8. Manual lines (free text) can be added, and edits survive a rebuild. A rebuild recomputes only generated lines.

## 7. Data model & storage [C8, C9]
Dexie (IndexedDB) tables:
- `ingredients` {id, nameEn, nameFr, aliases[], aisle, family, preferredUnit, pieceWeight?, packSize?, staple?, alwaysHave?}
- `recipes` {id, title, servings, minutes, tags[], seasons[], lines[{ingredientId|null, raw, qty?, qty2?, unit?, note?, optional?}], steps, source:'starter'|'user', archived}
- `periods` {id, start, end, label?}
- `plannedMeals` {id, periodId, recipeId|pseudo, date?, slot?, servings, cooked:bool, cookedAt?, leftoverOf?}
- `stock` {ingredientId, level, qty?, unit?, staple, alwaysHave, checkedAt}
- `listItems` {id, ingredientId?, text, qty?, unit?, aisle, ticked, manual, source:'gen'|'manual'}
- `settings` {household, slots[], aisleOrder[], theme, lastExportAt, editsSinceExport, persistGranted}

ULID ids, ISO dates. **Export** = `{schemaVersion, exportedAt, tables…}` as a single JSON file named `mealplan-YYYYMMDD.json`. **Import** validates the schema version and runs migrations. *Merge* upserts by id, newest wins; *replace* asks for confirmation.

## 8. Paste-parser [C6]
This is an in-house parser (~200 lines, pure function, unit-tested). `parse-ingredient` (R §3) is a reference only: French needs a pre-processor anyway and its health is unchecked.
1. Split lines, strip bullets.
2. Quantity: integers, decimal commas, fractions (½ ¼ 1/2), ranges ("2-3", "2 à 3" → qty, qty2).
3. Unit: longest match against a French/English table (g, gr, kg, ml, cl, l, "c. à soupe", "c.à.s", cs, CS, tbsp, "c. à café", cc, tsp, pincée, gousse(s), botte, boîte, sachet, tranche, cup).
4. Strip the connector: `de`, `d'`, `d’`, `of`.
5. Ingredient: alias lookup after lowercasing, accent folding and singularising (onions/oignons → oignon), with fuzzy fallback (Levenshtein ≤2).
6. The remainder becomes `note` ("émincés", "en dés").

"200 g d'oignons" → 200 g onion; "1 c. à soupe d'huile d'olive" → 15 ml olive oil; "2 carottes" → 2 pc carrot.

**Preview:** each line appears as a chip, green when matched and amber when unknown. Tapping amber picks or creates an ingredient. Unknown lines save raw (`ingredientId=null`, aisle "autre"); nothing blocks entry.

## 9. Starter library [C7]
- **40 original recipes** written for this app, not copied from sources, in English with French ingredient names in the aliases.
- Mix: 12 quick (≤25 min), 14 veggie, 10 batch/freezer-friendly, 6 budget.
- Autumn/winter weighted for launch (potée-style stew, leek tart, lentil soup, gratin, chili…).
- Only catalogue ingredients, so lines merge cleanly.
- Tags: `quick, veggie, batch, budget, season:*`.
- The seasonal filter uses a produce calendar kept in `ingredients` (seasons[] on vegetables and fruits).

## 10. Control feedback [C10]
A **review card** on the Plan header, also shown full-screen at period end:
- **Cooked X / planned Y** bar, no shaming.
- **Variety:** distinct recipes, count of veggie meals, and the number of distinct vegetables used. Variety is associated with diet quality (A §1, §3, CREDIBLE).
- **Waste proxy:** uncooked meals with bought fresh ingredients.

There are no calories, weights or streaks (A §4; charter rule 2).

## 11. Build order & module map [Executor]
- **M0:** scaffold (PWA, Dexie, theme, dark mode).
- **M1:** `units`, `ingredients` catalogue, `parser` + tests.
- **M2:** recipes CRUD, paste form, starter seed.
- **M3:** periods, plan grid, pool, copy, leftovers.
- **M4:** list builder + List screen.
- **M5:** stock, check home, put away, cook-deduct.
- **M6:** backup (export/import, persist, nag).
- **M7:** review card.
- **M8:** Capacitor README + build script for Ubuntu.

The app is usable after M4. Each milestone ends with Vitest + Playwright smoke.

```
src/
  main.tsx  app.tsx  nav.tsx  theme.css
  db/      schema.ts  repo.ts  seed.ts  migrate.ts
  domain/  units.ts  catalogue.ts  parser.ts  scale.ts  listBuild.ts
           stock.ts  period.ts  leftovers.ts  stats.ts  backup.ts
  data/    ingredients.fr-en.json  recipes.starter.json  aisles.ts
  ui/      PlanScreen.tsx  PeriodDialog.tsx  SlotPicker.tsx  ReviewCard.tsx
           RecipesScreen.tsx  RecipeEdit.tsx  ParsePreview.tsx
           ListScreen.tsx  CheckHome.tsx  StockScreen.tsx  Settings.tsx  Toast.tsx
tests/     parser.test.ts  listBuild.test.ts  stock.test.ts  period.test.ts  backup.test.ts  e2e/smoke.spec.ts
```
Domain modules are pure; `repo.ts` is the only DB layer.

**Open:** household size/batch habit (settings); store for aisle order; UI language; Android eviction (R, UNKNOWN); 2-week horizon unevidenced (A §2).
