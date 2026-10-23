// Tippspiel data layer. kicker-style prediction game: tip the exact score
// (result after 90 minutes). 3 points spot on, 2 for the right winner + goal
// difference, 1 for the right tendency. Everything that matters (deadlines,
// scoring, XP) is enforced in Postgres — see supabase/migrations/010_tippspiel.sql.
// No money and no prizes: points, rankings and XP only.

import { supabase } from './supabase';
import type { LangCode } from './i18n';

export type Competition = {
  code: string;
  name: string;
  emblem: string | null;
  current_season: number | null;
  current_matchday: number | null;
};

export type TipMatch = {
  id: number;
  competition: string;
  season: number;
  matchday: number | null;
  stage: string | null;
  kickoff: string;
  status: string;
  home_team_id: number | null;
  home_name: string;
  home_short: string | null;
  home_crest: string | null;
  away_team_id: number | null;
  away_name: string;
  away_short: string | null;
  away_crest: string | null;
  home_score: number | null;
  away_score: number | null;
};

export type Tip = { match_id: number; home: number; away: number; points: number | null };

export type RankRow = {
  rank: number;
  user_id: string;
  display_name: string;
  points: number;
  hits: number;
  exact: number;
  diffs: number;
  tips: number;
  is_me: boolean;
};

export type TipGroup = { id: string; name: string; code: string; is_owner: boolean; members: number };

export type BonusQuestion = {
  id: string;
  competition: string;
  season: number;
  kind: 'champion' | 'last_place';
  points: number;
  closes_at: string;
  answer_team_id: number | null;
};

export type BonusAnswer = { question_id: string; team_id: number; points: number | null };

export type Team = { id: number; name: string; crest: string | null };

/** One round of a competition: a league matchday or a knockout stage. */
export type Round = { key: string; matchday: number | null; stage: string | null; matches: TipMatch[] };

const OPEN_STATUSES = new Set(['SCHEDULED', 'TIMED']);
const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED']);
const VOID_STATUSES = new Set(['POSTPONED', 'SUSPENDED', 'CANCELLED', 'AWARDED']);

export const isOpen = (m: TipMatch) => OPEN_STATUSES.has(m.status) && Date.parse(m.kickoff) > Date.now();
export const isLive = (m: TipMatch) => LIVE_STATUSES.has(m.status);
export const isVoid = (m: TipMatch) => VOID_STATUSES.has(m.status);
export const isFinished = (m: TipMatch) => m.status === 'FINISHED';

/** Which competition a new player sees first, by app language. */
export function defaultCompetition(lang: LangCode): string {
  return ({ de: 'BL1', es: 'PD', it: 'SA' } as Record<string, string>)[lang] ?? 'PL';
}

/** Server error code ("tip_closed", "group_not_found", …) from an RPC error. */
function errorCode(err: { message?: string } | null): string {
  return (err?.message ?? 'unknown').trim();
}

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data } = await supabase
    .from('tip_competitions')
    .select('code, name, emblem, current_season, current_matchday')
    .order('sort_order');
  return (data ?? []) as Competition[];
}

export async function fetchMatches(competition: string, season: number): Promise<TipMatch[]> {
  const { data } = await supabase
    .from('tip_matches')
    .select('id, competition, season, matchday, stage, kickoff, status, home_team_id, home_name, home_short, home_crest, away_team_id, away_name, away_short, away_crest, home_score, away_score')
    .eq('competition', competition)
    .eq('season', season)
    .order('kickoff')
    .limit(1000);
  return (data ?? []) as TipMatch[];
}

export async function fetchMyTips(matchIds: number[]): Promise<Record<number, Tip>> {
  if (matchIds.length === 0) return {};
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const out: Record<number, Tip> = {};
  // Chunked: a season has up to ~380 matches and the id list goes in the URL.
  for (let i = 0; i < matchIds.length; i += 150) {
    const { data } = await supabase
      .from('tips')
      .select('match_id, home, away, points')
      .eq('user_id', user.id)
      .in('match_id', matchIds.slice(i, i + 150));
    for (const t of (data ?? []) as Tip[]) out[t.match_id] = t;
  }
  return out;
}

export async function placeTip(matchId: number, home: number, away: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('place_tip', { p_match: matchId, p_home: home, p_away: away });
  return error ? { ok: false, error: errorCode(error) } : { ok: true };
}

/** Group a season's matches into rounds (matchdays / knockout stages) in kickoff order. */
export function toRounds(matches: TipMatch[]): Round[] {
  const byKey = new Map<string, Round>();
  for (const m of matches) {
    const key = m.matchday != null && (!m.stage || m.stage === 'REGULAR_SEASON' || m.stage === 'LEAGUE_STAGE')
      ? `md-${m.matchday}`
      : `st-${m.stage ?? 'X'}${m.matchday != null ? `-${m.matchday}` : ''}`;
    let r = byKey.get(key);
    if (!r) {
      r = { key, matchday: m.matchday, stage: m.stage, matches: [] };
      byKey.set(key, r);
    }
    r.matches.push(m);
  }
  return [...byKey.values()].sort(
    (a, b) => Date.parse(a.matches[0].kickoff) - Date.parse(b.matches[0].kickoff),
  );
}

/** The round to open by default: the first one that isn't completely over. */
export function currentRoundIndex(rounds: Round[]): number {
  const i = rounds.findIndex((r) => r.matches.some((m) => !isFinished(m) && !isVoid(m)));
  return i === -1 ? Math.max(rounds.length - 1, 0) : i;
}

export async function fetchLeaderboard(opts: {
  competition?: string | null;
  matchday?: number | null;
  group?: string | null;
  limit?: number;
}): Promise<RankRow[]> {
  const { data } = await supabase.rpc('tip_leaderboard', {
    p_competition: opts.competition ?? null,
    p_matchday: opts.matchday ?? null,
    p_group: opts.group ?? null,
    p_limit: opts.limit ?? 100,
  });
  return ((data ?? []) as RankRow[]).map((r) => ({
    ...r,
    rank: Number(r.rank),
    points: Number(r.points),
    hits: Number(r.hits),
    exact: Number(r.exact),
    diffs: Number(r.diffs),
    tips: Number(r.tips),
  }));
}

// ── Groups (Tipprunden) ──────────────────────────────────────────────────────
export async function fetchMyGroups(): Promise<TipGroup[]> {
  const { data } = await supabase.rpc('my_tip_groups');
  return ((data ?? []) as TipGroup[]).map((g) => ({ ...g, members: Number(g.members) }));
}

export async function createGroup(name: string): Promise<{ ok: true; group: TipGroup } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('create_tip_group', { p_name: name });
  if (error) return { ok: false, error: errorCode(error) };
  return { ok: true, group: { ...(data as TipGroup), is_owner: true, members: 1 } };
}

export async function joinGroup(code: string): Promise<{ ok: true; group: TipGroup } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('join_tip_group', { p_code: code });
  if (error) return { ok: false, error: errorCode(error) };
  return { ok: true, group: data as TipGroup };
}

export async function leaveGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase.rpc('leave_tip_group', { p_group: groupId });
  return !error;
}

// ── Bonus questions ──────────────────────────────────────────────────────────
export async function fetchBonus(competition: string, season: number): Promise<{
  questions: BonusQuestion[];
  answers: Record<string, BonusAnswer>;
}> {
  const { data: questions } = await supabase
    .from('tip_bonus_questions')
    .select('id, competition, season, kind, points, closes_at, answer_team_id')
    .eq('competition', competition)
    .eq('season', season)
    .order('points', { ascending: false });
  const ids = (questions ?? []).map((q) => q.id);
  const answers: Record<string, BonusAnswer> = {};
  if (ids.length) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('tip_bonus_answers')
        .select('question_id, team_id, points')
        .eq('user_id', user.id)
        .in('question_id', ids);
      for (const a of (data ?? []) as BonusAnswer[]) answers[a.question_id] = a;
    }
  }
  return { questions: (questions ?? []) as BonusQuestion[], answers };
}

export async function placeBonusTip(questionId: string, teamId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('place_bonus_tip', { p_question: questionId, p_team: teamId });
  return error ? { ok: false, error: errorCode(error) } : { ok: true };
}

/** All teams of a competition season, from its fixtures, A–Z. */
export function teamsOf(matches: TipMatch[]): Team[] {
  const teams = new Map<number, Team>();
  for (const m of matches) {
    if (m.home_team_id) teams.set(m.home_team_id, { id: m.home_team_id, name: m.home_short ?? m.home_name, crest: m.home_crest });
    if (m.away_team_id) teams.set(m.away_team_id, { id: m.away_team_id, name: m.away_short ?? m.away_name, crest: m.away_crest });
  }
  return [...teams.values()].sort((a, b) => a.name.localeCompare(b.name));
}
