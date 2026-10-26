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
import { appData } from './app-data.js';
import { voicePrompt } from './persona.js';
import { teamLast, teamNext } from './sportsdb.js';

const SUPABASE_URL = 'https://djnmrvhdklpclbrhxxqs.supabase.co';
// Public anon key (ships in the app); requests run with the player's own JWT.
const SUPABASE_ANON = 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';
const MODEL = 'gpt-realtime-2.1-mini';
const SEARCH_MODEL = 'gpt-5.4-mini'; // Responses API + web_search, ~4 s per search
const VOICE = 'marin';
// Voices the app may ask for (e.g. to compare them); anything else falls back to VOICE.
const VOICES = new Set(['coral', 'shimmer', 'sage', 'marin', 'ballad', 'alloy', 'verse', 'cedar', 'ash', 'echo']);
export const DAILY_SECONDS = 5 * 60;
const LIMIT_ON = true;
// Testers without the daily limit (Dejan, 2026-10-26).
const UNLIMITED = new Set(['aa5ea30d-9ef6-4597-9453-44b9b09997d2']);

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

/** Seconds left today, or null without a limit (switched off, or a tester). */
const remaining = (userId) => (LIMIT_ON && !UNLIMITED.has(userId) ? Math.max(0, DAILY_SECONDS - used(userId)) : null);

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
  const fields = 'name,language,favourite_team,favourite_team_id,favourite_team_league,favourite_sports,vip_tier,xp_points,streak_days,created_at';
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

// ── The player's app data (read with their own JWT, so RLS applies) ────────
async function sb(path, token, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  return res.ok ? res.json() : null;
}

async function memoriesOf(token) {
  const rows = await sb('betina_memories?select=content&order=created_at.desc&limit=15', token).catch(() => null);
  return (rows ?? []).map((r) => r.content).filter(Boolean);
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
  if (left != null && left < 10) return c.json({ error: 'daily_limit', remaining: 0 }, 429);

  const body = await c.req.json().catch(() => ({}));
  const profile = await profileOf(user.id, token);
  const lang = String(body.lang || profile?.language || 'en').slice(0, 2);
  const [memories, data] = await Promise.all([memoriesOf(token), appData({ supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON, token, userId: user.id, profile, tippspiel: true })]);
  const instructions = voicePrompt({
    name: (profile?.name ?? '').split(' ')[0] || 'friend',
    lang,
    team: profile?.favourite_team ?? null,
    teamLeague: profile?.favourite_team_league ?? null,
    sports: (profile?.favourite_sports ?? '').split(',').filter(Boolean),
    tier: profile?.vip_tier ?? null,
    streakDays: profile?.streak_days ?? null,
    xp: profile?.xp_points ?? null,
    memories,
    live: await liveFor(profile?.favourite_team_id),
  }, data);

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
        tools: [{
          type: 'function',
          name: 'live_scores',
          description: "Football live scores, today's and yesterday's results and kick-off times with goal scorers (BETina Live). Use it first for any football score question.",
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Team, league or country, e.g. "Rapid Wien", "Premier League". Empty for the biggest live games.' } },
            required: [],
          },
        }, {
          type: 'function',
          name: 'web_search',
          description: 'Search the web for anything current or specific: weather anywhere, live scores and today\'s results, standings, transfers, news, events, opening hours, facts.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'What to look up, in natural language, with place and date if relevant.' } },
            required: ['query'],
          },
        }],
        tool_choice: 'auto',
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

// Searches per player per hour (keeps a runaway call from burning money).
const SEARCHES_PER_HOUR = 40;
const searchLog = new Map(); // userId -> timestamps (ms)

/** POST /v1/voice/search { query, lang } → { answer }. Called by the app when BETina uses web_search. */
export async function voiceSearch(c) {
  if (!process.env.OPENAI_API_KEY) return c.json({ error: 'not_configured' }, 503);
  const user = await supabaseUser(bearer(c));
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const now = Date.now();
  const recent = (searchLog.get(user.id) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= SEARCHES_PER_HOUR) return c.json({ answer: 'Search limit reached for now — answer from what you know or suggest trying later.' });
  recent.push(now);
  searchLog.set(user.id, recent);

  const body = await c.req.json().catch(() => ({}));
  const query = String(body.query ?? '').trim().slice(0, 300);
  if (!query) return c.json({ answer: 'Empty query.' });
  const lang = String(body.lang ?? 'en').slice(0, 2);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SEARCH_MODEL,
        tools: [{ type: 'web_search' }],
        instructions: `Today is ${new Date().toISOString().slice(0, 10)}. Look this up on the web and answer in 1–3 short factual sentences in the language with ISO code "${lang}", ready to be spoken: concrete numbers, names and times, no URLs, no markdown, no source list. If the web has no clear answer, say so.`,
        input: query,
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`responses ${res.status}`);
    const d = await res.json();
    const answer = (d.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? [])
      .map((cc) => cc.text ?? '').join(' ')
      // Drop inline source links ([site](url)) — BETina speaks, she doesn't read URLs.
      .replace(/\(\[[^\]]*\]\([^)]*\)\)|\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\s+([.,!?;:])/g, '$1')
      .trim();
    return c.json({ answer: answer || 'No clear answer found.' });
  } catch (err) {
    console.error('voice search:', err.message);
    return c.json({ answer: 'The search failed just now — say so briefly and offer to try again.' });
  }
}

/** POST /v1/voice/usage { seconds } → { remaining }. The app reports talk time every few seconds. */
export async function voiceUsage(c) {
  const user = await supabaseUser(bearer(c));
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({}));
  const seconds = Math.max(0, Math.min(60, Math.round(Number(body.seconds) || 0)));
  return c.json({ remaining: book(user.id, seconds) });
}
