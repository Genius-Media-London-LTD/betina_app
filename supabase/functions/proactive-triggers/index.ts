// BETina proactive triggers engine — Supabase Edge Function (Deno).
//
// Cron every 15 min. Sweeps BETina APP users (profiles with a push token),
// matches each to their CRM player by normalized phone, then evaluates the
// trigger registry and sends the first eligible message.
//
// Order of precedence per user (at most ONE message per run):
//   1. self_exclusion  → user skipped entirely (no message, no log)
//   2. RG triggers      → highest priority, exempt from frequency cap
//   3. transactional    → exempt from the marketing cap, blocked by nothing
//   4. marketing        → subject to caps (1/day, 3/week) + paused if risk_flag
//
// Frequency-cap source of truth = CRM betina_trigger_log (cross-channel).
// In-app visibility = a row in Supabase `notifications` (the app reads it).
//
// Deploy:  supabase functions deploy proactive-triggers --no-verify-jwt
// Env:     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
//          CRM_API_URL, CRM_BETINA_KEY
// Schedule (SQL, once): see supabase/migrations/006_proactive_triggers.sql

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  type CRMPlayer, getPlayerByPhone, getTriggerLog, logTrigger,
  daysSince, hoursUntil, wageringPct,
} from '../_shared/crm-client.ts';
import { normalizePhone } from '../_shared/phone.ts';
import { sendSms } from '../_shared/sms.ts';

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const SPORTS_API = 'https://intelligence.geniusbet.com';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MODEL = 'claude-haiku-4-5';

const MARKETING_MAX_PER_DAY = 1;
const MARKETING_MAX_PER_WEEK = 3;

const LANG_NAMES: Record<string, string> = {
  en: 'English', de: 'German', es: 'Spanish', pt: 'Portuguese', fr: 'French', it: 'Italian', ro: 'Romanian',
};

type ProfileRow = {
  id: string; name: string | null; phone: string | null; phone_normalized: string | null;
  push_token: string | null; language: string | null; favourite_team_id: string | null;
  created_at: string | null; notify_betina: boolean | null; notify_events: boolean | null;
};

type Fixture = { date: string; time: string; home: string; away: string };

// ── Frequency caps ────────────────────────────────────────────────────────────
type Cap =
  | { k: 'once' }
  | { k: 'perDay' } | { k: 'perWeek' } | { k: 'perMonth' } | { k: 'perYear' }
  | { k: 'maxIn'; n: number; days: number }
  | { k: 'cooldownD'; days: number };

const DAY = 86_400_000;
function countWithin(times: number[], now: number, days: number): number {
  const cut = now - days * DAY;
  return times.filter((t) => t >= cut).length;
}
function passesCap(cap: Cap, times: number[], now: number): boolean {
  switch (cap.k) {
    case 'once': return times.length === 0;
    case 'perDay': return countWithin(times, now, 1) === 0;
    case 'perWeek': return countWithin(times, now, 7) === 0;
    case 'perMonth': return countWithin(times, now, 30) === 0;
    case 'perYear': return countWithin(times, now, 365) === 0;
    case 'maxIn': return countWithin(times, now, cap.days) < cap.n;
    case 'cooldownD': return countWithin(times, now, cap.days) === 0;
  }
}

// ── Trigger registry ──────────────────────────────────────────────────────────
type Ctx = {
  p: CRMPlayer;
  pf: ProfileRow;
  now: Date;
  today: string;                                   // 'YYYY-MM-DD' (UTC)
  nextFixture: () => Promise<Fixture | null>;      // favourite team's next match
};
type Trig = {
  id: string;
  cat: 'rg' | 'transactional' | 'marketing';
  // Which settings toggle gates this trigger: 'events' → notify_events (⚽),
  // otherwise notify_betina (💬). Defaults to 'betina'.
  pref?: 'betina' | 'events';
  cap: Cap;
  cond: (c: Ctx) => boolean | Promise<boolean>;
  brief: (c: Ctx) => string | Promise<string>;
};

// Minutes until kickoff. TheSportsDB fixture times are UTC, so we parse
// date+time as UTC; this fires the reminder ~2h before the real kickoff
// regardless of the player's timezone.
function minutesToKickoff(fx: Fixture, now: Date): number {
  const t = Date.parse(`${fx.date}T${(fx.time || '00:00:00')}Z`);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (t - now.getTime()) / 60000;
}
function opponent(fx: Fixture, favTeam: string | null): string {
  const home = fx.home || '';
  return favTeam && home.toLowerCase().includes(favTeam.toLowerCase()) ? (fx.away || '') : home;
}

function mmdd(d: Date) { return [d.getUTCMonth(), d.getUTCDate()]; }
function sameDayOfYear(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const [m1, d1] = mmdd(d); const [m2, d2] = mmdd(now);
  return m1 === m2 && d1 === d2;
}

// Evaluation order = priority. RG first, then transactional, then marketing.
// Triggers the spec marks "ohne echte Daten: skip" (BT-020/021/024/030/033/036/
// 047/057/060, RG-06/08/10) are intentionally omitted until a data source exists.
const TRIGGERS: Trig[] = [
  // ── RESPONSIBLE GAMING (highest priority, cap-exempt) ──────────────────────
  { id: 'RG-05', cat: 'rg', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => (c.p.loss_streak >= 5) || (c.p.loss_limit_usage_pct >= 95),
    brief: () => `The player is on a heavy losing run / near their loss limit. Send a caring, non-judgmental check-in: suggest a break or a cool-down, offer the responsible-gaming tools. Absolutely NO bonus, NO "win it back", NO encouragement to keep playing.` },
  { id: 'RG-01', cat: 'rg', cap: { k: 'cooldownD', days: 3 },
    cond: (c) => c.p.deposit_count_7d > 5,
    brief: () => `The player's deposits have spiked recently. Gentle, caring check-in — "everything ok?" — and point them to their limit tools. No incentives.` },
  { id: 'RG-04', cat: 'rg', cap: { k: 'perDay' },
    cond: (c) => c.p.loss_limit_usage_pct >= 80,
    brief: (c) => `The player has reached ${Math.round(c.p.loss_limit_usage_pct)}% of their daily loss limit. Inform them neutrally, no judgment, no incentive.` },
  { id: 'RG-09', cat: 'rg', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.withdrawal_reversal_count > 0 && daysSince(c.p.last_withdrawal_at) < 1,
    brief: () => `The player reversed a withdrawal (a possible regret signal). Neutrally offer the protection/limit tools. No pressure.` },
  { id: 'RG-02', cat: 'rg', cap: { k: 'perDay' },
    cond: (c) => c.p.avg_session_minutes > 90,
    brief: (c) => `The player's sessions are long (~${Math.round(c.p.avg_session_minutes)} min). Kindly suggest a short break.` },
  { id: 'RG-03', cat: 'rg', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.now.getUTCHours() >= 2 && c.now.getUTCHours() <= 5 && c.p.inactivity_days === 0,
    brief: () => `It's the middle of the night and the player is active. Send a caring "you good?" nudge. No incentives at night.` },

  // ── TRANSACTIONAL (marketing-cap exempt; 1/day dedupe) ─────────────────────
  { id: 'BT-040', cat: 'transactional', cap: { k: 'once' },
    cond: (c) => c.p.total_bets === 1 && c.p.last_bet_result === 'win',
    brief: () => `Their very FIRST bet ever just won! Celebrate this milestone warmly.` },
  { id: 'BT-038', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_bet_result === 'win' &&
      c.p.last_win_amount > (c.p.total_wins / Math.max(c.p.total_bets, 1)) * 3 &&
      daysSince(c.p.last_bet_at) < 1,
    brief: (c) => `BIG WIN! The player just won ${c.p.last_win_amount} — much bigger than usual. Celebrate big.` },
  { id: 'BT-027', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_bet_result === 'win' && daysSince(c.p.last_bet_at) < 1,
    brief: (c) => `The player won their last bet (${c.p.last_win_amount}). Congratulate them warmly.` },
  { id: 'BT-028', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_bet_result === 'loss' && daysSince(c.p.last_bet_at) < 1,
    brief: (c) => `The player just lost a bet${c.p.fav_team ? ` (their team ${c.p.fav_team})` : ''}. Be empathetic and light — NEVER offer a reload bonus, NEVER say "win it back".` },
  { id: 'BT-004', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_bet_result === null && c.p.total_deposits > 0 && daysSince(c.p.last_deposit_at) < 1,
    brief: () => `First deposit landed but no bet yet. Warmly invite them to place their first tip.` },
  { id: 'BT-006', cat: 'transactional', cap: { k: 'once' },
    cond: (c) => c.p.total_bets === 1 && daysSince(c.p.last_bet_at) < 1,
    brief: () => `They just placed their first-ever bet. Cheer them on, fingers crossed.` },
  { id: 'BT-051', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.total_deposits === 0 && c.p.last_bet_result === null && daysSince(c.p.last_deposit_at) < 1,
    brief: () => `A deposit attempt failed. Reassure them and suggest trying again.` },
  { id: 'BT-052', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_withdrawal_status === 'completed' && daysSince(c.p.last_withdrawal_at) < 1,
    brief: () => `Their withdrawal completed — money's on the way. Confirm it cheerfully.` },
  { id: 'BT-053', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_withdrawal_status === 'pending' && c.p.last_withdrawal_pending_hours > 24,
    brief: () => `Their withdrawal has been pending over 24h. Reassure them it's being handled.` },
  { id: 'BT-054', cat: 'transactional', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_withdrawal_status === 'pending' && c.p.kyc_status !== 'approved',
    brief: () => `A withdrawal is blocked because KYC isn't approved. Nudge them to verify their account.` },

  // ── MARKETING (subject to caps; paused when risk_flag) ─────────────────────
  // Onboarding
  { id: 'BT-002', cat: 'marketing', cap: { k: 'maxIn', n: 2, days: 7 },
    cond: (c) => daysSince(c.p.registration_date) <= 7 && c.p.kyc_status !== 'approved',
    brief: () => `Their profile is almost done — nudge them to verify their identity (KYC).` },
  { id: 'BT-003', cat: 'marketing', cap: { k: 'maxIn', n: 2, days: 7 },
    cond: (c) => daysSince(c.p.registration_date) <= 7 && c.p.total_deposits === 0,
    brief: () => `Account created but no deposit yet. Friendly nudge to get started.` },
  { id: 'BT-005', cat: 'marketing', cap: { k: 'maxIn', n: 2, days: 7 },
    cond: (c) => c.p.total_deposits > 0 && c.p.total_bets === 0 && daysSince(c.p.last_deposit_at) <= 7,
    brief: () => `They have balance but haven't placed a bet. Encourage their first tip.` },
  { id: 'BT-007', cat: 'marketing', cap: { k: 'once' },
    cond: (c) => daysSince(c.p.registration_date) === 3,
    brief: () => `Day 3 check-in. Ask how it's going, tease today's top matches.` },
  { id: 'BT-008', cat: 'marketing', cap: { k: 'once' },
    cond: (c) => daysSince(c.p.registration_date) === 7,
    brief: () => `One week in! Warm check-in on their first week.` },
  // Win-back / inactivity (1x per cycle ≈ band-length cooldown)
  { id: 'BT-012', cat: 'marketing', cap: { k: 'cooldownD', days: 30 },
    cond: (c) => c.p.inactivity_days >= 30 && c.p.inactivity_days < 60,
    brief: () => `Away 30+ days. Heartfelt win-back — they're missed. Keep it warm, not desperate.` },
  { id: 'BT-013', cat: 'marketing', cap: { k: 'cooldownD', days: 90 },
    cond: (c) => c.p.inactivity_days >= 60,
    brief: () => `Away 60+ days — a final, gentle "you're missed" note.` },
  { id: 'BT-011', cat: 'marketing', cap: { k: 'cooldownD', days: 14 },
    cond: (c) => c.p.inactivity_days >= 14 && c.p.inactivity_days < 30,
    brief: () => `Away 2 weeks — BETina honestly misses them. Warm, a little flirty.` },
  { id: 'BT-010', cat: 'marketing', cap: { k: 'cooldownD', days: 7 },
    cond: (c) => c.p.inactivity_days >= 7 && c.p.inactivity_days < 14,
    brief: () => `Away a week. Light "haven't seen you" nudge${''}.` },
  { id: 'BT-009', cat: 'marketing', cap: { k: 'cooldownD', days: 4 },
    cond: (c) => c.p.inactivity_days >= 3 && c.p.inactivity_days < 7,
    brief: (c) => `Away 3 days — casual "you good?" nudge${c.p.fav_team ? `, mention ${c.p.fav_team}` : ''}.` },
  { id: 'BT-015', cat: 'marketing', cap: { k: 'cooldownD', days: 3 },
    cond: (c) => c.p.login_count_7d === 1 && daysSince(c.p.registration_date) > 14 && c.p.inactivity_days === 0,
    brief: () => `They just came back after a long pause. Warm "welcome back!" 🙌` },
  { id: 'BT-014', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => c.p.total_bets > 0 && c.p.login_count_7d > 0 && c.p.login_count_7d < 3 && c.p.inactivity_days < 7,
    brief: () => `Their activity is trailing off. Send a light, encouraging nudge.` },
  // Occasions
  { id: 'BT-016', cat: 'marketing', cap: { k: 'perYear' },
    cond: (c) => sameDayOfYear(c.p.birthday, c.now),
    brief: () => `It's the player's BIRTHDAY today 🎂. Warm, celebratory birthday message from BETina.` },
  { id: 'BT-017', cat: 'marketing', cap: { k: 'perYear' },
    cond: (c) => sameDayOfYear(c.p.registration_date, c.now) && daysSince(c.p.registration_date) >= 360,
    brief: () => `It's their GeniusBet account anniversary 🥳. Celebrate the milestone.` },
  { id: 'BT-018', cat: 'marketing', cap: { k: 'perYear' },
    cond: (c) => c.now.getUTCMonth() === 11 && c.now.getUTCDate() >= 24 && c.now.getUTCDate() <= 26,
    brief: () => `It's Christmas. Warm seasonal greeting 🎄.` },
  { id: 'BT-019', cat: 'marketing', cap: { k: 'perYear' },
    cond: (c) => c.now.getUTCMonth() === 0 && c.now.getUTCDate() === 1,
    brief: () => `Happy New Year! 🎆 Warm seasonal greeting.` },
  { id: 'BT-022', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => c.now.getUTCDay() === 5 && c.now.getUTCHours() >= 17,
    brief: () => `It's Friday evening — the weekend is here 🏆. Tease the weekend's big matches.` },
  // Sports
  { id: 'BT-023B', cat: 'marketing', pref: 'events', cap: { k: 'perDay' },
    cond: async (c) => {
      if (!c.pf.favourite_team_id) return false;
      const fx = await c.nextFixture();
      if (!fx) return false;
      const m = minutesToKickoff(fx, c.now);
      return m >= 90 && m <= 150; // ~2h before kickoff (15-min cron hits this window)
    },
    brief: async (c) => {
      const fx = await c.nextFixture();
      const opp = fx ? opponent(fx, c.p.fav_team) : '';
      const kt = fx ? (fx.time || '').slice(0, 5) : '';
      return `${c.p.fav_team ?? 'Their team'} kicks off in about 2 hours${kt ? ` (${kt})` : ''}${opp ? ` vs ${opp}` : ''}. Give them a short, excited heads-up so they don't miss it.`;
    } },
  { id: 'BT-023', cat: 'marketing', pref: 'events', cap: { k: 'perDay' },
    cond: async (c) => {
      if (!c.pf.favourite_team_id) return false;
      const fx = await c.nextFixture();
      return !!fx && fx.date === c.today;
    },
    brief: async (c) => {
      const fx = await c.nextFixture();
      const opp = fx ? opponent(fx, c.p.fav_team) : '';
      return `Their favourite team ${c.p.fav_team ?? ''} plays TODAY 🏟️${opp ? ` vs ${opp}` : ''}. Hype them up for match day.`;
    } },
  { id: 'BT-031', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => !!c.p.fav_team && c.p.last_bet_result !== 'win' && c.p.inactivity_days < 7,
    brief: (c) => `${c.p.fav_team} won recently but the player had no bet on it. Light, playful "you missed out" nudge — no pressure.` },
  { id: 'BT-025', cat: 'marketing', cap: { k: 'perDay' },
    cond: (c) => c.p.open_bet_slips > 0 && c.p.last_bet_result === 'pending' && daysSince(c.p.last_bet_at) < 1,
    brief: () => `They have an unfinished bet slip. Gentle "want to finish it?" nudge.` },
  { id: 'BT-029', cat: 'marketing', cap: { k: 'perDay' },
    cond: (c) => c.p.cashout_available && c.p.open_bet_slips > 0,
    brief: () => `Cashout is available on their live bet. Let them know, no pressure.` },
  // Behaviour
  { id: 'BT-039', cat: 'marketing', cap: { k: 'cooldownD', days: 3 },
    cond: (c) => c.p.win_streak >= 3,
    brief: (c) => `They're on a ${c.p.win_streak}-win streak 🔥. Hype it up.` },
  { id: 'BT-041', cat: 'marketing', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.win_streak === 0 && c.p.loss_streak > 0 && daysSince(c.p.last_bet_at) < 1,
    brief: () => `Their win streak ended. Light, supportive note — happens to the best. No "win it back".` },
  // Bonuses
  { id: 'BT-043', cat: 'marketing', cap: { k: 'perDay' },
    cond: (c) => !!c.p.bonus_expiry && hoursUntil(c.p.bonus_expiry) <= 24 && hoursUntil(c.p.bonus_expiry) > 0,
    brief: (c) => `Their bonus expires in ${hoursUntil(c.p.bonus_expiry)}h ⚠️. Friendly heads-up.` },
  { id: 'BT-045', cat: 'marketing', cap: { k: 'perDay' },
    cond: (c) => c.p.cashback_balance > 0,
    brief: (c) => `They have ${c.p.cashback_balance} cashback waiting. Let them know cheerfully.` },
  { id: 'BT-044', cat: 'marketing', cap: { k: 'cooldownD', days: 7 },
    cond: (c) => !!c.p.active_bonus_name && wageringPct(c.p.wagering_done, c.p.wagering_requirement) >= 80,
    brief: (c) => `Almost there — only ${100 - wageringPct(c.p.wagering_done, c.p.wagering_requirement)}% wagering left to unlock their bonus.` },
  // BT-042 (generic "a new bonus is available") intentionally disabled: the CRM
  // has no "offer available" signal, so it would fire for almost everyone with
  // no active bonus and promise a bonus that may not exist. The bonus triggers
  // below are all grounded in real data (expiry, cashback, wagering, free spins).
  { id: 'BT-046', cat: 'marketing', cap: { k: 'cooldownD', days: 7 },
    cond: (c) => c.p.loyalty_points > 0 && (c.p.loyalty_points % 100) < 10,
    brief: (c) => `Loyalty milestone: ${Math.round(c.p.loyalty_points)} points 🏅. Celebrate it.` },
  // Casino
  { id: 'BT-035', cat: 'marketing', cap: { k: 'perDay' },
    cond: (c) => c.p.free_spins_available > 0,
    brief: (c) => `${c.p.free_spins_available} free spins are waiting for them.` },
  { id: 'BT-034', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => !!c.p.fav_casino_category && c.p.total_bets > 10,
    brief: (c) => `Casino recommendation based on their style (${c.p.fav_casino_category}).` },
  { id: 'BT-032', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => !!c.p.fav_casino_category && c.p.inactivity_days > 2,
    brief: (c) => `A new slot in their favourite category (${c.p.fav_casino_category}).` },
  { id: 'BT-037', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => !!c.p.fav_casino_category && c.p.inactivity_days > 7,
    brief: () => `Haven't seen them in the casino for a while — gentle come-back nudge.` },
  { id: 'BT-058', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => !!c.p.fav_casino_category && daysSince(c.p.last_bet_at) > 7,
    brief: () => `Their favourite slot has been waiting — playful "come back" nudge.` },
  // VIP
  { id: 'BT-050', cat: 'marketing', cap: { k: 'once' },
    cond: (c) => c.p.vip_tier !== 'standard' && c.p.total_bets > 50,
    brief: () => `Introduce their personal VIP manager warmly.` },
  { id: 'BT-049', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => c.p.vip_tier === 'vip' || c.p.vip_tier === 'platinum',
    brief: () => `A VIP-exclusive offer, just for them. Make them feel special.` },
  { id: 'BT-048', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => c.p.vip_tier !== 'platinum' && c.p.churn_score < 30,
    brief: () => `They're close to the next VIP tier. Encourage the final push.` },
  // Recommendation / community
  { id: 'BT-056', cat: 'marketing', cap: { k: 'perWeek' },
    cond: (c) => c.p.total_bets > 5 && c.p.segment === 'standard',
    brief: () => `"Players like you also enjoy…" — a tasteful recommendation.` },
  { id: 'BT-055', cat: 'marketing', cap: { k: 'perMonth' },
    cond: (c) => !!c.p.fav_sport && c.p.fav_casino_category === null,
    brief: (c) => `They love ${c.p.fav_sport} — gently suggest trying the casino too.` },
  { id: 'BT-059', cat: 'marketing', cap: { k: 'perMonth' },
    cond: (c) => c.p.total_bets > 3 && c.p.inactivity_days === 0,
    brief: () => `Invite them to refer a friend and earn a bonus.` },
  { id: 'BT-061', cat: 'marketing', cap: { k: 'cooldownD', days: 1 },
    cond: (c) => c.p.last_bet_result === 'win' && c.p.last_win_amount > 50,
    brief: () => `Invite them to share their win 🏆.` },
];

const MARKETING_IDS = new Set(TRIGGERS.filter((t) => t.cat === 'marketing').map((t) => t.id));

// ── Message generation (Claude, in the player's language) ─────────────────────
async function generateMessage(lang: string, name: string, brief: string): Promise<string | null> {
  const language = LANG_NAMES[lang] ?? 'English';
  const system = `You are BETina, a charming, playful, lightly flirty companion for GeniusBet sports fans. Write ONE short push-notification body in ${language}, addressed to ${name || 'you'}. Warm and teasing, WhatsApp-style, max ~140 characters, at most one emoji. Output ONLY the message text — no title, no quotes. NEVER promise wins, NEVER pressure them to bet, NEVER say "win it back".`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 200, system, messages: [{ role: 'user', content: brief }] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // deno-lint-ignore no-explicit-any
    const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
    return text || null;
  } catch { return null; }
}

async function sendPush(token: string, body: string) {
  await fetch(EXPO_PUSH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title: 'BETina 💚', body, sound: 'default' }),
  });
}

// Push if a token exists, otherwise SMS to the (E.164) phone. Returns the
// channel actually used, or 'none' if the player can't be reached.
async function deliver(pf: ProfileRow, crmPhone: string | null, body: string): Promise<'push' | 'sms' | 'none'> {
  if (pf.push_token) {
    await sendPush(pf.push_token, body);
    return 'push';
  }
  const smsPhone = crmPhone ?? pf.phone_normalized ?? normalizePhone(pf.phone ?? '');
  if (smsPhone && smsPhone !== '+') {
    await sendSms(smsPhone, body);
    return 'sms';
  }
  return 'none';
}

// ── Sweep ─────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  // deno-lint-ignore no-explicit-any
  const supabase: any = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const now = new Date();
  const nowMs = now.getTime();
  const today = now.toISOString().slice(0, 10);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, phone, phone_normalized, push_token, language, favourite_team_id, created_at, notify_betina, notify_events')
    .or('push_token.not.is.null,phone.not.is.null'); // push users OR users with a phone (SMS fallback)

  let sent = 0;

  for (const pf of (users ?? []) as ProfileRow[]) {
    try {
      // Opted out of everything → skip entirely. Per-trigger gating (by pref)
      // happens below, so a user with only one category off still runs.
      if (pf.notify_betina === false && pf.notify_events === false) continue;
      const phone = pf.phone_normalized || normalizePhone(pf.phone ?? '');
      if (!phone || phone === '+') continue;

      const player = await getPlayerByPhone(phone);

      // No CRM match → app-only user: only the one-time welcome (BT-001, a 💬 msg).
      if (!player) {
        if (pf.notify_betina === false) continue;
        const createdDays = daysSince(pf.created_at);
        if (createdDays >= 2) continue;
        const { data: prior } = await supabase
          .from('notifications').select('id').eq('user_id', pf.id).eq('type', 'BT-001').limit(1);
        if ((prior?.length ?? 0) > 0) continue;
        const body = await generateMessage(pf.language ?? 'en', pf.name ?? '', 'Welcome them to GeniusBet as BETina, their new personal companion. Warm, excited, one line.');
        if (!body) continue;
        const ch1 = await deliver(pf, null, body);
        if (ch1 !== 'none') {
          await supabase.from('notifications').insert({ user_id: pf.id, type: 'BT-001', title: 'BETina', body });
          sent++;
        }
        continue;
      }

      // RG-07: self-exclusion → out of the loop entirely.
      if (player.self_exclusion) continue;

      // One week (+ up to a year for yearly caps) of the CRM trigger log.
      const log = await getTriggerLog(phone, 370);
      const timesFor = (id: string) => log.filter((l) => l.trigger_id === id).map((l) => new Date(l.sent_at).getTime());
      const mktTimes = log.filter((l) => MARKETING_IDS.has(l.trigger_id)).map((l) => new Date(l.sent_at).getTime());
      const marketingOk = countWithin(mktTimes, nowMs, 1) < MARKETING_MAX_PER_DAY
        && countWithin(mktTimes, nowMs, 7) < MARKETING_MAX_PER_WEEK;

      // Lazy, cached lookup of the favourite team's next fixture.
      let fxLoaded = false, fxCache: Fixture | null = null;
      const nextFixture = async (): Promise<Fixture | null> => {
        if (fxLoaded) return fxCache;
        fxLoaded = true;
        if (!pf.favourite_team_id) return null;
        try {
          const r = await fetch(`${SPORTS_API}/api/sports/team/${pf.favourite_team_id}/next`);
          const d = await r.json();
          fxCache = (d.events ?? [])[0] ?? null;
        } catch { fxCache = null; }
        return fxCache;
      };

      const ctx: Ctx = { p: player, pf, now, today, nextFixture };

      for (const trig of TRIGGERS) {
        // Settings toggle for this trigger's category (⚽ events vs 💬 betina).
        const prefOff = trig.pref === 'events' ? pf.notify_events === false : pf.notify_betina === false;
        if (prefOff) continue;
        if (trig.cat === 'marketing' && player.risk_flag) continue;    // RG pause
        if (trig.cat === 'marketing' && !marketingOk) continue;        // global cap
        if (!passesCap(trig.cap, timesFor(trig.id), nowMs)) continue;  // per-trigger cap
        if (!(await trig.cond(ctx))) continue;

        const body = await generateMessage(player.preferred_language ?? pf.language ?? 'en', pf.name ?? player.username ?? '', await trig.brief(ctx));
        if (!body) continue;

        const ch2 = await deliver(pf, phone, body);
        await supabase.from('notifications').insert({ user_id: pf.id, type: trig.id, title: 'BETina', body });
        if (ch2 !== 'none') {
          await logTrigger(phone, trig.id, ch2); // real channel: 'push' or 'sms'
          sent++;
        }
        break; // one proactive message per user per run
      }
    } catch (_e) {
      // one player failing shouldn't stop the batch
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), { headers: { 'Content-Type': 'application/json' } });
});
