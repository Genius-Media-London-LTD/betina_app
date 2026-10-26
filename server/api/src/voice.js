// BETina voice chat: mints short-lived OpenAI Realtime client secrets for
// signed-in players and keeps the daily voice budget (5 min per player per
// UTC day). The OpenAI key (OPENAI_API_KEY) never leaves this server; the app
// connects to OpenAI over WebRTC with the ephemeral secret.
//
// BETina's voice persona comes from supabase/functions/_shared/betina-persona.ts
// — deploy.sh strips its types into src/persona.js, so text and voice share one source.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { voicePrompt } from './persona.js';
import { teamLast, teamNext } from './sportsdb.js';

const SUPABASE_URL = 'https://djnmrvhdklpclbrhxxqs.supabase.co';
// Public anon key (ships in the app); requests run with the player's own JWT.
const SUPABASE_ANON = 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';
const MODEL = 'gpt-realtime-2.1-mini';
const VOICE = 'marin';
// Voices the app may ask for (e.g. to compare them); anything else falls back to VOICE.
const VOICES = new Set(['coral', 'shimmer', 'sage', 'marin', 'ballad', 'alloy', 'verse', 'cedar', 'ash', 'echo']);
export const DAILY_SECONDS = 5 * 60;

// ── Usage book (small JSON file; systemd StateDirectory) ─────────────────────
const STATE_DIR = process.env.STATE_DIRECTORY || join(process.cwd(), '.state');
const USAGE_FILE = join(STATE_DIR, 'voice-usage.json');
let usage = {}; // { 'YYYY-MM-DD': { userId: seconds } }
try {
  usage = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
} catch {
  usage = {};
}

const today = () => new Date().toISOString().slice(0, 10);

function used(userId) {
  return usage[today()]?.[userId] ?? 0;
}

function book(userId, seconds) {
  const day = today();
  // Keep only today's book.
  for (const d of Object.keys(usage)) if (d !== day) delete usage[d];
  usage[day] ??= {};
  usage[day][userId] = Math.min(DAILY_SECONDS, (usage[day][userId] ?? 0) + seconds);
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(USAGE_FILE, JSON.stringify(usage));
  } catch (err) {
    console.error('voice usage write:', err.message);
  }
  return remaining(userId);
}

const remaining = (userId) => Math.max(0, DAILY_SECONDS - used(userId));

// ── Supabase: who is calling + their profile ─────────────────────────────────
async function supabaseUser(token) {
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user?.id ? user : null;
}

async function profileOf(userId, token) {
  const fields = 'name,language,favourite_team,favourite_team_id,favourite_team_league,favourite_sports,vip_tier,streak_days';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=${fields}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return (await res.json())[0] ?? null;
}

async function liveFor(teamId) {
  if (!teamId) return null;
  try {
    const [next, last] = await Promise.all([teamNext(teamId), teamLast(teamId)]);
    return { next: next.body.events?.slice(0, 2) ?? [], last: last.body.events?.slice(0, 2) ?? [], news: [] };
  } catch {
    return null;
  }
}

const bearer = (c) => (c.req.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();

// ── Routes ───────────────────────────────────────────────────────────────────
/** GET /v1/voice/budget → { remaining, daily } */
export async function voiceBudget(c) {
  const user = await supabaseUser(bearer(c));
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json({ remaining: remaining(user.id), daily: DAILY_SECONDS });
}

/** POST /v1/voice/session { lang } → { client_secret, expires_at, remaining, model } */
export async function voiceSession(c) {
  if (!process.env.OPENAI_API_KEY) return c.json({ error: 'not_configured' }, 503);
  const token = bearer(c);
  const user = await supabaseUser(token);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const left = remaining(user.id);
  if (left < 10) return c.json({ error: 'daily_limit', remaining: 0 }, 429);

  const body = await c.req.json().catch(() => ({}));
  const profile = await profileOf(user.id, token);
  const lang = String(body.lang || profile?.language || 'en').slice(0, 2);
  const instructions = voicePrompt({
    name: (profile?.name ?? '').split(' ')[0] || 'friend',
    lang,
    team: profile?.favourite_team ?? null,
    teamLeague: profile?.favourite_team_league ?? null,
    sports: (profile?.favourite_sports ?? '').split(',').filter(Boolean),
    tier: profile?.vip_tier ?? null,
    streakDays: profile?.streak_days ?? null,
    live: await liveFor(profile?.favourite_team_id),
  });

  const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      // Stable, non-identifying id so OpenAI can attribute abuse per end user.
      'OpenAI-Safety-Identifier': createHash('sha256').update(user.id).digest('hex').slice(0, 32),
    },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: 60 },
      session: {
        type: 'realtime',
        model: MODEL,
        instructions,
        max_output_tokens: 1024,
        audio: {
          input: { turn_detection: { type: 'semantic_vad' }, noise_reduction: { type: 'near_field' } },
          // A touch faster: BETina is young and lively.
          output: { voice: VOICES.has(body.voice) ? body.voice : VOICE, speed: 1.08 },
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('openai client_secrets', res.status, detail.slice(0, 300));
    return c.json({ error: 'upstream_unavailable' }, 502);
  }
  const secret = await res.json();
  return c.json({ client_secret: secret.value, expires_at: secret.expires_at, remaining: left, model: MODEL });
}

/** POST /v1/voice/usage { seconds } → { remaining }. The app reports talk time every few seconds. */
export async function voiceUsage(c) {
  const user = await supabaseUser(bearer(c));
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({}));
  const seconds = Math.max(0, Math.min(60, Math.round(Number(body.seconds) || 0)));
  return c.json({ remaining: book(user.id, seconds) });
}
