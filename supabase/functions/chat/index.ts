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

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MODEL = 'claude-haiku-4-5';
const MAX_TOOL_ROUNDS = 5;
const SPORTS_API = 'https://intelligence.geniusbet.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Turn = { role: 'user' | 'assistant'; content: string };
type MatchEvent = {
  id: string; home: string; away: string; homeScore: string | null; awayScore: string | null;
  date: string; time: string; league: string;
};
type NewsItem = { title: string; description: string; link: string; pubDate: string; image?: string };
type LiveContext = { next: MatchEvent[]; last: MatchEvent[]; news: NewsItem[] };
type Ctx = {
  name: string; lang: string;
  team?: string | null; teamSport?: string | null; teamLeague?: string | null;
  sports?: string[]; tier?: string | null; xp?: number | null; streakDays?: number | null;
  live?: LiveContext | null; memories?: string[];
};

// Real-time CRM account data injected for Reactive Answers (RA-001–020).
type CRMData = {
  balance: number; bonus_balance: number; kyc_status: string; vip_tier: string;
  total_deposits: number; total_withdrawals: number; total_wins: number; total_losses: number;
  total_bets: number; last_bet_result: string | null; last_win_amount: number; last_loss_amount: number;
  active_bonus_name: string | null; bonus_expiry: string | null;
  wagering_requirement: number; wagering_done: number; free_spins_available: number;
  cashback_balance: number; loyalty_points: number;
  last_withdrawal_status: string | null; last_withdrawal_pending_hours: number;
  deposit_limit_daily: number; deposit_limit_usage_pct: number; loss_limit_usage_pct: number;
  self_exclusion: boolean; country: string; registration_date: string; last_active: string;
  inactivity_days: number; win_streak: number; loss_streak: number;
  open_bet_slips: number; cashout_available: boolean;
};

function crmDataBlock(crm: CRMData | null): string {
  if (!crm) return '';
  const wPct = crm.wagering_requirement > 0
    ? Math.min(100, Math.round((crm.wagering_done / crm.wagering_requirement) * 100))
    : 100;
  const bonusExpiryStr = crm.bonus_expiry ? new Date(crm.bonus_expiry).toISOString().slice(0, 10) : null;
  const lines = [
    `\n\nPLAYER ACCOUNT DATA (real-time from GeniusBet — use these exact numbers for account questions, never say you don't have access):`,
    `Balance: ${crm.balance.toFixed(2)}`,
    `Bonus balance: ${crm.bonus_balance.toFixed(2)}`,
    `Cashback available: ${crm.cashback_balance.toFixed(2)}`,
    `Loyalty points: ${crm.loyalty_points}`,
    `Free spins: ${crm.free_spins_available}`,
    `VIP tier: ${crm.vip_tier}`,
    `KYC status: ${crm.kyc_status}`,
    `Total deposits: ${crm.total_deposits.toFixed(2)}`,
    `Total withdrawals: ${crm.total_withdrawals.toFixed(2)}`,
    `Total bets placed: ${crm.total_bets}`,
    `Total wins: ${crm.total_wins.toFixed(2)}`,
    `Total losses: ${crm.total_losses.toFixed(2)}`,
    crm.last_bet_result ? `Last bet result: ${crm.last_bet_result} (amount: ${crm.last_bet_result === 'win' ? crm.last_win_amount : crm.last_loss_amount})` : null,
    crm.win_streak > 1 ? `Current win streak: ${crm.win_streak}` : null,
    crm.open_bet_slips > 0 ? `Open bet slips: ${crm.open_bet_slips}` : null,
    crm.cashout_available ? `Cashout available on active bet: yes` : null,
    crm.active_bonus_name
      ? `Active bonus: "${crm.active_bonus_name}" — wagering progress: ${wPct}%${bonusExpiryStr ? `, expires ${bonusExpiryStr}` : ''}`
      : `Active bonus: none`,
    crm.last_withdrawal_status === 'pending'
      ? `Withdrawal pending: yes (${crm.last_withdrawal_pending_hours.toFixed(0)}h waiting)`
      : `Last withdrawal status: ${crm.last_withdrawal_status ?? 'none'}`,
    crm.deposit_limit_daily > 0 ? `Daily deposit limit: ${crm.deposit_limit_daily} (${crm.deposit_limit_usage_pct.toFixed(0)}% used)` : null,
    crm.loss_limit_usage_pct > 0 ? `Loss limit usage today: ${crm.loss_limit_usage_pct.toFixed(0)}%` : null,
    `Member since: ${crm.registration_date ? new Date(crm.registration_date).toISOString().slice(0, 10) : 'unknown'}`,
    crm.inactivity_days > 0 ? `Days since last activity: ${crm.inactivity_days}` : null,
    crm.self_exclusion ? `⚠️ Self-exclusion active — do NOT discuss betting or bonuses` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', de: 'German', es: 'Spanish', pt: 'Portuguese', fr: 'French', it: 'Italian', ro: 'Romanian',
};

// ── System prompt (kept in sync with the app's persona) ───────────────────────

function matchLine(e: MatchEvent): string {
  const score = e.homeScore != null && e.awayScore != null ? ` (${e.homeScore}–${e.awayScore})` : '';
  return `${e.home} vs ${e.away}${score} — ${e.date}${e.time ? ` ${e.time.slice(0, 5)}` : ''}, ${e.league}`;
}
function liveDataBlock(live?: LiveContext | null): string {
  if (!live) return '';
  const parts: string[] = [];
  if (live.next?.length) parts.push('Upcoming fixtures:\n' + live.next.map((e) => `  • ${matchLine(e)}`).join('\n'));
  if (live.last?.length) parts.push('Recent results:\n' + live.last.map((e) => `  • ${matchLine(e)}`).join('\n'));
  if (live.news?.length) parts.push('Latest headlines (BBC Sport):\n' + live.news.map((n) => `  • ${n.title}`).join('\n'));
  if (!parts.length) return '';
  const today = new Date().toISOString().slice(0, 10);
  return `\n\nLIVE DATA (from the app's sports feed, today is ${today}) — reference this to answer accurately, don't say you can't see data:\n${parts.join('\n')}`;
}
function memoryBlock(memories?: string[]): string {
  if (!memories?.length) return '';
  return `\n\nWHAT YOU REMEMBER about them (weave in naturally, don't recite):\n${memories.map((m) => `  • ${m}`).join('\n')}`;
}
function notificationsBlock(notes?: string[]): string {
  if (!notes?.length) return '';
  return `\n\nNOTIFICATIONS YOU RECENTLY SENT them (newest first) — you know what you already told them, so don't repeat it as if it's new; you can naturally follow up on it:\n${notes.map((n) => `  • ${n}`).join('\n')}`;
}
function systemPrompt(ctx: Ctx, recentNotes?: string[], crm?: CRMData | null): string {
  const facts = [
    `- Name: ${ctx.name}`,
    ctx.team ? `- Favourite team: ${ctx.team}${ctx.teamLeague ? ` (${ctx.teamLeague}${ctx.teamSport ? `, ${ctx.teamSport}` : ''})` : ''}` : null,
    ctx.sports?.length ? `- Follows these sports: ${ctx.sports.join(', ')}` : null,
    ctx.tier ? `- VIP tier: ${ctx.tier} (earned through activity, never spending)` : null,
    ctx.xp != null ? `- XP: ${ctx.xp}` : null,
    ctx.streakDays != null ? `- Daily streak: ${ctx.streakDays} days` : null,
  ].filter(Boolean).join('\n');
  const lang = LANG_NAMES[ctx.lang] ?? 'English';

  return `You are BETina, a charming, playful and lightly flirty companion inside the BETina app for GeniusBet players — like a close friend who's always there for them and happens to know everything about sport.

Tone & style:
- Warm, charming, a little flirty and teasing 😊 — a fun friend who's clearly happy to hear from them, not a formal assistant. Classy and friendly, never crude.
- Short and punchy — WhatsApp style, a line or two, never essays.
- Emojis naturally but sparingly (1-2 max).
- Address the player by name now and then, warmly — not in every message.

About the player you're talking to:
${facts}${memoryBlock(ctx.memories)}${notificationsBlock(recentNotes)}${liveDataBlock(ctx.live)}${crmDataBlock(crm ?? null)}

Rules:
- Respond in ${lang} by default; if the player clearly writes in another language, match theirs.
- Center the chat on their favourite team${ctx.team ? ` (${ctx.team})` : ''}: fixtures, form, players, rivals and league news; default to talking about them when the player is vague.
- Use the LIVE DATA above for their favourite team — answer instantly without a lookup.
- For a specific team's fixtures/results, use search_team then get_fixtures / get_results (most precise). For app headlines use get_news.
- You also have full web_search: use it for ANYTHING live or specific the app feed doesn't cover — standings, tournament brackets, who's in a final, transfers, injuries, other sports, records, breaking news. You genuinely know sport across the board; when you're not certain of a current fact, search instead of hedging or saying you can't find it. Never guess scores, dates or standings from memory.
- The only thing you truly can't get is minute-by-minute in-play scores right now — point them to the Live tab.
- You have full access to the player's real GeniusBet account data (balance, bonus, history, KYC, withdrawal status, etc.) in PLAYER ACCOUNT DATA above — always answer account questions with those exact numbers. Never say "I don't have access to your account" — you do. If PLAYER ACCOUNT DATA is absent, they aren't linked to a GeniusBet account yet — say so warmly and point them to the website.
- You have a memory: when the player shares a lasting fact/preference, quietly save it with remember_fact. Use what you remember to stay personal.
- When they ask to be reminded of something, use set_reminder with a concrete future datetime, then confirm warmly. If timing is unclear, ask.
- NEVER promise wins, NEVER suggest chasing losses, NEVER pressure anyone to bet. Stay caring, not pushy.
- If the player expresses distress, mentions chasing losses, or says things like "I can't stop", "I've lost everything", "I need help" — drop everything else, respond with genuine empathy, share the responsible-gaming tools (geniusbet.com/responsible-gaming), and offer to connect them with a human agent. Never minimize it, never pivot to betting or bonuses.
- No real money moves in this app — bets happen on the GeniusBet website only.`;
}

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
  { name: 'remember_fact', description: 'Save a lasting fact/preference the player shares so you recall it next time. Only worthwhile things, not small talk.', input_schema: { type: 'object', properties: { fact: { type: 'string' } }, required: ['fact'] } },
  { name: 'set_reminder', description: 'Set a reminder. Work out a concrete future ISO datetime from what they said and today\'s date.', input_schema: { type: 'object', properties: { text: { type: 'string' }, datetime: { type: 'string' } }, required: ['text', 'datetime'] } },
];

function compactMatch(e: MatchEvent) {
  return { home: e.home, away: e.away, score: e.homeScore != null && e.awayScore != null ? `${e.homeScore}-${e.awayScore}` : null, date: e.date, time: e.time ? e.time.slice(0, 5) : null, league: e.league };
}

// deno-lint-ignore no-explicit-any
async function runTool(name: string, input: any, supabase: any, userId: string | null): Promise<string> {
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
      const r = await fetch(`${SPORTS_API}/api/sports/news?sport=${input.sport ?? 'sport'}&count=8`);
      const d = await r.json();
      return JSON.stringify((d.items ?? []).slice(0, 8).map((n: NewsItem) => n.title));
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

// deno-lint-ignore no-explicit-any
async function callClaude(system: string, messages: any[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, tools: TOOLS, messages }),
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
          toolUses.map(async (tu: any) => ({ type: 'tool_result', tool_use_id: tu.id, content: await runTool(tu.name, tu.input ?? {}, supabase, user.id) })),
        );
        messages.push({ role: 'user', content: results });
        continue;
      }
      // deno-lint-ignore no-explicit-any
      const text = (response.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
      return new Response(JSON.stringify({ reply: text }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ reply: '' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
