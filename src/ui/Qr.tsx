import { useEffect, useRef, useState } from 'preact/hooks';
import qrcode from 'qrcode-generator';

/** A QR code, always black on white (scanners need the contrast, even in dark mode). */
export function QrCode({ text }: { text: string }) {
  let qr; try { qr = qrcode(0, 'L'); qr.addData(text); qr.make(); } catch { return <p class="muted">Code trop long pour un QR : utilisez « Copier le code ».</p>; }
  const n = qr.getModuleCount(), Q = 4;                                   // quiet zone, in modules
  let d = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + Q} ${r + Q}h1v1h-1z`;
  return <svg class="qr" viewBox={`0 0 ${n + 2 * Q} ${n + 2 * Q}`} shape-rendering="crispEdges" role="img" aria-label="QR code à scanner">
    <rect width="100%" height="100%" fill="#fff" /><path d={d} fill="#000" /></svg>;
}

export const canScan = () => 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

/** Camera view that reads QR codes (Chrome's built-in BarcodeDetector). Calls onText once per new text. */
export function Scanner({ onText }: { onText: (t: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stop = false, stream: MediaStream | undefined, timer = 0, last = '';
    (async () => {
      try {
        const det = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop) return stream.getTracks().forEach(t => t.stop());
        const v = video.current!; v.srcObject = stream; await v.play();
        const tick = async () => {
          if (stop) return;
          try { const r = await det.detect(v); const t = r[0]?.rawValue; if (t && t !== last) { last = t; onText(t); } } catch { /* frame not ready */ }
          timer = window.setTimeout(tick, 250);
        };
        tick();
      } catch (e: any) { setErr(e?.name === 'NotAllowedError' ? "L'accès à la caméra est refusé : autorisez-le dans les réglages du navigateur, ou collez le code." : "Caméra indisponible : collez le code à la place."); }
    })();
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, []);
  return err ? <p class="muted">{err}</p> : <video ref={video} class="scanner" playsInline muted aria-label="Caméra : visez le QR code" />;
}
