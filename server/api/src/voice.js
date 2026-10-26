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
// TEST PHASE (Dejan, 2026-10-26): no daily limit while he tests.
// Switch back to true before the store release.
const LIMIT_ON = false;

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

/** Seconds left today, or null while the limit is off. */
const remaining = (userId) => (LIMIT_ON ? Math.max(0, DAILY_SECONDS - used(userId)) : null);

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

const TIERS = [['INITIATE', 0], ['THINKER', 1000], ['ANALYST', 3000], ['MASTERMIND', 8000], ['GENIUS', 20000]];

async function memoriesOf(token) {
  const rows = await sb('betina_memories?select=content&order=created_at.desc&limit=15', token).catch(() => null);
  return (rows ?? []).map((r) => r.content).filter(Boolean);
}

/** Compact text block: level, Tippspiel season, duel, tips side by side with BETina's. */
export async function appData(userId, token, profile) {
  const lines = [];
  const xp = Number(profile?.xp_points ?? 0);
  const idx = TIERS.reduce((i, [, min], k) => (xp >= min ? k : i), 0);
  const next = TIERS[idx + 1];
  lines.push(`- Level: ${TIERS[idx][0]}, ${xp} XP${next ? ` — ${next[1] - xp} XP to ${next[0]}` : ' (top tier)'}; daily streak ${profile?.streak_days ?? 0} days${profile?.created_at ? `; in the app since ${String(profile.created_at).slice(0, 10)}` : ''}.`);
  lines.push('- XP comes from daily opens (+5 + streak), chatting (+1 per message), Tippspiel points (5 XP each) and onboarding. Never from money.');

  try {
    const [tips, board, stats, groups] = await Promise.all([
      sb(`tips?user_id=eq.${userId}&select=match_id,home,away,points,tip_matches(competition,home_name,away_name,kickoff,status,home_score,away_score)&order=updated_at.desc&limit=30`, token),
      sb('rpc/tip_leaderboard', token, { p_competition: null, p_matchday: null, p_group: null, p_limit: 1 }),
      sb('rpc/tip_my_stats', token, { p_competition: null }),
      sb('rpc/my_tip_groups', token, {}),
    ]);
    const me = (board ?? []).find((r) => r.is_me);
    const her = (board ?? []).find((r) => r.is_betina);
    if (me) lines.push(`- Tippspiel season: ${me.points} points, rank ${me.rank}, ${me.exact} exact hits from ${me.tips} tips.`);
    if (her) lines.push(`- Your own (BETina's) season: ${her.points} points, rank ${her.rank}.`);
    if (stats?.duel) lines.push(`- Duel on matches you both tipped: player ${stats.duel.me} points vs you ${stats.duel.betina} (${stats.duel.matches} matches).`);
    if (stats?.streak) lines.push(`- Scoring streak: ${stats.streak} rounds in a row with points.`);

    const mine = tips ?? [];
    const ids = mine.map((t) => t.match_id);
    // BETina's tips are readable from kickoff only (RLS) — so future ones stay secret.
    const hers = ids.length ? await sb(`betina_tips?match_id=in.(${ids.join(',')})&select=match_id,home,away,points`, token) : [];
    const herBy = new Map((hers ?? []).map((b) => [b.match_id, b]));
    const now = Date.now();
    const label = (m) => `${m.home_name} vs ${m.away_name} (${m.competition})`;
    const scored = mine.filter((t) => t.points != null && t.tip_matches)
      .sort((a, b) => Date.parse(b.tip_matches.kickoff) - Date.parse(a.tip_matches.kickoff)).slice(0, 8);
    if (scored.length) {
      lines.push('- Latest scored matches (result · their tip · your tip):');
      for (const t of scored) {
        const m = t.tip_matches;
        const b = herBy.get(t.match_id);
        lines.push(`  • ${label(m)}: ${m.home_score}:${m.away_score} · they ${t.home}:${t.away} (+${t.points})${b ? ` · you ${b.home}:${b.away}${b.points != null ? ` (+${b.points})` : ''}` : ''}`);
      }
    }
    const upcoming = mine.filter((t) => t.tip_matches && Date.parse(t.tip_matches.kickoff) > now)
      .sort((a, b) => Date.parse(a.tip_matches.kickoff) - Date.parse(b.tip_matches.kickoff)).slice(0, 8);
    if (upcoming.length) {
      lines.push('- Their tips for upcoming matches (yours stay secret until kickoff):');
      for (const t of upcoming) lines.push(`  • ${label(t.tip_matches)}, ${t.tip_matches.kickoff.slice(0, 16).replace('T', ' ')} UTC: ${t.home}:${t.away}`);
    }
    if (Array.isArray(groups) && groups.length) {
      lines.push(`- Their Tipprunden (prediction groups): ${groups.map((g) => `${g.name} (${g.members} members)`).join(', ')}.`);
    }
  } catch (err) {
    console.error('voice app data:', err.message);
  }
  return lines.join('\n');
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
  const [memories, data] = await Promise.all([memoriesOf(token), appData(user.id, token, profile)]);
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
