import { useMemo, useState } from 'preact/hooks';
import type { PlannedMeal, Period, Recipe } from '../db/types';
import { getKV, setKV } from '../db/db';
import { buildMenu } from '../domain/menuLayout';
import { PDF_FORMATS, menuFileName, menuPdfBlob, type PdfFormat } from './menuPdf';
import { Seg, toast, useLive } from './kit';

/** Full-screen, read-only menu of a plan. Grid adapts to the screen (phone: 1 column, tablet: several). */
export function MenuView({ period, meals, recipes, onClose }: { period: Period; meals: PlannedMeal[]; recipes: Map<string, Recipe>; onClose: () => void }) {
  const menu = useMemo(() => buildMenu(period, meals, recipes), [period, meals, recipes]);
  const saved = useLive(() => getKV<PdfFormat>('pdfFormat', 'a4p'), []);
  const [fmt, setFmt] = useState<PdfFormat | null>(null);
  const [busy, setBusy] = useState(false);
  const f = fmt || saved || 'a4p';
  const pick = (v: PdfFormat) => { setFmt(v); setKV('pdfFormat', v); };

  const make = async (share: boolean) => {
    setBusy(true);
    try {
      const blob = await menuPdfBlob(menu, f), name = menuFileName(menu);
      const file = new File([blob], name, { type: 'application/pdf' });
      if (share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: menu.title }); }
      else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('PDF enregistré dans Téléchargements');
      }
    } catch (e: any) { if (e?.name !== 'AbortError') toast('PDF impossible : ' + (e?.message || e)); }
    setBusy(false);
  };

  const slot = (name: string, items: string[]) => <div class="mslot"><span class="sname">{name}</span>
    <div>{items.length ? items.map(t => <div class="mtitle">{t}</div>) : <span class="muted">–</span>}</div></div>;
  return <div class="menupage" role="dialog" aria-label={menu.title}>
    <div class="topbar"><button class="icon" aria-label="Retour" onClick={onClose}>‹</button><div class="ptitle"><h1>{menu.title}</h1></div></div>
    <div class="mgrid">
      {menu.days.map(d => <div class="mday"><div class="dlabel">{d.label}</div>{slot('Midi', d.lunch)}{slot('Soir', d.dinner)}
        {d.other.length > 0 && slot('Autre', d.other)}</div>)}
    </div>
    {menu.ideas.length > 0 && <div class="card"><h3>Idées · sans jour fixé</h3><ul class="mideas">{menu.ideas.map(t => <li>{t}</li>)}</ul></div>}
    <div class="menufoot">
      <Seg small value={f} options={(Object.keys(PDF_FORMATS) as PdfFormat[]).map(k => [k, PDF_FORMATS[k].label] as [PdfFormat, string])} onChange={pick} />
      <div class="row gap wrap"><button class="primary" disabled={busy} onClick={() => make(false)}>{busy ? 'Création…' : '📄 Télécharger le PDF'}</button>
        {!!navigator.canShare && <button class="secondary" disabled={busy} onClick={() => make(true)}>Partager</button>}</div>
    </div>
  </div>;
}
