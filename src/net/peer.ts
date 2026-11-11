// One WebRTC data channel between two devices, set up WITHOUT a server: the two "handshake" texts (offer, answer) are
// carried by QR codes (or copy/paste). Data then flows directly over the local network. Messages are JSON, split in frames.
import { Reassembler, toFrames } from '../domain/chunks';

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }];

export class Peer {
  private pc: RTCPeerConnection;
  private dc?: RTCDataChannel;
  private re = new Reassembler();
  private n = 0;
  onopen: () => void = () => {};
  onmessage: (m: any) => void = () => {};
  onfail: (why: string) => void = () => {};
  onclose: () => void = () => {};

  /** useStun = also try to find a public address (works outside the local network; contacts a public STUN server). Default: local only. */
  constructor(useStun = false) {
    this.pc = new RTCPeerConnection({ iceServers: useStun ? STUN : [] });
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'failed') this.onfail('failed'); else if (s === 'disconnected' || s === 'closed') this.onclose();
    };
    this.pc.ondatachannel = e => this.bind(e.channel);
  }
  private bind(dc: RTCDataChannel) {
    this.dc = dc; dc.bufferedAmountLowThreshold = 256 * 1024;
    dc.onopen = () => this.onopen();
    dc.onclose = () => this.onclose();
    dc.onmessage = e => { if (typeof e.data !== 'string') return; const full = this.re.push(e.data); if (full != null) { try { this.onmessage(JSON.parse(full)); } catch { /* ignore garbage */ } } };
  }
  private gathered() {
    return new Promise<void>(res => {
      if (this.pc.iceGatheringState === 'complete') return res();
      const done = () => { clearTimeout(t); this.pc.removeEventListener('icegatheringstatechange', ch); res(); };
      const ch = () => this.pc.iceGatheringState === 'complete' && done();
      const t = setTimeout(done, 4000);                                    // offline STUN etc.: take what we have
      this.pc.addEventListener('icegatheringstatechange', ch);
    });
  }
  /** Side 1: returns the offer (SDP text, candidates included). */
  async offer(): Promise<string> {
    this.bind(this.pc.createDataChannel('menu'));
    await this.pc.setLocalDescription(await this.pc.createOffer()); await this.gathered();
    return this.pc.localDescription!.sdp;
  }
  /** Side 2: takes the offer, returns the answer. */
  async accept(offerSdp: string): Promise<string> {
    await this.pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    await this.pc.setLocalDescription(await this.pc.createAnswer()); await this.gathered();
    return this.pc.localDescription!.sdp;
  }
  /** Side 1: takes the answer; the channel then opens by itself. */
  async finish(answerSdp: string) { await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp }); }

  async send(msg: unknown) {
    const dc = this.dc; if (!dc || dc.readyState !== 'open') throw new Error('Connexion fermée.');
    for (const f of toFrames(JSON.stringify(msg), 'm' + this.n++)) {
      if (dc.bufferedAmount > 1024 * 1024) await new Promise<void>(r => dc.addEventListener('bufferedamountlow', () => r(), { once: true }));
      dc.send(f);
    }
  }
  /** Waits until everything we sent has left, then closes (closing at once could cut the last message). */
  async drainAndClose() {
    for (let i = 0; i < 50 && (this.dc?.bufferedAmount || 0) > 0; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 600)); this.close();
  }
  close() { try { this.dc?.close(); this.pc.close(); } catch { /* already closed */ } }
}
