import { it, expect } from 'vitest';
import { essentials, packSdp, unpackSdp } from '../src/net/sdp';

const FP = '80:CC:A0:3B:4F:17:93:E1:15:DD:D1:15:6E:3E:08:DE:4D:35:C8:1D:EE:58:31:4D:78:68:C0:70:BD:6A:D9:A9';
const sdp = (role: string, cands: string[]) => ['v=0', 'o=- 1202001433728134293 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=extmap-allow-mixed', 'a=msid-semantic: WMS',
  'm=application 46318 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 192.168.1.20', ...cands, 'a=ice-ufrag:0Bk2', 'a=ice-pwd:snO8PwT8/TeEPwBaxJSEFcZJ', 'a=ice-options:trickle',
  'a=fingerprint:sha-256 ' + FP, 'a=setup:' + role, 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''].join('\r\n');
const host = 'a=candidate:390375870 1 udp 2113937151 192.168.1.20 46318 typ host generation 0 network-cost 999';
const v6 = 'a=candidate:12345 1 udp 2113939711 fe80::1ff:fe23:4567:890a 46319 typ host generation 0 network-cost 999';
const mdns = 'a=candidate:777 1 udp 2113937151 3f2a9c1e-8d4b-4c0e-9a77-1c2d3e4f5a6b.local 50000 typ host generation 0 network-cost 999';
const srflx = 'a=candidate:99 1 udp 1677729535 82.12.34.56 40000 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999';

it.each([['offer', 'actpass', [host]], ['answer', 'active', [host, v6]], ['mdns', 'actpass', [mdns]], ['stun', 'actpass', [host, srflx]]] as const)('%s: packs, shrinks a lot, and rebuilds the same information', (_n, role, c) => {
  const s = sdp(role, [...c]), p = packSdp(s)!; expect(p).not.toBeNull();
  expect(essentials(unpackSdp(p))).toBe(essentials(s));
  expect(JSON.stringify(p).length).toBeLessThan(s.length * 0.55);
  expect(unpackSdp(p)).toContain('m=application'); expect(unpackSdp(p)).toContain('a=sctp-port:5000');
});
it('Chrome\'s real offer (with the useless active-TCP candidate) packs, and the TCP one is dropped', () => {
  const real = sdp('actpass', ['a=candidate:1781867280 1 udp 2122260223 192.0.2.2 45952 typ host generation 0 network-id 1', 'a=candidate:2493511556 1 tcp 1518280447 192.0.2.2 9 typ host tcptype active generation 0 network-id 1']);
  const p = packSdp(real)!; expect(p).not.toBeNull(); expect(p.c).toHaveLength(1); expect(unpackSdp(p)).not.toContain('tcp');
});
it('anything unusual is NOT packed (the full SDP is sent instead)', () => {
  expect(packSdp(sdp('actpass', [host]).replace('webrtc-datachannel', 'webrtc-datachannel\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111'))).toBeNull();
  expect(packSdp(sdp('actpass', ['a=candidate:1 1 tcp 1518280447 192.168.1.20 9 typ host tcptype passive generation 0']))).toBeNull();
  expect(packSdp(sdp('actpass', [host]).replace('sha-256', 'sha-1'))).toBeNull();
  expect(packSdp('garbage')).toBeNull();
});
