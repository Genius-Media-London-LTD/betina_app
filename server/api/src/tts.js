// BETina's voice notes (Telegram): turns one or two sentences into a voice
// message in her voice — the same voice as in the app's voice chat. The OpenAI
// key stays on this server.
//
// Only our own Telegram function may call it: it creates a one-time ticket in
// Supabase (tts_tickets) and sends the id along; we redeem it with
// claim_tts_ticket() before anything is spoken.
const SUPABASE_URL = 'https://djnmrvhdklpclbrhxxqs.supabase.co';
// Public anon key (ships in the app).
const SUPABASE_ANON = 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';
const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'marin';
const MAX_CHARS = 320;
const STYLE = 'A woman in her mid-twenties recording a short voice message on her phone for someone she likes. '
  + 'Warm, bright, confident and a little teasing; natural pace, relaxed, a smile in the voice. '
  + 'Casual and close, like speaking to one person — never like an advert, a presenter or an assistant.';

async function claim(ticket) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_tts_ticket`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_ticket: ticket }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  return res?.ok ? (await res.json().catch(() => false)) === true : false;
}

/** POST /v1/tts { ticket, text } → audio/ogg (Opus), ready for Telegram's sendVoice. */
export async function tts(c) {
  if (!process.env.OPENAI_API_KEY) return c.json({ error: 'not_configured' }, 503);
  const body = await c.req.json().catch(() => ({}));
  const text = String(body.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
  const ticket = String(body.ticket ?? '');
  if (!text || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ticket)) return c.json({ error: 'bad_request' }, 400);
  if (!(await claim(ticket))) return c.json({ error: 'forbidden' }, 403);

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, instructions: STYLE, response_format: 'opus' }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res?.ok) {
    console.error('tts:', res ? `${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}` : 'no answer');
    return c.json({ error: 'upstream' }, 502);
  }
  return new Response(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/ogg', 'Cache-Control': 'no-store' } });
}
