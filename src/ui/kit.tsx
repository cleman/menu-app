// Small shared UI kit: live queries, toast with Undo, bottom sheet, segmented control, stepper.
import { createContext, type ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';
import type { Catalogue } from '../domain/catalogue';

export function useLive<T>(fn: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [v, setV] = useState<T | undefined>(undefined);
  useEffect(() => { const s = liveQuery(fn).subscribe({ next: setV, error: console.error }); return () => s.unsubscribe(); }, deps);
  return v;
}

export const CatCtx = createContext<{ cat: Catalogue; reloadCat: () => void }>(null as any);

// ---- toast (Undo ≥ 8 s, council decision) ----
type T = { msg: string; undo?: () => void; id: number };
let push: (t: T) => void = () => {};
export const toast = (msg: string, undo?: () => void) => push({ msg, undo, id: Date.now() });
export function Toaster() {
  const [t, setT] = useState<T | null>(null);
  useEffect(() => { push = setT; }, []);
  useEffect(() => { if (!t) return; const h = setTimeout(() => setT(null), t.undo ? 8000 : 3000); return () => clearTimeout(h); }, [t]);
  if (!t) return null;
  return <div class="toast" role="status"><span>{t.msg}</span>
    {t.undo && <button class="link" onClick={() => { t.undo!(); setT(null); }}>Undo</button>}</div>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return <div class="scrim" onClick={e => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-label={title}>
      <header><h2>{title}</h2><button class="icon" aria-label="Close" onClick={onClose}>✕</button></header>
      <div class="sheet-body">{children}</div>
    </div></div>;
}

export function Seg<V extends string>({ value, options, onChange, small }: { value: V; options: [V, string][]; onChange: (v: V) => void; small?: boolean }) {
  return <div class={'seg' + (small ? ' small' : '')} role="radiogroup">
    {options.map(([v, l]) => <button role="radio" aria-checked={v === value} class={v === value ? 'on ' + v : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}

export function Stepper({ value, onChange, min = 1, label }: { value: number; onChange: (n: number) => void; min?: number; label?: string }) {
  return <div class="stepper" aria-label={label}>
    <button aria-label="less" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
    <span>{value}</span>
    <button aria-label="more" onClick={() => onChange(value + 1)}>+</button></div>;
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ComponentChildren }) {
  return <div class="empty"><div class="big">{icon}</div><h3>{title}</h3>{children}</div>;
}
