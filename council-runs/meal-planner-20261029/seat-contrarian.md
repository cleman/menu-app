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
