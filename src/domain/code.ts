// Text codes: any JSON → short text that survives a messenger / clipboard / QR code.
// "MS1." = a sync file, "MH1." = a connection handshake. gzip (when the browser has it) then base64url. Whitespace and line breaks are ignored when reading.
export type CodeKind = 'S' | 'H';

const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (t: string) => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const pipe = async (data: Uint8Array, s: CompressionStream | DecompressionStream) => {
  const w = s.writable.getWriter(); w.write(data as BufferSource).catch(() => {}); w.close().catch(() => {});   // errors surface when reading the result
  return new Uint8Array(await new Response(s.readable).arrayBuffer());
};
const hasGzip = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeCode(kind: CodeKind, obj: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  return hasGzip ? `M${kind}1.` + b64(await pipe(raw, new CompressionStream('gzip'))) : `M${kind}0.` + b64(raw);
}

export async function decodeCode(text: string): Promise<{ kind: CodeKind; obj: any }> {
  const t = text.replace(/\s+/g, ''), m = /^M([SH])([01])\.([A-Za-z0-9_-]+)$/.exec(t);
  if (!m) throw new Error("Ce texte n'est pas un code Menu. Copiez-le en entier, sans rien ajouter.");
  try {
    const bytes = unb64(m[3]);
    const raw = m[2] === '1' ? await pipe(bytes, new DecompressionStream('gzip')) : bytes;
    return { kind: m[1] as CodeKind, obj: JSON.parse(new TextDecoder().decode(raw)) };
  } catch { throw new Error('Code incomplet ou abîmé : copiez-le à nouveau en entier.'); }
}
