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
