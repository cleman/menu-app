import { useContext, useEffect, useState } from 'preact/hooks';
import { db, exportJSON, getKV, importJSON, setKV } from '../db/db';
import { CatCtx, Sheet, Stepper, toast, useLive } from './kit';

const DAY = 864e5;

export async function downloadBackup() {
  const blob = new Blob([await exportJSON()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `menu-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  await setKV('lastExport', Date.now()); toast('Sauvegarde enregistrée dans Téléchargements');
}

/** Dismissible reminder (never blocking): data lives only on this phone. */
export function BackupBanner() {
  const last = useLive(() => getKV('lastExport', 0), []);
  const snooze = useLive(() => getKV('snoozeBackup', 0), []);
  const first = useLive(() => getKV('firstUse', Date.now()), []);
  const hasData = useLive(() => db.meals.count(), []);
  if (last == null || snooze == null || first == null || !hasData || Date.now() - Math.max(last, first) < 7 * DAY || Date.now() < snooze) return null;
  return <div class="banner"><span>💾 Vos données sont seulement sur ce téléphone. Faire une sauvegarde ?</span>
    <button class="primary sm" onClick={downloadBackup}>Sauvegarder</button>
    <button class="ghost sm" onClick={() => setKV('snoozeBackup', Date.now() + 3 * DAY)}>Plus tard</button></div>;
}

/** First launch: one question that changes every quantity. */
export function Welcome({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(2);
  return <Sheet title="Bienvenue 👋" onClose={async () => { await setKV('onboarded', true); onDone(); }}
    footer={<button class="primary wide" onClick={async () => { await setKV('household', n); await setKV('onboarded', true); onDone(); }}>C'est parti</button>}>
    <p>Une seule question pour commencer :</p>
    <div class="field"><label>Pour combien de personnes cuisinez-vous d'habitude ?</label><Stepper value={n} onChange={setN} label="personnes" /></div>
    <p class="muted">Toutes les quantités et les courses s'adaptent. Vous pourrez changer ce nombre pour chaque repas, et dans les réglages (⚙).</p>
  </Sheet>;
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { reloadCat } = useContext(CatCtx);
  const hh = useLive(() => getKV('household', 2), []);
  const deduct = useLive(() => getKV('cookDeduct', false), []);
  const last = useLive(() => getKV('lastExport', 0), []);
  const snaps = useLive(() => db.snapshots.orderBy('at').reverse().toArray(), []) || [];
  const counts = useLive(async () => ({ r: await db.recipes.count(), s: await db.stock.count() }), []);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted); }, []);

  const doImport = (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    if (!confirm("Remplacer toutes les données de l'app par cette sauvegarde ? (Une copie des données actuelles est gardée.)")) return;
    f.text().then(importJSON).then(() => { reloadCat(); toast('Sauvegarde restaurée'); }).catch(err => toast("Échec de l'import : " + err.message));
  };
  const restore = async (data: string) => { if (confirm('Revenir à cette copie automatique ?')) { await importJSON(data); reloadCat(); toast('Copie restaurée'); } };

  return <Sheet title="Réglages" onClose={onClose}>
    <div class="field"><label>Nombre de personnes par défaut</label>{hh != null && <Stepper value={hh} onChange={n => setKV('household', n)} label="personnes" />}
      <small class="muted">Utilisé pour chaque nouveau repas. Modifiable repas par repas.</small></div>
    <label class="check"><input type="checkbox" checked={!!deduct} onChange={e => setKV('cookDeduct', e.currentTarget.checked)} />
      Quand je marque un repas « cuisiné », retirer ses ingrédients de « Maison » <small class="muted">(seulement si la quantité est connue)</small></label>
    <h4>Vos données</h4>
    <p class="muted">{counts ? `${counts.r} recettes · ${counts.s} produits à la maison. ` : ''}Tout reste sur ce téléphone, sans compte.
      {persisted === true ? ' ✓ Stockage protégé par le navigateur.' : persisted === false ? " ⚠ Le navigateur peut effacer les données s'il manque de place : installez l'app et faites des sauvegardes." : ''}</p>
    <p class="muted">Dernière sauvegarde : {last ? new Date(last).toLocaleDateString('fr-FR') : 'jamais'}</p>
    <div class="row gap wrap"><button class="primary" onClick={downloadBackup}>💾 Sauvegarder (fichier)</button>
      <label class="button secondary">📂 Restaurer un fichier<input type="file" accept="application/json,.json" hidden onChange={doImport} /></label></div>
    {snaps.length > 0 && <><h4>Copies automatiques (3 dernières)</h4>
      <ul class="rlist">{snaps.map(s => <li><span>{new Date(s.at).toLocaleString('fr-FR')}</span><button class="sm ghost" onClick={() => restore(s.data)}>Restaurer</button></li>)}</ul></>}
    <h4>Ajouter une recette depuis Chrome</h4>
    <p class="muted small">Sur une page de recette : sélectionnez le texte de la recette (appui long, puis étendez la sélection) → <b>Partager</b> → <b>Menu</b>. L'app s'ouvre avec la recette pré-remplie. Fonctionne une fois l'app installée.</p>
    <p class="muted small">Menu · v0.2 · hors ligne</p>
  </Sheet>;
}
