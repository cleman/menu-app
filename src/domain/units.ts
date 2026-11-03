// Unit families: quantities merge only inside one family (mass→g, vol→ml, count→pc).
// Other units (can, bunch, clove…) are their own family and merge only with themselves.
export type Family = string;
export interface UnitDef { id: string; family: Family; factor: number }

const U = (id: string, family: Family, factor = 1): UnitDef => ({ id, family, factor });

export const UNITS: Record<string, UnitDef> = {
  g: U('g', 'mass'), kg: U('kg', 'mass', 1000), mg: U('mg', 'mass', 0.001),
  ml: U('ml', 'vol'), cl: U('cl', 'vol', 10), dl: U('dl', 'vol', 100), l: U('l', 'vol', 1000),
  tbsp: U('tbsp', 'vol', 15), tsp: U('tsp', 'vol', 5), cup: U('cup', 'vol', 240),
  pc: U('pc', 'count'),
  can: U('can', 'can'), bunch: U('bunch', 'bunch'), clove: U('clove', 'clove'),
  slice: U('slice', 'slice'), pinch: U('pinch', 'pinch'), handful: U('handful', 'handful'),
  pack: U('pack', 'pack'), jar: U('jar', 'jar'),
};

// Aliases (lowercase, accents removed). Longest match wins in the parser.
export const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gr: 'g', gramme: 'g', grammes: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramme: 'kg', kilogrammes: 'kg', mg: 'mg',
  ml: 'ml', cl: 'cl', dl: 'dl', l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  'c. a soupe': 'tbsp', 'c.a.s': 'tbsp', 'c.a.s.': 'tbsp', cas: 'tbsp', cs: 'tbsp', 'c a s': 'tbsp',
  'cuillere a soupe': 'tbsp', 'cuilleres a soupe': 'tbsp', 'cuil. a soupe': 'tbsp',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  'c. a cafe': 'tsp', 'c.a.c': 'tsp', 'c.a.c.': 'tsp', cac: 'tsp', cc: 'tsp', 'c a c': 'tsp',
  'cuillere a cafe': 'tsp', 'cuilleres a cafe': 'tsp', 'cuil. a cafe': 'tsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  cup: 'cup', cups: 'cup', tasse: 'cup', tasses: 'cup',
  piece: 'pc', pieces: 'pc', pc: 'pc', pcs: 'pc',
  boite: 'can', boites: 'can', can: 'can', cans: 'can', tin: 'can', tins: 'can',
  botte: 'bunch', bottes: 'bunch', bunch: 'bunch', bunches: 'bunch', bouquet: 'bunch',
  gousse: 'clove', gousses: 'clove', clove: 'clove', cloves: 'clove',
  tranche: 'slice', tranches: 'slice', slice: 'slice', slices: 'slice',
  pincee: 'pinch', pincees: 'pinch', pinch: 'pinch', pinches: 'pinch',
  poignee: 'handful', poignees: 'handful', handful: 'handful', handfuls: 'handful',
  sachet: 'pack', sachets: 'pack', paquet: 'pack', paquets: 'pack', pack: 'pack', packs: 'pack',
  pot: 'jar', pots: 'jar', jar: 'jar', jars: 'jar', bocal: 'jar',
};

export const unitDef = (u?: string | null): UnitDef => UNITS[u || 'pc'] || UNITS.pc;

export function toBase(qty: number, unit?: string | null): { qty: number; family: Family } {
  const d = unitDef(unit);
  return { qty: qty * d.factor, family: d.family };
}

export const baseUnit = (family: Family): string =>
  family === 'mass' ? 'g' : family === 'vol' ? 'ml' : family === 'count' ? 'pc' : family;

/** Round up to amounts you can actually buy. */
export function roundUp(qty: number, family: Family): number {
  if (family === 'mass' || family === 'vol') {
    const step = family === 'vol' && qty < 60 ? 5 : qty < 100 ? 10 : qty <= 500 ? 50 : 100;
    return Math.ceil(qty / step - 1e-9) * step;
  }
  return Math.ceil(qty - 1e-9);
}

const LABEL: Record<string, [string, string]> = {
  tbsp: ['c. à s.', 'c. à s.'], tsp: ['c. à c.', 'c. à c.'], cup: ['tasse', 'tasses'], can: ['boîte', 'boîtes'],
  bunch: ['botte', 'bottes'], clove: ['gousse', 'gousses'], slice: ['tranche', 'tranches'], pinch: ['pincée', 'pincées'],
  handful: ['poignée', 'poignées'], pack: ['sachet', 'sachets'], jar: ['pot', 'pots'],
};
export const unitLabel = (u: string, plural = false) => LABEL[u]?.[plural ? 1 : 0] ?? u;

/** French display: "1,5 kg", "2 c. à s.", "3 gousses". */
export function formatQty(qty: number | null | undefined, unit?: string | null): string {
  if (qty == null || !isFinite(qty)) return '';
  let q = qty, u = unit || '';
  if (u === 'g' && q >= 1000) { q = q / 1000; u = 'kg'; }
  if (u === 'ml' && q >= 1000) { q = q / 1000; u = 'l'; }
  if (u === 'ml' && q > 0 && q < 60) {           // small volumes read better as spoons
    if (q % 15 === 0) { q = q / 15; u = 'tbsp'; } else if (q % 5 === 0) { q = q / 5; u = 'tsp'; }
  }
  const n = (Number.isInteger(q) ? String(q) : q.toFixed(q < 10 ? 2 : 1).replace(/\.?0+$/, '')).replace('.', ',');
  if (u === 'pc' || !u) return n;
  return `${n} ${unitLabel(u, q > 1)}`;
}

/** Units offered when editing a size in the cart. */
export const EDIT_UNITS: [string, string][] = [['pc', 'pièce(s)'], ['g', 'g'], ['kg', 'kg'], ['ml', 'ml'], ['cl', 'cl'], ['l', 'l'],
  ['pack', 'sachet/paquet'], ['can', 'boîte'], ['jar', 'pot'], ['bunch', 'botte']];
