// Matchdays on Telegram: the prediction duel in the chat and the matches she
// texts about on her own (migration 038).
//
// The duel: they predict the score of a match from the app's prediction game
// (tip_matches: Bundesliga, Premier League, LaLiga, Serie A, Champions League)
// before kick-off, BETina's own prediction comes from betina_tips and stays
// hidden until kick-off, and after the final whistle both are scored with the
// app's rule: 3 exact, 2 winner and goal difference, 1 outcome. It is a game
// for points only: no stake, no prize, nothing to do with betting.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;
type Who = { chat_id: number; utc_offset: number; team: string | null; tip_points?: number; tip_settled?: number };
export type TipMatch = {
  id: number; competition: string; kickoff: string; status: string;
  home_name: string; home_short: string | null; away_name: string; away_short: string | null;
  home_score: number | null; away_score: number | null;
};
type Tip = { chat_id: number; match_id: number; home: number; away: number; points: number | null };

const COMPETITIONS: Record<string, string> = { BL1: 'Bundesliga', PL: 'Premier League', PD: 'LaLiga', SA: 'Serie A', CL: 'Champions League' };
const OPEN = ['SCHEDULED', 'TIMED'];
const DONE = ['FINISHED', 'AWARDED'];
const COLUMNS = 'id, competition, kickoff, status, home_name, home_short, away_name, away_short, home_score, away_score';
const TIP_DAYS = 4;          // how far ahead a match can be predicted
const MAX_LISTED = 10;

const plain = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const home = (m: TipMatch) => m.home_short || m.home_name;
const away = (m: TipMatch) => m.away_short || m.away_name;
export const pairing = (m: TipMatch) => `${home(m)} vs ${away(m)}`;
const league = (m: TipMatch) => COMPETITIONS[m.competition] ?? m.competition;

/** The app's scoring rule (tip_points in migration 010). */
export function tipPoints(th: number, ta: number, rh: number, ra: number): number {
  if (th === rh && ta === ra) return 3;
  if (Math.sign(th - ta) === Math.sign(rh - ra)) return th - ta === rh - ra ? 2 : 1;
  return 0;
}

/** Kick-off in the person's own time: "today 20:45", "tomorrow 15:30" or "Sat 18:30". */
export function localKickoff(m: TipMatch, offset: number): string {
  const shift = (iso: number) => new Date(iso + offset * 3_600_000);
  const k = shift(Date.parse(m.kickoff)), n = shift(Date.now());
  const day = (d: Date) => Math.floor(d.getTime() / 86_400_000);
  const diff = day(k) - day(n);
  const time = `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
  const name = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][k.getUTCDay()];
  return `${name} ${time}`;
}

/** Is this one of the two teams the person follows? */
function theirs(m: TipMatch, team: string | null): boolean {
  const t = plain(team);
  if (!t) return false;
  return [m.home_name, m.home_short, m.away_name, m.away_short].some((n) => { const p = plain(n); return !!p && (p.includes(t) || t.includes(p)); });
}

async function tipsOf(db: Db, chatId: number, ids: number[]): Promise<Map<number, Tip>> {
  if (!ids.length) return new Map();
  const { data } = await db.from('telegram_tips').select('chat_id, match_id, home, away, points').eq('chat_id', chatId).in('match_id', ids);
  return new Map(((data ?? []) as Tip[]).map((t) => [Number(t.match_id), t]));
}

/** Matches they can still predict, their own club first. For the get_tip_matches tool. */
export async function openMatches(db: Db, who: Who, query = ''): Promise<string> {
  const now = new Date();
  const { data } = await db.from('tip_matches').select(COLUMNS).in('status', OPEN)
    .gt('kickoff', now.toISOString()).lt('kickoff', new Date(now.getTime() + TIP_DAYS * 86_400_000).toISOString())
    .order('kickoff').limit(120);
  let list = (data ?? []) as TipMatch[];
  const q = plain(query);
  if (q) {
    const hit = list.filter((m) => plain(`${m.home_name} ${m.home_short} ${m.away_name} ${m.away_short} ${league(m)}`).includes(q));
    if (hit.length) list = hit;
  }
  list = [...list.filter((m) => theirs(m, who.team)), ...list.filter((m) => !theirs(m, who.team))].slice(0, MAX_LISTED);
  if (!list.length) return `No match is open for a prediction in the next ${TIP_DAYS} days (Bundesliga, Premier League, LaLiga, Serie A, Champions League). Say so and offer it for the next matchday.`;
  const tips = await tipsOf(db, who.chat_id, list.map((m) => m.id));
  return JSON.stringify(list.map((m) => {
    const t = tips.get(m.id);
    return { match_id: m.id, match: pairing(m), league: league(m), kickoff: localKickoff(m, who.utc_offset), their_prediction: t ? `${t.home}-${t.away}` : null };
  }));
}

/** Saves (or changes) their prediction. For the place_tip tool. */
export async function placeTip(db: Db, who: Who, matchId: number, h: number, a: number): Promise<string> {
  if (![h, a].every((n) => Number.isInteger(n) && n >= 0 && n <= 20)) return 'That is not a valid score — two whole numbers, home goals first. Ask again.';
  const { data: m } = await db.from('tip_matches').select(COLUMNS).eq('id', matchId).maybeSingle();
  if (!m) return 'That match id does not exist. Look the match up with get_tip_matches first.';
  const match = m as TipMatch;
  if (!OPEN.includes(match.status) || Date.parse(match.kickoff) <= Date.now()) return `${pairing(match)} has already kicked off — no prediction any more. Tell them, and offer the next match.`;
  const { error } = await db.from('telegram_tips').upsert({ chat_id: who.chat_id, match_id: matchId, home: h, away: a, points: null, updated_at: new Date().toISOString() });
  if (error) return 'Could not save the prediction — try once more.';
  return `Saved: ${home(match)} ${h}-${a} ${away(match)} (${league(match)}, kick-off ${localKickoff(match, who.utc_offset)}). They can change it until kick-off. Your own prediction for this match is locked in and you reveal it only at kick-off — tease them with that, do not make one up now.`;
}

/** Their points, their place among the Telegram players and the last scored matches. For the tip_score tool. */
export async function tipScore(db: Db, who: Who): Promise<string> {
  const { data: me } = await db.from('telegram_chats').select('tip_points, tip_settled').eq('chat_id', who.chat_id).maybeSingle();
  const points = Number(me?.tip_points ?? 0), settled = Number(me?.tip_settled ?? 0);
  const { data: tips } = await db.from('telegram_tips').select('match_id, home, away, points, updated_at').eq('chat_id', who.chat_id).order('updated_at', { ascending: false }).limit(12);
  const mine = (tips ?? []) as (Tip & { updated_at: string })[];
  if (!mine.length) return 'They have not predicted a match yet. Offer one — get_tip_matches shows what is on.';
  const ids = mine.map((t) => Number(t.match_id));
  const [{ data: ms }, { data: bs }, above, players] = await Promise.all([
    db.from('tip_matches').select(COLUMNS).in('id', ids),
    db.from('betina_tips').select('match_id, home, away, points').in('match_id', ids),
    db.from('telegram_chats').select('chat_id', { count: 'exact', head: true }).gt('tip_points', points).gt('tip_settled', 0),
    db.from('telegram_chats').select('chat_id', { count: 'exact', head: true }).gt('tip_settled', 0),
  ]);
  const matches = new Map(((ms ?? []) as TipMatch[]).map((m) => [m.id, m]));
  // deno-lint-ignore no-explicit-any
  const hers = new Map(((bs ?? []) as any[]).map((b) => [Number(b.match_id), b]));
  const rows = mine.map((t) => {
    const m = matches.get(Number(t.match_id));
    if (!m) return null;
    const started = Date.parse(m.kickoff) <= Date.now();
    const b = hers.get(m.id);
    return {
      match: pairing(m), league: league(m),
      result: DONE.includes(m.status) && m.home_score != null ? `${m.home_score}-${m.away_score}` : started ? 'running' : `kick-off ${localKickoff(m, who.utc_offset)}`,
      their_prediction: `${t.home}-${t.away}`, their_points: t.points,
      your_prediction: started && b ? `${b.home}-${b.away}` : started ? null : 'hidden until kick-off',
      your_points: started && b ? b.points : null,
    };
  }).filter(Boolean);
  return JSON.stringify({
    their_points: points, scored_predictions: settled,
    place: settled > 0 ? `${(above.count ?? 0) + 1} of ${players.count ?? 1} players on Telegram` : 'no place yet — nothing scored so far',
    rule: '3 exact score, 2 winner and goal difference, 1 outcome',
    predictions: rows,
  });
}

/** Today's matches for her good-morning, their own club first. */
export async function todaysMatches(db: Db, who: Who): Promise<string> {
  const now = Date.now();
  const { data } = await db.from('tip_matches').select(COLUMNS).in('status', OPEN)
    .gt('kickoff', new Date(now).toISOString()).lt('kickoff', new Date(now + 16 * 3_600_000).toISOString()).order('kickoff').limit(40);
  const all = (data ?? []) as TipMatch[];
  const list = [...all.filter((m) => theirs(m, who.team)), ...all.filter((m) => m.competition === 'CL' && !theirs(m, who.team)), ...all.filter((m) => m.competition !== 'CL' && !theirs(m, who.team))].slice(0, 4);
  return list.map((m) => `${pairing(m)} (${league(m)}, ${localKickoff(m, who.utc_offset)})`).join('; ');
}

/**
 * Scores every prediction whose match is over and returns, per chat, what she
 * tells the person about it. Points are booked whether or not she may text.
 */
export async function settle(db: Db, perRun: number): Promise<{ chat_id: number; note: string }[]> {
  const { data: open } = await db.from('telegram_tips').select('chat_id, match_id, home, away, points').is('points', null).limit(400);
  const tips = (open ?? []) as Tip[];
  if (!tips.length) return [];
  const ids = [...new Set(tips.map((t) => Number(t.match_id)))];
  const [{ data: ms }, { data: bs }] = await Promise.all([
    db.from('tip_matches').select(COLUMNS).in('id', ids).in('status', DONE).not('home_score', 'is', null),
    db.from('betina_tips').select('match_id, home, away').in('match_id', ids),
  ]);
  const finished = new Map(((ms ?? []) as TipMatch[]).map((m) => [m.id, m]));
  if (!finished.size) return [];
  // deno-lint-ignore no-explicit-any
  const hers = new Map(((bs ?? []) as any[]).map((b) => [Number(b.match_id), b]));
  const byChat = new Map<number, Tip[]>();
  for (const t of tips) if (finished.has(Number(t.match_id))) byChat.set(t.chat_id, [...(byChat.get(t.chat_id) ?? []), t]);

  const out: { chat_id: number; note: string }[] = [];
  for (const [chatId, list] of [...byChat].slice(0, perRun)) {
    let gained = 0, herGain = 0;
    const lines: string[] = [];
    for (const t of list) {
      const m = finished.get(Number(t.match_id))!;
      const p = tipPoints(t.home, t.away, m.home_score!, m.away_score!);
      // Only the row that is still open: a second run must not score it twice.
      const { data: done } = await db.from('telegram_tips').update({ points: p, settled_at: new Date().toISOString() })
        .eq('chat_id', chatId).eq('match_id', t.match_id).is('points', null).select('match_id');
      if (!done?.length) continue;
      gained += p;
      const b = hers.get(m.id);
      const bp = b ? tipPoints(b.home, b.away, m.home_score!, m.away_score!) : null;
      if (bp != null) herGain += bp;
      lines.push(`${home(m)} ${m.home_score}-${m.away_score} ${away(m)}: they said ${t.home}-${t.away} = ${p} point${p === 1 ? '' : 's'}${b ? `, you said ${b.home}-${b.away} = ${bp}` : ''}`);
    }
    if (!lines.length) continue;
    const { data: row } = await db.from('telegram_chats').select('tip_points, tip_settled').eq('chat_id', chatId).maybeSingle();
    const total = Number(row?.tip_points ?? 0) + gained;
    await db.from('telegram_chats').update({ tip_points: total, tip_settled: Number(row?.tip_settled ?? 0) + lines.length }).eq('chat_id', chatId);
    const duel = lines.some((l) => l.includes('you said')) ? ` Between the two of you this round: they ${gained}, you ${herGain}.` : '';
    out.push({
      chat_id: chatId,
      note: `(No message from them — the final whistle has gone on what you two predicted. ${lines.join('. ')}.${duel} Their total is now ${total} point${total === 1 ? '' : 's'}. Tell them how it went, in one or two short lines in your style: gloat a little if you won, give them their due if they did. No photo, and no new question about the match.)`,
    });
  }
  return out;
}

/**
 * Matches that kick off in about half an hour, and who gets one line about
 * them: people who predicted the match, people whose club plays, and people
 * who chatted in the last three days. One such message per person per day.
 */
export async function kickoffNotes(db: Db, perRun: number): Promise<{ chat_id: number; note: string }[]> {
  const now = Date.now();
  const { data: ms } = await db.from('tip_matches').select(COLUMNS).in('status', OPEN)
    .gt('kickoff', new Date(now + 15 * 60_000).toISOString()).lt('kickoff', new Date(now + 45 * 60_000).toISOString()).order('kickoff').limit(30);
  const matches = (ms ?? []) as TipMatch[];
  if (!matches.length) return [];
  const day = new Date().toISOString().slice(0, 10);
  const { data: chats } = await db.from('telegram_chats').select('chat_id, utc_offset, team, last_seen, kickoff_ping')
    .eq('proactive', true).eq('adult', true).gte('msg_total', 5)
    .gt('last_seen', new Date(now - 7 * 86_400_000).toISOString())
    .or(`kickoff_ping.is.null,kickoff_ping.neq.${day}`).order('last_seen', { ascending: false }).limit(300);
  // deno-lint-ignore no-explicit-any
  const people = (chats ?? []) as any[];
  if (!people.length) return [];
  const { data: ts } = await db.from('telegram_tips').select('chat_id, match_id, home, away, points').in('match_id', matches.map((m) => m.id));
  const tipped = new Map<string, Tip>(((ts ?? []) as Tip[]).map((t) => [`${t.chat_id}:${t.match_id}`, t]));
  const top = matches.find((m) => m.competition === 'CL') ?? matches[0];

  const out: { chat_id: number; note: string }[] = [];
  for (const c of people) {
    if (out.length >= perRun) break;
    const hour = (((new Date().getUTCHours() + Number(c.utc_offset ?? 0)) % 24) + 24) % 24;
    if (hour < 9 || hour >= 23) continue;
    const recent = now - Date.parse(c.last_seen ?? '') < 3 * 86_400_000;
    const m = matches.find((x) => tipped.has(`${c.chat_id}:${x.id}`)) ?? matches.find((x) => theirs(x, c.team)) ?? (recent ? top : null);
    if (!m) continue;
    // Claim the day first, so two runs never text the same person twice.
    const { data: claimed } = await db.from('telegram_chats').update({ kickoff_ping: day })
      .eq('chat_id', c.chat_id).or(`kickoff_ping.is.null,kickoff_ping.neq.${day}`).select('chat_id');
    if (!claimed?.length) continue;
    const t = tipped.get(`${c.chat_id}:${m.id}`);
    const minutes = Math.max(5, Math.round((Date.parse(m.kickoff) - now) / 60_000 / 5) * 5);
    const state = t
      ? `They predicted ${t.home}-${t.away}. Your own prediction stays hidden until kick-off.`
      : `They have not predicted it yet — they still can until kick-off (match_id ${m.id} for place_tip). Ask for their score, or whether they are watching.`;
    out.push({
      chat_id: Number(c.chat_id),
      note: `(No message from them — ${pairing(m)} (${league(m)}) kicks off in about ${minutes} minutes${theirs(m, c.team) ? ', and that is their club' : ''}. ${state} Text them ONE short line about it in your style, as if it just crossed your mind. No photo, no link.)`,
    });
  }
  return out;
}
