# Research brief — meal-planner app (2026-10-29)

**Method and limits.** About 18 searches/fetches. Search returned link lists only. Pages were read through a summarising fetch tool, not raw text, so nothing here is "VERIFIED"; CORROBORATED is the ceiling. Several URLs (Grocy GitHub, parse-ingredient GitHub, Android Studio docs) were blocked, and the Grocy blue-book page returned only its table of contents. User reviews were hard to reach (Jow Trustpilot partial). Single-source claims are ALLEGED. Many app-comparison pages are from competing vendors (tagged "vendor").

## 60-second version
- Apps fail on **data-entry effort** and on **list merging that does not match units or wording**. Grocy-style exact stock tracking is the heaviest part and the most abandoned.
- Cheapest viable stock model: **track only staples/packs, by "have / low / out" plus optional quantity**, run a quick pre-shopping check, and subtract only when a quantity is known.
- Delivery: a PWA is workable, but IndexedDB is "best-effort" storage unless persistence is granted. Export/import JSON is mandatory. APK wrapping is possible on Ubuntu.
- Ingredient parsing: `parse-ingredient` (MIT, configurable languages) is a candidate. French support is configurable, not built in. Expect to write a French unit and keyword table.

## 1. Existing apps

| App | Facts | Grade / source |
|---|---|---|
| Plan to Eat | Merges shopping items by title + unit + category. Fails on "pinch" vs "tsp", "4 potatoes" vs "6 lb potatoes", "Chopped Onion" vs "Onion". Manual merge by editing the line. | ALLEGED (single, official help page, which is strong for its own behaviour): https://learn.plantoeat.com/doc/manually-merge-ingredients-on-your-shopping-list |
| Paprika 3 | Manual "Menus" calendar, manual pantry list, aisle sorting with custom categories, clips recipes from websites, one-time purchase per platform. | ALLEGED (vendor): https://www.foodieprep.ai/blog/mealime-vs-paprika |
| Mealime | Auto plan from own catalogue, aisle-sorted list, no pantry awareness, no own-recipe import. The same page claims it was **discontinued 21 Oct 2026**; I found no second source (a search surfaced a Mealime community thread on discontinuation, not opened). | ALLEGED, treat shutdown as unconfirmed: same URL |
| Jow (France) | Reviewers praise reduced mental load, auto lists, one-click cart filling, filters by serving size/allergy. Only visible complaint was a rewards cut. Jow is built around retailer carts; the partial sample is not representative. | ALLEGED (partial sample of ~20 of 70 reviews): https://fr.trustpilot.com/review/jow.com?page=2 |
| Tandoor | Calendar with breakfast/lunch/dinner/snack slots, shopping list auto-built from plan with quantities combined. URL import can miss ingredients. Heavier (app + PostgreSQL). | ALLEGED (single comparison site): https://selfhosting.sh/compare/tandoor-vs-mealie/ |
| Mealie | Simpler, single container. Strong URL import (JSON-LD). Basic planner, shopping lists less tied to the plan. | same source, ALLEGED |
| Samsung Food, AnyList, Mela, KitchenOwl | Not researched in depth. A general comparison list exists (https://grate-six.vercel.app/blog/meal-planning-and-grocery-list-app, vendor-like, not opened). | UNKNOWN |

**Flexible periods.** Paprika, Tandoor and Mealie all offer a free calendar to which recipes are added. None of the pages I read documents "pick any start/end then generate a list". Cross-app finding is thin: UNKNOWN whether any app does this well.

**Grocy as the stock reference.**
- Reported failure: one journalist gave up after about a week. Every product needs master-data entry with units and conversions. Variable items (onions) break piece counting. Recipes need exact quantities and "took hours". Spices, oil and herbs were hard to track. Checking items off the list and booking them into stock conflicted when the bought quantity differed from the plan. Her conclusion: tracking whole packs only, and moving used packs onto the shopping list, gave the same result with far less work. https://www.galaxus.fr/en/page/wie-ich-meinen-kuehlschrankinhalt-digitalisieren-will-und-daran-scheitere-39565 — ALLEGED (single personal account, independent journalist at a retailer's magazine).
- Grocy's feature set (min-stock, shopping list, consume on cooking) was not confirmed from an official page (blocked). The blue-book table of contents lists "Minimum quantities", "Parent products", "On the units", "Doing the inventory review" as concerns, which suggests units and parent products are the pain points: ALLEGED (single, partial).
- Design implication (reasoned, not sourced): what works is minimum-quantity thresholds and an inventory review pass. What is too heavy is a mandatory product master, barcode scanning, and per-gram tracking.

**Complaints and abandonment.** Evidence is weak. The sources are marketing blogs (Member Kitchens, Product Hunt threads, an "Oh a potato" landing page). The only extractable list is a vendor's hypothesis: not enough time to plan and cook, boredom with repeated meals, household members with differing tastes, difficulty turning the plan into shopping: https://www.producthunt.com/p/cookifyai/what-usually-causes-meal-planning-apps-to-fail-after-the-first-few-weeks — ALLEGED, vendor, no replies. Merging failures (above) are the best-documented concrete complaint. A rigorous abandonment study: UNKNOWN. Another fetch returned no article body.

## 2. Delivery tech (facts only)

| Claim | Grade / source |
|---|---|
| Browser storage (IndexedDB, Cache, service worker) shares one quota. `navigator.storage.persist()` requests persistence. If granted, the browser will not evict; users can still clear it. In Chrome the grant is decided by heuristics, one criterion being PWA installation. Page last updated 2022-01-10. | CORROBORATED with the dev.to piece that browser storage is "best-effort", ranks sites by engagement/installation, and persist() is the mitigation: https://web.dev/learn/pwa/offline-data ; https://dev.to/frozenblood/your-web-apps-data-can-disappear-even-if-the-user-never-cleared-it-3ffm |
| Chrome allows up to 80% of disk, 60% per origin. | ALLEGED (single, 2022): web.dev |
| Mobile-specific Android eviction details were not found. | UNKNOWN |
| TWA needs a **live website** with manifest and a Digital Asset Links file at `.well-known/assetlinks.json`, with matching signing key; otherwise it opens as a Custom Tab. Chrome 72+ on Android. Bubblewrap (Node CLI) generates and builds it and can download Java/Android tooling. | CORROBORATED (Chrome docs + npm page found): https://developer.chrome.com/docs/android/trusted-web-activity/quick-start ; https://npmjs.com/package/@bubblewrap/cli (not opened) |
| So a TWA is **not** a fully local APK: it requires hosting the PWA somewhere (GitHub Pages, say). Offline-first TWA guide exists, not opened. | CREDIBLE (inference from the above) |
| Capacitor: `capacitor add android`, copy web build, `./gradlew assembleDebug` yields an APK; release needs jarsigner/zipalign (or Gradle signing). Requires a working JDK + Android SDK. Gradle needs Maven access on the user's machine, which is fine for him. | ALLEGED (forum thread, one source; Capacitor official docs not opened): https://forum.ionicframework.com/t/how-to-build-an-android-apk-file-without-using-android-studio-in-a-capacitor-project/177814 |
| Native Kotlin/Compose + Room built in Android Studio on 64-bit Linux is standard; install guides for Ubuntu exist. System requirements page was blocked. | ALLEGED: https://computingforgeeks.com/install-android-studio-on-ubuntu-linux/ (not opened) |
| Native code cannot be compiled in this build workspace (charter statement). | Charter fact |

Reasoned trade-off (not external fact): the PWA is fully testable here. The data-loss risk is mitigated by persist(), a visible "last export" nag, and JSON export. A Capacitor wrapper stores data in the same WebView storage, so it does not by itself remove eviction risk. UNKNOWN whether Capacitor WebView storage is exempt from eviction.

## 3. Ingredient parsing and units

- **parse-ingredient** (npm, MIT): parses quantity, range (`quantity2`), unit, description; fractions and vulgar fractions; configurable keywords for other languages (German, Spanish, Japanese examples) and decimal commas; `additionalUOMs` for custom units; `convertUnit` between volume/mass/length, returning null across types (cup to gram). Offline behaviour not stated, but it is plain JS. https://cdn.jsdelivr.net/npm/parse-ingredient@2.2.0/README.md — ALLEGED (single, README). No built-in French; "d'oignons" (elision "de/d'") will need a custom pre-processor. Repo health unchecked.
- Other candidates found, none opened: `recipe-ingredient-parser-v3`, `parse-ingredients` (magrinj), `recipes-parser`. Their French support: UNKNOWN.
- Unit normalisation behaviour of Plan to Eat (above) shows what to avoid: merge only when unit families match. Count items ("2 carrots") and mass ("200 g carottes") cannot merge without a per-ingredient average weight. This is a reasoned point supported by the Grocy onion story (ALLEGED, same source as above) and the Plan to Eat potato example.
- Suggested minimal design (reasoned): canonical units g, ml, piece; French aliases (c. à soupe/cs = 15 ml, c. à café/cc = 5 ml, pincée, gousse, botte, boîte); optional per-ingredient piece-weight table for the top ~50 ingredients; a "parse then confirm" preview.

## Still UNKNOWN
Samsung Food, AnyList, Mela details; any app's handling of arbitrary-date planning; Android-specific PWA eviction in 2026; French parser quality; Mealime shutdown confirmation; Grocy official behaviour.
