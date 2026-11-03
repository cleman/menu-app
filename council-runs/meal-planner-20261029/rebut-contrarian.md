# Rebuttal: Contrarian (Critic E)

**Endorse: Critic F.** Capacitor's WebView has separate storage from the Chrome PWA, so moving means export/import (C9). That sinks my own "pull the APK forward" fix. A mid-use switch is itself a data-loss event.

**Most oppose: Critic B #2** (defer quantity-aware subtraction, amend C4b). The user approved C4b as written. Deferring it ships a list that over-buys, and over-buying is the first reason people stop trusting a list. B is right that the stock model has too many concepts. Fix that by cutting cook-deduct and the 14-day re-ask, not the subtraction.

**Final top-3 required changes**
1. Backup (C9): export from M2 (B #5), 3 rolling in-app snapshots restorable in 1 tap, and a nag that cannot be dismissed after 14 days. Hosted PWA (F #2), with the APK conditional.
2. Stock drift (C4b): `have`-without-qty decays to "unsure" after 30 days and shows in a visible collapsed group. Use C's wording, "Skipped: you have these (4)", one tap to Add.
3. List trust (C3, C4): rebuild keeps ticks and manual lines, and merges on normalised raw text when `ingredientId` is null, with an "N unmatched" badge.

**Changed my mind:** I dropped "APK early" in favour of a hosted PWA plus snapshots (F). I now agree that cook-deduct should be cut (B, F).
