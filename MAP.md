# MAP — read this first, open files only when you change them

Purpose: retake control of meals. Loop = Recettes → Plan (any length) → Courses (À prévoir → Panier) → Maison → Cuisiner → Bilan → next plan.
Stack: Vite + TS + Preact + Dexie (IndexedDB) + vite-plugin-pwa (installable, offline, share_target). French UI. GitHub Pages (.github/workflows/deploy.yml).
Design source: council-runs/meal-planner-20261029/design-v2.md (+ verdict.md).

## Files (one module each, keep them small)
- src/domain/ — PURE logic, unit-tested
  - units.ts       families mass g · vol ml · count pc · own (can, clove…); roundUp; formatQty FR ("1,5 kg", "2 c. à s."); EDIT_UNITS
  - catalogue.ts   Catalogue: alias index, norm(), singular(), match() exact→head→tail, NO fuzzy; name() = French; loads data/extra/*.ts
  - parser.ts      parseLine/parseText: FR+EN lines, fractions, ranges, "d'", "une pincée", "sel, poivre"
  - recipeText.ts  tag vocabulary (CATEGORIES, DIETS, CUISINES, SEASONS) · parseBank (bank format) · parseFreeText (pasted/shared) · parseJsonLdRecipe · filterRecipes · migrateTags
  - listBuild.ts   collectNeeds → applyStock → (proposal) · addToCart (merge same ingredient+family) · needToItem · listAsText · mergeList (legacy)
  - stock.ts       putAway · cookDeduct (opt-in) · isStale (>30 d)
  - suggest.ts     main dishes only (isMain) · not-recent + use-it-up + season · alternate vege
  - dates.ts       'YYYY-MM-DD' helpers, fr-FR labels
  - backup.ts      backup format v2: normalize (v1→v2, starter ids), merge(local, incoming) · DEVICE_LOCAL_KV
  - sync.ts        PURE sync rules: version vectors, content hash, decide(local, remote, chiefId), mergeGroup, parseSyncFile, SYNC_KV
  - menuLayout.ts  buildMenu(period, meals, recipes) → days (midi/soir) + ideas, for Menu page and PDF
- src/data/
  - ingredients.ts  ~570 lines "id|en|fr|aisle|pieceG|aliases" · AISLES (13 French store sections) · PANTRY_AISLES
  - bank/*.ts       recipe bank, ~300 recipes in 6 themes (francaise, vege, monde, rapide, soupes, desserts) — format: bank/README.md
  - extra/*.ts      extra ingredients per theme (same line format)
- src/db/  types.ts · db.ts (ONLY Dexie layer; seedIfEmpty = bank v2; migrate() = v0.3 one-time (starter ids); export/import replace|merge; 3 snapshots) · ops.ts (addMeal, removeMeal, setStatus, createPeriod+copy, fill)
- src/ui/
  - App (tabs Plan/Recettes/Courses/Maison, Boundary per tab, share-target reader, Welcome) · kit (useLive, toast+Annuler, Sheet+footer, Seg, Stepper, Boundary, FilterBar)
  - PlanScreen + PlanSheets (SlotPicker: slot = 1 tap; Ideas = multi-select stays open + FilterBar · MealMenu · PeriodDialog · FillSheet · ReviewSheet)
  - RecipesScreen (+RecipeBody, FilterBar) · RecipeEdit (+PasteSheet, tag groups, parse preview, create ingredient)
  - ListScreen: Proposal (uncheck → kv proposalOff, extras stage 'proposal', CheckHome, Valider → cart + meals.listedAt) · Cart (tick, ✕, SizeSheet, share) · PutAway → stock
  - SyncSheet (Réglages → Synchronisation: create/join group, send/receive file, chief, conflict history)
  - MenuView (full-screen plan menu, opened from Plan → 📄 Menu) + menuPdf.ts (jsPDF lazy; formats A4 ↕↔, Tablette ↔↕)
  - StockScreen (+QtySheet) · Settings (Welcome, BackupBanner, SettingsSheet)
- tests/  parser · list (+stock, cart) · recipeText · bank (validates every bank file) · e2e_smoke.py (Playwright phone flows)

## Entities (src/db/types.ts)
Recipe{title, servings, minutes, tags[], lines[{ingredientId|null, raw, rawKey, qty, qty2, unit, note}], steps, source starter|user}
Period{start,end,reviewedAt} · PlannedMeal{periodId, recipeId|label, date?, slot?, servings, extra, status, listedAt?, leftoverOf?}
StockItem{ingredientId, level have|low|out, qty?, unit? (g/ml/pc…), alwaysHave} · ListItem{key, stage proposal|cart, ticked, qty, unit, edited}
kv: schemaVersion, pdfFormat, household, onboarded, cookDeduct, lastExport, firstUse, snoozeBackup, seeded, bankVersion, proposalOff

## Key rules
- Proposal scope = planned, listedAt null, not leftovers, date today..until (or no date), period not over; minus stock
- Valider: selected → cart (merge), scoped meals get listedAt · Ranger: ticked cart items → stock "J'ai" with qty
- Stock: J'ai without qty excludes; qty subtracts; Peu/Plus = buy; ★ basiques never listed
- Every destructive action: toast with Annuler (8 s); snapshot before import and before Ranger
- Starter recipe id = starterId(title) ('s-…') on every device; backup v1 files are upgraded on import; import = Merge (add, newest wins on recipes/stock) or Replace
- Bank upgrade: bump BANK_VERSION in db.ts → unused starters replaced, user recipes kept

## Later
URL import beyond JSON-LD · aisle reorder per store · Capacitor APK (only if storage wiped) · cook mode (wake lock)

## Sync (v0.4) — files today, WebRTC/QR later
- Synced: recipes (source≠starter; editing a starter makes it 'user'), periods, meals, stock, list, ingredients, kv household/cookDeduct/proposalOff. Never: starters, snapshots, other kv.
- Per record `syncmeta` = {version vector, last editor, content hash(ignores updatedAt), del}. Tables sync/syncmeta/conflicts are Dexie v2 (additive), not in backups.
- Send = full synced state as JSON (idempotent, order-independent). Receive: newer vector wins; concurrent edits → the CHIEF's version wins (else latest), loser → `conflicts` (restorable). Deletes are tombstones.
- Join: 'adopt' (take the group's data, atomic) or 'merge'. Chief: only the chief hands over (chiefSeq); anyone can take over.
- Tests: tests/sync.test.ts (rules), tests/syncdb.test.ts (2–3 simulated devices).
