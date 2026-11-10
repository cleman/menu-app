import { useContext, useEffect, useState } from 'preact/hooks';
import { db, exportJSON, getKV, importJSON, setKV } from '../db/db';
import { normalize } from '../domain/backup';
import { getGroup } from '../db/sync';
import { CatCtx, Sheet, Stepper, toast, useLive } from './kit';
import { SyncSheet } from './SyncSheet';

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
  const grouped = useLive(async () => !!(await getGroup()), []);
  const [showSync, setShowSync] = useState(false);
  const counts = useLive(async () => ({ r: await db.recipes.count(), s: await db.stock.count() }), []);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted); }, []);

  const [file, setFile] = useState<string | null>(null);   // text of a chosen backup file, waiting for "merge or replace"
  const pickFile = (e: Event) => {
    const input = e.target as HTMLInputElement, f = input.files?.[0]; if (!f) return;
    f.text().then(t => { normalize(JSON.parse(t)); setFile(t); }).catch(err => toast("Fichier refusé : " + err.message)).finally(() => { input.value = ''; });
  };
  const doImport = async (mode: 'merge' | 'replace') => {
    const t = file!; setFile(null);
    try {
      const st = await importJSON(t, mode); reloadCat();
      toast(mode === 'merge' ? `Fusion terminée : ${st!.added} ajouté(s), ${st!.updated} mis à jour` : 'Sauvegarde restaurée');
    } catch (err: any) { toast("Échec de l'import : " + err.message); }
  };
  const restore = async (data: string) => { if (confirm('Revenir à cette copie automatique ?')) { await importJSON(data, 'replace'); reloadCat(); toast('Copie restaurée'); } };

  return <Sheet title="Réglages" onClose={onClose}>
    <div class="field"><label>Nombre de personnes par défaut</label>{hh != null && <Stepper value={hh} onChange={n => setKV('household', n)} label="personnes" />}
      <small class="muted">Utilisé pour chaque nouveau repas. Modifiable repas par repas.</small></div>
    <label class="check"><input type="checkbox" checked={!!deduct} onChange={e => setKV('cookDeduct', e.currentTarget.checked)} />
      Quand je marque un repas « cuisiné », retirer ses ingrédients de « Maison » <small class="muted">(seulement si la quantité est connue)</small></label>
    <h4>Plusieurs appareils</h4>
    <p class="muted">Téléphone et tablette avec les mêmes données.</p>
    <button class="secondary" onClick={() => setShowSync(true)}>🔄 Synchronisation{grouped ? ' (activée)' : ''}</button>
    <h4>Vos données</h4>
    <p class="muted">{counts ? `${counts.r} recettes · ${counts.s} produits à la maison. ` : ''}Tout reste sur ce téléphone, sans compte.
      {persisted === true ? ' ✓ Stockage protégé par le navigateur.' : persisted === false ? " ⚠ Le navigateur peut effacer les données s'il manque de place : installez l'app et faites des sauvegardes." : ''}</p>
    <p class="muted">Dernière sauvegarde : {last ? new Date(last).toLocaleDateString('fr-FR') : 'jamais'}</p>
    <div class="row gap wrap"><button class="primary" onClick={downloadBackup}>💾 Sauvegarder (fichier)</button>
      <label class="button secondary">📂 Restaurer un fichier<input type="file" accept="application/json,.json" hidden onChange={pickFile} /></label></div>
    {snaps.length > 0 && <><h4>Copies automatiques (3 dernières)</h4>
      <ul class="rlist">{snaps.map(s => <li><span>{new Date(s.at).toLocaleString('fr-FR')}</span><button class="sm ghost" onClick={() => restore(s.data)}>Restaurer</button></li>)}</ul></>}
    <h4>Ajouter une recette depuis Chrome</h4>
    <p class="muted small">Sur une page de recette : sélectionnez le texte de la recette (appui long, puis étendez la sélection) → <b>Partager</b> → <b>Menu</b>. L'app s'ouvre avec la recette pré-remplie. Fonctionne une fois l'app installée.</p>
    <p class="muted small">Menu · v0.4.1 · hors ligne</p>
    {showSync && <SyncSheet onClose={() => setShowSync(false)} />}
    {file && <Sheet title="Restaurer cette sauvegarde" onClose={() => setFile(null)}>
      <p><b>Fusionner</b> (conseillé) : ajoute les données du fichier à celles de cet appareil. Rien n'est supprimé ; si une recette ou un produit existe des deux côtés, la version la plus récente est gardée.</p>
      <p><b>Remplacer</b> : efface les données de cet appareil et reprend exactement celles du fichier.</p>
      {grouped && <p><b>⚠ Cet appareil est dans un groupe de synchronisation :</b> ce que vous restaurez ici sera envoyé aux autres appareils comme des modifications (en cas de désaccord, le chef l'emporte).</p>}
      <p class="muted small">Dans les deux cas, une copie automatique des données actuelles est gardée avant.</p>
      <div class="row gap wrap"><button class="primary" onClick={() => doImport('merge')}>Fusionner</button>
        <button class="secondary" onClick={() => doImport('replace')}>Remplacer tout</button></div>
    </Sheet>}
  </Sheet>;
}
