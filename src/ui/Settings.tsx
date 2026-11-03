import { useEffect, useState } from 'preact/hooks';
import { db, exportJSON, getKV, importJSON, setKV } from '../db/db';
import { CatCtx, Sheet, Stepper, toast, useLive } from './kit';
import { useContext } from 'preact/hooks';

const DAY = 864e5;

export async function downloadBackup() {
  const blob = new Blob([await exportJSON()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `menu-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  await setKV('lastExport', Date.now()); toast('Backup saved to Downloads');
}

/** Dismissible reminder (never blocking): data lives only on this phone. */
export function BackupBanner() {
  const last = useLive(() => getKV('lastExport', 0), []);
  const snooze = useLive(() => getKV('snoozeBackup', 0), []);
  const first = useLive(() => getKV('firstUse', Date.now()), []);
  const hasData = useLive(() => db.meals.count(), []);
  if (last == null || snooze == null || first == null || !hasData || Date.now() - Math.max(last, first) < 7 * DAY || Date.now() < snooze) return null;
  return <div class="banner"><span>💾 Your data lives only on this phone. Save a backup?</span>
    <button class="primary sm" onClick={downloadBackup}>Save</button>
    <button class="ghost sm" onClick={() => setKV('snoozeBackup', Date.now() + 3 * DAY)}>Later</button></div>;
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { reloadCat } = useContext(CatCtx);
  const hh = useLive(() => getKV('household', 2), []);
  const deduct = useLive(() => getKV('cookDeduct', false), []);
  const last = useLive(() => getKV('lastExport', 0), []);
  const snaps = useLive(() => db.snapshots.orderBy('at').reverse().toArray(), []) || [];
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted); }, []);

  const doImport = (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    if (!confirm('Replace everything in the app with this backup? (A snapshot of the current data is kept.)')) return;
    f.text().then(importJSON).then(() => { reloadCat(); toast('Backup restored'); }).catch(err => toast('Import failed: ' + err.message));
  };
  const restore = async (data: string) => { if (confirm('Go back to this snapshot?')) { await importJSON(data); reloadCat(); toast('Snapshot restored'); } };

  return <Sheet title="Settings" onClose={onClose}>
    <div class="field"><label>People I usually cook for</label>{hh != null && <Stepper value={hh} onChange={n => setKV('household', n)} label="household size" />}</div>
    <label class="check"><input type="checkbox" checked={!!deduct} onChange={e => setKV('cookDeduct', e.currentTarget.checked)} />
      When I mark a meal cooked, remove its ingredients from “At home” <small class="muted">(only where a quantity is known)</small></label>
    <h4>Your data</h4>
    <p class="muted">Everything stays on this phone, no account. {persisted === true ? '✓ Storage is protected by the browser.' : persisted === false ? '⚠ The browser may clear storage if space runs low — install the app and keep backups.' : ''}</p>
    <p class="muted">Last backup: {last ? new Date(last).toLocaleDateString() : 'never'}</p>
    <div class="row gap wrap"><button class="primary" onClick={downloadBackup}>💾 Save backup file</button>
      <label class="button secondary">📂 Restore from file<input type="file" accept="application/json,.json" hidden onChange={doImport} /></label></div>
    {snaps.length > 0 && <><h4>Automatic snapshots (last 3)</h4>
      <ul class="rlist">{snaps.map(s => <li><span>{new Date(s.at).toLocaleString()}</span><button class="sm ghost" onClick={() => restore(s.data)}>Restore</button></li>)}</ul></>}
    <p class="muted small">Menu planner · v0.1 · offline</p>
  </Sheet>;
}
