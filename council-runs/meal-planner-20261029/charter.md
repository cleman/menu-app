# COUNCIL CHARTER — Personal meal-planner app (2026-10-29)

## Question
Design (then build) a personal Android meal-planning app: a library of proposed recipes, a menu
calendar to which recipes are added for a NON-FIXED period (typically ~2 weeks, any start/end),
and an automatically generated shopping list. It must be easy and pleasant enough to be used for
real. The user's goal: "retake control of my meals".
Reader: single adult user, builds the app for himself, lives in France (Grand Est), technical
enough to follow a dev project; writes in English. Unknowns to cover: household size (1 or more),
cooking skill, whether he batch-cooks, which store(s).
Reader language: English. Today: 2026-10-29.

## Mode
Design / Build. Artifact: the app's product + technical spec (MVP scope, screens & flows, data
model, shopping-list algorithm, delivery/tech choice, build order). Acceptance criteria:
criteria.md.

## User additions (2026-10-29 16:36)
- HOME STOCK / PANTRY: the app must know what the user still has at home before shopping, and the
  shopping list = needs of the planned meals − what is already in stock. Stock must be quick to
  update (e.g. a pre-shopping "check what I have" pass), and ideally decrease when meals are cooked.
- The user's computer runs Ubuntu (he can install Android Studio / build tools himself).

## Delivery question (council must decide)
The build workspace CANNOT reach Google Maven / Gradle / Android SDK servers (only npm/PyPI/GitHub).
Options: (a) installable offline web app (PWA) — fully buildable and testable here, installs on
Android home screen, later wrappable to APK (Capacitor/TWA) on the user's machine; (b) native
Kotlin/Jetpack Compose source the user compiles in Android Studio — cannot be compiled or tested
here; (c) other. Recommend one, with reasons and the case against.

## Expert domains
Meal-planning behaviour & UX — source bases: (1) research (meal planning, food waste, home cooking
habits, behaviour change); (2) field (existing apps: Jow, Mealime, Paprika, Plan to Eat,
AnyList, Samsung Food/Whisk, Mela… their features and user reviews/complaints).
Two-source rule applies to every claim.

## Quality rules (binding)
Follow /root/council/references/quality-charter.md. Run-specific:
1. Easy-to-use beats feature-rich. Every feature must justify its tap cost. MVP must be small.
2. No calorie/diet enforcement by default ("control" ≠ restriction); keep it a planning tool.
3. Method note: research uses web search; cite URLs. Single-source claims are ALLEGED.
4. TOKEN ECONOMY (user request): write concisely; respect your word cap; read only the files
   named in your prompt; never paste whole files back.

## Seats (critics of the design)
- **Contrarian** — how does this fail or get abandoned after 2 weeks?
- **First Principles** — what is the app really for? what is essential?
- **Expansionist** — what would make it remarkably better (evidence required)?
- **Outsider** — can tired-me at 7pm use it unaided, in ≤ 3 taps?
- **Executor** — can one person build and maintain it? in what order?
- **Habit & nutrition coach** (specialist) — does it actually change eating habits sustainably?

## Configuration (approved)
Level: Standard. Mode: Design/Build. Research: 1 brief. Experts: 1 domain × 2.
Build: architect v1 → 6 seat critiques (parallel) → rebuttal → architect v2 → chairman + light
acceptance check. Fact desk: on request. Outputs: spec v2, MAP.md, report, transcript. Then dev.
