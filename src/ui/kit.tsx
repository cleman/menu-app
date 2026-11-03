// Small shared UI kit: live queries, toast with Undo, bottom sheet, segmented control, stepper,
// error boundary (a screen must never stay blank), recipe filter bar.
import { Component, createContext, type ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';
import type { Catalogue } from '../domain/catalogue';
import { CATEGORIES, CUISINES, DIETS, type RecipeFilter } from '../domain/recipeText';

export function useLive<T>(fn: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [v, setV] = useState<T | undefined>(undefined);
  useEffect(() => {
    const s = liveQuery(fn).subscribe({ next: setV, error: e => { console.error(e); toast('Erreur de lecture des données : ' + (e?.message || e)); } });
    return () => s.unsubscribe();
  }, deps);
  return v;
}

export const CatCtx = createContext<{ cat: Catalogue; reloadCat: () => void }>(null as any);

// ---- toast (Undo ≥ 8 s, council decision) ----
type T = { msg: string; undo?: () => void; id: number };
let push: (t: T) => void = () => {};
export const toast = (msg: string, undo?: () => unknown) => push({ msg, undo: undo as () => void, id: Date.now() });
export function Toaster() {
  const [t, setT] = useState<T | null>(null);
  useEffect(() => { push = setT; }, []);
  useEffect(() => { if (!t) return; const h = setTimeout(() => setT(null), t.undo ? 8000 : 3000); return () => clearTimeout(h); }, [t]);
  if (!t) return null;
  return <div class="toast" role="status"><span>{t.msg}</span>
    {t.undo && <button class="link" onClick={() => { t.undo!(); setT(null); }}>Annuler</button>}</div>;
}

export class Boundary extends Component<{ children: ComponentChildren; name: string }, { err: Error | null }> {
  state = { err: null as Error | null };
  componentDidCatch(err: Error) { console.error(err); this.setState({ err }); }
  render() {
    if (!this.state.err) return this.props.children;
    return <div class="empty"><div class="big">⚠️</div><h3>Cet écran a rencontré un problème</h3>
      <p class="muted small">{this.props.name} : {this.state.err.message}</p>
      <button class="primary" onClick={() => this.setState({ err: null })}>Réessayer</button>
      <button class="ghost" onClick={() => location.reload()}>Recharger l'app</button></div>;
  }
}

export const Loading = () => <div class="loading small">Chargement…</div>;

export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ComponentChildren; footer?: ComponentChildren }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return <div class="scrim" onClick={e => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-label={title}>
      <header><h2>{title}</h2><button class="icon" aria-label="Fermer" onClick={onClose}>✕</button></header>
      <div class="sheet-body">{children}</div>
      {footer && <div class="sheet-foot">{footer}</div>}
    </div></div>;
}

export function Seg<V extends string>({ value, options, onChange, small }: { value: V; options: [V, string][]; onChange: (v: V) => void; small?: boolean }) {
  return <div class={'seg' + (small ? ' small' : '')} role="radiogroup">
    {options.map(([v, l]) => <button role="radio" aria-checked={v === value} class={v === value ? 'on ' + v : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}

export function Stepper({ value, onChange, min = 1, label }: { value: number; onChange: (n: number) => void; min?: number; label?: string }) {
  return <div class="stepper" aria-label={label}>
    <button aria-label="moins" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
    <span>{value}</span>
    <button aria-label="plus" onClick={() => onChange(value + 1)}>+</button></div>;
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ComponentChildren }) {
  return <div class="empty"><div class="big">{icon}</div><h3>{title}</h3>{children}</div>;
}

const FLAGS: [string, string][] = [['rapide', '⏱ Rapide'], ['saison', '🍂 De saison'], ...DIETS, ...CUISINES];
export const emptyFilter = (cat = ''): RecipeFilter => ({ q: '', cat, flags: [] });

/** Search + category chips + filter chips. Used by the meal picker and the Recipes tab. */
export function FilterBar({ f, set, count }: { f: RecipeFilter; set: (f: RecipeFilter) => void; count: number }) {
  const toggle = (x: string) => set({ ...f, flags: f.flags.includes(x) ? f.flags.filter(y => y !== x) : [...f.flags, x] });
  return <div class="filterbar">
    <input class="search" type="search" placeholder="Chercher une recette ou un ingrédient…" value={f.q} onInput={e => set({ ...f, q: e.currentTarget.value })} />
    <div class="chips scroll" role="group" aria-label="Catégorie">
      <button class={'chip' + (!f.cat ? ' on' : '')} aria-pressed={!f.cat} onClick={() => set({ ...f, cat: '' })}>Tout</button>
      {CATEGORIES.map(([c, l]) => <button class={'chip' + (f.cat === c ? ' on' : '')} aria-pressed={f.cat === c} onClick={() => set({ ...f, cat: f.cat === c ? '' : c })}>{l}</button>)}
    </div>
    <div class="chips scroll" role="group" aria-label="Filtres">
      {FLAGS.map(([x, l]) => <button class={'chip flag' + (f.flags.includes(x) ? ' on' : '')} aria-pressed={f.flags.includes(x)} onClick={() => toggle(x)}>{l}</button>)}
    </div>
    <div class="row between small muted"><span>{count} recette{count > 1 ? 's' : ''}</span>
      {(f.q || f.cat || f.flags.length > 0) && <button class="link sm" onClick={() => set(emptyFilter())}>Effacer les filtres</button>}</div>
  </div>;
}
