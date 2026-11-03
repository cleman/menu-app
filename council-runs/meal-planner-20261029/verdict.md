# Personal meal-planner app — v2 (spec verdict)

Method: Standard council, Design/Build. One research brief, two experts, six seat critiques, one rebuttal, spec v2. Grades: CORROBORATED, CREDIBLE, ALLEGED, UNKNOWN. Sources were read through a summarising fetch tool, so nothing is VERIFIED; CORROBORATED is the ceiling. Acceptance is checked against the spec only: nothing is built yet.

## The 60-second version

- **Build:** a small offline-first Android app around one loop: recipe, plan, list, cook. Free-date menu periods, paste-in recipes, an aisle-grouped list, later home stock. No calories, streaks or accounts. Spec: `design-v2.md`.
- **Delivery:** an installable web app (PWA) on GitHub Pages, installed from Chrome. It is the only option buildable and testable here; native Kotlin cannot be compiled here. An APK wrapper (Capacitor) is conditional on eviction or install trouble. All six seats agreed.
- **v0.1 (M0–M4):** recipes with paste parsing, 15 starters, periods with Lunch/Dinner and an "Ideas" pool, aisle list with ticks and always-have exclusions, text share, JSON backup with 3 snapshots, Pages install.
- **Gate:** use v0.1 for one real period before building stock, leftovers, suggestions and review (M5–M7). Stock (C4b) is delayed, not dropped.
- **First step:** build M0 and M0b (scaffold plus Pages deploy), install the empty shell on your phone, check the storage badge.

## 1. Acceptance check (spec only)

| Criterion | Rating | Note |
|---|---|---|
| C1 Plan 2 weeks in under 10 min, free dates | Partly | Free dates and 3-tap presets specified. Timing unmeasured. |
| C2 Add in 3 taps or fewer; copy period | Met | 2 taps (3 with search); copy adds 2. |
| C3 List from any range, merged, normalised | Met | Merge by ingredient and unit family; unmatched lines merge on raw text with a badge. |
| C4 Aisles, ticks, excludable items | Met | Fixed French aisle order; your store's order is open. |
| C4b Stock subtracted from needs | Partly | Quantity-aware only where a quantity is entered; "Have" without quantity goes to a visible Skipped group. The under-2-minute check (about 5–8 taps) is unmeasured. Cook-deduct is off by default. Ships after the gate. |
| C5 Servings scale; leftovers | Met | At M6, after the gate. |
| C6 Pasted text parsed | Partly | FR/EN parser, exact aliases only. Real accuracy on French recipes UNKNOWN. |
| C7 Tagged starter library | Met | 15 growing to 25, about half veggie. |
| C8 Offline, no account, no server | Met | Pages serves code only, not data. First install needs a network. |
| C9 JSON export/import, nothing lost | Partly | Export, 3 snapshots, banner specified. Browser storage is best-effort; Android eviction UNKNOWN. |
| C10 Cooked vs planned, variety | Met | Period-end review at M7, no calories. |
| C11 One-handed, dark mode | Met | Bottom-third actions, 48 px targets. Untested on a phone. |
| C12 Choices cite sources | Partly | Every choice cites a critic, expert or brief section, but many underlying facts are ALLEGED. |

## 2. Key decisions and dissent

| Decision | Disagreement | Resolution |
|---|---|---|
| Thin v0.1 plus gate | Executor and First Principles wanted a smaller first release. | Accepted: the loop is complete at M4. |
| Keep quantity-aware subtraction | First Principles wanted it deferred and C4b amended. Contrarian, Expansionist, Outsider: an under-counted list over-buys and loses trust. | Kept, since you approved C4b. Complexity cut elsewhere: no re-ask, no adaptive intervals, one Have/Low/Out vocabulary. |
| Cook-deduct | Contrarian, First Principles, Executor: cut. | Opt-in, off by default; C4b says only "can". |
| Hide or show stock | Plan to Eat's pantry hid needed items (ALLEGED). | Never hide: visible Skipped group, one-tap re-add, 30-day "Check these". |
| Backup nag | Contrarian: non-dismissible. Coach, Executor: coercion causes abandonment. | Dismissible, returns daily after 7 days. Chairman sides with the majority; snapshots cover sudden loss. |
| APK timing | Contrarian wanted it early, then withdrew. | Conditional. Capacitor's storage is separate from Chrome's, so switching means a JSON move. |
| Leftovers | Executor: bare pseudo-recipe. | Model kept; C5 needs the dish and portions. |

### The honest case against building an app at all

No seat proposed an existing app (all answered "no reframe") and the research never tested it. This case is the chairman's, so it is less stress-tested.

- **For Jow, KitchenOwl, Mealie, Paprika:** the core loop exists, polished. Trying one takes an evening; building takes weeks. Jow reviewers praise auto lists and lower mental load (ALLEGED: partial Trustpilot sample). Mealie and Tandoor have calendars and merged lists (ALLEGED: one comparison site). Paprika has a calendar and pantry (ALLEGED: vendor blog). KitchenOwl: UNKNOWN. Whether any app handles "any start/end, then list" well: UNKNOWN.
- **Against that:** Jow is built around retailer carts, so it may not suit your own recipes or stock. Self-hosted tools need a server. Paid apps draw price and rigidity complaints (CREDIBLE).
- **Verdict:** building is still reasonable as a personal project, since your approved criteria (free periods, own stock, offline) are only partly documented elsewhere. That rests on an unverified gap. **Cheap hedge:** spend one evening on Jow and Mealie or KitchenOwl before M1. If one meets C1–C4, the council would not argue for building.

## 3. Facts graded

| Fact | Grade | Note |
|---|---|---|
| Browser storage is best-effort; `persist()` helps, install favours the grant | CORROBORATED | Chrome and web.dev plus dev.to (2022 pages) |
| Android-specific eviction in 2026 | UNKNOWN | Not found |
| A TWA needs a live hosted site | CORROBORATED | Chrome docs and npm page |
| Capacitor builds an APK on Ubuntu | ALLEGED | One forum thread |
| Exact-quantity inventory gets abandoned | CORROBORATED | Three independent origins |
| Plan to Eat merges poorly across wording and units | ALLEGED | Vendor help page |
| Aisle-grouped auto lists are valued | CREDIBLE | iOS review samples |
| Use-it-up planning effect | UNKNOWN | No local effect size |
| Mealime shutdown 21 Oct 2026 | ALLEGED | Single source |
| Real C1 and C4b timings | UNKNOWN | Need your first period |

Leanings: Plan to Eat and Paprika pages are vendor or competitor; Trustpilot is user-generated and partial; comparison pages are commercial or self-hosting enthusiasts. Expert A is US/Australian academic with no usability data for this case. Expert B skews iOS/US, with no Play Store or French apps sampled.

## 4. Risks

- **Data loss:** high severity, unknown likelihood. Mitigation: `persist()`, badge, snapshots, one Drive export on day one.
- **Abandonment after about two weeks:** the main, likely risk. Mitigation: thin v0.1, Move/Skip, planning cue, no shaming.
- **Stock drift:** wrong stock hides items. Mitigation: visible Skipped group.
- **Parser or catalogue misses:** list looks wrong. Mitigation: unmatched badge, create-from-preview, CI seed validator.
- **One-person maintenance:** tests only on four modules plus one smoke test.

## 5. Open questions for you

1. Will you try Jow or another existing app against C1–C4 for one evening before M1?
2. Which store do you use (sets aisle order), and should the UI be English, French or both?
3. How many people eat, and do you batch-cook?
4. Will you treat the gate as binding: one real period on v0.1, then decide?

## 6. Glossary

- **PWA:** web app installable on the home screen, works offline.
- **TWA:** Android wrapper opening a hosted PWA full screen.
- **Capacitor:** tool that packages a web app as an APK.
- **APK:** Android install file.
- **Eviction:** the browser deleting stored data to free space.
- **CI:** automated checks on each code push.
- **M0–M8:** build milestones. **Gate:** pause after M4 for one real period of use.

## Self-check (internal, same process, not independent)

- Grading and ceiling stated. C12 is Partly because citations lean on ALLEGED sources.
- No required design change rests on a single source. Capacitor details are ALLEGED and kept conditional.
- Vendor, competitor and user-generated sources are tagged.
- Status quo is included but chairman-written, so less tested.
- Advice is conditional on your goals; no impact claims invented (waste and habit effects UNKNOWN).
- Weaknesses: acceptance is spec-only, C1 and C4b timings are untested, and primary sources were not reopened.
