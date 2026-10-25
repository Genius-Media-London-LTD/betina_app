// WebRTC for the voice chat — browser build (see rtc.ts for native).
export const RTCPeerConnection = globalThis.RTCPeerConnection;
export const RTCSessionDescription = globalThis.RTCSessionDescription;
export const mediaDevices = globalThis.navigator?.mediaDevices;

/** Plays BETina's audio track through a hidden <audio> element. Returns a cleanup. */
export function playRemote(stream: MediaStream): () => void {
  const el = document.createElement('audio');
  el.autoplay = true;
  el.srcObject = stream;
  document.body.appendChild(el);
  return () => {
    el.srcObject = null;
    el.remove();
  };
}

let ctx: AudioContext | null = null;

/** Live loudness 0..1 of a stream via an AnalyserNode. */
export function levelMeter(stream: MediaStream): (() => number) | null {
  try {
    ctx ??= new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    return () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / data.length) * 4);
    };
  } catch {
    return null;
  }
}
