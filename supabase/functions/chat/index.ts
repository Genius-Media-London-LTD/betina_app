// BETina chat proxy — Supabase Edge Function (Deno).
//
// Holds the Anthropic key server-side (so it never ships in the app bundle),
// verifies the caller's Supabase session, runs BETina's full tool loop
// (team/news lookups + memory + reminders) and returns her reply.
//
// Deploy:
//   supabase functions deploy chat          # JWT verification ON (default)
//   supabase secrets set ANTHROPIC_API_KEY=<your rotated key>
// (SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPlayerByPhone } from '../_shared/crm-client.ts';
import { normalizePhone } from '../_shared/phone.ts';
import {
  CRMData, Ctx, MatchEvent, NewsItem, TIPPSPIEL_LIVE, systemPrompt,
} from '../_shared/betina-persona.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MODEL = 'claude-haiku-5-5';
const MAX_TOOL_ROUNDS = 5;
const SPORTS_API = 'https://intelligence.geniusbet.com';
// BETina's own news gateway (betina-server): fresh news in the player's language.
const NEWS_API = 'https://api.betina.geniusbet.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Turn = { role: 'user' | 'assistant'; content: string };
// ── Tools ─────────────────────────────────────────────────────────────────────

const TOOLS = [
  // Anthropic server-side web search — lets BETina look up ANY live fact
  // (standings, brackets, transfers, other sports, breaking news) beyond the
  // app's own fixtures/results/news feed. Executed on Anthropic's side.
  { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
  { name: 'search_team', description: 'Find a sports team by name across ANY sport to get its id, sport and league. Call this first for a team you do not already have an id for.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_fixtures', description: "A team's upcoming matches. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_results', description: "A team's recent finished matches with scores. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_news', description: 'Latest sports headlines. Optional sport filter.', input_schema: { type: 'object', properties: { sport: { type: 'string' } }, required: [] } },
  ...(TIPPSPIEL_LIVE
    ? [{ name: 'get_tippspiel', description: "The player's Tippspiel (free prediction game): season points + rank, the duel against you (BETina tips every match too), matches in the next days they still have to tip, their upcoming tips and latest scored tips.", input_schema: { type: 'object', properties: {}, required: [] } }]
    : []),
  { name: 'remember_fact', description: 'Save a lasting fact/preference the player shares so you recall it next time. Only worthwhile things, not small talk.', input_schema: { type: 'object', properties: { fact: { type: 'string' } }, required: ['fact'] } },
  { name: 'set_reminder', description: 'Set a reminder. Work out a concrete future ISO datetime from what they said and today\'s date.', input_schema: { type: 'object', properties: { text: { type: 'string' }, datetime: { type: 'string' } }, required: ['text', 'datetime'] } },
];

function compactMatch(e: MatchEvent) {
  return { home: e.home, away: e.away, score: e.homeScore != null && e.awayScore != null ? `${e.homeScore}-${e.awayScore}` : null, date: e.date, time: e.time ? e.time.slice(0, 5) : null, league: e.league };
}

// deno-lint-ignore no-explicit-any
async function runTool(name: string, input: any, supabase: any, userId: string | null, lang: string): Promise<string> {
  try {
    if (name === 'search_team') {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(String(input.query ?? ''))}`);
      const d = await r.json();
      // deno-lint-ignore no-explicit-any
      return JSON.stringify((d.teams ?? []).slice(0, 5).map((t: any) => ({ id: t.idTeam, name: t.strTeam, sport: t.strSport, league: t.strLeague })));
    }
    if (name === 'get_fixtures') {
      const r = await fetch(`${SPORTS_API}/api/sports/team/${input.team_id}/next`);
      const d = await r.json();
      return JSON.stringify((d.events ?? []).slice(0, 5).map(compactMatch));
    }
    if (name === 'get_results') {
      const r = await fetch(`${SPORTS_API}/api/sports/team/${input.team_id}/last`);
      const d = await r.json();
      return JSON.stringify((d.events ?? []).slice(0, 5).map(compactMatch));
    }
    if (name === 'get_news') {
      const r = await fetch(`${NEWS_API}/v1/news?sport=${input.sport ?? 'sport'}&count=8&lang=${encodeURIComponent(lang)}`);
      const d = await r.json();
      return JSON.stringify((d.items ?? []).slice(0, 8).map((n: NewsItem) => n.title));
    }
    if (name === 'get_tippspiel') {
      if (!userId) return 'Not signed in.';
      const now = new Date();
      const soon = new Date(now.getTime() + 4 * 86_400_000);
      const [{ data: upcoming }, { data: tips }, { data: board }, { data: stats }] = await Promise.all([
        supabase.from('tip_matches')
          .select('id, competition, home_name, away_name, kickoff')
          .in('status', ['SCHEDULED', 'TIMED'])
          .gt('kickoff', now.toISOString()).lt('kickoff', soon.toISOString())
          .order('kickoff').limit(80),
        supabase.from('tips')
          .select('match_id, home, away, points, tip_matches(competition, home_name, away_name, kickoff, status, home_score, away_score)')
          .eq('user_id', userId).order('updated_at', { ascending: false }).limit(40),
        supabase.rpc('tip_leaderboard', { p_competition: null, p_matchday: null, p_group: null, p_limit: 1 }),
        supabase.rpc('tip_my_stats', { p_competition: null }),
      ]);
      // deno-lint-ignore no-explicit-any
      const mine = (tips ?? []) as any[];
      const tipped = new Set(mine.map((t) => t.match_id));
      // deno-lint-ignore no-explicit-any
      const me = ((board ?? []) as any[]).find((r) => r.is_me);
      const label = (m: { home_name: string; away_name: string; competition: string }) => `${m.home_name} vs ${m.away_name} (${m.competition})`;
      // Team vs BETina: each Tipprunde's rounds won/lost against you.
      const { data: groups } = await supabase.rpc('my_tip_groups');
      // deno-lint-ignore no-explicit-any
      const teams = await Promise.all(((groups ?? []) as any[]).slice(0, 5).map(async (g) => {
        const { data: d } = await supabase.rpc('tip_group_duel', { p_group: g.id });
        return { group: g.name, members: Number(g.members), rounds_won_vs_you: d?.won ?? 0, rounds_lost_vs_you: d?.lost ?? 0, last_round: d?.rounds?.[0] ?? null };
      }));
      return JSON.stringify({
        teams_vs_you: teams,
        season: me ? { points: Number(me.points), rank: Number(me.rank), exact: Number(me.exact), tips: Number(me.tips) } : { points: 0, tips: 0 },
        // "Beat BETina": you tip every match too; this is the duel on matches you both tipped.
        duel_vs_you: stats?.duel ?? null,
        scoring_streak_rounds: stats?.streak ?? 0,
        still_to_tip: (upcoming ?? []).filter((m) => !tipped.has(m.id)).slice(0, 10).map((m) => ({ match: label(m), kickoff: m.kickoff })),
        upcoming_tips: mine.filter((t) => t.tip_matches && Date.parse(t.tip_matches.kickoff) > now.getTime())
          .slice(0, 10).map((t) => ({ match: label(t.tip_matches), tip: `${t.home}:${t.away}`, kickoff: t.tip_matches.kickoff })),
        recent_results: mine.filter((t) => t.points != null)
          .sort((a, b) => Date.parse(b.tip_matches.kickoff) - Date.parse(a.tip_matches.kickoff))
          .slice(0, 8).map((t) => ({ match: label(t.tip_matches), result: `${t.tip_matches.home_score}:${t.tip_matches.away_score}`, tip: `${t.home}:${t.away}`, points: t.points })),
      });
    }
    if (name === 'remember_fact') {
      if (!userId) return "Can't save (not signed in).";
      const { error } = await supabase.from('betina_memories').insert({ user_id: userId, content: String(input.fact ?? '').trim() });
      return error ? `Could not save: ${error.message}` : 'Saved.';
    }
    if (name === 'set_reminder') {
      if (!userId) return "Can't set it (not signed in).";
      const when = new Date(String(input.datetime ?? ''));
      if (isNaN(when.getTime())) return 'Time unclear — ask the player to be specific.';
      const { error } = await supabase.from('reminders').insert({ user_id: userId, text: String(input.text ?? '').trim(), remind_at: when.toISOString() });
      return error ? `Could not set reminder: ${error.message}` : `Reminder set for ${when.toISOString()}.`;
    }
    return 'Unknown tool.';
  } catch {
    return 'That lookup failed — no data right now.';
  }
}

const DECLINED: Record<string, string> = {
  en: "Ha, that one's not for me 🙈 Ask me something else!",
  de: 'Haha, da bin ich raus 🙈 Frag mich was anderes!',
  es: 'Jaja, eso no es lo mío 🙈 ¡Pregúntame otra cosa!',
  pt: 'Haha, nisso não entro 🙈 Pergunta-me outra coisa!',
  fr: 'Haha, là je passe 🙈 Demande-moi autre chose !',
  it: 'Ahah, su questo passo 🙈 Chiedimi altro!',
  ro: 'Haha, aici nu mă bag 🙈 Întreabă-mă altceva!',
};

// deno-lint-ignore no-explicit-any
async function callClaude(system: string, messages: any[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    // Haiku 5.5 thinks adaptively by default (thinking counts towards max_tokens);
    // low effort keeps chat replies quick.
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, output_config: { effort: 'low' }, system, tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { history, ctx } = (await req.json()) as { history: Turn[]; ctx: Ctx };

    // Auth-scoped client so memory/reminder writes run as the caller (RLS).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // First message must be from the user
    const firstUser = history.findIndex((m) => m.role === 'user');
    const trimmed = firstUser === -1 ? [] : history.slice(firstUser).slice(-24);
    if (!trimmed.length) return new Response(JSON.stringify({ reply: '' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

    // What BETina has recently pushed to this player, so she stays consistent
    // with her own notifications instead of re-announcing them.
    let recentNotes: string[] = [];
    try {
      const { data: notes } = await supabase
        .from('notifications')
        .select('title, body, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      recentNotes = (notes ?? []).map((n) =>
        `${n.title ? n.title + ': ' : ''}${n.body ?? ''}`.trim(),
      ).filter(Boolean);
    } catch (_) {
      // non-fatal — chat works without notification history
    }

    // Real-time CRM account data for Reactive Answers (RA-001–020). Fresh per
    // request; graceful — chat still works if the CRM is unreachable.
    let crmData: CRMData | null = null;
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('phone, phone_normalized')
        .eq('id', user.id)
        .single();
      const phone = prof?.phone_normalized ?? prof?.phone ?? null;
      if (phone) {
        const p = await getPlayerByPhone(normalizePhone(phone));
        if (p) {
          crmData = {
            balance: p.balance ?? 0, bonus_balance: p.bonus_balance ?? 0,
            kyc_status: p.kyc_status ?? 'pending', vip_tier: p.vip_tier ?? 'standard',
            total_deposits: p.total_deposits ?? 0, total_withdrawals: p.total_withdrawals ?? 0,
            total_wins: p.total_wins ?? 0, total_losses: p.total_losses ?? 0, total_bets: p.total_bets ?? 0,
            last_bet_result: p.last_bet_result ?? null,
            last_win_amount: p.last_win_amount ?? 0, last_loss_amount: p.last_loss_amount ?? 0,
            active_bonus_name: p.active_bonus_name ?? null, bonus_expiry: p.bonus_expiry ?? null,
            wagering_requirement: p.wagering_requirement ?? 0, wagering_done: p.wagering_done ?? 0,
            free_spins_available: p.free_spins_available ?? 0, cashback_balance: p.cashback_balance ?? 0,
            loyalty_points: p.loyalty_points ?? 0,
            last_withdrawal_status: p.last_withdrawal_status ?? null,
            last_withdrawal_pending_hours: p.last_withdrawal_pending_hours ?? 0,
            deposit_limit_daily: p.deposit_limit_daily ?? 0,
            deposit_limit_usage_pct: p.deposit_limit_usage_pct ?? 0,
            loss_limit_usage_pct: p.loss_limit_usage_pct ?? 0,
            self_exclusion: !!p.self_exclusion, country: p.country ?? '',
            registration_date: p.registration_date ?? '', last_active: p.last_active ?? '',
            inactivity_days: p.inactivity_days ?? 0, win_streak: p.win_streak ?? 0, loss_streak: p.loss_streak ?? 0,
            open_bet_slips: p.open_bet_slips ?? 0, cashout_available: !!p.cashout_available,
          };
        }
      }
    } catch (_) {
      // non-fatal — BETina just won't know account details this turn
    }

    // deno-lint-ignore no-explicit-any
    const messages: any[] = trimmed.map((m) => ({ role: m.role, content: m.content }));
    const system = systemPrompt(ctx, recentNotes, crmData);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await callClaude(system, messages);
      // Server-side tools (web_search) can pause mid-turn — hand the partial
      // turn back so Claude continues where it left off.
      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content });
        continue;
      }
      if (response.stop_reason === 'tool_use') {
        // deno-lint-ignore no-explicit-any
        const toolUses = (response.content ?? []).filter((b: any) => b.type === 'tool_use');
        messages.push({ role: 'assistant', content: response.content });
        const results = await Promise.all(
          // deno-lint-ignore no-explicit-any
          toolUses.map(async (tu: any) => ({ type: 'tool_result', tool_use_id: tu.id, content: await runTool(tu.name, tu.input ?? {}, supabase, user.id, ctx.lang ?? 'en') })),
        );
        messages.push({ role: 'user', content: results });
        continue;
      }
      // deno-lint-ignore no-explicit-any
      const text = (response.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
      // A declined request comes back as stop_reason "refusal" without usable text.
      const reply = response.stop_reason === 'refusal' || !text ? (DECLINED[ctx.lang] ?? DECLINED.en) : text;
      return new Response(JSON.stringify({ reply }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ reply: '' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
