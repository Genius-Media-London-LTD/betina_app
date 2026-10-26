// BETina's moments beyond BOOM: K.O. / Revanche (matchday duel against her),
// Platz 1 (leading a Tipprunde), On Fire (scoring streak), Serie (days in a
// row in the app), Matchday (favourite team plays today) and the small
// TREFFER toast (1–2 points). Points, XP and fun only — nothing about money.
//
// Each moment fires once per event (remembered in AsyncStorage) and at most
// one big moment shows per app visit; the rest wait for the next one.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { fetchBetinaTips, fetchLeaderboard, fetchMyGroups, fetchStats } from './tippspiel';

export type PhotoMoment =
  | { kind: 'ko'; competition: string; matchday: number; me: number; betina: number }
  | { kind: 'revanche'; competition: string; matchday: number; me: number; betina: number }
  | { kind: 'lead'; group: string; members: number }
  | { kind: 'fire'; streak: number }
  | { kind: 'streak'; days: number }
  | { kind: 'matchday'; team: string; home: string; away: string; kickoff: string };

export type HitMoment = { points: number; matches: number; home_name: string; away_name: string; home: number; away: number };

const KEY = {
  duel: 'moment_duel_seen', // ["PL:9", …]
  lead: 'moment_lead_ranks', // { groupId: rank }
  fire: 'moment_fire_seen', // last celebrated streak milestone
  streak: 'moment_streak_seen', // last celebrated days milestone
  matchday: 'moment_matchday_seen', // ["eventId", …]
  hit: 'moment_hit_seen', // [matchId, …]
};

const FIRE_STEPS = [3, 5, 7, 10, 15, 20, 30];
const STREAK_STEPS = [7, 14, 30, 50, 100, 200, 365];

// ── One big moment per visit ─────────────────────────────────────────────────
// A "visit" ends when the app has been in the background for 10+ minutes.
let bigShown = false;
let backgroundSince = 0;
AppState.addEventListener('change', (s) => {
  if (s === 'background') backgroundSince = Date.now();
  else if (s === 'active' && backgroundSince && Date.now() - backgroundSince > 10 * 60_000) bigShown = false;
});

/** Claims this visit's big moment; false if one was already shown. */
export function claimBigMoment(): boolean {
  if (bigShown) return false;
  bigShown = true;
  return true;
}
export const bigMomentShown = () => bigShown;

// Home and Tippspiel can be mounted side by side in the pager and check at the
// same time; checks run one after the other so no moment is marked seen
// without being shown.
let queue: Promise<unknown> = Promise.resolve();
export function checkMoments<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

// ── Storage helpers ──────────────────────────────────────────────────────────
async function read<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw == null ? fallback : (JSON.parse(raw) as T);
}
const write = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
const stepOf = (n: number, steps: number[]) => steps.filter((s) => n >= s).pop() ?? 0;

async function userId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// ── App moments (Home) ───────────────────────────────────────────────────────
/** Favourite team plays today (once per match, from kickoff day 00:00 until kickoff). */
export async function matchdayMoment(team: string | null | undefined, next: { id: string; home: string; away: string; kickoff: Date } | null): Promise<PhotoMoment | null> {
  if (!team || !next) return null;
  const now = new Date();
  const k = next.kickoff;
  if (k.getTime() < now.getTime() || k.toDateString() !== now.toDateString()) return null;
  const seen = await read<string[]>(KEY.matchday, []);
  if (seen.includes(next.id)) return null;
  await write(KEY.matchday, [...seen, next.id].slice(-50));
  return { kind: 'matchday', team, home: next.home, away: next.away, kickoff: k.toISOString() };
}

/** 7, 14, 30 … days in a row in the app. */
export async function streakMoment(days: number | null | undefined): Promise<PhotoMoment | null> {
  const d = days ?? 0;
  const step = stepOf(d, STREAK_STEPS);
  const seen = await read<number>(KEY.streak, 0);
  if (step > seen) {
    await write(KEY.streak, step);
    return { kind: 'streak', days: d };
  }
  // Streak broke: celebrate the milestones again next time round.
  if (step < seen) await write(KEY.streak, step);
  return null;
}

// ── Tippspiel moments ────────────────────────────────────────────────────────
/** K.O. or Revanche for the latest finished matchday (within 4 days) where both tipped. */
async function duelMoment(uid: string, series: { competition: string; matchday: number }[]): Promise<PhotoMoment | null> {
  const last = series[series.length - 1];
  if (!last) return null;
  const id = `${last.competition}:${last.matchday}`;
  const seen = await read<string[]>(KEY.duel, []);
  if (seen.includes(id)) return null;

  const { data } = await supabase
    .from('tips')
    .select('match_id, points, tip_matches!inner(competition, matchday, kickoff)')
    .eq('user_id', uid)
    .eq('tip_matches.competition', last.competition)
    .eq('tip_matches.matchday', last.matchday)
    .not('points', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(60);
  type Row = { match_id: number; points: number; tip_matches: { kickoff: string } | { kickoff: string }[] };
  const rows = (data ?? []) as Row[];
  if (!rows.length) return null;
  const kickoffs = rows.map((r) => Date.parse((Array.isArray(r.tip_matches) ? r.tip_matches[0] : r.tip_matches).kickoff));
  if (Date.now() - Math.max(...kickoffs) > 4 * 86_400_000) return null;

  const hers = await fetchBetinaTips(rows.map((r) => r.match_id));
  let me = 0;
  let betina = 0;
  let both = 0;
  for (const r of rows) {
    const b = hers[r.match_id];
    if (b?.points == null) continue;
    me += r.points;
    betina += b.points;
    both += 1;
  }
  await write(KEY.duel, [...seen, id].slice(-100));
  if (!both || me === betina) return null;
  const base = { competition: last.competition, matchday: last.matchday, me, betina };
  return me > betina ? { kind: 'ko', ...base } : { kind: 'revanche', ...base };
}

/** Took over first place in a Tipprunde (2+ members, some points). */
async function leadMoment(): Promise<PhotoMoment | null> {
  const groups = (await fetchMyGroups()).filter((g) => g.members >= 2);
  if (!groups.length) return null;
  const ranks = await Promise.all(groups.map((g) => fetchLeaderboard({ group: g.id, limit: 1 }).then((rows) => rows.find((r) => r.is_me) ?? null)));
  const stored = await read<Record<string, number>>(KEY.lead, {});
  let lead: PhotoMoment | null = null;
  groups.forEach((g, i) => {
    const me = ranks[i];
    if (!me) return;
    if (!lead && me.rank === 1 && me.points > 0 && stored[g.id] !== 1) lead = { kind: 'lead', group: g.name, members: g.members };
    stored[g.id] = me.rank;
  });
  await write(KEY.lead, stored);
  return lead;
}

/** 3, 5, 7 … matchdays in a row with points. */
async function fireMoment(streak: number): Promise<PhotoMoment | null> {
  const step = stepOf(streak, FIRE_STEPS);
  const seen = await read<number>(KEY.fire, 0);
  if (step > seen) {
    await write(KEY.fire, step);
    return { kind: 'fire', streak };
  }
  if (step < seen) await write(KEY.fire, step);
  return null;
}

/** The next Tippspiel moment in order: K.O./Revanche, Platz 1, On Fire. */
export async function tipMoment(): Promise<PhotoMoment | null> {
  try {
    const uid = await userId();
    if (!uid) return null;
    const stats = await fetchStats(null);
    if (!stats) return null;
    return (await duelMoment(uid, stats.series ?? []))
      ?? (await leadMoment())
      ?? (await fireMoment(stats.streak ?? 0));
  } catch {
    // storage or network trouble: skip the moment rather than repeat it
    return null;
  }
}

/** TREFFER: fresh 1–2 point tips (last 3 days) not shown yet, summed up. */
export async function takeHits(): Promise<HitMoment | null> {
  try {
    const uid = await userId();
    if (!uid) return null;
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const { data } = await supabase
      .from('tips')
      .select('match_id, home, away, points, tip_matches!inner(home_short, home_name, away_short, away_name, kickoff)')
      .eq('user_id', uid)
      .in('points', [1, 2])
      .gte('tip_matches.kickoff', since)
      .limit(40);
    type M = { home_short: string | null; home_name: string; away_short: string | null; away_name: string; kickoff: string };
    type Row = { match_id: number; home: number; away: number; points: number; tip_matches: M | M[] };
    const rows = ((data ?? []) as Row[]).map((r) => ({ ...r, m: Array.isArray(r.tip_matches) ? r.tip_matches[0] : r.tip_matches }));
    const seen = await read<number[]>(KEY.hit, []);
    const fresh = rows.filter((r) => !seen.includes(r.match_id));
    if (!fresh.length) return null;
    await write(KEY.hit, [...seen, ...fresh.map((r) => r.match_id)].slice(-300));
    const best = [...fresh].sort((a, b) => b.points - a.points || b.m.kickoff.localeCompare(a.m.kickoff))[0];
    return {
      points: fresh.reduce((n, r) => n + r.points, 0),
      matches: fresh.length,
      home_name: best.m.home_short ?? best.m.home_name,
      away_name: best.m.away_short ?? best.m.away_name,
      home: best.home,
      away: best.away,
    };
  } catch {
    return null;
  }
}
