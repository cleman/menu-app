import { useMemo, useState } from 'preact/hooks';
import { db } from '../db/db';
import type { PlannedMeal, Recipe, Slot } from '../db/types';
import { diffDays, label, range, short, today } from '../domain/dates';
import { Empty, Loading, useLive } from './kit';
import { FillSheet, MealMenu, PeriodDialog, ReviewSheet, SlotPicker } from './PlanSheets';
import { SettingsSheet } from './Settings';
import { MenuView } from './MenuView';

type S = { k: 'slot'; date?: string; slot?: Slot } | { k: 'meal'; id: string } | { k: 'period'; next?: boolean }
  | { k: 'fill' } | { k: 'review' } | { k: 'settings' } | { k: 'menu' } | null;

export function PlanScreen({ goList }: { goList: () => void }) {
  const periods = useLive(() => db.periods.orderBy('start').toArray(), []);
  const [pid, setPid] = useState<string | null>(null);
  const t = today();
  const ps = periods || [];
  const p = ps.find(x => x.id === pid) || ps.find(x => x.start <= t && x.end >= t) || ps.find(x => x.start > t) || ps[ps.length - 1];
  const meals = useLive(() => (p ? db.meals.where('periodId').equals(p.id).toArray() : []), [p?.id]) || [];
  const recipeArr = useLive(() => db.recipes.toArray(), []);
  const recipes = useMemo(() => new Map((recipeArr || []).map(r => [r.id, r])), [recipeArr]);
  const [sheet, setSheet] = useState<S>(null);
  const close = () => setSheet(null);
  if (!periods || !recipeArr) return <section class="screen"><div class="topbar"><h1>Plan</h1></div><Loading /></section>;

  const idx = p ? ps.indexOf(p) : -1;
  const ideas = meals.filter(m => !m.date);
  const notListed = meals.filter(m => m.status === 'planned' && !m.listedAt && !m.leftoverOf && m.recipeId).length;

  const sheets = <>
    {sheet?.k === 'slot' && p && <SlotPicker period={p} date={sheet.date} slot={sheet.slot} meals={meals} recipes={recipeArr} onClose={close} />}
    {sheet?.k === 'meal' && p && <MealMenu meal={meals.find(m => m.id === sheet.id)} recipes={recipes} period={p} onClose={close} />}
    {sheet?.k === 'period' && <PeriodDialog prev={sheet.next ? p : ps[ps.length - 1]} onDone={np => { setPid(np.id); close(); }} onClose={close} />}
    {sheet?.k === 'fill' && p && <FillSheet period={p} meals={meals} onClose={close} />}
    {sheet?.k === 'review' && p && <ReviewSheet period={p} meals={meals} recipes={recipes} onNext={() => setSheet({ k: 'period', next: true })} onCreated={np => { setPid(np.id); close(); }} onClose={close} />}
    {sheet?.k === 'settings' && <SettingsSheet onClose={close} />}
    {sheet?.k === 'menu' && p && <MenuView period={p} meals={meals} recipes={recipes} onClose={close} />}
  </>;

  if (!p) return <><section class="screen">
    <div class="topbar"><h1>Plan</h1><button class="icon" aria-label="Réglages" onClick={() => setSheet({ k: 'settings' })}>⚙</button></div>
    <Empty icon="🗓" title="Planifiez vos prochains repas">
      <p>Choisissez combien de jours planifier : une semaine, deux, ou la durée que vous voulez.</p>
      <button class="primary" onClick={() => setSheet({ k: 'period' })}>Commencer un plan</button>
    </Empty></section>{sheets}</>;

  const daysLeft = diffDays(t, p.end);
  const ended = p.end < t && !p.reviewedAt;
  const isLast = idx === ps.length - 1;

  return <><section class="screen">
    <div class="topbar">
      <button class="icon" aria-label="Plan précédent" disabled={idx <= 0} onClick={() => setPid(ps[idx - 1].id)}>‹</button>
      <div class="ptitle"><h1>{short(p.start)} – {short(p.end)}</h1><small>{diffDays(p.start, p.end) + 1} jours · {meals.filter(m => m.recipeId || m.label).length} repas</small></div>
      <button class="icon" aria-label="Plan suivant" disabled={isLast} onClick={() => setPid(ps[idx + 1].id)}>›</button>
      <button class="icon" aria-label="Réglages" onClick={() => setSheet({ k: 'settings' })}>⚙</button>
    </div>

    {ended && <div class="cue"><span>Ce plan est terminé. Comment ça s'est passé ?</span><button class="primary sm" onClick={() => setSheet({ k: 'review' })}>Bilan & plan suivant</button></div>}
    {!ended && isLast && daysLeft >= 0 && daysLeft <= 2 && <div class="cue"><span>Le plan se termine {daysLeft === 0 ? "aujourd'hui" : `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}.</span><button class="primary sm" onClick={() => setSheet({ k: 'review' })}>Préparer le suivant</button></div>}

    <div class="row gap actions">
      <button class="secondary" onClick={() => setSheet({ k: 'fill' })}>✨ Proposer</button>
      <button class="secondary" onClick={() => setSheet({ k: 'menu' })}>📄 Menu</button>
      <button class="secondary" disabled={!notListed} onClick={goList}>🛒 Courses ({notListed})</button>
      {isLast && !ended && <button class="ghost" onClick={() => setSheet({ k: 'period', next: true })}>+ Plan suivant</button>}
    </div>

    <div class="card ideas">
      <div class="row between"><h3>Idées · sans jour fixé</h3><button class="link" onClick={() => setSheet({ k: 'slot' })}>+ Ajouter</button></div>
      {ideas.length ? <div class="chips">{ideas.map(m => <MealChip m={m} recipes={recipes} onClick={() => setSheet({ k: 'meal', id: m.id })} />)}</div>
        : <p class="muted">Les plats que vous voulez cuisiner pendant ce plan, sans choisir le jour.</p>}
    </div>

    {range(p.start, p.end).map(d => <div class={'day' + (d < t ? ' past' : '') + (d === t ? ' today' : '')} id={'d' + d}>
      <div class="dlabel">{d === t ? "Aujourd'hui" : label(d)}</div>
      {(['lunch', 'dinner'] as Slot[]).map(s => {
        const ms = meals.filter(m => m.date === d && m.slot === s);
        return <div class="slot"><span class="sname">{s === 'lunch' ? 'Midi' : 'Soir'}</span>
          <div class="sbody">{ms.map(m => <MealChip m={m} recipes={recipes} onClick={() => setSheet({ k: 'meal', id: m.id })} />)}
            {!ms.length && <button class="add" aria-label={`Ajouter ${s === 'lunch' ? 'midi' : 'soir'} ${label(d)}`} onClick={() => setSheet({ k: 'slot', date: d, slot: s })}>+</button>}</div></div>;
      })}
    </div>)}
  </section>{sheets}</>;
}

export function MealChip({ m, recipes, onClick }: { m: PlannedMeal; recipes: Map<string, Recipe>; onClick: () => void }) {
  const r = m.recipeId ? recipes.get(m.recipeId) : undefined;
  const title = m.leftoverOf ? `Restes : ${r?.title || ''}` : r?.title || m.label || '?';
  return <button class={'meal ' + m.status + (m.leftoverOf ? ' leftover' : '') + (r?.tags.includes('vege') ? ' veg' : '')} onClick={onClick}>
    {m.status === 'cooked' && <span aria-label="cuisiné">✓ </span>}{m.status === 'skipped' && <span aria-label="pas fait">⤼ </span>}
    <span class="mt">{title}</span>{!!m.extra && <small> +restes</small>}</button>;
}
