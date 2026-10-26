// Voice chat with BETina (OpenAI Realtime over WebRTC). betina-server checks the
// player's login, keeps the 5-minutes-a-day budget and hands out a short-lived
// secret; the audio then flows directly between the app and OpenAI.
import { levelMeter, mediaDevices, playRemote, RTCPeerConnection, RTCSessionDescription } from './rtc';
import { LIVE_API } from './live';
import { NEWS_API } from './sports';
import { supabase } from './supabase';

export type VoiceState = 'connecting' | 'listening' | 'userSpeaking' | 'speaking' | 'searching' | 'ended';
export type VoiceError = 'limit' | 'mic' | 'network' | 'auth';

const REPORT_EVERY_S = 10;

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function api(path: string, token: string, body?: object) {
  return fetch(`${NEWS_API}/v1/voice/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Seconds of voice left today (null when unknown / signed out). */
export async function voiceBudget(): Promise<number | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const r = await api('budget', token);
    return r.ok ? (await r.json()).remaining : null;
  } catch {
    return null;
  }
}

export type VoiceCall = {
  stop: () => void;
  setMuted: (muted: boolean) => void;
  /** Current loudness 0..1 of the player and of BETina (null where unsupported). */
  levels: () => { me: number | null; betina: number | null };
};

export async function startVoice(opts: {
  lang: string;
  /** Optional voice name (server whitelist), e.g. to compare voices. */
  voice?: string;
  onState: (s: VoiceState) => void;
  /** Seconds left today; null while there is no daily limit. */
  onRemaining: (seconds: number | null) => void;
  onError: (e: VoiceError) => void;
}): Promise<VoiceCall | null> {
  const { onState, onRemaining, onError } = opts;
  onState('connecting');

  const token = await accessToken();
  if (!token) { onError('auth'); return null; }

  // 1. Short-lived secret from betina-server (also checks the daily budget).
  let secret: string;
  let remaining: number | null;
  try {
    const r = await api('session', token, { lang: opts.lang, voice: opts.voice });
    if (r.status === 429) { onError('limit'); return null; }
    if (r.status === 401) { onError('auth'); return null; }
    if (!r.ok) { onError('network'); return null; }
    const d = await r.json();
    secret = d.client_secret;
    remaining = d.remaining;
  } catch {
    onError('network');
    return null;
  }
  onRemaining(remaining);

  // 2. Microphone.
  // react-native-webrtc and the browser have different (but compatible) WebRTC typings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let local: any;
  try {
    local = await mediaDevices.getUserMedia({ audio: true, video: false });
  } catch {
    onError('mic');
    return null;
  }

  // 3. Peer connection: our mic out, BETina's voice in, events over a data channel.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  const pc: any = new RTCPeerConnection();
  let stopAudio = () => {};
  let betinaLevel: (() => number) | null = null;
  const meLevel = levelMeter(local);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  local.getTracks().forEach((t: any) => pc.addTrack(t, local));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  pc.addEventListener('track', (e: any) => {
    const stream = e.streams?.[0];
    if (!stream) return;
    stopAudio = playRemote(stream);
    betinaLevel = levelMeter(stream);
  });

  let ended = false;
  let sinceReport = 0;
  let tick: ReturnType<typeof setInterval> | null = null;

  const report = (seconds: number) => {
    if (seconds <= 0) return;
    api('usage', token, { seconds })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.remaining === 'number' && remaining != null) { remaining = Math.min(remaining, d.remaining); onRemaining(remaining); } })
      .catch(() => {});
  };

  const stop = () => {
    if (ended) return;
    ended = true;
    if (tick) clearInterval(tick);
    report(sinceReport);
    try { dc.close(); } catch { /* already closed */ }
    try { pc.close(); } catch { /* already closed */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
    local.getTracks().forEach((t: any) => t.stop());
    stopAudio();
    onState('ended');
  };

  const dc = pc.createDataChannel('oai-events');
  dc.addEventListener('open', () => {
    // BETina opens the call with a short greeting (see voicePrompt()).
    dc.send(JSON.stringify({ type: 'response.create' }));
  });
  dc.addEventListener('message', (e: { data: string }) => {
    let ev: { type?: string; call_id?: string; name?: string; arguments?: string };
    try { ev = JSON.parse(e.data); } catch { return; }
    switch (ev.type) {
      case 'response.function_call_arguments.done':
        if (ev.name === 'web_search' && ev.call_id) runSearch(ev.call_id, ev.arguments ?? '{}');
        else if (ev.name === 'live_scores' && ev.call_id) runLive(ev.call_id, ev.arguments ?? '{}');
        break;
      case 'input_audio_buffer.speech_started': onState('userSpeaking'); break;
      case 'input_audio_buffer.speech_stopped': onState('listening'); break;
      case 'output_audio_buffer.started': onState('speaking'); break;
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared': onState('listening'); break;
      case 'error': console.warn('realtime error', e.data); break;
    }
  });
  // BETina asked for a web search: run it on betina-server, hand her the answer.
  const runSearch = async (callId: string, args: string) => {
    onState('searching');
    let answer = 'The search failed just now.';
    try {
      const { query } = JSON.parse(args) as { query?: string };
      const r = await api('search', token, { query, lang: opts.lang });
      if (r.ok) answer = (await r.json()).answer ?? answer;
    } catch {
      // keep the fallback answer
    }
    if (ended) return;
    dc.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: answer } }));
    dc.send(JSON.stringify({ type: 'response.create' }));
  };

  // BETina asked for live scores: BETina Live on betina-server (API-Football).
  const runLive = async (callId: string, args: string) => {
    onState('searching');
    let answer = 'The live scores are not reachable just now.';
    try {
      const { query } = JSON.parse(args) as { query?: string };
      const r = await fetch(`${LIVE_API}/v1/live/find?q=${encodeURIComponent(query ?? '')}`);
      if (r.ok) answer = (await r.json()).answer ?? answer;
    } catch {
      // keep the fallback answer
    }
    if (ended) return;
    dc.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: answer } }));
    dc.send(JSON.stringify({ type: 'response.create' }));
  };

  pc.addEventListener('connectionstatechange', () => {
    if (!ended && (pc.connectionState === 'failed' || pc.connectionState === 'disconnected')) {
      onError('network');
      stop();
    }
  });

  // 4. SDP exchange with OpenAI using the short-lived secret.
  try {
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    const r = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/sdp' },
    });
    if (!r.ok) throw new Error(`calls ${r.status}`);
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: await r.text() }));
  } catch (err) {
    console.warn('voice connect:', (err as Error).message);
    onError('network');
    stop();
    return null;
  }
  onState('listening');

  // 5. Talk time: count down locally, book it on the server every few seconds.
  tick = setInterval(() => {
    sinceReport += 1;
    if (sinceReport >= REPORT_EVERY_S) { report(sinceReport); sinceReport = 0; }
    if (remaining == null) return; // no daily limit right now
    remaining -= 1;
    onRemaining(Math.max(0, remaining));
    if (remaining <= 0) { onError('limit'); stop(); }
  }, 1000);

  return {
    stop,
    setMuted: (muted) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
      local.getAudioTracks().forEach((t: any) => { t.enabled = !muted; });
    },
    levels: () => ({ me: meLevel ? meLevel() : null, betina: betinaLevel ? betinaLevel() : null }),
  };
}
