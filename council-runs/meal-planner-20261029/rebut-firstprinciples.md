# Rebuttal: First Principles (Critic B)

**Endorse: Critic F, change 2 (install path).** A PWA with no HTTPS origin cannot be installed, so the loop (recipe, plan, list, cook) never reaches the phone. M0b, GitHub Pages, is a precondition for C8 and C11. I missed it. F also correctly makes Capacitor conditional, because its WebView storage is separate from Chrome's.

**Oppose: Critic E, change 1 (pull Capacitor forward to just after M4, as daily driver).** It adds JDK, Android Studio and a build that cannot be tested here, before the loop has proved itself. It also puts a storage migration (export/import) in the user's first week. Criterion at stake: C9 (nothing lost) is better served by cheap early backup (export plus persist() at M2, one rolling snapshot) than by a heavier platform. Critic D's additions (Suggest N meals, use-it-up, wake lock) fail the same test: they grow scope before M4 is used.

**Final top-3 required changes**
1. M4 is the MVP, per F's v0.1 cut (about 80 ingredients, 10 to 15 recipes) with M0b Pages deploy. Gate M5+ on two weeks of own use.
2. One stock mechanism: C's "default Have, tap exceptions" check, with a visible "Skipped: you have these" list section (C). Defer qty-aware subtraction and cook-deduct, and amend C4b.
3. Backup at M2, with the Export button inside the nag banner (C) and one rolling snapshot.

**Changed my mind**
- Hidden stock: C and E show that hiding "have" items causes the 7pm failure. I now require a visible, collapsed section.
- Catalogue: F's script-generated draft plus "unknown, create" replaces my hand-shrink.
