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
