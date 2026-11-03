# Council transcript — meal-planner-20261029

## Charter & room draw

### charter.md

# COUNCIL CHARTER — Personal meal-planner app (2026-10-29)

## Question
Design (then build) a personal Android meal-planning app: a library of proposed recipes, a menu
calendar to which recipes are added for a NON-FIXED period (typically ~2 weeks, any start/end),
and an automatically generated shopping list. It must be easy and pleasant enough to be used for
real. The user's goal: "retake control of my meals".
Reader: single adult user, builds the app for himself, lives in France (Grand Est), technical
enough to follow a dev project; writes in English. Unknowns to cover: household size (1 or more),
cooking skill, whether he batch-cooks, which store(s).
Reader language: English. Today: 2026-10-29.

## Mode
Design / Build. Artifact: the app's product + technical spec (MVP scope, screens & flows, data
model, shopping-list algorithm, delivery/tech choice, build order). Acceptance criteria:
criteria.md.

## User additions (2026-10-29 16:36)
- HOME STOCK / PANTRY: the app must know what the user still has at home before shopping, and the
  shopping list = needs of the planned meals − what is already in stock. Stock must be quick to
  update (e.g. a pre-shopping "check what I have" pass), and ideally decrease when meals are cooked.
- The user's computer runs Ubuntu (he can install Android Studio / build tools himself).

## Delivery question (council must decide)
The build workspace CANNOT reach Google Maven / Gradle / Android SDK servers (only npm/PyPI/GitHub).
Options: (a) installable offline web app (PWA) — fully buildable and testable here, installs on
Android home screen, later wrappable to APK (Capacitor/TWA) on the user's machine; (b) native
Kotlin/Jetpack Compose source the user compiles in Android Studio — cannot be compiled or tested
here; (c) other. Recommend one, with reasons and the case against.

## Expert domains
Meal-planning behaviour & UX — source bases: (1) research (meal planning, food waste, home cooking
habits, behaviour change); (2) field (existing apps: Jow, Mealime, Paprika, Plan to Eat,
AnyList, Samsung Food/Whisk, Mela… their features and user reviews/complaints).
Two-source rule applies to every claim.

## Quality rules (binding)
Follow /root/council/references/quality-charter.md. Run-specific:
1. Easy-to-use beats feature-rich. Every feature must justify its tap cost. MVP must be small.
2. No calorie/diet enforcement by default ("control" ≠ restriction); keep it a planning tool.
3. Method note: research uses web search; cite URLs. Single-source claims are ALLEGED.
4. TOKEN ECONOMY (user request): write concisely; respect your word cap; read only the files
   named in your prompt; never paste whole files back.

## Seats (critics of the design)
- **Contrarian** — how does this fail or get abandoned after 2 weeks?
- **First Principles** — what is the app really for? what is essential?
- **Expansionist** — what would make it remarkably better (evidence required)?
- **Outsider** — can tired-me at 7pm use it unaided, in ≤ 3 taps?
- **Executor** — can one person build and maintain it? in what order?
- **Habit & nutrition coach** (specialist) — does it actually change eating habits sustainably?

## Configuration (approved)
Level: Standard. Mode: Design/Build. Research: 1 brief. Experts: 1 domain × 2.
Build: architect v1 → 6 seat critiques (parallel) → rebuttal → architect v2 → chairman + light
acceptance check. Fact desk: on request. Outputs: spec v2, MAP.md, report, transcript. Then dev.

### criteria.md

# Acceptance criteria (approved by user 2026-10-29)

C1. A 2-week menu can be planned in under 10 minutes; the planning period has free start/end dates.
C2. Adding a recipe to a day/meal takes ≤ 3 taps; "copy a previous period" exists.
C3. Shopping list generated from any date range; quantities merged across recipes, units normalised.
C4. Shopping list grouped by store aisle; items tickable; pantry items excludable.
C4b. Home stock: the app tracks what I have; the list subtracts stock from needs (quantity-aware); a quick pre-shopping "what do I still have?" check takes under 2 minutes; bought items can go into stock in one tap; cooking a meal can deduct its ingredients.
C5. Servings scale per planned meal; leftovers can fill a later slot.
C6. Recipe entry is fast: ingredients pasted as text are parsed into structured lines.
C7. A starter library of proposed recipes, tagged (quick, veggie, batch, season…).
C8. Works fully offline; no account, no server.
C9. Data export/import (JSON); nothing can be lost.
C10. Simple "control" feedback: planned vs actually cooked, variety at a glance; no calorie counting by default.
C11. One-handed, readable phone UI; dark mode.
C12. Every design choice in the spec cites the expert hearing, the research brief, or a reviewed app.

## Design versions & rationale

### design-v1.md

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

### design-v2.md

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

## Final verdict

# Personal meal-planner app — v2 (spec verdict)

Method: Standard council, Design/Build. One research brief, two experts, six seat critiques, one rebuttal, spec v2. Grades: CORROBORATED, CREDIBLE, ALLEGED, UNKNOWN. Sources were read through a summarising fetch tool, so nothing is VERIFIED; CORROBORATED is the ceiling. Acceptance is checked against the spec only: nothing is built yet.

## The 60-second version

- **Build:** a small offline-first Android app around one loop: recipe, plan, list, cook. Free-date menu periods, paste-in recipes, an aisle-grouped list, later home stock. No calories, streaks or accounts. Spec: `design-v2.md`.
- **Delivery:** an installable web app (PWA) on GitHub Pages, installed from Chrome. It is the only option buildable and testable here; native Kotlin cannot be compiled here. An APK wrapper (Capacitor) is conditional on eviction or install trouble. All six seats agreed.
- **v0.1 (M0–M4):** recipes with paste parsing, 15 starters, periods with Lunch/Dinner and an "Ideas" pool, aisle list with ticks and always-have exclusions, text share, JSON backup with 3 snapshots, Pages install.
- **Gate:** use v0.1 for one real period before building stock, leftovers, suggestions and review (M5–M7). Stock (C4b) is delayed, not dropped.
- **First step:** build M0 and M0b (scaffold plus Pages deploy), install the empty shell on your phone, check the storage badge.

## 1. Acceptance check (spec only)

| Criterion | Rating | Note |
|---|---|---|
| C1 Plan 2 weeks in under 10 min, free dates | Partly | Free dates and 3-tap presets specified. Timing unmeasured. |
| C2 Add in 3 taps or fewer; copy period | Met | 2 taps (3 with search); copy adds 2. |
| C3 List from any range, merged, normalised | Met | Merge by ingredient and unit family; unmatched lines merge on raw text with a badge. |
| C4 Aisles, ticks, excludable items | Met | Fixed French aisle order; your store's order is open. |
| C4b Stock subtracted from needs | Partly | Quantity-aware only where a quantity is entered; "Have" without quantity goes to a visible Skipped group. The under-2-minute check (about 5–8 taps) is unmeasured. Cook-deduct is off by default. Ships after the gate. |
| C5 Servings scale; leftovers | Met | At M6, after the gate. |
| C6 Pasted text parsed | Partly | FR/EN parser, exact aliases only. Real accuracy on French recipes UNKNOWN. |
| C7 Tagged starter library | Met | 15 growing to 25, about half veggie. |
| C8 Offline, no account, no server | Met | Pages serves code only, not data. First install needs a network. |
| C9 JSON export/import, nothing lost | Partly | Export, 3 snapshots, banner specified. Browser storage is best-effort; Android eviction UNKNOWN. |
| C10 Cooked vs planned, variety | Met | Period-end review at M7, no calories. |
| C11 One-handed, dark mode | Met | Bottom-third actions, 48 px targets. Untested on a phone. |
| C12 Choices cite sources | Partly | Every choice cites a critic, expert or brief section, but many underlying facts are ALLEGED. |

## 2. Key decisions and dissent

| Decision | Disagreement | Resolution |
|---|---|---|
| Thin v0.1 plus gate | Executor and First Principles wanted a smaller first release. | Accepted: the loop is complete at M4. |
| Keep quantity-aware subtraction | First Principles wanted it deferred and C4b amended. Contrarian, Expansionist, Outsider: an under-counted list over-buys and loses trust. | Kept, since you approved C4b. Complexity cut elsewhere: no re-ask, no adaptive intervals, one Have/Low/Out vocabulary. |
| Cook-deduct | Contrarian, First Principles, Executor: cut. | Opt-in, off by default; C4b says only "can". |
| Hide or show stock | Plan to Eat's pantry hid needed items (ALLEGED). | Never hide: visible Skipped group, one-tap re-add, 30-day "Check these". |
| Backup nag | Contrarian: non-dismissible. Coach, Executor: coercion causes abandonment. | Dismissible, returns daily after 7 days. Chairman sides with the majority; snapshots cover sudden loss. |
| APK timing | Contrarian wanted it early, then withdrew. | Conditional. Capacitor's storage is separate from Chrome's, so switching means a JSON move. |
| Leftovers | Executor: bare pseudo-recipe. | Model kept; C5 needs the dish and portions. |

### The honest case against building an app at all

No seat proposed an existing app (all answered "no reframe") and the research never tested it. This case is the chairman's, so it is less stress-tested.

- **For Jow, KitchenOwl, Mealie, Paprika:** the core loop exists, polished. Trying one takes an evening; building takes weeks. Jow reviewers praise auto lists and lower mental load (ALLEGED: partial Trustpilot sample). Mealie and Tandoor have calendars and merged lists (ALLEGED: one comparison site). Paprika has a calendar and pantry (ALLEGED: vendor blog). KitchenOwl: UNKNOWN. Whether any app handles "any start/end, then list" well: UNKNOWN.
- **Against that:** Jow is built around retailer carts, so it may not suit your own recipes or stock. Self-hosted tools need a server. Paid apps draw price and rigidity complaints (CREDIBLE).
- **Verdict:** building is still reasonable as a personal project, since your approved criteria (free periods, own stock, offline) are only partly documented elsewhere. That rests on an unverified gap. **Cheap hedge:** spend one evening on Jow and Mealie or KitchenOwl before M1. If one meets C1–C4, the council would not argue for building.

## 3. Facts graded

| Fact | Grade | Note |
|---|---|---|
| Browser storage is best-effort; `persist()` helps, install favours the grant | CORROBORATED | Chrome and web.dev plus dev.to (2022 pages) |
| Android-specific eviction in 2026 | UNKNOWN | Not found |
| A TWA needs a live hosted site | CORROBORATED | Chrome docs and npm page |
| Capacitor builds an APK on Ubuntu | ALLEGED | One forum thread |
| Exact-quantity inventory gets abandoned | CORROBORATED | Three independent origins |
| Plan to Eat merges poorly across wording and units | ALLEGED | Vendor help page |
| Aisle-grouped auto lists are valued | CREDIBLE | iOS review samples |
| Use-it-up planning effect | UNKNOWN | No local effect size |
| Mealime shutdown 21 Oct 2026 | ALLEGED | Single source |
| Real C1 and C4b timings | UNKNOWN | Need your first period |

Leanings: Plan to Eat and Paprika pages are vendor or competitor; Trustpilot is user-generated and partial; comparison pages are commercial or self-hosting enthusiasts. Expert A is US/Australian academic with no usability data for this case. Expert B skews iOS/US, with no Play Store or French apps sampled.

## 4. Risks

- **Data loss:** high severity, unknown likelihood. Mitigation: `persist()`, badge, snapshots, one Drive export on day one.
- **Abandonment after about two weeks:** the main, likely risk. Mitigation: thin v0.1, Move/Skip, planning cue, no shaming.
- **Stock drift:** wrong stock hides items. Mitigation: visible Skipped group.
- **Parser or catalogue misses:** list looks wrong. Mitigation: unmatched badge, create-from-preview, CI seed validator.
- **One-person maintenance:** tests only on four modules plus one smoke test.

## 5. Open questions for you

1. Will you try Jow or another existing app against C1–C4 for one evening before M1?
2. Which store do you use (sets aisle order), and should the UI be English, French or both?
3. How many people eat, and do you batch-cook?
4. Will you treat the gate as binding: one real period on v0.1, then decide?

## 6. Glossary

- **PWA:** web app installable on the home screen, works offline.
- **TWA:** Android wrapper opening a hosted PWA full screen.
- **Capacitor:** tool that packages a web app as an APK.
- **APK:** Android install file.
- **Eviction:** the browser deleting stored data to free space.
- **CI:** automated checks on each code push.
- **M0–M8:** build milestones. **Gate:** pause after M4 for one real period of use.

## Self-check (internal, same process, not independent)

- Grading and ceiling stated. C12 is Partly because citations lean on ALLEGED sources.
- No required design change rests on a single source. Capacitor details are ALLEGED and kept conditional.
- Vendor, competitor and user-generated sources are tagged.
- Status quo is included but chairman-written, so less tested.
- Advice is conditional on your goals; no impact claims invented (waste and habit effects UNKNOWN).
- Weaknesses: acceptance is spec-only, C1 and C4b timings are untested, and primary sources were not reopened.
