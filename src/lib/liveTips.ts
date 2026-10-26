// Tippspiel next to the live scores: the player's tip (and BETina's, from
// kickoff) for a live match, with the points it would bring right now.
// Tippspiel matches come from football-data.org, live scores from
// API-Football — they're paired by kickoff time and team names.
import { useEffect, useState } from 'react';
import { Row, sameTeam } from './live';
import { supabase } from './supabase';

export type TipRef = {
  kickoff: number; home: string; away: string;
  mine: [number, number] | null; betina: [number, number] | null;
};

/** Tippspiel points for a tip at the current score (3 exact, 2 winner + difference, 1 tendency). */
export function tipPoints(tip: [number, number] | null, g: [number | null, number | null]): number | null {
  if (!tip || g[0] == null || g[1] == null) return null;
  const [th, ta] = tip;
  const [h, a] = [g[0], g[1]];
  if (th === h && ta === a) return 3;
  const trend = (x: number, y: number) => Math.sign(x - y);
  if (trend(th, ta) !== trend(h, a)) return 0;
  return th - ta === h - a ? 2 : 1;
}

async function fetchTips(from: number, to: number): Promise<TipRef[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data } = await supabase
    .from('tips')
    .select('match_id, home, away, tip_matches!inner(kickoff, home_name, away_name)')
    .eq('user_id', session.user.id)
    .gte('tip_matches.kickoff', new Date(from).toISOString())
    .lt('tip_matches.kickoff', new Date(to).toISOString())
    .limit(200);
  type M = { kickoff: string; home_name: string; away_name: string };
  const rows = (data ?? []) as { match_id: number; home: number; away: number; tip_matches: M | M[] }[];
  if (!rows.length) return [];
  // BETina's tips are readable from kickoff on (RLS).
  const { data: hers } = await supabase.from('betina_tips').select('match_id, home, away').in('match_id', rows.map((r) => r.match_id));
  const herBy = new Map(((hers ?? []) as { match_id: number; home: number; away: number }[]).map((b) => [b.match_id, b]));
  return rows.map((r) => {
    const m = Array.isArray(r.tip_matches) ? r.tip_matches[0] : r.tip_matches;
    const b = herBy.get(r.match_id);
    return { kickoff: Date.parse(m.kickoff), home: m.home_name, away: m.away_name, mine: [r.home, r.away], betina: b ? [b.home, b.away] : null };
  });
}

/** The tip that belongs to a live-score row, if any. */
export function tipFor(row: Pick<Row, 'ts' | 'h' | 'a'>, tips: TipRef[]): TipRef | undefined {
  return tips.find((t) => Math.abs(t.kickoff - row.ts * 1000) <= 20 * 60_000 && sameTeam(t.home, row.h.n) && sameTeam(t.away, row.a.n));
}

/** The player's tips for matches kicking off between `from` and `to` (ms). */
export function useTips(from: number, to: number): TipRef[] {
  const [tips, setTips] = useState<TipRef[]>([]);
  useEffect(() => {
    let active = true;
    fetchTips(from, to).then((t) => { if (active) setTips(t); }).catch(() => {});
    return () => { active = false; };
  }, [from, to]);
  return tips;
}
