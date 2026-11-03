# Design v2: meal planner (2026-10-29)
R research, A/B experts; critics cA coach, cB first-principles, cC outsider, cD expansionist, cE contrarian, cF executor.

## 1. Purpose, principles, scope [all; C12]
The core loop is **recipe → plan → list → cook** (cB).
1. **Tap cost beats features** (effort barrier, A §2; entry burden, R §1).
2. **Flexible, recoverable** (rigidity complaints, B §2).
3. **Coarse stock, honest list** (exact inventories abandoned, B §3 CORROBORATED); nothing hidden silently.
4. **Lapses are fine** (A §3). No streaks, no red states.
5. **No calories** (A §4).

**v0.1 (M0–M4, first usable build):** paste-entry recipes (exact aliases), 15 starters, periods with Lunch/Dinner + "Ideas, no day yet" pool, aisle list with ticks and always-have exclusion, share as text, JSON export/import + 3 snapshots, GitHub Pages install.

**Gate:** one real period of use before M5 (cB, cF). **After:** stock, leftovers, suggestions, review, cook-deduct. **Later:** URL import, aisle reorder, French UI, slots config, Wake Lock cook view. **Never:** calories, barcodes, accounts, per-gram stock.

## 2. Delivery [C8, C9, C11]
**Offline PWA** (Vite, TS, Preact, Dexie, vite-plugin-pwa), **hosted on GitHub Pages**, installed from Chrome.
- Buildable/testable here, native is not (charter); Pages gives the needed HTTPS origin (cF).
- **Case against:** IndexedDB storage is best-effort (R §2, CORROBORATED), and the app feels less native.
- **Mitigations:** `persist()` at launch (install favours the grant, R §2), status badge on Plan; export, snapshots, banner (§7).
- Decision: Capacitor is conditional (only after eviction or install trouble) because its WebView storage is separate from Chrome's, so switching forces an export/import (cF; cE withdrew "APK early").

**Install, Ubuntu → phone:**
1. `sudo apt install git`, then Node ≥20 via nvm.
2. `git clone <repo> && cd mealplan && npm ci && npm test && npm run build`.
3. Push to GitHub. Under Settings → Pages, set Source to Actions; `deploy.yml` publishes `dist/` (Vite `base='/mealplan/'`, service-worker scope set to match).
4. On the phone, open the Pages URL in Chrome and choose **Install app**.
5. Check that Plan shows "Storage: protected". Export once and save the file to Drive.
6. Optional APK: JDK 17 + Android Studio, then `npx cap add android && npx cap sync`, then build. Move data via JSON.

## 3. Screens & flows [C1, C2, C4, C4b, C11]
- **Nav:** Plan · Recipes · List · Stock (after gate); Settings cog.
- Bottom-third actions, ≥48 px targets, system dark mode.
- **Every gesture has a visible button:** ‹ › period arrows, a pencil on list rows, Undo toast for ≥8 s (cC).
- **Plan:** header (dates, ‹ ›, storage badge, cue), **Ideas** pool, days × Lunch/Dinner; meal ⋯ menu: Move to tomorrow / to Ideas / Skip / Cooked.
- **Recipes:** search, tag chips, an opt-in "In season" chip, and + to open the paste form.
- **List:** **one contextual button** ("Make list" → "Check home first?" → "Put away N items"); Rebuild/Share/Add in ⋯ (cC); collapsed **"Skipped: you have these (N)"**, 1-tap re-add.
- **Stock:** staples by aisle, each with Have / Low / Out and an optional qty.

| Task | Taps |
|---|---|
| New period | New → preset ("2 weeks from today / Monday") → Create = **3** |
| Copy previous | Copy from… → pick = **+2** |
| Add to slot | slot → recipe = **2** (with search **3**) |
| Make list | List → Make list = **2** |
| Check home | open → rows default **Have**, tap the 3–6 exceptions → Done ≈ **5–8, <1 min** |
| Mark cooked | tap the circle = **1** |

Onboarding: people eating, planning time.

## 4. Planning model [C1, C2, C5]
- **Period:** free start/end, no overlap; default 14 days, 7-day preset (horizon unevidenced, A §2). Copy shifts dates; overflow → Ideas.
- **Hybrid:** `date` + `slot` are optional; meals without them sit in Ideas ("pick by mood", B §4).
- Decision: slots are fixed at Lunch/Dinner because cB, cC, cE and cF all cut configurable slots and no criterion needs them.
  - "Eat out" and "Free" count as planned and add nothing to the list (cA).
- **Servings** default to household [C5]. **Recovery:** Move/Skip in 1 tap (cE).
- **Leftovers (M6):**
  - Stepper: "Cook for 4 (2 extra, saved as leftovers)"; slot picker shows "Leftovers: Chili (2 left)" first → `leftoverOf`, no list demand.
  - Decision: keep this model (cC, cA) rather than a bare "Leftovers" pseudo-recipe (cF), because C5 needs the dish and the portion count. It ships after the gate.
- **Planning cue (M3):** Plan shows "Plan next period?" when the period ends in ≤2 days or at the user's planning time (default Sunday 17:00). It is in-app only (cA; A §3).
- **Suggest N meals (M6):** offers 4–6 recipes on New period, accepted or swapped in 1 tap into Ideas.
  - Ranking: not cooked in the last 2 periods → use-it-up score (overlap with Low/Have stock and with items already on the list) → veggie first → mixed tags → in-season bonus.
  - Decision: ship after the gate. Both are cheap pure functions (cA, cD), and cB objected to timing, not value. Use-it-up is the top-ranked practice (A §2, CORROBORATED); its effect is UNKNOWN.

## 5. Home stock (M5) [C4, C4b]
Decision: keep **quantity-aware subtraction**, because C4b is user-approved and an under-counted list leads to over-buying, which breaks trust (cE, cD, cC; cB disagreed). Simplify instead by cutting the 14-day re-ask and adaptive intervals.
- **StockItem:** `{ingredientId, level, qty?, unit?, alwaysHave, updatedAt}`, using a single vocabulary, **Have / Low / Out** (cC).
- **Subtraction:** same-family qty → need − qty (drop if ≤0); Have without qty, and `alwaysHave` (salt, oil) unless Low/Out → **Skipped**; Low → kept with badge; Out/none → kept.
- **Never hidden:** Skipped is visible and re-addable (cC, cE; Plan to Eat's pantry hid items, B §3). Have >30 days → **"Check these"**.
- **Check home:** lists Have items the plan needs, the "Check these" items and Low staples.
  - All default to Have; sticky Done adds Out/Low to the list (cupboard check, B §3).
- **Put away:** 1 tap moves ticked items to stock as Have, adding the qty where known.
- **Cook-deduct (M7):** a setting, **off by default**, that deducts only qty-aware stock and shows Undo.
  - Decision: opt-in, because cB, cE and cF cut it (qty is rarely known; weighing is impractical, B §3) while C4b only says cooking "can" deduct.

## 6. Shopping list [C3, C4]
1. **Scope:** default = period meals with `listedAt=null`, so top-ups never duplicate (cD); any range selectable [C3].
2. Scale by meal servings ÷ recipe servings, skipping leftovers and pseudo-meals.
3. **Normalise** to `ingredientId` via FR/EN aliases (accent-folded, singularised); preparation words go to `note`. (fixes Plan to Eat's merge failure, R §1).
4. **Units:** g, ml, piece + packs (gousse, botte, boîte, sachet); kg→g, l/cl/dl→ml, c. à soupe 15 ml, c. à café 5 ml, cup 240 ml; pincée has no qty.
5. **Merge** on `(ingredientId, family)`; cross-family via `pieceWeight` (~20 items), else **two lines** (cC). Unmatched lines merge on normalised raw text, with an **"N unmatched"** badge (cE).
6. Subtract stock. Round up to 50 g (100 g above 500 g), 50 ml or whole pieces, with a pack hint where known.
7. **Group** by a fixed French aisle order: fruits & légumes, boulangerie, frais, boucherie/poisson, épicerie, conserves, surgelés, boissons, maison, autre.
8. **Rebuild keeps ticks, manual lines and edits.** Lines are keyed by `(ingredientId|rawKey, family)`, and once anything is ticked it asks "Rebuild?" first (cE; a correctness fix, so in M4).
9. **Share as text** via Web Share (cD, cB; aisle lists are praised, B §1).

## 7. Data model & storage [C8, C9]
- `ingredients` {id, nameEn, nameFr, aliases[], aisle, family, pieceWeight?, packSize?, alwaysHave?, seasons?}
- `recipes` {id, title, servings, minutes, tags[], lines[{ingredientId|null, raw, rawKey, qty?, qty2?, unit?, note?}], steps, source, archived}
- `periods` {id, start, end}
- `plannedMeals` {id, periodId, recipeId|'eatout'|'free', date?, slot?, servings, status: planned|cooked|skipped, listedAt?, leftoverOf?}
- `stock` {ingredientId, level, qty?, unit?, alwaysHave, updatedAt}
- `listItems` {key, ingredientId?, text, qty?, unit?, aisle, ticked, manual, edited}
- `snapshots` {id, at, json} (≤3)
- `settings` {household, planMoment, cookDeduct=false, lastExportAt, persistGranted, schemaVersion}

**Backup (M2):**
- Export: `{schemaVersion, exportedAt, tables}` → `mealplan-YYYYMMDD.json`.
- Auto-snapshot at startup if last >24 h; 3 rolling; 1-tap restore (cE).
- Decision: import is **replace only**, with an automatic snapshot first; merge-import is cut (cA, cC, cE) because snapshots cover undo.
- Decision: the banner stays **dismissible**. After 7 days without an export it returns daily, with the Export button inside and the text "Keep your data safe: save a copy" (cC). The non-dismissible version (cE) is rejected because coercion drives abandonment (cA, cF) and snapshots cover sudden loss.

## 8. Paste-parser [C6]
In-house; `parse-ingredient` as reference only (R §3).
1. Split lines; read the quantity: integers, decimal commas, ½ or 1/2, ranges ("2-3", "2 à 3").
2. Take the longest matching FR/EN unit (g, kg, ml, cl, l, c. à soupe, cs, tbsp, c. à café, cc, tsp, pincée, gousse, botte, boîte, sachet, tranche, cup).
3. Strip de/d'/d’/of.
4. Look up the alias after lowercasing, accent-folding and singularising; **no fuzzy matching** (cB, cD, cF).
5. The remainder becomes `note`.

"200 g d'oignons" → 200 g onion; "1 c. à soupe d'huile d'olive" → 15 ml olive oil; "2 carottes" → 2 pc carrot.

**Preview:** green matched, amber unknown → tap to pick or create (name + aisle), growing the catalogue; unknown lines save raw.

**Catalogue:** ~80 items, script-drafted from starters + staples, hand-reviewed (cF); editable, exported.

## 9. Starter library [C7]
Decision: **15 recipes in v0.1, growing to 25**, about half veggie, 2 flagged "new to try" (cB, cF; cA agreed if the veggie share holds).
- Original recipes, tagged quick/veggie/batch/budget/season; launch set leans autumn/winter.
- CI validator: every line resolves to the catalogue (cF).

## 10. Control feedback (M7) [C10]
**Period-end review → next plan:**
1. A **"Cooked?"** batch card confirms past meals (cE).
2. **Cooked X / planned Y** (Eat out/Free count; Skipped neutral), on the review only (cA).
3. **Variety:** distinct recipes, veggie meals, and one prompt ("try a new vegetable"; A §1).
4. **Carry-over:** keep or drop each uncooked recipe, leading straight into New period (cA).

Decision: waste proxy, veg count and header stats are cut because they are unvalidated and risk shaming (cA–cE); variety stays because C10 requires it.

## 11. Build order & map [Executor]
- **M0** scaffold + migration fixture · **M0b** Pages Action + install doc · **M1** units, catalogue, parser.
- **M2:** recipes, paste form, 15 starters, **backup/snapshots/banner**.
- **M3:** periods, slots, Ideas, Move/Skip, copy, cue.
- **M4:** list (scope, merge, rebuild keeps ticks, Skipped, share). **v0.1 ships here.**
- **GATE:** one real period of use.
- **M5** Stock/Check home · **M6** leftovers, suggestions · **M7** review, cook-deduct · **M8** Capacitor (conditional).

Tests: Vitest on parser, listBuild, stock, backup + 1 Playwright smoke (cF).
```
src/ main.tsx app.tsx nav.tsx theme.css
 db/ schema repo seed migrate snapshots (.ts)
 domain/ units catalogue parser scale listBuild stock period leftovers suggest stats backup (.ts)
 data/ ingredients.json recipes.starter.json aisles.ts
 ui/ PlanScreen PeriodDialog SlotPicker MealMenu RecipesScreen RecipeEdit ParsePreview
     ListScreen CheckHome StockScreen ReviewScreen BackupBanner Settings Toast (.tsx)
scripts/ draftCatalogue.ts validateSeed.ts · .github/workflows/deploy.yml
tests/ parser listBuild stock backup (.test.ts) · e2e/smoke.spec.ts
```
**Open:** store (aisle order), UI language, Android eviction (UNKNOWN), real C1 timing.

## Changelog v1→v2 (change: critics · criterion)
v0.1 cut + gate: B,F · C1–4 | Pages install: F · C8,C11 | Capacitor conditional: F · C9 | backup M2 + 3 snapshots + banner Export: B,E,C · C9 | merge-import cut: A,C,E · C9 | Have/Low/Out, default Have: C · C4b,C11 | visible Skipped, "Check these": C,E · C4,C4b | qty subtraction kept, re-ask cut: E,D,C · C4b | cook-deduct opt-in: B,E,F · C4b | visible buttons, Undo 8 s, one List button: C · C11,C2 | leftovers kept, plain words: C,A · C5 | Move/Skip: E · C1,C2 | cue, presets, onboarding: A,C · C1 | Suggest N + use-it-up: A,D · C1,C4b | `listedAt`, rebuild keeps ticks: D,E · C3,C4 | raw merge, unmatched badge, no composite: E,C · C3,C6 | share text: D,B · C4 | no fuzzy, scripted catalogue: B,D,F · C6 | fixed slots, opt-in season, no reorder: B,C,E,F · C11 | review off header, Cooked? card, carry-over: A,E · C10 | waste proxy/veg count cut: A–E · C10 | library 15→25: B,F,A · C7 | 4 unit tests + 1 smoke: F.
