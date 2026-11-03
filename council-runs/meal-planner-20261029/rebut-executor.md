# Rebuttal: Executor (Critic F)

**Endorse: Critic B, change 5 (backup moves from M6 to M2).** Recipe entry is the costliest user effort, so the library needs a safety net once real data exists. This matches my own optional item (export nag from M2). B's M4 "use for one period, then decide" gate also fits my v0.1 cut. Serves C9.

**Most oppose: Critic E, change 1 (pull the Capacitor build forward to just after M4, as daily driver).** It needs JDK 17 and Android Studio, and it can't be built or tested in this environment. The WebView has separate storage from the Chrome PWA, so an early APK splits the user's data and forces an export/import move at the worst time. The stated risk, eviction, is already covered by persist() plus export plus snapshots. Criteria at stake: C8, C9, and the "easy beats rich" principle. Keep M8 conditional.

**Final top-3 required changes**
1. Re-cut v0.1: recipes (paste, exact alias), period, slots, aisle list, ~80 catalogue items, 10-15 starter recipes. Stock, leftovers, review and the full catalogue come after the M4 gate (B1).
2. Add M0b: GitHub Pages deploy through an Action (base path, service-worker scope), with the install steps written down. Capacitor becomes conditional and states the storage split.
3. Backup from M2: export, persist(), a nag that carries the Export button (C), and 3 rolling snapshots (E).

**Changed my mind**
- I now accept E's 3 in-app snapshots, which are cheap.
- I now accept E3, where rebuild keeps ticks. It is a correctness bug, so it goes into M4, not later.
- I now accept C's single Have/Low/Out vocabulary.
- Stock should shrink to B's staples checklist at first.
