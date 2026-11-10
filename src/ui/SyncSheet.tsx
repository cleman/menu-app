import { useContext, useEffect, useState } from 'preact/hooks';
import { NeedsJoin, applySyncFile, buildSyncFile, createGroup, dismissConflict, getGroup, getPeers, getSelf, lastTimes, peekSelf, leaveGroup, listConflicts,
  markSent, restoreConflict, setChief, setDeviceName, takeChief, type ApplyResult } from '../db/sync';
import { parseSyncFile, type SyncFile } from '../domain/sync';
import { CatCtx, Sheet, toast, useLive } from './kit';

const when = (t?: number) => (t ? new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais');

/** Sync between your devices: send a file (Nearby Share / Bluetooth / Wi-Fi Direct from the share sheet), receive a file. */
export function SyncSheet({ onClose }: { onClose: () => void }) {
  const { reloadCat } = useContext(CatCtx);
  useEffect(() => { getSelf(); }, []);          // creates this device's identity once (liveQuery below is read-only)
  const self = useLive(peekSelf, []), group = useLive(async () => (await getGroup()) ?? null, []), peers = useLive(getPeers, []) || {};
  const times = useLive(lastTimes, []), conflicts = useLive(listConflicts, []) || [];
  const [pending, setPending] = useState<SyncFile | null>(null);      // a file from a group we are not in yet: join how?
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isChief = !!group && !!self && group.chiefId === self.id;
  const nameOf = (id: string) => (self && id === self.id ? self.name + ' (cet appareil)' : peers[id]?.name || 'Autre appareil');

  const send = async () => {
    setBusy(true);
    try {
      const f = await buildSyncFile(), blob = new Blob([JSON.stringify(f)], { type: 'application/json' });
      const fname = `menu-synchro-${(self?.name || 'appareil').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File([blob], fname, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Synchro Menu' });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Fichier enregistré dans Téléchargements'); }
      await markSent();
    } catch (e: any) { if (e?.name !== 'AbortError') toast('Envoi impossible : ' + (e?.message || e)); }
    setBusy(false);
  };
  const run = async (f: SyncFile, join?: 'adopt' | 'merge') => {
    setBusy(true); setPending(null);
    try { setResult(await applySyncFile(f, { join })); reloadCat(); }
    catch (e: any) { if (e instanceof NeedsJoin) setPending(f); else toast(e?.message || String(e)); }
    setBusy(false);
  };
  const receive = (e: Event) => {
    const input = e.target as HTMLInputElement, f = input.files?.[0]; if (!f) return;
    f.text().then(t => run(parseSyncFile(t))).catch(err => toast(err.message)).finally(() => { input.value = ''; });
  };
  const fileInput = (label: string, cls = 'secondary') => <label class={'button ' + cls}>{label}<input type="file" accept="application/json,.json" hidden onChange={receive} /></label>;

  const nameField = self && <div class="field"><label>Nom de cet appareil <small class="muted">(ex. Téléphone, Tablette)</small></label>
    <div class="row gap"><input value={name ?? self.name} onInput={e => setName(e.currentTarget.value)} />
      {name != null && name !== self.name && <button class="sm" onClick={async () => { await setDeviceName(name); setName(null); }}>OK</button>}</div></div>;
  return <Sheet title="Synchronisation" onClose={onClose}>
    {nameField}
    {group === null && <>
      <p>Utilisez les mêmes données (plans, recettes, courses, maison) sur plusieurs appareils : téléphone, tablette…</p>
      <p class="muted small">Les appareils s'échangent un petit fichier (par Partage à proximité, Bluetooth, Wi-Fi Direct ou tout autre moyen), sans compte ni serveur. L'appareil qui crée le groupe en est le <b>chef</b> : en cas de désaccord sur une même donnée, c'est sa version qui est gardée.</p>
      <h4>Cet appareil est le premier</h4>
      <button class="primary" disabled={busy} onClick={async () => { await createGroup(); toast('Groupe créé : cet appareil est le chef'); }}>Créer le groupe</button>
      <h4>Un autre appareil a déjà créé le groupe</h4>
      <p class="muted small">Sur lui : Réglages → Synchronisation → « Envoyer mes données ». Puis choisissez ici le fichier reçu.</p>
      {fileInput('📥 Rejoindre avec un fichier', 'primary')}
    </>}

    {group && self && <>
      <p>{isChief ? '👑 Cet appareil est le chef.' : <>Chef du groupe : <b>{nameOf(group.chiefId)}</b>.</>} <small class="muted">En cas de désaccord sur une même donnée, la version du chef est gardée.</small></p>
      <div class="row gap wrap"><button class="primary" disabled={busy} onClick={send}>📤 Envoyer mes données</button>{fileInput('📥 Recevoir un fichier')}</div>
      <p class="muted small">Dernier envoi : {when(times?.sent)} · Dernière réception : {when(times?.received)}. Pour être à jour partout : envoyez de A vers B, puis de B vers A.</p>

      <h4>Appareils du groupe</h4>
      <ul class="rlist">{[self.id, ...Object.keys(peers)].map(id => <li><span>{nameOf(id)}{id === group.chiefId ? ' 👑' : ''}{id !== self.id && <small class="muted"> · vu {when(peers[id]?.lastSyncAt)}</small>}</span>
        {isChief && id !== self.id && <button class="sm ghost" onClick={() => confirm(`Donner le rôle de chef à « ${nameOf(id)} » ?`) && setChief(id)}>Nommer chef</button>}</li>)}</ul>
      {!isChief && <button class="sm ghost" onClick={() => confirm("Devenir le chef de ce groupe ? À utiliser surtout si l'ancien chef n'est plus disponible.") && takeChief()}>Devenir le chef</button>}

      {conflicts.length > 0 && <><h4>Désaccords résolus ({conflicts.length})</h4>
        <p class="muted small">Pour ces éléments, deux appareils avaient modifié la même chose : une version a été gardée. L'autre est ici si vous la préférez.</p>
        <ul class="rlist">{conflicts.slice(0, 20).map(c => <li><span>{c.label}<small class="muted"> · {c.data === null ? 'supprimé' : 'version de'} {nameOf(c.dev)}, {when(c.at)}</small></span>
          <span class="row gap"><button class="sm ghost" onClick={async () => { await restoreConflict(c); reloadCat(); toast('Version remise (sera envoyée aux autres)'); }}>Remettre</button>
            <button class="sm ghost" aria-label="Ignorer" onClick={() => dismissConflict(c.id!)}>✕</button></span></li>)}</ul></>}

      <h4>Quitter le groupe</h4>
      <button class="sm ghost" onClick={() => confirm('Quitter le groupe ? Les données restent sur cet appareil, mais ne seront plus synchronisées.') && leaveGroup()}>Quitter le groupe</button>
    </>}

    {pending && <Sheet title="Rejoindre le groupe" onClose={() => setPending(null)}>
      <p>Fichier de <b>{pending.from.name}</b>. Que faire des données de cet appareil ?</p>
      <p><b>Remplacer</b> (conseillé si cet appareil est neuf ou vide) : il reprend exactement les données du groupe. Une copie automatique de ses données actuelles est gardée avant.</p>
      <p><b>Fusionner</b> : ses données actuelles sont conservées et ajoutées à celles du groupe. En cas de désaccord, c'est le chef qui l'emporte.</p>
      <div class="row gap wrap"><button class="primary" onClick={() => run(pending, 'adopt')}>Remplacer</button><button class="secondary" onClick={() => run(pending, 'merge')}>Fusionner</button></div>
    </Sheet>}

    {result && <Sheet title="Synchronisation faite ✓" onClose={() => setResult(null)}>
      <p>{result.joined ? `Vous avez rejoint le groupe de ${result.from}. ` : `Fichier de ${result.from} reçu. `}
        {result.applied + result.conflicts === 0 ? 'Rien de nouveau.' : `${result.applied} changement(s) reçu(s).`}</p>
      {result.conflicts > 0 && <p>{result.conflicts} désaccord(s) sur une même donnée : {result.keptMine > 0 ? `${result.keptMine} gardé(s) comme chez vous, ` : ''}le chef l'a emporté. Les autres versions sont dans « Désaccords résolus ».</p>}
      <p class="muted small">Pour que l'autre appareil reçoive aussi vos modifications, renvoyez-lui vos données.</p>
      <div class="row gap wrap"><button class="primary" disabled={busy} onClick={async () => { setResult(null); await send(); }}>📤 Renvoyer mes données</button><button class="secondary" onClick={() => setResult(null)}>Fermer</button></div>
    </Sheet>}
  </Sheet>;
}
