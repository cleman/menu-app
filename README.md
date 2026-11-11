# Menu — personal meal planner

Plan meals for **any period** (1 week, 2 weeks, 10 days…), pick from your recipes, and get a **shopping list that already removes what you have at home**. Offline, no account, your data stays on your phone.

**Plan** · jours avec midi/soir + des « Idées » (plats sans jour fixé, sélection multiple avec filtres) · ✨ Proposer remplit les dîners libres · restes · copier un plan · bilan de fin de plan.
**Recettes** · ~300 recettes françaises (plats, végé, poisson, monde, pâtes/tartes, soupes, salades, desserts, petit-déj) · filtres par catégorie, régime, cuisine, rapide, saison · coller une recette entière ou la partager depuis Chrome.
**Courses** · 1) *À prévoir* : ingrédients des repas moins ce que vous avez, décochez ce que vous ne voulez pas · 2) *Panier* : cochez ce que vous achetez vraiment, indiquez la taille du paquet, retirez · 3) *Ranger* → Maison.
**Maison** · stock approximatif : J'ai / Peu / Plus, quantité si connue, ★ basiques (sel, huile…) jamais dans les courses.

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

**Menu** · page « 📄 Menu » dans Plan : le menu du plan en grille lisible (téléphone, tablette) + export PDF (A4 ↕↔, Tablette ↔↕). **Sauvegarde** · restaurer un fichier = *Fusionner* (ajoute, rien n'est supprimé) ou *Remplacer*.
**Synchronisation** · Réglages → 🔄 Synchronisation : plusieurs appareils (téléphone, tablette) avec les mêmes données, par échange d'un fichier (Partage à proximité / Bluetooth / Wi-Fi Direct), sans compte. Un appareil « chef » l'emporte en cas de désaccord sur une même donnée ; l'autre version est gardée et restaurable.
**Synchro en direct** · Réglages → Synchronisation → 📡 : deux QR codes (ou deux textes copiés) connectent directement les appareils par le Wi-Fi, sans serveur ni fichier. Sinon : fichier .txt, ou « Copier un code » / « Coller un code ».
