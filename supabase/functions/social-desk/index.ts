// BETina on X — Supabase Edge Function (Deno), every minute via pg_cron
// (job "social-desk", migration 025). BETina writes her own posts from our
// own data; social_settings.mode decides what happens with them:
//   off     nothing at all (kill switch)
//   drafts  posts wait in the team dashboard (/admin → Social); approved ones go out
//   auto    the kinds in auto_kinds go out on their own; replies and anything
//           the filter flagged still wait for approval
//
// What she writes, in Europe/Vienna time — few posts, each with an image card
// (rendered by betina-server from social_posts.card; agreed with Dejan
// 2026-11-07 after a first week of ~15 posts a day and few views):
//   poll      09:00  "who takes it?" for today's biggest match (Claude picks
//                    the 1–2 biggest = "featured")
//   goal      live   at most one per featured match: a late, decisive goal
//                    (from minute 75, equaliser or one-goal lead; 2 min VAR delay)
//   result    live   full time of the featured matches
//   news      11–21  one story a day from our newsroom (importance ≥ 4); on a
//                    day without a featured match a second one from 16:00,
//                    from another sport
//   history   12:00  time travel: "on this day" from Wikipedia, else social_moments
//   reply     live   answers to @-mentions (always waits for approval)
// Facts always come from the data; the filters below keep sad news, betting
// talk and over-long posts away from X.
//
// Instagram + Facebook (migration 027): the best X posts (time travel, big
// results, news) follow there with a caption of their own and a 4:5 card —
// see metaPublish().
//
// Deploy: supabase functions deploy social-desk --no-verify-jwt
// Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//         X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET (optional:
//         without them nothing is posted — drafts only)
//         META_PAGE_TOKEN (optional: Instagram + Facebook)

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { metaCaptionInstructions, socialInstructions, SocialKind } from '../_shared/betina-persona.ts';

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;

const API = 'https://api.betina.geniusbet.com/v1';
const X = 'https://api.x.com/2';
const MODEL = 'claude-haiku-5-5';
const TZ = 'Europe/Vienna';
const GOAL_DELAY_MS = 2 * 60_000;     // wait for VAR before a goal post
const LIVE_WINDOW_MS = 15 * 60_000;   // older incidents are not news anymore
const GOAL_FROM_MINUTE = 75;          // only late goals can get a post
const FEATURED_MAX = 2;
const MENTIONS_EVERY_MS = 3 * 60_000;
const POSTS_PER_RUN = 3;

// Competitions a "featured" match can come from: the big tournaments, the big
// five, then GeniusBet's markets (league ids of API-Football).
const FEATURE_LEAGUES = new Set([
  1, 2, 3, 848, 4, 5, 9, 15, 39, 140, 135, 78, 61,
  218, 210, 283, 203, 94, 88, 71, 128, 13, 6, 12,
]);

// Source material we never joke about (news, Wikipedia).
const SENSITIVE = /\b(dies?|died|death|dead|killed|kill|tragedy|tragic|disaster|crash|accident|injur\w*|hospital\w*|cancer|illness|surgery|attack\w*|violen\w*|riot\w*|stab\w*|shoot\w*|racis\w*|abuse\w*|assault\w*|arrest\w*|police|court|trial|prison|jail|war|terror\w*|suicide|mourn\w*|funeral|doping|fixing|bribe\w*|scandal|massacre|stampede|crush)\b/i;
// What BETina's own text must never contain.
const BETTING = /\b(bet|bets|betting|odds|wager\w*|stakes?|punt\w*|acca|accumulator|tips?|tipster|bookies?|bookmakers?|sure thing|guaranteed|bonus)\b/i;

type Settings = {
  mode: 'off' | 'drafts' | 'auto'; auto_kinds: string[]; daily_limit: number; lang: string;
  featured: { date?: string; ids?: number[] }; x_user_id: string | null; mentions_since: string | null;
  last_mentions: string;
};
type Team = { id: number; n: string };
type Match = { id: number; ts: number; st: string; min: number | null; lg: number; h: Team; a: Team; g: [number | null, number | null] };
type Incident = {
  seq: number; at: number; type: string; id: number; side?: 0 | 1; min?: number | null; player?: string | null; detail?: string;
  h: Team; a: Team; g: [number | null, number | null]; league: { id: number; name: string; country: string; round?: string };
};
/** What the post's image card shows — see server/api/src/card.js. */
type Card = Record<string, string | number | boolean | null | undefined> & { t: 'goal' | 'result' | 'poll' | 'history' | 'news'; mood: string };
type Draft = {
  kind: SocialKind; text: string; dedupe_key: string; context: string; card?: Card;
  poll?: string[]; reply_to?: string; reply_author?: string; reply_text?: string; expires_at?: string;
  platform?: 'x' | 'instagram' | 'facebook'; // where it goes out; replies to Instagram/Facebook comments set it
};

// ── BETina's mood on the card (photos in server/api/assets/betina) ──────────
/** Same input, same pick — but varied across matches and days. */
const pickOf = <T>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

/** Everyday photos for cards whose mood isn't set by the score (15 added 2026-11-10). */
const NEWS_MOODS = [
  'studio', 'zeitung', 'podcast', 'analyse', 'kiosk', 'laptop-nacht', 'pressetribuene', 'zug',
  'regen-fenster', 'buchladen', 'couch-abend', 'nachdenklich', 'dachterrasse', 'stadt-nacht', 'zwinkern',
];
/** Morning of a match day. */
const POLL_MOODS = ['matchday-morgen', 'kueche', 'stadion-gang', 'trainingsplatz', 'zwinkern', 'nachdenklich', 'strand', 'zug'];

/** analyse and matchday-morgen are the same café-and-coffee scene, so they count as one look. */
const look = (mood: unknown) => (mood === 'matchday-morgen' ? 'analyse' : String(mood));

/**
 * Like pickOf, but skips looks on BETina's latest cards (X and Instagram), so
 * the feed never shows the same photo twice in a row (two café shots on 2026-11-10).
 */
async function freshMood(db: Db, list: string[], seed: number) {
  const [{ data: x }, { data: ig }] = await Promise.all([
    db.from('social_posts').select('card').not('card', 'is', null).in('status', ['approved', 'posted'])
      .order('created_at', { ascending: false }).limit(5),
    db.from('social_posts').select('card').eq('meta_status', 'posted')
      .order('meta_posted_at', { ascending: false }).limit(3),
  ]);
  const recent = new Set([...(x ?? []), ...(ig ?? [])].map((r) => look((r.card as Card | null)?.mood)));
  const start = Math.abs(seed) % list.length;
  const order = list.map((_, i) => list[(start + i) % list.length]);
  return order.find((m) => !recent.has(look(m))) ?? order[0];
}

function goalCard(i: Incident, min: number): { card: Card; diff: number } {
  const [hs, as] = [i.g[0] ?? 0, i.g[1] ?? 0];
  const diff = i.side === 1 ? as - hs : hs - as; // for the scoring team, after the goal
  const tag = min >= 85 ? 'Late drama' : diff === 0 ? 'All square' : 'In front';
  const mood = min >= 85 ? pickOf(['schock', 'jubel'], i.seq) : pickOf(['jubel', 'strasse'], i.seq);
  return {
    diff,
    card: { t: 'goal', mood, tag, league: i.league.name, home: i.h.n, away: i.a.n, hs, as, side: i.side ?? 0, min, scorer: i.player ?? null },
  };
}

function resultCard(i: Incident): Card {
  const [hs, as] = [i.g[0] ?? 0, i.g[1] ?? 0];
  const total = hs + as, diff = Math.abs(hs - as);
  const [tag, mood] =
    total >= 5 ? ['Goal fest', 'schock']
    : total === 0 ? ['Goalless', 'enttaeuscht']
    : diff === 0 ? ['All square', 'analyse']
    : diff >= 3 ? ['Statement win', 'zwinkern']
    : diff === 1 ? ['Tight one', pickOf(['jubel', 'strasse', 'nervoes'], i.id)]
    : ['Job done', pickOf(['zwinkern', 'couch-abend', 'stadt-nacht', 'dachterrasse'], i.id)];
  return { t: 'result', mood, tag, league: i.league.name, home: i.h.n, away: i.a.n, hs, as };
}

/** How the score reads, so her words can't contradict it ("two-nil" at 2–1). */
function margin(home: string, away: string, hs: number, as: number, done: boolean) {
  if (hs === as) return done ? 'The match ended level.' : 'The match is level.';
  const [lead, by] = hs > as ? [home, hs - as] : [away, as - hs];
  const goals = by === 1 ? 'one goal' : `${by} goals`;
  return done ? `${lead} won by ${goals}.` : `${lead} lead by ${goals}.`;
}

function historyMood(year: number, text: string) {
  if (/\btennis|wimbledon|grand slam\b/i.test(text)) return 'tennis';
  if (/\bnba|basketball\b/i.test(text)) return 'basketball';
  if (/\bformula one|grand prix|f1\b/i.test(text)) return 'motorsport';
  return year < 1980 ? 'zeitreise-1966' : year < 1995 ? 'zeitreise-1986' : 'zeitreise-1998';
}

const client = new Anthropic();
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

// ── Time in Vienna ───────────────────────────────────────────────────────────
function vienna(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const offset = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - now.getTime()) / 60_000);
  return { date, month: p.month, day: p.day, hour: +p.hour, offset };
}

// ── Claude ───────────────────────────────────────────────────────────────────
const POST_SCHEMA = {
  type: 'object',
  properties: {
    skip: { type: 'boolean' },
    reason: { type: 'string', description: 'If skip: why, in a few words. Else empty.' },
    text: { type: 'string' },
  },
  required: ['skip', 'reason', 'text'],
  additionalProperties: false,
};
const MAX_LEN = 270; // X allows 280 — keep a little room for the team's edits

/** Why the last Claude call gave nothing — ends up in the "passed" note in the dashboard. */
let claudeError = '';

async function claudeJson<T>(system: string, user: string, schema: object): Promise<T | null> {
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system,
      // @ts-ignore: output_config is newer than some SDK type definitions
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: user }],
    });
    if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') {
      claudeError = `stop: ${res.stop_reason}`;
      return null;
    }
    const text = res.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') {
      claudeError = 'no text block';
      return null;
    }
    return JSON.parse(text.text) as T;
  } catch (err) {
    claudeError = (err as Error).message.slice(0, 160);
    console.error('claude:', claudeError);
    return null;
  }
}

type Written = { text?: string; why?: string };

/**
 * BETina writes one post from the facts. She sees her latest posts, so she
 * doesn't repeat herself. A draft that doesn't fit X gets up to two shorter
 * rewrites; if it still doesn't fit, it's dropped — nobody has to cut it.
 * `reserve`: characters the caller adds in front (the score line).
 */
async function write(db: Db, kind: SocialKind, lang: string, facts: string, reserve = 0): Promise<Written> {
  // Replies are compared with replies only, posts with posts.
  let q = db.from('social_posts').select('text').in('status', ['draft', 'approved', 'posted']);
  q = kind === 'reply' ? q.eq('kind', 'reply') : q.neq('kind', 'reply');
  const { data: recent } = await q.order('created_at', { ascending: false }).limit(kind === 'reply' ? 8 : 12);
  const before = (recent ?? []).map((r) => `- ${r.text.replace(/\s*\n+\s*/g, ' ')}`).join('\n');
  const input = `${facts}${before ? `\n\nYour latest ${kind === 'reply' ? 'replies' : 'posts'} — don’t reuse their openings, jokes or images:\n${before}` : ''}`;
  type Out = { skip: boolean; reason: string; text: string };

  claudeError = '';
  let out = await claudeJson<Out>(socialInstructions(kind, lang), input, POST_SCHEMA);
  for (const target of [160, 110]) {
    if (!out || out.skip || xLength(out.text.trim()) + reserve <= MAX_LEN) break;
    // A failed rewrite keeps the draft we have (and ends below as "too long").
    out = await claudeJson<Out>(
      socialInstructions(kind, lang),
      `${input}\n\nYour draft has ${xLength(out.text.trim())} characters, too long:\n${out.text}\nRewrite it in under ${target} characters, same shape.`,
      POST_SCHEMA,
    ) ?? out;
  }
  if (!out) return { why: `model error${claudeError ? ` (${claudeError})` : ''}` };
  const text = out.text?.trim();
  if (out.skip || !text) return { why: out.reason?.trim() || 'nothing to say' };
  return xLength(text) + reserve <= MAX_LEN ? { text } : { why: 'too long even after rewriting' };
}

/** Drafts written before the rewrite rule: shorten them in place. */
async function shortenDrafts(db: Db, s: Settings) {
  const { data: long } = await db.from('social_posts').select('id, kind, text, poll')
    .eq('status', 'draft').contains('flags', ['too_long']).limit(3);
  for (const p of long ?? []) {
    const out = await claudeJson<{ skip: boolean; reason: string; text: string }>(
      socialInstructions(p.kind as SocialKind, s.lang),
      `Shorten this post of yours to under 200 characters. Keep its facts, its shape and its first line if that is a score line:\n${p.text}`,
      POST_SCHEMA,
    );
    const text = out?.text?.trim();
    if (!text || out?.skip || xLength(text) > MAX_LEN) {
      await db.from('social_posts').update({ status: 'skipped', error: 'too long' }).eq('id', p.id);
      continue;
    }
    const d = { kind: p.kind as SocialKind, text, poll: p.poll ?? undefined, dedupe_key: '', context: '' };
    await db.from('social_posts').update({ text, flags: flagsFor(d) }).eq('id', p.id);
  }
}

// ── Filters ──────────────────────────────────────────────────────────────────
/** X counts most emoji and CJK characters double. */
function xLength(s: string) {
  let n = 0;
  for (const ch of s) n += (ch.codePointAt(0) ?? 0) > 0x10ff ? 2 : 1;
  return n;
}

function flagsFor(d: Draft): string[] {
  const flags: string[] = [];
  if (BETTING.test(d.text) || d.poll?.some((o) => BETTING.test(o))) flags.push('betting_words');
  if (/https?:\/\//i.test(d.text)) flags.push('link');
  if (/(^|\s)@\w/.test(d.text)) flags.push('mention');
  const tags = d.text.match(/#\w+/g)?.length ?? 0;
  if (tags > 1 || (tags && (d.kind === 'reply' || d.kind === 'poll'))) flags.push('hashtags');
  if (xLength(d.text) > 280) flags.push('too_long');
  if (d.poll?.some((o) => o.length > 25)) flags.push('poll_option_too_long');
  return flags;
}

/** The card font (Archivo) covers Latin script only; anything else posts without a card. */
const cardFits = (c?: Card) => !!c && Object.values(c).every((v) => typeof v !== 'string' || !/[^\u0000-ɏḀ-ỿ‐-‧]/.test(v));

async function save(db: Db, s: Settings, d: Draft) {
  if (d.card && !cardFits(d.card)) d = { ...d, card: undefined };
  if (d.card) d = { ...d, card: await withXPhoto(db, d.card, d.dedupe_key) };
  const flags = flagsFor(d);
  const auto = s.mode === 'auto' && d.kind !== 'reply' && s.auto_kinds.includes(d.kind) && flags.length === 0;
  const { error } = await db.from('social_posts').insert({ ...d, flags, status: auto ? 'approved' : 'draft' });
  // A duplicate key just means another run wrote it already.
  if (error && error.code !== '23505') console.error('save:', error.message);
}

/** BETina passed (or the model failed): remember it, so the next run doesn't try again. */
async function pass(db: Db, kind: SocialKind, key: string, context: string, why?: string) {
  await db.from('social_posts').insert({ kind, text: `(BETina passed${why ? `: ${why}` : ''})`, dedupe_key: key, context, status: 'skipped' });
}

async function exists(db: Db, key: string) {
  const { count } = await db.from('social_posts').select('id', { count: 'exact', head: true }).eq('dedupe_key', key);
  return (count ?? 0) > 0;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${new URL(url).pathname} ${r.status}`);
  return r.json() as Promise<T>;
}

// ── Matchday + poll ──────────────────────────────────────────────────────────
async function matchday(db: Db, s: Settings, v: ReturnType<typeof vienna>) {
  if (v.hour < 9 || s.featured.date === v.date) return;
  // Mark the day first, so a slow or failed run doesn't repeat it every minute.
  await db.from('social_settings').update({ featured: { date: v.date, ids: [] } }).eq('id', 1);

  const day = await getJson<{ leagues: { league: { id: number; name: string; country: string }; matches: Match[] }[] }>(
    `${API}/live/day?date=${v.date}&tz=${v.offset}`,
  );
  const candidates = day.leagues
    .filter((l) => FEATURE_LEAGUES.has(l.league.id))
    .flatMap((l) => l.matches.filter((m) => m.st === 'NS').map((m) => ({ m, league: `${l.league.name} (${l.league.country})` })))
    .slice(0, 40);
  if (!candidates.length) return;

  const time = (ts: number) => new Date(ts * 1000).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const lines = candidates.map(({ m, league }) => `[${m.id}] ${m.h.n} vs ${m.a.n} — ${league}, ${time(m.ts)} CET`).join('\n');
  const picked = await claudeJson<{ featured: number[] }>(
    'You run the social account of a football fan with followers all over the world. From today’s fixtures pick the 1 or 2 biggest, most talked-about matches (famous clubs with big international fan bases, derbies, title races, knockout games). Fewer is better: pick a second one only if it is truly big. Return their ids, the biggest first.',
    lines,
    { type: 'object', properties: { featured: { type: 'array', items: { type: 'integer' } } }, required: ['featured'], additionalProperties: false },
  );
  const byId = new Map(candidates.map((c) => [c.m.id, c]));
  const featured = (picked?.featured ?? []).filter((id) => byId.has(id)).slice(0, FEATURED_MAX);
  if (!featured.length) return;
  await db.from('social_settings').update({ featured: { date: v.date, ids: featured } }).eq('id', 1);

  // The morning post is the poll on the biggest match (no separate fixture list anymore).
  const top = byId.get(featured[0])!;
  const leagueName = day.leagues.find((l) => l.matches.some((m) => m.id === top.m.id))?.league.name ?? '';
  const { text: question } = await write(db, 'poll', s.lang, `Match: ${top.m.h.n} vs ${top.m.a.n} — ${top.league}, kick-off ${time(top.m.ts)} CET`);
  if (question) {
    const short = (n: string) => (n.length > 25 ? n.slice(0, 24) + '…' : n);
    await save(db, s, {
      kind: 'poll', text: question, poll: [short(top.m.h.n), 'Draw', short(top.m.a.n)],
      dedupe_key: `poll:${v.date}`, context: `${top.m.h.n} vs ${top.m.a.n}`,
      card: { t: 'poll', mood: await freshMood(db, POLL_MOODS, top.m.id), league: leagueName, kickoff: `${time(top.m.ts)} CET`, home: top.m.h.n, away: top.m.a.n },
      expires_at: new Date(top.m.ts * 1000 - 30 * 60_000).toISOString(),
    });
  }
}

// ── Goals + results of the featured matches ─────────────────────────────────
async function live(db: Db, s: Settings, v: ReturnType<typeof vienna>) {
  const ids = new Set(s.featured.date === v.date ? s.featured.ids ?? [] : []);
  if (!ids.size) return;
  const { incidents } = await getJson<{ incidents: Incident[] }>(`${API}/live/incidents?since=0`);
  const now = Date.now();
  for (const i of incidents) {
    if (!ids.has(i.id) || now - i.at > LIVE_WINDOW_MS) continue;
    const score = `${i.h.n} ${i.g[0] ?? 0}–${i.g[1] ?? 0} ${i.a.n}`;
    const where = `${i.league.name}, ${i.league.country}`;

    if (i.type === 'goal') {
      if (now - i.at < GOAL_DELAY_MS) continue;
      // Only the goal that decides it: late, and making it level or a one-goal lead.
      const min = i.min ?? 0;
      if (min < GOAL_FROM_MINUTE) continue;
      const { card, diff } = goalCard(i, min);
      if (diff < 0 || diff > 1) continue;
      // Taken back by VAR in the meantime: no post.
      if (incidents.some((x) => x.id === i.id && x.type === 'disallowed' && x.seq > i.seq)) continue;
      // At most one goal post per match.
      const { count } = await db.from('social_posts').select('id', { count: 'exact', head: true })
        .like('dedupe_key', `goal:${i.id}:%`).neq('status', 'skipped');
      if (count) continue;
      const key = `goal:${i.id}:${i.g[0] ?? 0}-${i.g[1] ?? 0}`;
      if (await exists(db, key)) continue;
      const team = i.side === 1 ? i.a.n : i.h.n;
      const facts = [
        `GOAL for ${team} in minute ${min}${i.player ? `, scored by ${i.player}` : ''}${i.detail && i.detail !== 'Normal Goal' ? ` (${i.detail})` : ''}.`,
        `Score now: ${score} (${where}). ${margin(i.h.n, i.a.n, i.g[0] ?? 0, i.g[1] ?? 0, false)}`,
      ].join('\n');
      // The score line comes from the data, so it's always right.
      const head = `GOAL ⚽ ${score}`;
      const { text, why } = await write(db, 'goal', s.lang, facts, xLength(head) + 2);
      if (text) await save(db, s, { kind: 'goal', text: `${head}\n\n${text}`, dedupe_key: key, context: facts, card, expires_at: new Date(i.at + 20 * 60_000).toISOString() });
      else await pass(db, 'goal', key, facts, why);
    }

    if (i.type === 'ft') {
      const key = `result:${i.id}`;
      if (await exists(db, key)) continue;
      const facts = `FULL TIME: ${score} (${where}). ${margin(i.h.n, i.a.n, i.g[0] ?? 0, i.g[1] ?? 0, true)}`;
      const head = `FT: ${score}`;
      const { text, why } = await write(db, 'result', s.lang, facts, xLength(head) + 2);
      if (text) await save(db, s, { kind: 'result', text: `${head}\n\n${text}`, dedupe_key: key, context: facts, card: resultCard(i), expires_at: new Date(i.at + 60 * 60_000).toISOString() });
      else await pass(db, 'result', key, facts, why);
    }
  }
}

// ── News from our own newsroom ──────────────────────────────────────────────
async function news(db: Db, s: Settings, v: ReturnType<typeof vienna>) {
  if (v.hour < 11 || v.hour >= 21) return;
  // One story a day: the biggest one; stories she passed on don't count.
  // A day without a featured match (no poll, goals or results) gets a second
  // story in the afternoon, from another sport than the first.
  const dayStart = new Date(Date.parse(`${v.date}T00:00:00Z`) - v.offset * 60_000).toISOString();
  const { data: today } = await db.from('social_posts').select('card')
    .eq('kind', 'news').neq('status', 'skipped').gte('created_at', dayStart);
  const done = today?.length ?? 0;
  const quiet = s.featured.date === v.date && !(s.featured.ids ?? []).length;
  if (done >= (quiet ? 2 : 1) || (done === 1 && v.hour < 16)) return;
  const used = new Set((today ?? []).map((p) => (p.card as { discipline?: string | null } | null)?.discipline ?? ''));

  const since = new Date(Date.now() - 12 * 3_600_000).toISOString();
  const { data: stories } = await db.from('news_stories')
    .select('id, sport, competition, teams, importance, news_articles!inner(lang, headline, teaser, body, take)')
    .eq('status', 'ready').gte('importance', 4).gte('published_at', since).eq('news_articles.lang', 'en')
    .order('importance', { ascending: false }).order('published_at', { ascending: false }).limit(20);

  let tries = 0;
  for (const st of stories ?? []) {
    if (tries >= 3) return;
    const key = `news:${st.id}`;
    if (await exists(db, key)) continue;
    if (done && used.has(st.sport ?? '')) continue;
    const a = (st.news_articles as { headline: string; teaser: string; body: string[]; take: string | null }[])[0];
    if (!a) continue;
    const source = [a.headline, a.teaser, ...(a.body ?? [])].join('\n');
    if (SENSITIVE.test(source)) continue;
    const facts = `Headline: ${a.headline}\nSummary: ${a.teaser}\nArticle:\n${(a.body ?? []).slice(0, 4).join('\n')}`;
    tries++;
    const { text, why } = await write(db, 'news', s.lang, facts);
    if (!text) {
      await pass(db, 'news', key, a.headline, why);
      continue;
    }
    const label = st.competition || (st.sport ? st.sport[0].toUpperCase() + st.sport.slice(1) : '');
    await save(db, s, {
      kind: 'news', text, dedupe_key: key, context: a.headline,
      card: { t: 'news', mood: await freshMood(db, NEWS_MOODS, +v.day), sport: label, discipline: st.sport ?? null, headline: a.headline },
      expires_at: new Date(Date.now() + 12 * 3_600_000).toISOString(),
    });
    return; // one story per run
  }
}

// ── History: on this day, else a legendary moment ───────────────────────────
const SPORTY = /\b(football|soccer|world cup|olympic\w*|championships?|cup|league|tennis|wimbledon|marathon|boxing|boxer|grand prix|formula one|tour de france|nba|nfl|super bowl|cricket|rugby|hockey|athlet\w*|medal|world record|stadium|tournament|club|goal|grand slam|heavyweight|sprint\w*)\b/i;

async function history(db: Db, s: Settings, v: ReturnType<typeof vienna>) {
  if (v.hour < 12) return;
  const key = `history:${v.date}`;
  if (await exists(db, key)) return;
  const year = +v.date.slice(0, 4);

  // 1. Wikipedia "on this day".
  let facts: string | null = null;
  let context = '';
  let card: Card | undefined;
  try {
    const otd = await getJson<{ events?: { text: string; year: number; pages?: { extract?: string }[] }[] }>(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${v.month}/${v.day}`,
      { headers: { 'User-Agent': 'BETina-social-desk/1.0 (https://betina.geniusbet.com/support)' } },
    );
    const events = (otd.events ?? []).filter((e) => SPORTY.test(e.text) && !SENSITIVE.test(e.text)).slice(0, 25);
    if (events.length) {
      const list = events.map((e, k) => `[${k}] ${e.year}: ${e.text}`).join('\n');
      const pick = await claudeJson<{ index: number; title: string }>(
        'From these events, pick the single best SPORTS moment for a fun post by a sports fan (famous matches, records, titles, great comebacks). Nothing sad, violent or political. Return its index, or -1 if none is a fun sports moment, and a short title for it in English (2 to 4 words, only facts from the text, e.g. "Juventus are born", "Bolt runs 9.58").',
        list,
        { type: 'object', properties: { index: { type: 'integer' }, title: { type: 'string' } }, required: ['index', 'title'], additionalProperties: false },
      );
      const e = pick && pick.index >= 0 ? events[pick.index] : undefined;
      if (e) {
        const extract = e.pages?.[0]?.extract ?? '';
        if (!SENSITIVE.test(extract)) {
          facts = `On this day, ${year - e.year} years ago (${e.year}): ${e.text}${extract ? `\nBackground: ${extract}` : ''}`;
          context = `Wikipedia · ${e.year}: ${e.text}`;
          const title = (pick!.title ?? '').trim().slice(0, 40);
          if (title) card = { t: 'history', mood: historyMood(e.year, e.text), year: e.year, title, today: true };
        }
      }
    }
  } catch (err) {
    console.error('wikipedia:', (err as Error).message);
  }

  if (facts) {
    const { text } = await write(db, 'history', s.lang, facts);
    if (text) return save(db, s, { kind: 'history', text, dedupe_key: key, context, card, expires_at: `${v.date}T23:00:00Z` });
    facts = null;
    card = undefined;
  }

  // 2. Our own moments: today's anniversary first, else the one unused longest.
  const { data: moments } = await db.from('social_moments').select('id, happened_on, title, facts, last_used')
    .order('last_used', { ascending: true, nullsFirst: true }).limit(200);
  const today = (moments ?? []).find((m) => m.happened_on.slice(5) === `${v.month}-${v.day}`);
  const m = today ?? (moments ?? [])[0];
  if (m) {
    const y = +m.happened_on.slice(0, 4);
    facts = today
      ? `On this day, ${year - y} years ago (${m.happened_on}): ${m.facts}`
      : `A moment from your time travels (${m.happened_on}, ${year - y} years ago — not today’s date, so don’t say “today”): ${m.facts}`;
    context = `Moment · ${m.title}`;
    card = { t: 'history', mood: historyMood(y, `${m.sport} ${m.facts}`), year: y, title: m.title, today: !!today };
    await db.from('social_moments').update({ last_used: v.date }).eq('id', m.id);
  }
  const { text, why } = facts ? await write(db, 'history', s.lang, facts) : { text: undefined, why: 'no moment found' };
  if (text) await save(db, s, { kind: 'history', text, dedupe_key: key, context, card, expires_at: `${v.date}T23:00:00Z` });
  else await pass(db, 'history', key, context, why);
}

// ── X API (OAuth 1.0a, user context of BETina's account) ────────────────────
// Pasted keys sometimes bring spaces or quotes along.
const env = (k: string) => (Deno.env.get(k) ?? '').trim().replace(/^["']|["']$/g, '');
const X_KEYS = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
/** For a 401: the keys' lengths and shape, never their values (expected about 25/50/50/45, token "<digits>-…"). */
const keyShape = () => X_KEYS.map((k) => env(k).length).join('/') +
  (/^\d+-/.test(env('X_ACCESS_TOKEN')) ? '' : ', access token not "<digits>-…"') +
  (X_KEYS.some((k) => /\s/.test(env(k))) ? ', whitespace inside a key' : '');
const xReady = () => ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'].every((k) => env(k));
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

async function oauthHeader(method: 'GET' | 'POST', url: string) {
  const u = new URL(url);
  const oauth: Record<string, string> = {
    oauth_consumer_key: env('X_API_KEY'),
    oauth_nonce: crypto.randomUUID().replaceAll('-', ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: env('X_ACCESS_TOKEN'),
    oauth_version: '1.0',
  };
  // The JSON body is not part of the signature; query parameters are.
  const params = [...Object.entries(oauth), ...u.searchParams.entries()]
    .map(([k, v]) => [enc(k), enc(v)])
    .sort(([a, av], [b, bv]) => (a === b ? (av < bv ? -1 : 1) : a < b ? -1 : 1));
  const base = [method, enc(u.origin + u.pathname), enc(params.map(([k, v]) => `${k}=${v}`).join('&'))].join('&');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(`${enc(env('X_API_SECRET'))}&${enc(env('X_ACCESS_SECRET'))}`),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base)));
  oauth.oauth_signature = btoa(String.fromCharCode(...sig));
  return 'OAuth ' + Object.entries(oauth).map(([k, v]) => `${enc(k)}="${enc(v)}"`).join(', ');
}

/** JSON body, or a multipart form for media (neither is part of the OAuth 1.0a signature). */
async function xFetch(method: 'GET' | 'POST', url: string, body?: unknown) {
  const form = body instanceof FormData ? body : undefined;
  const res = await fetch(url, {
    method,
    headers: { Authorization: await oauthHeader(method, url), ...(body && !form ? { 'Content-Type': 'application/json' } : {}) },
    body: form ?? (body ? JSON.stringify(body) : undefined),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`x ${res.status}: ${JSON.stringify(data).slice(0, 300)}${res.status === 401 ? ` (keys ${keyShape()})` : ''}`);
  return data;
}

/** The post's image card: rendered by betina-server, uploaded to X; returns the media id. */
async function uploadCard(postId: number): Promise<string> {
  const r = await fetch(`${API}/social/card/${postId}.png`, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`card ${r.status}`);
  const form = new FormData();
  form.append('media', new Blob([await r.arrayBuffer()], { type: 'image/png' }), `betina-${postId}.png`);
  form.append('media_category', 'tweet_image');
  form.append('media_type', 'image/png');
  const res = await xFetch('POST', `${X}/media/upload`, form) as { data?: { id?: string } };
  if (!res.data?.id) throw new Error('media upload: no id');
  return res.data.id;
}

async function publish(db: Db, s: Settings) {
  const now = new Date().toISOString();
  // Approved too late (a goal from an hour ago): don't post it anymore.
  await db.from('social_posts').update({ status: 'skipped', error: 'expired' })
    .eq('status', 'approved').lt('expires_at', now);

  // The daily limit is for BETina's own posts. Replies are approved one by one
  // and never count against it (7 approved replies blocked all posts on 2026-11-09).
  const { count } = await db.from('social_posts').select('id', { count: 'exact', head: true })
    .eq('status', 'posted').eq('platform', 'x').neq('kind', 'reply').gt('posted_at', new Date(Date.now() - 86_400_000).toISOString());
  const room = Math.max(0, s.daily_limit - (count ?? 0));

  // Replies to Instagram/Facebook comments go out through metaReplies().
  let q = db.from('social_posts').select('id, kind, text, poll, reply_to, card').eq('status', 'approved').eq('platform', 'x');
  if (room <= 0) q = q.eq('kind', 'reply');
  const { data: queue } = await q.order('created_at', { ascending: true }).limit(POSTS_PER_RUN + room);
  // At most POSTS_PER_RUN per run, and own posts only while there is room.
  let own = 0;
  const due = (queue ?? []).filter((p) => (p.kind === 'reply' ? true : own++ < room)).slice(0, POSTS_PER_RUN);
  let sent = 0;
  for (const p of due ?? []) {
    // Claim it, so an overlapping run can't post it twice.
    const { data: claimed } = await db.from('social_posts').update({ status: 'posting' })
      .eq('id', p.id).eq('status', 'approved').select('id');
    if (!claimed?.length) continue;
    try {
      const body: Record<string, unknown> = { text: p.text };
      if (p.poll?.length) body.poll = { options: p.poll, duration_minutes: 180 };
      if (p.reply_to) body.reply = { in_reply_to_tweet_id: p.reply_to };
      // X doesn't allow a poll and media in the same post: a poll's card goes
      // out as a reply right after it. Without the card the post still goes out.
      let mediaId: string | null = null;
      let note: string | null = null;
      if (p.card) {
        try {
          mediaId = await uploadCard(p.id);
        } catch (err) {
          note = `posted without image: ${(err as Error).message.slice(0, 200)}`;
        }
      }
      if (mediaId && !p.poll?.length) body.media = { media_ids: [mediaId] };
      const res = await xFetch('POST', `${X}/tweets`, body) as { data?: { id: string } };
      if (mediaId && p.poll?.length && res.data?.id) {
        await xFetch('POST', `${X}/tweets`, { text: 'Cast your vote 👆', media: { media_ids: [mediaId] }, reply: { in_reply_to_tweet_id: res.data.id } })
          .catch((err) => { note = `poll image reply failed: ${(err as Error).message.slice(0, 200)}`; });
      }
      await db.from('social_posts').update({ status: 'posted', x_id: res.data?.id ?? null, posted_at: new Date().toISOString(), error: note }).eq('id', p.id);
      sent++;
    } catch (err) {
      await db.from('social_posts').update({ status: 'failed', error: (err as Error).message }).eq('id', p.id);
    }
  }
  return sent;
}

// ── Replies to @-mentions (always wait for approval) ────────────────────────
async function mentions(db: Db, s: Settings) {
  if (Date.now() - Date.parse(s.last_mentions) < MENTIONS_EVERY_MS) return;
  await db.from('social_settings').update({ last_mentions: new Date().toISOString() }).eq('id', 1);

  let me = s.x_user_id;
  if (!me) {
    me = ((await xFetch('GET', `${X}/users/me`)) as { data: { id: string } }).data.id;
    await db.from('social_settings').update({ x_user_id: me }).eq('id', 1);
  }
  // Ads bring bursts of comments: take up to 50 per run, plus the post they answered.
  const q = new URLSearchParams({
    max_results: '50', expansions: 'author_id,referenced_tweets.id',
    'user.fields': 'username,name', 'tweet.fields': 'referenced_tweets',
  });
  if (s.mentions_since) q.set('since_id', s.mentions_since);
  type Tweet = { id: string; text: string; author_id: string; referenced_tweets?: { type: string; id: string }[] };
  const res = await xFetch('GET', `${X}/users/${me}/mentions?${q}`) as {
    data?: Tweet[]; meta?: { newest_id?: string };
    includes?: { users?: { id: string; username: string; name?: string }[]; tweets?: Tweet[] };
  };
  if (res.meta?.newest_id) await db.from('social_settings').update({ mentions_since: res.meta.newest_id }).eq('id', 1);
  // The very first fetch only sets the starting point; no answers to old mentions.
  if (!s.mentions_since) return;

  for (const m of res.data ?? []) {
    if (m.author_id === me) continue;
    const user = res.includes?.users?.find((u) => u.id === m.author_id);
    const author = user?.username ?? 'someone';
    const parentId = m.referenced_tweets?.find((r) => r.type === 'replied_to')?.id;
    const parent = res.includes?.tweets?.find((t) => t.id === parentId);
    const now = new Date();
    const when = now.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', hour: '2-digit', minute: '2-digit' });
    const comment = m.text.replace(/^(@\w+\s+)+/, ''); // drop the leading @handles X adds to replies
    const { text } = await write(db, 'reply', s.lang, [
      `It is ${when} (West Africa time, where most of your followers are).`,
      parent ? `${parent.author_id === me ? 'Your post' : 'The post'} they replied to:\n"""${parent.text}"""` : '',
      `Comment by ${user?.name ? `${user.name} (@${author})` : `@${author}`}:\n"""${comment}"""`,
    ].filter(Boolean).join('\n\n'));
    if (!text) continue;
    await save(db, s, {
      kind: 'reply', text, dedupe_key: `reply:${m.id}`, context: `@${author}`,
      reply_to: m.id, reply_author: author, reply_text: m.text, expires_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    });
  }
}

// ── Instagram + Facebook (Meta Graph API, migration 027) ────────────────────
// Fewer but nicer than X: BETina's best X posts (social_settings.meta_kinds)
// get an Instagram caption and the 4:5 card, at most meta_daily_limit a day,
// 3 h apart, between 08:00 and 23:00 Vienna.
const GRAPH = 'https://graph.facebook.com/v23.0';
const META_GAP_MS = 3 * 3_600_000;
const META_FRESH_MS = 6 * 3_600_000;   // older X posts don't go to Instagram anymore
const APP_URL = 'https://betina.geniusbet.com';
const metaReady = () => !!env('META_PAGE_TOKEN');

async function graph<T>(token: string, method: 'GET' | 'POST', path: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(method === 'GET' ? `${GRAPH}/${path}?${q}` : `${GRAPH}/${path}`, {
    method, body: method === 'POST' ? q : undefined, signal: AbortSignal.timeout(30_000),
  });
  const j = await r.json().catch(() => ({})) as T & { error?: { message?: string } };
  // The message never contains the token; the URL (which does) is not logged.
  if (!r.ok || j.error) throw new Error(`${path.split('/').pop()} ${r.status}: ${j.error?.message ?? 'no body'}`.slice(0, 300));
  return j;
}

/**
 * META_PAGE_TOKEN may be a Page token or a (system) user token that manages
 * BETina's page — with a user token, the page's own token is looked up.
 */
async function metaAuth(db: Db, s: MetaSettings) {
  const token = env('META_PAGE_TOKEN');
  type Page = { id: string; access_token?: string; instagram_business_account?: { id: string } };
  let page: Page;
  try {
    const { data } = await graph<{ data: Page[] }>(token, 'GET', 'me/accounts', { fields: 'id,access_token,instagram_business_account' });
    page = data.find((p) => p.id === s.fb_page_id) ?? data.find((p) => p.instagram_business_account) ?? data[0];
    if (!page) throw new Error('the token manages no Facebook page');
  } catch (err) {
    if (/no Facebook page/.test((err as Error).message)) throw err;
    page = await graph<Page>(token, 'GET', 'me', { fields: 'id,instagram_business_account' }); // a Page token
  }
  const ig = page.instagram_business_account?.id ?? null;
  if (page.id !== s.fb_page_id || ig !== s.ig_user_id) {
    await db.from('social_settings').update({ fb_page_id: page.id, ig_user_id: ig }).eq('id', 1);
  }
  return { token: page.access_token ?? token, page: page.id, ig };
}

/** Puts the app line in front of the hashtags (or at the end if there are none). */
function withCta(caption: string, cta: string) {
  const lines = caption.trim().split('\n');
  const last = lines[lines.length - 1].trim();
  if (last.startsWith('#')) return [...lines.slice(0, -1), cta, '', last].join('\n').replace(/\n{3,}/g, '\n\n');
  return `${caption.trim()}\n\n${cta}`;
}

// ── Instagram/Facebook photos (server/api/assets/betina-ig, 1080×1350) ──────
// Their own set (60, varied outfits, 2026-11-10), picked per post when it goes out.
const IG_SETS: Record<string, number> = {
  'news-fussball': 8, 'news-f1': 5, 'news-tennis': 4, 'news-basketball': 4, 'news-kampfsport': 3, 'news-allgemein': 6,
  'ergebnis-jubel': 4, 'ergebnis-schock': 3, 'ergebnis-knapp': 3, 'ergebnis-enttaeuscht': 2, 'ergebnis-abend': 2, lifestyle: 8,
};
const ZEITREISE = [1930, 1950, 1960, 1970, 1980, 1990, 2000, 2010]; // zeitreise-<decade>
const igSet = (...names: string[]) => names.flatMap((n) => Array.from({ length: IG_SETS[n] ?? 0 }, (_, i) => `${n}-${i + 1}`));

function newsSport(c: Card) {
  if (c.discipline) return String(c.discipline);
  const l = String(c.sport ?? '');
  return /formula|grand prix|f1|motogp|nascar|indycar/i.test(l) ? 'motorsport'
    : /tennis|atp|wta|open|wimbledon/i.test(l) ? 'tennis'
    : /nba|basketball|euroleague/i.test(l) ? 'basketball'
    : /ufc|mma|boxing/i.test(l) ? 'boxing'
    : /league|liga|serie a|bundesliga|ligue|cup|champions|football|soccer/i.test(l) ? 'football' : 'other';
}

/** Photos that fit the post, best first (time travel: the closest decade first). */
function igChoices(c: Card): string[] {
  if (c.t === 'goal') return igSet(...(Number(c.min) >= 85 ? ['ergebnis-schock', 'ergebnis-jubel'] : ['ergebnis-jubel']));
  if (c.t === 'poll') return igSet('news-fussball', 'news-allgemein');
  if (c.t === 'history') {
    const y = Number(c.year) || 1986;
    return [...ZEITREISE].sort((a, b) => Math.abs(a + 5 - y) - Math.abs(b + 5 - y)).map((d) => `zeitreise-${d}`);
  }
  if (c.t === 'result') {
    const byTag: Record<string, string[]> = {
      'Goal fest': ['ergebnis-schock', 'ergebnis-jubel'], Goalless: ['ergebnis-enttaeuscht', 'ergebnis-knapp'],
      'All square': ['ergebnis-knapp', 'ergebnis-enttaeuscht'], 'Statement win': ['ergebnis-jubel', 'ergebnis-abend'],
      'Tight one': ['ergebnis-knapp', 'ergebnis-jubel'], 'Job done': ['ergebnis-abend', 'ergebnis-jubel'],
    };
    return igSet(...(byTag[String(c.tag)] ?? ['ergebnis-jubel']));
  }
  const bySport: Record<string, string[]> = {
    football: ['news-fussball', 'news-allgemein'], tennis: ['news-tennis'], basketball: ['news-basketball'], nfl: ['news-basketball', 'news-allgemein'],
    motorsport: ['news-f1'], boxing: ['news-kampfsport'], mma: ['news-kampfsport'],
  };
  return igSet(...(bySport[newsSport(c)] ?? ['news-allgemein', 'lifestyle']));
}

/** A fitting photo that wasn't on the feed lately (time travel: only the last two of its own). */
async function pickIg(db: Db, c: Card, seed: number) {
  const { data } = await db.from('social_posts').select('kind, card').eq('meta_status', 'posted')
    .order('meta_posted_at', { ascending: false }).limit(12);
  const rows = (data ?? []).filter((r) => c.t !== 'history' || r.kind === 'history').slice(0, c.t === 'history' ? 2 : 12);
  const recent = new Set([...rows.map((r) => (r.card as Card | null)?.ig), c.xig]);
  const list = igChoices(c);
  const order = c.t === 'history' ? list : list.map((_, i) => list[(Math.abs(seed) + i) % list.length]);
  return order.find((n) => !recent.has(n)) ?? order[0];
}

/**
 * X gets the portrait set too (cropped to the photo area of the wide card),
 * on every other post, so the timeline mixes both sets (Dejan, 2026-11-10).
 */
async function withXPhoto(db: Db, c: Card, key: string): Promise<Card> {
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  if (Math.abs(seed) % 2) return c;
  const { data } = await db.from('social_posts').select('card').not('card', 'is', null).in('status', ['approved', 'posted'])
    .order('created_at', { ascending: false }).limit(8);
  const recent = new Set((data ?? []).map((r) => (r.card as Card | null)?.xig));
  const list = igChoices(c);
  const order = c.t === 'history' ? list : list.map((_, i) => list[(Math.abs(seed) + i) % list.length]);
  const xig = order.find((n) => !recent.has(n)) ?? order[0];
  return xig ? { ...c, xig } : c;
}

type MetaSettings = Settings & {
  meta_mode: 'off' | 'auto'; meta_kinds: string[]; meta_daily_limit: number; fb_page_id: string | null; ig_user_id: string | null;
  last_meta_comments: string;
};

async function metaPublish(db: Db, s: MetaSettings, v: ReturnType<typeof vienna>) {
  if (s.meta_mode !== 'auto' || v.hour < 8 || v.hour >= 23) return 0;
  const dayStart = new Date(Date.parse(`${v.date}T00:00:00Z`) - v.offset * 60_000).toISOString();
  const { data: done } = await db.from('social_posts').select('meta_posted_at, kind, card')
    .eq('meta_status', 'posted').neq('kind', 'reel') // reels are posted by hand and don't use up the daily photo posts
    .gte('meta_posted_at', new Date(Date.now() - 86_400_000).toISOString())
    .order('meta_posted_at', { ascending: false });
  const today = (done ?? []).filter((d) => d.meta_posted_at >= dayStart).length;
  if (today >= s.meta_daily_limit) return 0;
  if (done?.length && Date.now() - Date.parse(done[0].meta_posted_at) < META_GAP_MS) return 0;

  const { data: next } = await db.from('social_posts').select('id, kind, text, card')
    .eq('status', 'posted').in('kind', s.meta_kinds).not('card', 'is', null).is('meta_status', null)
    .gte('posted_at', new Date(Date.now() - META_FRESH_MS).toISOString())
    .order('posted_at', { ascending: true }).limit(5);
  // The grid should alternate: prefer a post whose type and photo differ from the last one.
  const last = done?.[0];
  const p = next?.find((c) => !last || (c.kind !== last.kind && look((c.card as Card).mood) !== look((last.card as Card | null)?.mood)))
    ?? next?.[0];
  if (!p) return 0;
  const { data: claimed } = await db.from('social_posts').update({ meta_status: 'posting' })
    .eq('id', p.id).is('meta_status', null).select('id');
  if (!claimed?.length) return 0;

  const { mood: _mood, ig: _ig, xig: _xig, discipline: _d, ...facts } = p.card as Card;
  claudeError = '';
  const out = await claudeJson<{ skip: boolean; reason: string; text: string }>(
    metaCaptionInstructions(s.lang),
    `Your X post:\n"""${p.text}"""\n\nFacts on the image card: ${JSON.stringify(facts)}`,
    POST_SCHEMA,
  );
  const caption = out?.text?.trim();
  if (!out || out.skip || !caption || BETTING.test(caption) || caption.length > 1500) {
    const why = !out ? `model error ${claudeError}` : out.skip ? out.reason : !caption ? 'empty' : BETTING.test(caption) ? 'betting words' : 'too long';
    await db.from('social_posts').update({ meta_status: 'skipped', meta_error: why.slice(0, 300) }).eq('id', p.id);
    return 0;
  }

  let auth: Awaited<ReturnType<typeof metaAuth>>;
  try {
    auth = await metaAuth(db, s);
  } catch (err) {
    await db.from('social_posts').update({ meta_status: 'failed', meta_text: caption, meta_error: `token: ${(err as Error).message}` }).eq('id', p.id);
    throw err;
  }
  // Instagram/Facebook get their own photo; the card renders it from card.ig.
  const card = { ...(p.card as Card), ig: await pickIg(db, p.card as Card, p.id) };
  await db.from('social_posts').update({ card }).eq('id', p.id);
  const image = `${API}/social/card/${p.id}-4x5.jpg`;
  const errors: string[] = [];
  let igId: string | null = null, fbId: string | null = null;
  if (auth.ig) {
    try {
      const box = await graph<{ id: string }>(auth.token, 'POST', `${auth.ig}/media`, { image_url: image, caption: withCta(caption, '📲 BETina app: free, link in bio') });
      for (let i = 0; i < 10; i++) {
        const st = await graph<{ status_code?: string }>(auth.token, 'GET', box.id, { fields: 'status_code' });
        if (st.status_code === 'FINISHED') break;
        if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`container ${st.status_code}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
      igId = (await graph<{ id: string }>(auth.token, 'POST', `${auth.ig}/media_publish`, { creation_id: box.id })).id;
    } catch (err) {
      errors.push(`instagram: ${(err as Error).message}`);
    }
  } else {
    errors.push('instagram: no Instagram business account linked to the page');
  }
  try {
    const res = await graph<{ id: string; post_id?: string }>(auth.token, 'POST', `${auth.page}/photos`, {
      url: image, message: withCta(caption, `📲 BETina app, free on iPhone, Android & web: ${APP_URL}`),
    });
    fbId = res.post_id ?? res.id;
  } catch (err) {
    errors.push(`facebook: ${(err as Error).message}`);
  }
  const ok = !!(igId || fbId);
  await db.from('social_posts').update({
    meta_status: ok ? 'posted' : 'failed', meta_text: caption, ig_id: igId, fb_id: fbId,
    meta_error: errors.join(' | ') || null, meta_posted_at: ok ? new Date().toISOString() : null,
  }).eq('id', p.id);
  return ok ? 1 : 0;
}

// ── Comments on Instagram + Facebook (migration 028) ────────────────────────
// Same flow as @-mentions on X: BETina drafts a reply to each new comment under
// her own posts, the team approves it in the dashboard, then it goes out.
const META_COMMENTS_EVERY_MS = 10 * 60_000;
const META_COMMENT_POSTS_MS = 5 * 86_400_000;  // comments under posts of the last 5 days
const META_COMMENT_FRESH_MS = 3 * 86_400_000;  // older comments get no answer anymore
const META_DRAFTS_PER_RUN = 10;
const META_COMMENT_SCOPES = ['instagram_basic', 'instagram_manage_comments', 'pages_read_engagement', 'pages_read_user_content', 'pages_manage_engagement'];

type Who = { id?: string; username?: string; name?: string };
type IgComment = { id: string; text?: string; timestamp?: string; username?: string; from?: Who; replies?: { data?: { from?: Who }[] } };
type FbComment = { id: string; message?: string; created_time?: string; from?: Who; comments?: { data?: { from?: Who }[] } };

async function metaComments(db: Db, s: MetaSettings) {
  if (Date.now() - Date.parse(s.last_meta_comments) < META_COMMENTS_EVERY_MS) return;
  await db.from('social_settings').update({ last_meta_comments: new Date().toISOString() }).eq('id', 1);

  const { data: posts } = await db.from('social_posts').select('id, text, meta_text, ig_id, fb_id')
    .eq('meta_status', 'posted').gte('meta_posted_at', new Date(Date.now() - META_COMMENT_POSTS_MS).toISOString())
    .order('meta_posted_at', { ascending: false }).limit(15);
  if (!posts?.length) return;
  const auth = await metaAuth(db, s);
  const fresh = (t?: string) => !!t && Date.now() - Date.parse(t) < META_COMMENT_FRESH_MS;
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', hour: '2-digit', minute: '2-digit' });
  const errors: string[] = [];
  let drafts = 0, igOk = 0, igFailed = 0, gone = 0;
  // Per platform: comments Meta returned, and why some got no draft.
  // "counted" is the number of comments Meta reports on the posts themselves: if it
  // is higher than what the comment list returns, Meta is holding comments back
  // (app without access to other people's comments).
  const counted = { instagram: 0, facebook: 0 };
  const seen = { instagram: { all: 0, own: 0, old: 0, answered: 0, known: 0, drafted: 0, passed: 0 }, facebook: { all: 0, own: 0, old: 0, answered: 0, known: 0, drafted: 0, passed: 0 } };

  const draft = async (platform: 'instagram' | 'facebook', post: { text: string; meta_text: string | null }, id: string, who: Who, comment: string) => {
    const key = `reply:${platform === 'instagram' ? 'ig' : 'fb'}:${id}`;
    if (await exists(db, key)) return void seen[platform].known++;
    if (drafts >= META_DRAFTS_PER_RUN) return;
    drafts++;
    const author = who.username ?? who.name ?? 'someone';
    const { text, why } = await write(db, 'reply', s.lang, [
      `It is ${when} (West Africa time, where most of your followers are).`,
      `This comment is under your ${platform === 'instagram' ? 'Instagram' : 'Facebook'} post:\n"""${post.meta_text ?? post.text}"""`,
      `Comment by ${author}:\n"""${comment}"""`,
    ].join('\n\n'));
    if (!text) {
      seen[platform].passed++;
      return pass(db, 'reply', key, `${platform} · ${author}`, why);
    }
    seen[platform].drafted++;
    await save(db, s, {
      kind: 'reply', platform, text, dedupe_key: key, context: `${platform === 'instagram' ? 'Instagram' : 'Facebook'} · ${author}`,
      reply_to: id, reply_author: author, reply_text: comment, expires_at: new Date(Date.now() + META_COMMENT_FRESH_MS).toISOString(),
    });
  };

  for (const p of posts) {
    if (p.ig_id && auth.ig) {
      try {
        const { data } = await graph<{ data?: IgComment[] }>(auth.token, 'GET', `${p.ig_id}/comments`, {
          fields: 'id,text,timestamp,username,from,replies{from}', limit: '50',
        });
        for (const c of data ?? []) {
          // Her own comments, comments she already answered and old ones need no draft.
          seen.instagram.all++;
          if (c.from?.id === auth.ig) { seen.instagram.own++; continue; }
          if (!c.text?.trim() || !fresh(c.timestamp)) { seen.instagram.old++; continue; }
          if (c.replies?.data?.some((r) => r.from?.id === auth.ig)) { seen.instagram.answered++; continue; }
          await draft('instagram', p, c.id, { username: c.username ?? c.from?.username }, c.text);
        }
        igOk++;
        counted.instagram += (await graph<{ comments_count?: number }>(auth.token, 'GET', p.ig_id, { fields: 'comments_count' })).comments_count ?? 0;
      } catch (err) {
        igFailed++;
        // A post deleted on Instagram answers "does not exist": no error while other posts can be read.
        if (/does not exist/.test((err as Error).message)) gone++;
        else errors.push(`instagram: ${(err as Error).message}`);
      }
    }
    if (p.fb_id) {
      try {
        const { data } = await graph<{ data?: FbComment[] }>(auth.token, 'GET', `${p.fb_id}/comments`, {
          fields: 'id,message,created_time,from,comments.limit(10){from}', order: 'reverse_chronological', limit: '50',
        });
        for (const c of data ?? []) {
          seen.facebook.all++;
          if (c.from?.id === auth.page) { seen.facebook.own++; continue; }
          if (!c.message?.trim() || !fresh(c.created_time)) { seen.facebook.old++; continue; }
          if (c.comments?.data?.some((r) => r.from?.id === auth.page)) { seen.facebook.answered++; continue; }
          await draft('facebook', p, c.id, { name: c.from?.name }, c.message);
        }
        const sum = await graph<{ comments?: { summary?: { total_count?: number } } }>(auth.token, 'GET', p.fb_id, { fields: 'comments.summary(true).limit(0)' });
        counted.facebook += sum.comments?.summary?.total_count ?? 0;
      } catch (err) {
        errors.push(`facebook: ${(err as Error).message}`);
      }
    }
  }
  // Nothing readable at all is a permission problem, not deleted posts.
  if (gone && !igOk) errors.push(`instagram: none of ${gone} posts could be read (does not exist or missing permissions)`);
  // Meta's errors are vague ("Unsupported get request"), so on a failure the
  // dashboard also says which permissions the token lacks. Names only, never the token.
  let missing = '';
  if (errors.length) {
    try {
      const { data } = await graph<{ data: { permission: string; status: string }[] }>(env('META_PAGE_TOKEN'), 'GET', 'me/permissions');
      const granted = new Set(data.filter((p) => p.status === 'granted').map((p) => p.permission));
      const lacks = META_COMMENT_SCOPES.filter((p) => !granted.has(p));
      missing = lacks.length ? `token lacks: ${lacks.join(', ')} | ` : 'token has all comment permissions | ';
    } catch {
      // A Page token can't list its permissions; the Graph error below has to do.
    }
    if (igOk + igFailed) missing += `instagram posts readable: ${igOk} of ${igOk + igFailed} | `;
  }
  const note = errors.length ? (missing + [...new Set(errors)].slice(0, 2).join(' | ')).slice(0, 500) : null;
  const line = (n: string, c: typeof seen.instagram) =>
    `${n}: ${c.all} comments readable, ${counted[n.toLowerCase() as 'instagram' | 'facebook']} counted on the posts${c.all ? ` (${c.drafted} new drafts, ${c.known} known, ${c.own} her own, ${c.answered} answered, ${c.old} old or empty, ${c.passed} skipped by BETina)` : ''}`;
  await db.from('social_settings').update({
    meta_comments_error: note,
    meta_comments_seen: `${posts.length} posts · ${line('Instagram', seen.instagram)} · ${line('Facebook', seen.facebook)}`,
  }).eq('id', 1);
  if (note) throw new Error(note);
}

/** Sends the approved replies to Instagram/Facebook comments. */
async function metaReplies(db: Db, s: MetaSettings) {
  const { data: queue } = await db.from('social_posts').select('id, platform, text, reply_to')
    .eq('status', 'approved').eq('kind', 'reply').in('platform', ['instagram', 'facebook'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true }).limit(5);
  if (!queue?.length) return 0;
  const auth = await metaAuth(db, s);
  let sent = 0;
  for (const p of queue) {
    const { data: claimed } = await db.from('social_posts').update({ status: 'posting' })
      .eq('id', p.id).eq('status', 'approved').select('id');
    if (!claimed?.length) continue;
    try {
      const path = p.platform === 'instagram' ? `${p.reply_to}/replies` : `${p.reply_to}/comments`;
      const res = await graph<{ id: string }>(auth.token, 'POST', path, { message: p.text });
      await db.from('social_posts').update({
        status: 'posted', posted_at: new Date().toISOString(), error: null,
        ...(p.platform === 'instagram' ? { ig_id: res.id } : { fb_id: res.id }),
      }).eq('id', p.id);
      sent++;
    } catch (err) {
      await db.from('social_posts').update({ status: 'failed', error: (err as Error).message }).eq('id', p.id);
    }
  }
  return sent;
}

// ── Reels (migration 030) ────────────────────────────────────────────────────
// The team uploads a video and a caption in the dashboard and approves it.
// Instagram processes a Reel for a minute or two, so it takes several runs:
// run 1 hands the video to Instagram (ig_container), later runs wait until it
// is ready, publish it and post the same video on Facebook.
const REEL_TIMEOUT_MS = 20 * 60_000;

async function metaReels(db: Db, s: MetaSettings) {
  await db.from('social_posts').update({ status: 'posting' }).eq('kind', 'reel').eq('status', 'approved');
  const { data: queue } = await db.from('social_posts').select('id, text, video_url, ig_container, decided_at')
    .eq('kind', 'reel').eq('status', 'posting').order('created_at', { ascending: true }).limit(2);
  if (!queue?.length) return 0;
  const auth = await metaAuth(db, s);
  let sent = 0;
  for (const p of queue) {
    const errors: string[] = [];
    let igId: string | null = null;
    if (!p.video_url) {
      await db.from('social_posts').update({ status: 'failed', error: 'no video' }).eq('id', p.id);
      continue;
    }
    if (auth.ig) {
      try {
        if (!p.ig_container) {
          const box = await graph<{ id: string }>(auth.token, 'POST', `${auth.ig}/media`, {
            media_type: 'REELS', video_url: p.video_url, caption: p.text, share_to_feed: 'true',
          });
          await db.from('social_posts').update({ ig_container: box.id }).eq('id', p.id);
          continue; // Instagram fetches and processes the video now
        }
        const st = await graph<{ status_code?: string; status?: string }>(auth.token, 'GET', p.ig_container, { fields: 'status_code,status' });
        if (st.status_code === 'IN_PROGRESS' && Date.now() - Date.parse(p.decided_at ?? '') < REEL_TIMEOUT_MS) continue;
        if (st.status_code !== 'FINISHED') throw new Error(`video ${st.status_code ?? 'unknown'}: ${st.status ?? 'not ready in time'}`);
        igId = (await graph<{ id: string }>(auth.token, 'POST', `${auth.ig}/media_publish`, { creation_id: p.ig_container })).id;
      } catch (err) {
        errors.push(`instagram: ${(err as Error).message}`);
      }
    } else {
      errors.push('instagram: no Instagram business account linked to the page');
    }
    let fbId: string | null = null;
    try {
      fbId = (await graph<{ id: string }>(auth.token, 'POST', `${auth.page}/videos`, { file_url: p.video_url, description: p.text })).id;
    } catch (err) {
      errors.push(`facebook: ${(err as Error).message}`);
    }
    const ok = !!(igId || fbId);
    const now = new Date().toISOString();
    await db.from('social_posts').update({
      status: ok ? 'posted' : 'failed', posted_at: ok ? now : null, error: ok ? null : errors.join(' | ').slice(0, 500),
      meta_status: ok ? 'posted' : 'failed', meta_text: p.text, ig_id: igId, fb_id: fbId,
      meta_error: errors.join(' | ').slice(0, 500) || null, meta_posted_at: ok ? now : null,
      // A failed reel can be approved again: start over with a fresh upload.
      ...(ok ? {} : { ig_container: null }),
    }).eq('id', p.id);
    if (ok) sent++;
  }
  return sent;
}

// ── Run ──────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const db: Db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: claimed } = await db.rpc('social_desk_claim', { p_min_seconds: 50 });
  if (!claimed) return json({ skipped: 'busy' });

  const { data: s } = await db.from('social_settings').select('*').eq('id', 1).single<MetaSettings>();
  const ready = xReady();
  await db.from('social_settings').update({ x_ready: ready, meta_ready: metaReady() }).eq('id', 1);
  if (!s || s.mode === 'off') return json({ mode: 'off' });

  const v = vienna();
  const errors: string[] = [];
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  };
  await step('matchday', () => matchday(db, s, v));
  // Re-read: matchday may just have picked today's featured matches.
  const { data: fresh } = await db.from('social_settings').select('featured').eq('id', 1).single();
  const now = { ...s, featured: fresh?.featured ?? s.featured };
  await step('live', () => live(db, now, v));
  await step('news', () => news(db, now, v));
  await step('history', () => history(db, s, v));
  await step('shorten', () => shortenDrafts(db, s));
  let posted = 0;
  if (ready) {
    await step('mentions', () => mentions(db, s));
    await step('publish', async () => { posted = await publish(db, s); });
  }
  let meta = 0;
  // Connection check: until the page is known, look it (and Instagram) up with
  // the token on every run, so the dashboard shows the link before anything is posted.
  if (metaReady() && !s.fb_page_id) await step('meta-auth', () => metaAuth(db, s));
  if (metaReady()) await step('meta', async () => { meta = await metaPublish(db, s, v); });
  if (metaReady() && s.fb_page_id) {
    await step('meta-comments', () => metaComments(db, s));
    await step('meta-replies', () => metaReplies(db, s));
    await step('meta-reels', () => metaReels(db, s));
  }
  if (errors.length) console.error(errors.join(' | '));
  return json({ mode: s.mode, x_ready: ready, posted, meta_mode: s.meta_mode, meta, errors });
});
