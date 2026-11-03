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
