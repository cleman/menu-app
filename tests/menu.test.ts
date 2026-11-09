import { it, expect } from 'vitest';
import { buildMenu } from '../src/domain/menuLayout';
import { PDF_FORMATS, pdfSafe, renderMenuPdf, type PdfFormat } from '../src/ui/menuPdf';

const r = (id: string, title: string) => ({ id, title, servings: 2, tags: [], lines: [], steps: '', source: 'user' as const, updatedAt: 1 });
const recipes = new Map([r('a', 'Poulet rôti'), r('b', 'Soupe à l’oignon gratinée')].map(x => [x.id, x]));
const p = { id: 'p', start: '2026-11-09', end: '2026-11-15', createdAt: 1 };
const m = (id: string, o: any) => ({ id, periodId: 'p', servings: 2, status: 'planned' as const, ...o });

it('builds days with midi/soir, restes, ideas, and hides skipped meals', () => {
  const x = buildMenu(p, [m('1', { recipeId: 'a', date: '2026-11-09', slot: 'dinner' }), m('2', { recipeId: 'a', date: '2026-11-10', slot: 'lunch', leftoverOf: '1' }),
    m('3', { label: 'Restaurant', date: '2026-11-11', slot: 'dinner' }), m('4', { recipeId: 'b', date: '2026-11-11', slot: 'lunch', status: 'skipped' }), m('5', { recipeId: 'b' })], recipes);
  expect(x.days).toHaveLength(7); expect(x.title).toMatch(/^Menu du 9 nov\.? au 15 nov\.?$/);
  expect(x.days[0].dinner).toEqual(['Poulet rôti']); expect(x.days[1].lunch).toEqual(['Restes : Poulet rôti']);
  expect(x.days[2].dinner).toEqual(['Restaurant']); expect(x.days[2].lunch).toEqual([]); expect(x.ideas).toEqual(['Soupe à l’oignon gratinée']);
});
it('pdfSafe keeps French accents and replaces what standard fonts lack', () => {
  expect(pdfSafe('Cœur d’artichaut — à l’ail ✓')).toBe("Coeur d'artichaut - à l'ail ");
});
it.each(Object.keys(PDF_FORMATS) as PdfFormat[])('renders a PDF in format %s (long plan paginates)', async f => {
  const days = Array.from({ length: 21 }, (_, i) => ({ date: '2026-11-09', label: `jour ${i + 1}`, lunch: ['Restes : Gratin dauphinois à la crème fraîche et aux champignons'], dinner: ['Poulet rôti', 'Salade'], other: [] }));
  const doc = await renderMenuPdf({ title: 'Menu test', days, ideas: ['Tarte', 'Soupe'] }, f);
  const size = doc.internal.pageSize; expect(Math.round(size.getWidth())).toBe(PDF_FORMATS[f].w); expect(Math.round(size.getHeight())).toBe(PDF_FORMATS[f].h);
  expect(doc.getNumberOfPages()).toBeGreaterThan(f === 'a4l' ? 0 : 1);
});
