// Menu → PDF. jsPDF is loaded only when needed (separate chunk). Text only, standard fonts (no emoji).
import type { MenuModel } from '../domain/menuLayout';

export type PdfFormat = 'a4p' | 'a4l' | 'tabl' | 'tabp';
/** Page sizes in mm. "Tablette" = a 16:10 screen, so the page fills the tablet without zooming or scrolling. */
export const PDF_FORMATS: Record<PdfFormat, { label: string; w: number; h: number; cols: number }> = {
  a4p: { label: 'A4 ↕', w: 210, h: 297, cols: 2 },
  a4l: { label: 'A4 ↔', w: 297, h: 210, cols: 4 },
  tabl: { label: 'Tablette ↔', w: 250, h: 156, cols: 4 },
  tabp: { label: 'Tablette ↕', w: 156, h: 250, cols: 2 },
};

/** Standard PDF fonts only cover Latin-1: map the few French characters outside it. */
export const pdfSafe = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
  .replace(/œ/g, 'oe').replace(/Œ/g, 'Oe').replace(/[\u00a0\u202f]/g, ' ').replace(/[^\x09\x0a\x20-\x7e\u00a0-\u00ff]/g, '');

export async function renderMenuPdf(menu: MenuModel, format: PdfFormat) {
  const { jsPDF } = await import('jspdf');
  const F = PDF_FORMATS[format];
  const doc = new jsPDF({ unit: 'mm', format: [F.w, F.h], orientation: F.w > F.h ? 'landscape' : 'portrait' });
  const M = 10, G = 4, PAD = 3, LH = 1.28, PT = 0.3528;          // margin, gutter, cell padding, line height factor, pt → mm
  const colW = (F.w - 2 * M - G * (F.cols - 1)) / F.cols, textW = colW - 2 * PAD;
  const ink: [number, number, number] = [43, 36, 32], mute: [number, number, number] = [122, 110, 102], line: [number, number, number] = [200, 190, 180];
  const lines = (t: string, size: number, w: number, bold = false) => { doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size); return doc.splitTextToSize(pdfSafe(t), w) as string[]; };
  const lh = (size: number) => size * PT * LH;

  // each day cell = a list of text blocks, so height can be measured before drawing
  type Block = { text: string[]; size: number; bold?: boolean; gray?: boolean; gap?: number };
  const dayBlocks = (d: MenuModel['days'][0]): Block[] => {
    const b: Block[] = [{ text: lines(d.label.charAt(0).toUpperCase() + d.label.slice(1), 11, textW, true), size: 11, bold: true, gap: 1.5 }];
    for (const [name, items] of [['MIDI', d.lunch], ['SOIR', d.dinner]] as const) {
      b.push({ text: [name], size: 7, gray: true });
      if (!items.length) b.push({ text: ['-'], size: 10, gray: true, gap: 1.5 });
      items.forEach((t, i) => b.push({ text: lines(t, 10, textW), size: 10, gap: i === items.length - 1 ? 1.5 : 0.5 }));
    }
    if (d.other.length) { b.push({ text: ['AUTRE'], size: 7, gray: true }); d.other.forEach(t => b.push({ text: lines(t, 10, textW), size: 10, gap: 0.5 })); }
    return b;
  };
  const height = (bs: Block[]) => 2 * PAD + bs.reduce((h, x) => h + x.text.length * lh(x.size) + (x.gap || 0), 0);
  const draw = (bs: Block[], x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(...line).setLineWidth(0.3).roundedRect(x, y, w, h, 2, 2);
    let cy = y + PAD;
    for (const b of bs) {
      doc.setFont('helvetica', b.bold ? 'bold' : 'normal').setFontSize(b.size).setTextColor(...(b.gray ? mute : ink));
      for (const l of b.text) { cy += lh(b.size); doc.text(l, x + PAD, cy - lh(b.size) * 0.22); }
      cy += b.gap || 0;
    }
  };

  let y = M;
  const head = (cont: boolean) => {
    doc.setFont('helvetica', 'bold').setFontSize(cont ? 11 : 18).setTextColor(...ink);
    doc.text(pdfSafe(menu.title + (cont ? ' (suite)' : '')), M, y + (cont ? 4 : 6));
    y += cont ? 9 : 12;
  };
  head(false);
  for (let i = 0; i < menu.days.length; i += F.cols) {
    const row = menu.days.slice(i, i + F.cols).map(dayBlocks), rh = Math.max(...row.map(height));
    if (y + rh > F.h - M && y > M + 15) { doc.addPage(); y = M; head(true); }
    row.forEach((bs, c) => draw(bs, M + c * (colW + G), y, colW, rh));
    y += rh + G;
  }
  if (menu.ideas.length) {
    const bs: Block[] = [{ text: lines('Idées · sans jour fixé', 11, F.w - 2 * M - 2 * PAD, true), size: 11, bold: true, gap: 1.5 },
      ...menu.ideas.map(t => ({ text: lines('· ' + t, 10, F.w - 2 * M - 2 * PAD), size: 10, gap: 0.5 }))];
    const h = height(bs);
    if (y + h > F.h - M && y > M + 15) { doc.addPage(); y = M; head(true); }
    draw(bs, M, y, F.w - 2 * M, h);
  }
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...mute); doc.text(`Menu · ${p}/${n}`, F.w - M, F.h - 4, { align: 'right' }); }
  return doc;
}

export async function menuPdfBlob(menu: MenuModel, format: PdfFormat): Promise<Blob> { return (await renderMenuPdf(menu, format)).output('blob'); }
export const menuFileName = (menu: MenuModel) => menu.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
