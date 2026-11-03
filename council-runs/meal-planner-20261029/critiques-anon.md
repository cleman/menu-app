# Anonymized critiques of design-v1

## Critic A
# Seat: Habit & nutrition coach
Lens: sustainable habit change. Evidence: expert-A (A).

## REQUIRED CHANGES
1. **Planning ritual with a cue [C1].** v1 has no habit loop. Onboarding asks for a planning moment (default Sunday 17:00). Plan tab shows "Plan next period?" when the period ends in <=2 days or has ended. No OS notifications in the PWA. Stable context and few missed repetitions matter (A §3, Lally, CREDIBLE; effect on planning UNKNOWN).
2. **"Fill my period" guided flow [C1, C2].** Suggest 4-6 seasonal, mixed-tag, not-recently-cooked recipes; accept or swap in 1 tap into the To-cook pool. Effort is the main barrier (A §2, CREDIBLE).
3. **Variety nudges, not rules [C7, C10].** Suggestions avoid repeats (except batch) and show veggie recipes first. Review frames vegetables as a prompt ("try one new veg"). Variety is associated with diet quality (A §1, §3, CREDIBLE, association only).
4. **Close the loop at period end [C10].** The review leads straight into the next plan: carry-over plus 1-tap keep/drop per recipe. Neutral tone: no streaks, no red states (A §4, CONTESTED; risk sits in calorie/weight tracking).
5. **Lapse-tolerant tracking [C10].** "Free / Eat out / Leftovers" count as planned. The cooked flag is optional and blocks nothing. Move "cooked X/planned Y" off the header to the review screen so daily glances do not become tracking (A §3, §4).

## OPTIONAL IMPROVEMENTS
- Use-it-up suggestion slot from low/old stock (A §2, CORROBORATED; effect UNKNOWN).
- Raise the veggie share of the starter library from 14 to ~20 of 40; flag 2 "new to try".
- Default period 7 days, 14 optional: the 2-week horizon is unevidenced (A §2).

## CUTS
- Waste proxy (unvalidated, shaming risk).
- Distinct-veg count on the header.
- Aisle reorder, merge import and period labels from early milestones.

## Delivery decision
Agree with PWA; the habit risk is data loss, so the backup nag is justified.

## Reframe flag
No: goal and architecture fit; only the cue/ritual layer is missing.

## Critic B
# Seat: First Principles
Purpose: "retake control" = decide what to eat, buy only that, then actually cook it. Essential loop: recipe -> plan -> list -> cook. Everything else must earn its place.

## REQUIRED CHANGES
1. Make M4 the real MVP and gate M5+ on 2 weeks of own use (C1, C2, C3). v1 treats 11 modules as equal; the loop is complete at M4. Fix: add a "use for one period, then decide" checkpoint after M4 in section 11.
2. Collapse stock to one mechanism (C4b, charter rule 1). Three levels + optional qty + alwaysHave + staple + 14-day re-ask + cook-deduct is five concepts. Fix for MVP: staples checklist (Have/Need) inside List, plus Put away. Defer qty-aware subtraction and cook-deduct; propose amending C4b "can deduct" to "later".
3. Shrink catalogue to ~120 ingredients, pieceWeight on ~20, drop Levenshtein fuzzy matching (C6, C3). Unknown lines already save raw; 250 aliases is data-entry work for the builder, not value for the user.
4. Cut the review card to "cooked X / planned Y" (C10). Distinct vegetables and the waste proxy are decoration without evidence of behaviour change (A section 4 CONTESTED).
5. Move backup (export + persist()) from M6 to M2 (C9). Losing the recipe library on eviction destroys trust faster than any missing feature, and recipe entry is the costliest user effort.

## OPTIONAL IMPROVEMENTS
- Recipe "cook view": big-text steps, ingredients scaled to the meal. The app is used at the stove, and v1 has no screen for it.
- Share list as plain text (Web Share) instead of a later "sharing" feature.
- Starter library of 25 instead of 40; the user's own recipes matter more.

## CUTS
Seasonal filter and produce calendar; configurable slots (fix Lunch/Dinner); aisle reordering (ship one French order); pseudo-recipes beyond "Eat out"; Mirepoix-style adaptive intervals; rotation templates.

## Delivery decision
Agree: PWA. It is testable here, and Capacitor later is a packaging step, not a rewrite.

## Reframe flag
No. The goal and criteria fit; the issue is scope weight, not direction.

## Critic C
# Seat: Outsider (tired, 7pm, one hand, zero context)

## REQUIRED CHANGES
1. **Check home is 15-25 taps, not "<2 min easy" (C4b, C11).** Fix: every row defaults to "Have"; user taps only the exceptions (expect 3-6 taps). Big sticky "Done" at the bottom. Use one vocabulary everywhere: Have / Low / Out (Check home currently says Have/Need, Stock says have/low/out).
2. **"Probably at home" is confusing and hides needs (C4b, C4).** A tired user cannot tell whether it is on the list. Fix: a collapsed section at the end of the List, "Skipped: you have these (4)", each row one tap to "Add". Never use "Probably".
3. **Hidden gestures (C11).** Swipe to change period, long-press to edit list lines, "Undo" toasts that vanish. Fix: visible < > arrows on the period header, a visible pencil on list rows, Undo toast 8 s minimum. Every gesture needs a visible button equivalent.
4. **Leftover chips are unexplained (C5).** A chip appearing "under the meal" after changing servings makes no sense unaided. Fix: the servings stepper says "Cook for 4 (2 extra, saved as leftovers)". Slot picker lists "Leftovers: Chili (2 left)" first when any exist. Drop the word "chip".
5. **List screen has three competing buttons: Build, Check home, Put away (C2, C4b).** Fix: ONE contextual primary button by state: empty = "Make list"; built = "Check home first?" (skippable); items ticked = "Put away N items". Secondary actions go in a menu.

## OPTIONAL IMPROVEMENTS
- New period: offer presets ("2 weeks from today", "2 weeks from Monday") before the date pickers; native date pickers cost 4+ taps each.
- Rename "To cook" pool to "Ideas, no day yet" and show a one-line empty-state hint. First launch: 2 questions only (people at home, ready).
- Cooked circle: first use shows "Marked cooked. Stock updated. Undo" so auto-deduction is not a surprise.

## CUTS
- Seasonal filter on by default (hides recipes with no explanation); make it an opt-in chip.
- Composite lines ("2 pcs + 200 g"): convert or show two lines.
- Waste proxy, merge-import mode, Mirepoix intervals, 4 configurable slots (fix at Lunch/Dinner), aisle reordering UI (M-later).
- Settings cog hiding Export: make the backup nag banner contain the Export button itself.

## Delivery decision
Agree PWA, provided the install and backup prompts are plain-language ("Keep your data safe: save a copy").

## Reframe flag
No. Architecture is sound; the issue is vocabulary and tap defaults, not direction.

## Critic D
# Seat: Expansionist (critique of design-v1)

## REQUIRED CHANGES
1. **"Use-it-up" suggestions (C4b, C10).** Top-ranked, high-impact, easy waste practices are leftovers, a use-it-up shelf and a weekly "cook what is going off" meal (A §2, CREDIBLE; ADEME independently agrees). v1 only has a passive waste proxy. Fix: in SlotPicker, sort/badge recipes by overlap with `low`/`have` stock and with ingredients already on the period's list. Pure function, no new screen, 0 extra taps.
2. **Pool-first quick-start (C1, C2).** Plan to Eat documents "add 3-4 recipes, pick days by mood" (B §4, CREDIBLE, independent echo from Mumsnet). Fix: on New period, offer "Suggest N meals" (filters: quick/veggie/batch, in season) filling the pool, which cuts C1 below the 6-8 min estimate. Cheap: tags and seasons already exist.
3. **Scope the list to what is unplanned (C3).** Fix: Build defaults to the dates not yet shopped (`listedAt` flag on plannedMeals), so a mid-period top-up never duplicates. Low cost, protects trust in the list.
4. **Plain-text list share (C4).** Aisle-grouped, household-shared lists are praised (B §1, CREDIBLE). Fix: promote "Share list as text" (Web Share API) from Later into MVP; ~20 lines and it also serves as a no-install fallback.
5. **Keep-screen-awake recipe view (C11).** Paprika complaint about lost progress and bottom-edge mis-taps (B §4, ALLEGED, single source, so build only because it is cheap). Fix: Wake Lock API plus tickable steps in RecipeEdit/view.

## OPTIONAL IMPROVEMENTS
- Seasonal produce calendar already exists; show "in season" chip on pool suggestions.
- Weekly auto-backup to Documents already planned for M8; surface its status on the review card.
- One-tap "Repeat last period's favourites" (starred after cooking) as a lighter C2 copy.

## CUTS
- Waste-proxy stat on the review card until real use data exists (inferential).
- 4 configurable slots: ship Lunch/Dinner only.
- Fuzzy Levenshtein parser fallback in M1; ship exact alias plus amber chip first.

## Delivery decision
Agree PWA first: it is the only option testable here, and the eviction risk is covered by persist() plus export.

## Reframe flag
No. Goal, criteria and architecture hold; upside lies in using stock and tags already modelled.

## Critic E
# Seat: Contrarian (lens: how it fails or is abandoned after 2 weeks)

## REQUIRED CHANGES
1. **Backup is the weak point (C9, C8).** The export nag is dismissible and the APK arrives only at M8. A user who loses 3 weeks of plan and stock to IndexedDB eviction will never return. Fix: keep 3 rolling in-app snapshots (restore in 1 tap); make the nag non-dismissible after 14 days without export. Pull the Capacitor build forward to just after M4 and use it as the daily driver, with auto-backup to Documents.
2. **"Probably at home" hidden by default creates the 7pm failure (C4b).** Stock drifts, so items get hidden and are missing mid-recipe. This is exactly why Plan to Eat's pantry failed (B §3). Fix: show `have`-without-qty items as a collapsed, visible "Check these" group, and decay `have` to "unsure" after 30 days.
3. **List rebuild vs shopping in progress (C3, C4).** Rebuild must not wipe ticks, manual lines, or in-store edits. Fix: key lines by (ingredientId, family), carry ticked state across rebuilds, and ask "Rebuild?" once any line is ticked.
4. **Plan collapses on first deviation (C1, C2).** There is no recovery flow when life intervenes. Fix: an "Unplanned/skipped" action on each meal that moves it to tomorrow or to the pool in 1 tap. Also add an empty-state first run that pre-fills a period from the starter library.
5. **Silent catalogue misses break merging (C3, C6).** Raw lines with `ingredientId=null` never merge, so the list looks wrong and trust drops. Fix: fall back to merging on normalised raw text, and show an "N unmatched" badge on the list.

## OPTIONAL IMPROVEMENTS
- Auto-mark past meals as "cooked?" in one batch card at period end, so forgotten taps do not ruin the review card.
- Storage-quota and persist() health check shown on the Plan screen, not buried in Settings.
- Keep the catalogue editable and exportable, since a ~250-item catalogue will be too small within weeks.

## CUTS
- Cook-time stock deduction (qty is rarely populated, so it is a maintenance burden for little gain).
- Waste proxy and the seasonal filter defaulting on.
- Configurable slots up to 4 (fix at Lunch/Dinner).
- Merge-import (keep replace only, plus snapshots).

## Delivery decision
Agree with PWA-first. Disagree with the timing: the APK must land early, because the PWA alone is the highest data-loss risk.

## Reframe flag
No. The goal and architecture are sound. The risk is in operational details (backup, stock drift, recovery).

## Critic F
# Seat: Executor

## REQUIRED CHANGES
1. **First usable version is too late (M4) and too big.** Re-cut as v0.1 = recipes (paste, no fuzzy match) + period + plan slots + list by aisle, with ~80 catalogue items and 10 starter recipes. Stock, leftovers, review and the full catalogue follow. Serves C1-C4, C12 "easy beats rich".
2. **Install path is missing.** A PWA needs an HTTPS origin; the spec has none. Add M0b: deploy to GitHub Pages (free, `base` path set in Vite, service worker scope checked) from a GitHub Action. Phone installs from Chrome. Serves C8, C11.
3. **Capacitor (M8) is optional, not a milestone.** Its WebView has separate storage from the Chrome PWA, so moving means export/import. State this and make M8 conditional on eviction or install trouble. Serves C9.
4. **Catalogue effort is the schedule risk.** 250 FR+EN aliased entries plus pieceWeight and packSize is days of data work. Fix: generate a draft with a script from the starter recipes, hand-review, and grow by "unknown -> create" in the parser. Serves C6, C7.
5. **Test load is too heavy for one maintainer.** Keep Vitest on `parser`, `listBuild`, `stock`, `backup` only. One Playwright smoke total, not one per milestone. Serves maintainability.

## OPTIONAL IMPROVEMENTS
- Add a `schemaVersion` migration test fixture from M0, so later changes never break real data.
- Build a seed-recipe validator (every line resolves to the catalogue), run in CI.
- Show the Settings export nag from M2, because real data exists from then on.

## CUTS from MVP
- Leftover chips and `leftoverOf` (C5 is met by the servings scale; use a "Leftovers" pseudo-recipe only).
- Review card variety stats (keep cooked/planned only).
- Fuzzy Levenshtein matching (exact alias + singularise suffices).
- Mirepoix-style intervals, custom aisle reordering UI (fixed order first), 4 configurable slots (Lunch/Dinner fixed).
- 40 recipes -> 15 at launch.

## Ubuntu install steps (PWA path)
1. `sudo apt install git nodejs npm`; check Node >= 20 (or use nvm).
2. `git clone <repo> && cd mealplan && npm ci && npm run build`.
3. `npm test` (Vitest).
4. Push to GitHub; the Action publishes `dist/` to Pages (Settings > Pages > Source: Actions).
5. On the phone, open the Pages URL in Chrome > menu > "Install app".
6. Open Settings and confirm "persistent storage: granted".
7. Export JSON once and store it in Drive or by email.

APK later: install JDK 17 and Android Studio, run `npx cap add android`, `npx cap sync`, then build in Studio. Transfer data via JSON.

## Delivery decision
Agree: PWA, hosted on GitHub Pages, with Capacitor conditional.

## Reframe flag
No. The architecture is sound; the scope and ordering need trimming.
