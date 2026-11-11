// A data-channel-only WebRTC description (SDP) is ~560 bytes of mostly boilerplate. For a QR code we keep only what differs
// (ICE user/password, DTLS fingerprint, role, addresses) and rebuild the standard text on the other side.
// packSdp returns null whenever the SDP is not exactly the simple expected shape: callers then send the full SDP unchanged.
export interface PackedSdp { u: string; w: string; h: string; r: 'a' | 'c' | 'p'; c: (string | number)[][] }

const ROLE = { actpass: 'a', active: 'c', passive: 'p' } as const;
const ROLE_BACK = { a: 'actpass', c: 'active', p: 'passive' } as const;
const CAND = /^a=candidate:(\S+) 1 udp (\d+) (\S+) (\d+) typ (host|srflx|prflx|relay)(?: raddr (\S+) rport (\d+))?(?: generation \d+)?(?: ufrag \S+)?(?: network-(?:id|cost) \d+)*$/;
const TCP_ACTIVE = /^a=candidate:\S+ 1 tcp \d+ \S+ \d+ typ host tcptype active/;   // Chrome adds these; the other side never listens for them, so they can't connect
const TYPES: Record<string, string> = { host: 'h', srflx: 's', prflx: 'p', relay: 'r' }, TYPES_BACK: Record<string, string> = { h: 'host', s: 'srflx', p: 'prflx', r: 'relay' };

const hexToB64 = (hex: string) => btoa(String.fromCharCode(...hex.split(':').map(x => parseInt(x, 16)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64ToHex = (b: string) => Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(':');

export function packSdp(sdp: string): PackedSdp | null {
  try {
    const lines = sdp.split(/\r?\n/).filter(Boolean);
    if (lines.filter(l => l.startsWith('m=')).length !== 1 || !lines.some(l => l === 'm=application' || /^m=application \d+ UDP\/DTLS\/SCTP webrtc-datachannel$/.test(l))) return null;
    const one = (re: RegExp) => { const m = lines.map(l => re.exec(l)).filter(Boolean); return m.length === 1 ? m[0]![1] : null; };
    const u = one(/^a=ice-ufrag:(\S+)$/), w = one(/^a=ice-pwd:(\S+)$/), fp = one(/^a=fingerprint:sha-256 ([0-9A-Fa-f:]+)$/), role = one(/^a=setup:(actpass|active|passive)$/);
    if (!u || !w || !fp || !role || lines.some(l => l.startsWith('a=ice-lite'))) return null;
    const c: (string | number)[][] = [];
    for (const l of lines.filter(l => l.startsWith('a=candidate:'))) {
      if (TCP_ACTIVE.test(l)) continue;
      const m = CAND.exec(l); if (!m) return null;
      c.push(m[6] ? [m[1], +m[2], m[3], +m[4], TYPES[m[5]], m[6], +m[7]] : [m[1], +m[2], m[3], +m[4], TYPES[m[5]]]);
    }
    const p: PackedSdp = { u, w, h: hexToB64(fp.toUpperCase()), r: ROLE[role as keyof typeof ROLE], c };
    return unpackSdp(p) && essentials(unpackSdp(p)!) === essentials(sdp) ? p : null;       // must rebuild to the very same information
  } catch { return null; }
}

export function unpackSdp(p: PackedSdp): string {
  const first = p.c[0], port = first ? first[3] : 9, ip = first && !String(first[2]).includes(':') && !String(first[2]).endsWith('.local') ? first[2] : '0.0.0.0';
  return ['v=0', 'o=- 1 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=extmap-allow-mixed', 'a=msid-semantic: WMS',
    `m=application ${port} UDP/DTLS/SCTP webrtc-datachannel`, `c=IN IP4 ${ip}`,
    ...p.c.map(x => `a=candidate:${x[0]} 1 udp ${x[1]} ${x[2]} ${x[3]} typ ${TYPES_BACK[x[4] as string]}${x[5] ? ` raddr ${x[5]} rport ${x[6]}` : ''} generation 0 network-cost 999`),
    `a=ice-ufrag:${p.u}`, `a=ice-pwd:${p.w}`, 'a=ice-options:trickle', `a=fingerprint:sha-256 ${b64ToHex(p.h)}`, `a=setup:${ROLE_BACK[p.r]}`,
    'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''].join('\r\n');
}

/** The information an SDP carries, for comparing two of them. */
export function essentials(sdp: string): string {
  const get = (re: RegExp) => sdp.split(/\r?\n/).map(l => re.exec(l)).filter(Boolean).map(m => m![1]);
  return JSON.stringify([get(/^a=ice-ufrag:(\S+)/), get(/^a=ice-pwd:(\S+)/), get(/^a=fingerprint:sha-256 (\S+)/).map(x => x.toUpperCase()), get(/^a=setup:(\S+)/),
sdp.split(/\r?\n/).filter(l => l.startsWith('a=candidate:') && !TCP_ACTIVE.test(l)).map(l => l.replace(/ generation.*$/, ''))]);
}
