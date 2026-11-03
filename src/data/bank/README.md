# Recipe bank — format and rules

One file per theme: `src/data/bank/<theme>.ts` containing only:

```ts
export default `
## Dal de lentilles corail au lait de coco | 4 | 35 | plat;vege;indienne;batch;automne;hiver
- 250 g de lentilles corail
- 1 oignon
- 2 gousses d'ail
- 1 c. à soupe de curry en poudre
- 400 ml de lait de coco
- 1 boîte de tomates concassées
- 200 g de riz basmati
- sel
> Émincer l'oignon et l'ail, les faire revenir 5 min dans un filet d'huile.
> Ajouter le curry, les lentilles rincées, les tomates, le lait de coco et 30 cl d'eau.
> Laisser mijoter 20 min en remuant, saler. Servir avec le riz cuit.
`;
```

Header: `## Titre | portions | minutes (total, prep + cuisson) | tags separated by ;`

## Tags (only these)
- exactly ONE category: `plat` `soupe` `salade` `tarte` (tartes, quiches, pizzas, galettes, cakes salés) `accompagnement` `sauce` `dessert` `petit-dej` (petit-déj & goûter)
- diet/type, any that apply: `vege` (no meat/fish), `viande` (beef, pork, lamb, veal), `volaille`, `poisson` (fish & seafood), `batch` (keeps/reheats/freezes well, makes ≥4), `leger`
- cuisine, one: `francaise` `italienne` `asiatique` `indienne` `orientale` `mexicaine` `monde`
- seasons, only if clearly seasonal: `printemps` `ete` `automne` `hiver` (none = all year)

## Rules
- Write ORIGINAL texts in French (do not copy any website or book). Classic dishes are fine; wording and quantities are yours.
- Realistic home quantities for the stated servings, metric units (g, kg, ml, cl, l, c. à soupe, c. à café, pincée, gousse, boîte, sachet, botte, tranche, pièces as plain numbers).
- One ingredient per `- ` line, written naturally as in a French recipe ("2 carottes", "200 g de lardons fumés", "1 c. à café de cumin", "sel, poivre" is allowed on one line). Put preparation details after a comma: "2 oignons, émincés".
- Every ingredient must be recognised by the catalogue (see validation). Prefer catalogue names. If a genuinely needed ingredient is missing, add it to `src/data/extra/<theme>.ts` (same theme name) as `export default \`id|English|Français|aisle|pieceG|aliases\``, one per line, id unique and not already in `src/data/ingredients.ts` (grep first). Aisles: veg bakery meat fish dairy fresh dry cans spice sweet frozen drinks other.
- 3–7 short steps, each a `> ` line, practical (temperatures, times).
- Variety: different main ingredients, budgets (mostly affordable), difficulty mostly easy, times mostly ≤ 45 min (some long mijotés OK).
- Titles unique across the whole bank.

## Validate (from the repo root) until it passes
`npx vitest run tests/bank.test.ts -t <theme>`
