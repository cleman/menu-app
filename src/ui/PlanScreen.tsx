import { useContext, useMemo, useState } from 'preact/hooks';
import { db } from '../db/db';
import type { PlannedMeal, Recipe, Slot } from '../db/types';
import { diffDays, label, range, short, today } from '../domain/dates';
import { CatCtx, Empty, useLive } from './kit';
import { FillSheet, MealMenu, PeriodDialog, ReviewSheet, SlotPicker } from './PlanSheets';
import { SettingsSheet } from './Settings';

type S = { k: 'slot'; date?: string; slot?: Slot } | { k: 'meal'; id: string } | { k: 'period'; next?: boolean }
  | { k: 'fill' } | { k: 'review' } | { k: 'settings' } | null;

export function PlanScreen({ goList }: { goList: () => void }) {
  useContext(CatCtx);
  const periods = useLive(() => db.periods.orderBy('start').toArray(), []) || [];
  const [pid, setPid] = useState<string | null>(null);
  const t = today();
  const p = periods.find(x => x.id === pid) || periods.find(x => x.start <= t && x.end >= t)
    || periods.find(x => x.start > t) || periods[periods.length - 1];
  const meals = useLive(() => (p ? db.meals.where('periodId').equals(p.id).toArray() : []), [p?.id]) || [];
  const recipeArr = useLive(() => db.recipes.toArray(), []) || [];
  const recipes = useMemo(() => new Map(recipeArr.map(r => [r.id, r])), [recipeArr]);
  const [sheet, setSheet] = useState<S>(null);
  const idx = p ? periods.indexOf(p) : -1;

  const ideas = meals.filter(m => !m.date);
  const notListed = meals.filter(m => m.status === 'planned' && !m.listedAt && !m.leftoverOf && m.recipeId).length;
  const close = () => setSheet(null);

  const sheets = <>
    {sheet?.k === 'slot' && p && <SlotPicker period={p} date={sheet.date} slot={sheet.slot} meals={meals} recipes={recipeArr} onClose={close} />}
    {sheet?.k === 'meal' && <MealMenu meal={meals.find(m => m.id === sheet.id)} recipes={recipes} period={p!} onClose={close} />}
    {sheet?.k === 'period' && <PeriodDialog prev={sheet.next ? p : periods[periods.length - 1]} onDone={np => { setPid(np.id); setSheet(null); }} onClose={close} />}
    {sheet?.k === 'fill' && p && <FillSheet period={p} meals={meals} onClose={close} />}
    {sheet?.k === 'review' && p && <ReviewSheet period={p} meals={meals} recipes={recipes} onNext={() => setSheet({ k: 'period', next: true })} onCreated={np => { setPid(np.id); close(); }} onClose={close} />}
    {sheet?.k === 'settings' && <SettingsSheet onClose={close} />}
  </>;

  if (!p) return <section class="screen">
    <div class="topbar"><h1>Plan</h1><button class="icon" aria-label="Settings" onClick={() => setSheet({ k: 'settings' })}>⚙</button></div>
    <Empty icon="🗓" title="Plan your next meals">
      <p>Pick how many days you want to plan — a week, two weeks, any length.</p>
      <button class="primary" onClick={() => setSheet({ k: 'period' })}>Start a plan</button>
    </Empty>{sheets}</section>;

  const daysLeft = diffDays(t, p.end);
  const ended = p.end < t && !p.reviewedAt;
  const isLast = idx === periods.length - 1;

  return <section class="screen">
    <div class="topbar">
      <button class="icon" aria-label="Previous plan" disabled={idx <= 0} onClick={() => setPid(periods[idx - 1].id)}>‹</button>
      <div class="ptitle"><h1>{short(p.start)} – {short(p.end)}</h1><small>{diffDays(p.start, p.end) + 1} days · {meals.filter(m => m.recipeId || m.label).length} meals</small></div>
      <button class="icon" aria-label="Next plan" disabled={isLast} onClick={() => setPid(periods[idx + 1].id)}>›</button>
      <button class="icon" aria-label="Settings" onClick={() => setSheet({ k: 'settings' })}>⚙</button>
    </div>

    {ended && <div class="cue"><span>This plan is over. How did it go?</span><button class="primary sm" onClick={() => setSheet({ k: 'review' })}>Review & plan next</button></div>}
    {!ended && isLast && daysLeft >= 0 && daysLeft <= 2 && <div class="cue"><span>Plan ends {daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}.</span><button class="primary sm" onClick={() => setSheet({ k: 'review' })}>Plan the next one</button></div>}

    <div class="row gap actions">
      <button class="secondary" onClick={() => setSheet({ k: 'fill' })}>✨ Suggest</button>
      <button class="secondary" disabled={!notListed} onClick={goList}>🛒 List ({notListed})</button>
      {isLast && !ended && <button class="ghost" onClick={() => setSheet({ k: 'period', next: true })}>+ Next plan</button>}
    </div>

    <div class="card ideas">
      <div class="row between"><h3>Ideas · no day yet</h3><button class="link" onClick={() => setSheet({ k: 'slot' })}>+ Add</button></div>
      {ideas.length ? <div class="chips">{ideas.map(m => <MealChip m={m} recipes={recipes} onClick={() => setSheet({ k: 'meal', id: m.id })} />)}</div>
        : <p class="muted">Meals you want to cook this period, without fixing a day.</p>}
    </div>

    {range(p.start, p.end).map(d => <div class={'day' + (d < t ? ' past' : '') + (d === t ? ' today' : '')} id={'d' + d}>
      <div class="dlabel">{d === t ? 'Today' : label(d)}</div>
      {(['lunch', 'dinner'] as Slot[]).map(s => {
        const ms = meals.filter(m => m.date === d && m.slot === s);
        return <div class="slot"><span class="sname">{s === 'lunch' ? 'Lunch' : 'Dinner'}</span>
          <div class="sbody">{ms.map(m => <MealChip m={m} recipes={recipes} onClick={() => setSheet({ k: 'meal', id: m.id })} />)}
            {!ms.length && <button class="add" aria-label={`Add ${s} ${label(d)}`} onClick={() => setSheet({ k: 'slot', date: d, slot: s })}>+</button>}</div></div>;
      })}
    </div>)}
    {sheets}
  </section>;
}

export function MealChip({ m, recipes, onClick }: { m: PlannedMeal; recipes: Map<string, Recipe>; onClick: () => void }) {
  const r = m.recipeId ? recipes.get(m.recipeId) : undefined;
  const title = m.leftoverOf ? `Leftovers: ${r?.title || ''}` : r?.title || m.label || '?';
  return <button class={'meal ' + m.status + (m.leftoverOf ? ' leftover' : '') + (r?.tags.includes('veggie') ? ' veg' : '')} onClick={onClick}>
    {m.status === 'cooked' && <span aria-label="cooked">✓ </span>}{m.status === 'skipped' && <span aria-label="skipped">⤼ </span>}
    <span class="mt">{title}</span>{!!m.extra && <small> +leftovers</small>}</button>;
}
