import { useEffect, useState } from 'preact/hooks';
import { db, getKV, loadCatalogue, seedIfEmpty, setKV, snapshot } from '../db/db';
import type { Catalogue } from '../domain/catalogue';
import { CatCtx, Toaster, useLive } from './kit';
import { PlanScreen } from './PlanScreen';
import { RecipesScreen } from './RecipesScreen';
import { ListScreen } from './ListScreen';
import { StockScreen } from './StockScreen';
import { BackupBanner } from './Settings';

const TABS = [['plan', 'Plan', '🗓'], ['recipes', 'Recipes', '📖'], ['list', 'List', '🛒'], ['stock', 'At home', '🏠']] as const;
type Tab = typeof TABS[number][0];

export function App() {
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [tab, setTab] = useState<Tab>(() => { try { return (localStorage.getItem('tab') as Tab) || 'plan'; } catch { return 'plan'; } });
  const reloadCat = () => loadCatalogue().then(setCat);
  useEffect(() => {
    (async () => {
      const c = await loadCatalogue(); await seedIfEmpty(c);
      if (!(await getKV('firstUse', 0))) await setKV('firstUse', Date.now()); setCat(c); snapshot();
      if (navigator.storage?.persist && !(await getKV('persistAsked', false))) navigator.storage.persist();
    })();
  }, []);
  useEffect(() => { try { localStorage.setItem('tab', tab); } catch { /* private mode */ } }, [tab]);
  const listCount = useLive(() => db.list.filter(i => !i.ticked).count(), []);
  if (!cat) return <div class="loading">Loading…</div>;
  return <CatCtx.Provider value={{ cat, reloadCat }}>
    <main>
      <BackupBanner />
      {tab === 'plan' && <PlanScreen goList={() => setTab('list')} />}
      {tab === 'recipes' && <RecipesScreen />}
      {tab === 'list' && <ListScreen />}
      {tab === 'stock' && <StockScreen />}
    </main>
    <nav class="tabs">
      {TABS.map(([id, label, icon]) => <button class={tab === id ? 'on' : ''} aria-current={tab === id} onClick={() => setTab(id)}>
        <span class="ti">{icon}{id === 'list' && !!listCount && <b class="badge">{listCount}</b>}</span>{label}</button>)}
    </nav>
    <Toaster />
  </CatCtx.Provider>;
}
