// What BETina knows about the player from the app — level, XP to the next tier,
// Tippspiel season, the duel, both tips side by side, upcoming tips, Tipprunden.
// One source for the text chat (chat/) and the voice chat (betina-server builds
// app-data.js from this file). Reads with the player's own JWT, so RLS applies:
// BETina's tips for matches that haven't kicked off stay invisible.

export type AppProfile = {
  xp_points?: number | null;
  streak_days?: number | null;
  created_at?: string | null;
};

type Opts = {
  supabaseUrl: string;
  anonKey: string;
  /** The player's access token (JWT). */
  token: string;
  userId: string;
  profile: AppProfile | null;
  /** Include the Tippspiel (only for app versions that have it). */
  tippspiel: boolean;
};

const TIERS: [string, number][] = [['INITIATE', 0], ['THINKER', 1000], ['ANALYST', 3000], ['MASTERMIND', 8000], ['GENIUS', 20000]];

type Match = { competition: string; home_name: string; away_name: string; kickoff: string; status: string; home_score: number | null; away_score: number | null };
type TipRow = { match_id: number; home: number; away: number; points: number | null; tip_matches: Match | null };
type BetinaTip = { match_id: number; home: number; away: number; points: number | null };
type RankRow = { is_me: boolean; is_betina: boolean; points: number; rank: number; exact: number; tips: number };

export async function appData(o: Opts): Promise<string> {
  // deno-lint-ignore no-explicit-any
  const sb = async (path: string, body?: unknown): Promise<any> => {
    const res = await fetch(`${o.supabaseUrl}/rest/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { apikey: o.anonKey, Authorization: `Bearer ${o.token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? res.json() : null;
  };

  const lines: string[] = [];
  const xp = Number(o.profile?.xp_points ?? 0);
  const idx = TIERS.reduce((i, [, min], k) => (xp >= min ? k : i), 0);
  const next = TIERS[idx + 1];
  lines.push(`- Level: ${TIERS[idx][0]}, ${xp} XP${next ? ` — ${next[1] - xp} XP to ${next[0]}` : ' (top tier)'}; daily streak ${o.profile?.streak_days ?? 0} days${o.profile?.created_at ? `; in the app since ${String(o.profile.created_at).slice(0, 10)}` : ''}.`);
  lines.push(`- XP comes from daily opens (+5 + streak), chatting (+1 per message)${o.tippspiel ? ', Tippspiel points (5 XP each)' : ''} and onboarding. Never from money.`);
  if (!o.tippspiel) return lines.join('\n');

  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 4 * 86_400_000);
    const mineComps = ((await sb(`tip_user_competitions?select=competition&user_id=eq.${o.userId}`)) as { competition: string }[] | null ?? []).map((r) => r.competition);
    const compFilter = mineComps.length ? `&competition=in.(${mineComps.join(',')})` : '';
    const [tips, board, stats, groups, upcomingMatches] = await Promise.all([
      sb(`tips?user_id=eq.${o.userId}&select=match_id,home,away,points,tip_matches(competition,home_name,away_name,kickoff,status,home_score,away_score)&order=updated_at.desc&limit=40`) as Promise<TipRow[] | null>,
      sb('rpc/tip_leaderboard', { p_competition: null, p_matchday: null, p_group: null, p_limit: 1 }) as Promise<RankRow[] | null>,
      sb('rpc/tip_my_stats', { p_competition: null }),
      sb('rpc/my_tip_groups', {}) as Promise<{ name: string; members: number }[] | null>,
      sb(`tip_matches?select=id,competition,home_name,away_name,kickoff${compFilter}&status=in.(SCHEDULED,TIMED)&kickoff=gt.${now.toISOString()}&kickoff=lt.${soon.toISOString()}&order=kickoff&limit=60`) as Promise<{ id: number; competition: string; home_name: string; away_name: string; kickoff: string }[] | null>,
    ]);
    const me = (board ?? []).find((r) => r.is_me);
    const her = (board ?? []).find((r) => r.is_betina);
    if (me) lines.push(`- Tippspiel season: ${me.points} points, rank ${me.rank}, ${me.exact} exact hits from ${me.tips} tips.`);
    if (her) lines.push(`- Your own (BETina's) season: ${her.points} points, rank ${her.rank}.`);
    if (stats?.duel) lines.push(`- Duel on matches you both tipped: player ${stats.duel.me} points vs you ${stats.duel.betina} (${stats.duel.matches} matches).`);
    if (stats?.streak) lines.push(`- Scoring streak: ${stats.streak} rounds in a row with points.`);

    const mine = tips ?? [];
    const ids = mine.map((t) => t.match_id);
    const hers = (ids.length ? await sb(`betina_tips?match_id=in.(${ids.join(',')})&select=match_id,home,away,points`) : []) as BetinaTip[] | null;
    const herBy = new Map((hers ?? []).map((b) => [b.match_id, b]));
    const label = (m: { home_name: string; away_name: string; competition: string }) => `${m.home_name} vs ${m.away_name} (${m.competition})`;
    const when = (iso: string) => `${iso.slice(0, 16).replace('T', ' ')} UTC`;

    const scored = mine.filter((t) => t.points != null && t.tip_matches)
      .sort((a, b) => Date.parse(b.tip_matches!.kickoff) - Date.parse(a.tip_matches!.kickoff)).slice(0, 8);
    if (scored.length) {
      lines.push('- Latest scored matches (result · their tip · your tip):');
      for (const t of scored) {
        const m = t.tip_matches!;
        const b = herBy.get(t.match_id);
        lines.push(`  • ${label(m)}: ${m.home_score}:${m.away_score} · they ${t.home}:${t.away} (+${t.points})${b ? ` · you ${b.home}:${b.away}${b.points != null ? ` (+${b.points})` : ''}` : ''}`);
      }
    }
    const upcoming = mine.filter((t) => t.tip_matches && Date.parse(t.tip_matches.kickoff) > now.getTime())
      .sort((a, b) => Date.parse(a.tip_matches!.kickoff) - Date.parse(b.tip_matches!.kickoff)).slice(0, 8);
    if (upcoming.length) {
      lines.push('- Their tips for upcoming matches (yours stay secret until kickoff):');
      for (const t of upcoming) lines.push(`  • ${label(t.tip_matches!)}, ${when(t.tip_matches!.kickoff)}: ${t.home}:${t.away}`);
    }
    const tipped = new Set(ids);
    const open = (upcomingMatches ?? []).filter((m) => !tipped.has(m.id)).slice(0, 8);
    if (open.length) {
      lines.push('- Matches in the next days they still have to tip:');
      for (const m of open) lines.push(`  • ${label(m)}, ${when(m.kickoff)}`);
    }
    if (Array.isArray(groups) && groups.length) {
      lines.push(`- Their Tipprunden (prediction groups): ${groups.map((g) => `${g.name} (${g.members} members)`).join(', ')}.`);
    }
  } catch (err) {
    console.error('app data:', (err as Error).message);
  }
  return lines.join('\n');
}
