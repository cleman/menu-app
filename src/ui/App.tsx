import { useEffect, useState } from 'preact/hooks';
import { db, getKV, loadCatalogue, seedIfEmpty, setKV, snapshot } from '../db/db';
import type { Catalogue } from '../domain/catalogue';
import { parseFreeText, parseJsonLdRecipe, type RecipeDraft } from '../domain/recipeText';
import { Boundary, CatCtx, Toaster, toast, useLive } from './kit';
import { PlanScreen } from './PlanScreen';
import { RecipesScreen } from './RecipesScreen';
import { ListScreen } from './ListScreen';
import { StockScreen } from './StockScreen';
import { BackupBanner, Welcome } from './Settings';

const TABS = [['plan', 'Plan', '🗓'], ['recipes', 'Recettes', '📖'], ['list', 'Courses', '🛒'], ['stock', 'Maison', '🏠']] as const;
type Tab = typeof TABS[number][0];

/** Text shared from Chrome (manifest share_target, GET ?title=&text=&url=). */
async function readShare(cat: Catalogue): Promise<RecipeDraft | null> {
  const p = new URLSearchParams(location.search);
  if (!p.has('share')) return null;
  history.replaceState(null, '', location.pathname);
  const title = p.get('title') || '', text = p.get('text') || '';
  const url = p.get('url') || text.match(/https?:\/\/\S+/)?.[0] || '';
  const body = text.replace(url, '').trim();
  if (body.split('\n').length >= 3) return parseFreeText((title ? title + '\n' : '') + body, cat);
  if (url) {
    try { const html = await (await fetch(url)).text(); const d = parseJsonLdRecipe(html); if (d) return d; } catch { /* site blocks reading */ }
    toast('Ce site ne laisse pas lire la recette. Sélectionnez son texte dans Chrome, puis Partager → Menu.');
  }
  return { title: title || body || 'Nouvelle recette', servings: 4, tags: [], ingredients: [], steps: [] };
}

export function App() {
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [tab, setTab] = useState<Tab>(() => { try { return (localStorage.getItem('tab') as Tab) || 'plan'; } catch { return 'plan'; } });
  const [shared, setShared] = useState<RecipeDraft | null>(null);
  const [welcome, setWelcome] = useState(false);
  const reloadCat = () => loadCatalogue().then(setCat);
  useEffect(() => {
    (async () => {
      const c = await loadCatalogue(); await seedIfEmpty(c);
      if (!(await getKV('firstUse', 0))) await setKV('firstUse', Date.now());
      setCat(c); snapshot();
      if (!(await getKV('onboarded', false))) setWelcome(true);
      const d = await readShare(c); if (d) { setShared(d); setTab('recipes'); }
      navigator.storage?.persist?.();
    })().catch(e => { console.error(e); alert('Erreur au démarrage : ' + e.message); });
  }, []);
  useEffect(() => { try { localStorage.setItem('tab', tab); } catch { /* private mode */ } }, [tab]);
  const listCount = useLive(() => db.list.filter(i => i.stage !== 'proposal' && !i.ticked).count(), []);
  if (!cat) return <div class="loading">Chargement des recettes…</div>;
  return <CatCtx.Provider value={{ cat, reloadCat }}>
    <main>
      <BackupBanner />
      <Boundary name={tab} key={tab}>
        {tab === 'plan' && <PlanScreen goList={() => setTab('list')} />}
        {tab === 'recipes' && <RecipesScreen shared={shared} clearShared={() => setShared(null)} />}
        {tab === 'list' && <ListScreen />}
        {tab === 'stock' && <StockScreen />}
      </Boundary>
    </main>
    <nav class="tabs">
      {TABS.map(([id, label, icon]) => <button class={tab === id ? 'on' : ''} aria-current={tab === id} onClick={() => setTab(id)}>
        <span class="ti">{icon}{id === 'list' && !!listCount && <b class="badge">{listCount}</b>}</span>{label}</button>)}
    </nav>
    {welcome && <Welcome onDone={() => setWelcome(false)} />}
    <Toaster />
  </CatCtx.Provider>;
}
