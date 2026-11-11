import { useEffect, useRef, useState } from 'preact/hooks';
import { buildSyncFile, getGroup, getSelf } from '../db/sync';
import { decodeCode, encodeCode } from '../domain/code';
import { parseSyncFile, type DeviceInfo, type SyncFile } from '../domain/sync';
import { Peer } from '../net/peer';
import { packSdp, unpackSdp, type PackedSdp } from '../net/sdp';
import { QrCode, Scanner, canScan } from './Qr';
import { Sheet, toast } from './kit';

type Step = 'choose' | 'offer' | 'scan-offer' | 'answer' | 'syncing' | 'error';
interface Hand { t: 'o' | 'a'; f: DeviceInfo; g: string | null; p?: PackedSdp; s?: string }     // p = packed description (small QR), s = full one (fallback)

/**
 * Live sync: two QR codes (or two copied texts) connect the devices directly, over the local network, no server.
 * Then each device sends its sync file and applies the other's, exactly like the file method.
 */
export function LiveSync({ onReceive, onClose }: { onReceive: (f: SyncFile) => Promise<void>; onClose: () => void }) {
  const [step, setStep] = useState<Step>('choose');
  const [stun, setStun] = useState(false);
  const [code, setCode] = useState('');
  const [other, setOther] = useState<DeviceInfo | null>(null);
  const [msg, setMsg] = useState('');
  const [slow, setSlow] = useState(false);
  const [paste, setPaste] = useState('');
  const peer = useRef<Peer | null>(null), me = useRef<DeviceInfo | null>(null), done = useRef(false);
  useEffect(() => { getSelf().then(s => { me.current = s; }); return () => { done.current = true; peer.current?.close(); }; }, []);

  const fail = (why: string) => { if (done.current) return; setMsg(why); setStep('error'); peer.current?.close(); };
  const newPeer = () => {
    const p = new Peer(stun); peer.current = p;
    p.onopen = () => exchange(p);
    p.onfail = () => fail('Connexion impossible. Les deux appareils doivent être sur le même Wi-Fi (certaines box empêchent les appareils de se voir : essayez le point d\'accès Wi-Fi d\'un des téléphones), ou utilisez le fichier / le code.');
    p.onclose = () => fail('Connexion interrompue avant la fin. Recommencez, ou utilisez le fichier / le code.');
    return p;
  };
  const handshake = async (sdp: string, t: 'o' | 'a'): Promise<Hand> => { const p = packSdp(sdp), base = { t, f: me.current || await getSelf(), g: (await getGroup())?.id ?? null }; return p ? { ...base, p } : { ...base, s: sdp }; };

  const startHost = async () => {
    setStep('offer'); setCode(''); setMsg('');
    try { const p = newPeer(), sdp = await p.offer(); setCode(await encodeCode('H', await handshake(sdp, 'o'))); }
    catch (e: any) { fail("Impossible de préparer la connexion : " + (e?.message || e)); }
  };

  /** A scanned / pasted handshake text, whatever the step. */
  const onText = async (text: string) => {
    if (step !== 'offer' && step !== 'scan-offer') return;
    try {
      const { kind, obj } = await decodeCode(text), h = obj as Hand;
      const sdp = h?.p ? unpackSdp(h.p) : h?.s;
      if (kind !== 'H' || !sdp) throw new Error("Ce n'est pas un code de connexion.");
      setOther(h.f);
      if (step === 'scan-offer' && h.t === 'o') {
        const p = newPeer(); setStep('answer'); setCode('');
        setCode(await encodeCode('H', await handshake(await p.accept(sdp), 'a'))); setSlow(false); setTimeout(() => setSlow(true), 25000);
      } else if (step === 'offer' && h.t === 'a') {
        setStep('syncing'); setMsg('Connexion…'); await peer.current!.finish(sdp); setTimeout(() => setSlow(true), 25000);
      } else throw new Error(step === 'offer' ? "C'est un code d'invitation : ici il faut scanner le code de réponse de l'autre appareil." : "C'est un code de réponse : ici il faut scanner le code d'invitation.");
    } catch (e: any) { toast(e?.message || String(e)); }
  };

  const exchange = (p: Peer) => {
    setStep('syncing'); setMsg('Échange des données…'); setSlow(false);
    let got = false, sent = false;
    const finish = () => { if (got && sent && !done.current) { done.current = true; p.drainAndClose(); onClose(); } };
    const sentP = (async () => { const g = await getGroup(); await p.send(g ? { k: 'file', file: await buildSyncFile() } : { k: 'nogroup' }); sent = true; })()
      .catch(e => fail('Envoi interrompu : ' + (e?.message || e)));
    p.onmessage = async (m: any) => {
      await sentP;                                              // never apply while we are still reading our own data
      try {
        if (m.k === 'file') await onReceive(parseSyncFile(JSON.stringify(m.file)));
        else if (m.k === 'nogroup' && !(await getGroup())) { toast("Aucun des deux appareils n'a de groupe : créez-le d'abord sur l'un d'eux."); }
      } catch (e: any) { toast(e?.message || String(e)); }
      got = true; finish();
    };
    sentP.then(finish);
  };

  const pasteBox = <div class="field"><label>Ou collez le code reçu</label>
    <textarea class="codebox" value={paste} onInput={e => setPaste(e.currentTarget.value)} placeholder="MH1.…" />
    <button class="sm secondary" disabled={!paste.trim()} onClick={() => { onText(paste); setPaste(''); }}>Valider le code collé</button></div>;
  const copyBtn = <button class="sm secondary" disabled={!code} onClick={() => navigator.clipboard?.writeText(code).then(() => toast('Code copié'), () => toast('Copie impossible : sélectionnez le texte ci-dessous'))}>📋 Copier le code</button>;

  return <Sheet title="Synchro en direct" onClose={onClose}>
    {step === 'choose' && <>
      <p>Sans fichier : les deux appareils se connectent directement, par le Wi-Fi qu'ils partagent. Ouvrez ce menu sur <b>les deux</b>, puis :</p>
      <ol class="steps"><li>Un appareil <b>montre son code</b>, l'autre le <b>scanne</b>.</li><li>L'autre appareil montre alors <b>son</b> code de réponse, que le premier scanne.</li></ol>
      <p class="muted small">Les deux appareils doivent être sur le même Wi-Fi (ou le point d'accès d'un téléphone). Aucune donnée ne passe par Internet.</p>
      <div class="row gap wrap"><button class="primary" onClick={startHost}>📱 Montrer mon code</button><button class="primary" onClick={() => setStep('scan-offer')}>📷 Scanner l'autre code</button></div>
      <label class="row gap" style="margin-top:14px"><input type="checkbox" checked={stun} onChange={e => setStun(e.currentTarget.checked)} /><span class="small">Essayer aussi hors du même Wi-Fi <span class="muted">(contacte un serveur public pour trouver l'adresse ; peut échouer sur certains réseaux mobiles)</span></span></label>
    </>}

    {step === 'offer' && <>
      <p><b>1.</b> Sur l'autre appareil, choisissez « Scanner l'autre code » et visez ce QR code.</p>
      {code ? <><QrCode text={code} />{copyBtn}</> : <p class="muted">Préparation du code…</p>}
      <p><b>2.</b> Puis scannez le code de réponse qu'il affiche.</p>
      {canScan() ? <Scanner onText={onText} /> : <p class="muted small">Ce navigateur ne sait pas lire les QR codes : utilisez le code copié.</p>}
      {pasteBox}
    </>}

    {step === 'scan-offer' && <>
      <p>Visez le QR code affiché sur l'autre appareil.</p>
      {canScan() ? <Scanner onText={onText} /> : <p class="muted small">Ce navigateur ne sait pas lire les QR codes : utilisez le code copié.</p>}
      {pasteBox}
    </>}

    {step === 'answer' && <>
      <p>{other ? <>Connecté au code de <b>{other.name}</b>. </> : ''}Montrez maintenant ce code de réponse à l'autre appareil, qui doit le scanner.</p>
      {code ? <><QrCode text={code} />{copyBtn}</> : <p class="muted">Préparation du code…</p>}
      {slow && <p class="muted small">Toujours pas connecté… Vérifiez que les deux appareils sont sur le même Wi-Fi et que l'autre a bien scanné ce code.</p>}
    </>}

    {step === 'syncing' && <>
      <p>{msg}{other ? <> avec <b>{other.name}</b></> : ''}</p>
      {slow && <p class="muted small">Toujours pas connecté… Vérifiez que les deux appareils sont sur le même Wi-Fi. Sinon, essayez le point d'accès d'un téléphone, ou le fichier / le code.</p>}
    </>}

    {step === 'error' && <>
      <p>{msg}</p><div class="row gap wrap"><button class="primary" onClick={() => { setStep('choose'); setMsg(''); done.current = false; }}>Recommencer</button><button class="secondary" onClick={onClose}>Fermer</button></div>
    </>}
  </Sheet>;
}
