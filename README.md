# Menu — personal meal planner

Plan meals for **any period** (1 week, 2 weeks, 10 days…), pick from your recipes, and get a **shopping list that already removes what you have at home**. Offline, no account, your data stays on your phone.

**Plan** · days with Lunch/Dinner + an "Ideas" pool (meals without a fixed day) · ✨ Suggest fills empty dinners (not eaten lately, uses what you have, about half veggie, seasonal) · leftovers · copy a previous plan · end-of-plan review → next plan in one tap.
**Recipes** · 15 starters · paste ingredients in French or English, they're recognised (`200 g d'oignons`, `1 c. à soupe d'huile`, `sel, poivre`).
**List** · quantities merged across recipes, grouped by aisle · "Check what I have first" (Have / Low / Out) · share as text · "Done shopping" puts bought items into At home.
**At home** · rough stock: Have / Low / Out, quantities only when you know them, ★ staples (salt, oil…) never on the list.

## Install on your Android phone (from Ubuntu)

```bash
# 1. once: Node 22
sudo apt install -y curl && curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
# 2. try it on your computer
npm install
npm test
npm run dev          # opens http://localhost:5173 ; your phone on the same Wi-Fi can open http://<pc-ip>:5173
```

To keep it on your phone for good, host it (free) on GitHub Pages:

1. Create an empty GitHub repo (e.g. `menu`) and push this folder:
   `git remote add origin git@github.com:<you>/menu.git && git push -u origin main`
2. On GitHub: **Settings → Pages → Source: GitHub Actions**. The included workflow tests, builds and publishes on every push.
3. On the phone, open `https://<you>.github.io/menu/` in **Chrome** → menu ⋮ → **Install app** (or "Add to home screen").
4. It now opens like an app and works offline.

**Your data lives only on the phone.** Settings (⚙ on Plan) → *Save backup file* every week or two; the app reminds you. *Restore from file* brings it back on any device.

Optional later: wrap as an APK with Capacitor (only if Chrome ever clears the app's storage).

## For developers
See `MAP.md` (project mind map) and `CLAUDE.md`. Design rationale: the council report in `council-runs/`.
