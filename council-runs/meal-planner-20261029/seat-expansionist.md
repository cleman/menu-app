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
