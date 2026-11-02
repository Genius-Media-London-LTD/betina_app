// BETina Live: football live scores from betina-server (/v1/live/*, fed by
// API-Football). One shared poll of the live matches serves every screen
// (Live-Center, match page, Home strip, the TOR moment); it runs faster while
// a live screen is open and pauses in the background. Scores only — no odds.
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

export const LIVE_API = 'https://api.betina.geniusbet.com';

export type Team = { id: number; n: string };
export type Score = [number | null, number | null];
export type Scorer = { s: 0 | 1; m: number | null; x: number | null; p: string; d: string };
export type Row = {
  id: number; ts: number; st: string; min: number | null; ex: number | null; lg: number;
  h: Team; a: Team; g: Score; pen: Score | null; red?: [number, number];
  goalAt?: number | null; sc?: Scorer[];
};
export type League = { id: number; name: string; country: string; season: number; round: string };
export type DayData = { date: string; serverNow: number; liveCount: number; leagues: { league: League; matches: Row[] }[] };
export type Incident = {
  seq: number; at: number; type: 'kickoff' | 'goal' | 'disallowed' | 'red' | 'ht' | 'ft'; id: number;
  side?: 0 | 1; min?: number | null; player?: string | null; detail?: string | null; h: Team; a: Team; g: Score; lg: number;
};
export type NowData = { serverNow: number; updated: number; seq: number; matches: Row[]; leagues: Record<string, League>; incidents: Incident[] };
export type MatchEvent = { m: number | null; x: number | null; s: 0 | 1; t: string; d: string; p: string | null; pid: number | null; as: string | null; c: string | null };
export type Person = { id: number; n: string; no: number | null; pos: string | null; grid: string | null };
export type Lineup = { s: 0 | 1; formation: string | null; coach: string | null; colors: { player?: { primary?: string; number?: string; border?: string } } | null; xi: Person[]; subs: Person[] };
export type Rating = { r: number | null; min: number | null; g: number; as: number; y: number; rd: number; c: boolean };
export type MatchDetail = Row & {
  league: League; venue: string | null; referee: string | null; ht: Score | null;
  events: MatchEvent[]; lineups: Lineup[]; stats: { type: string; h: number | string | null; a: number | string | null }[];
  ratings: Record<string, Rating>;
};
export type TableRow = {
  rank: number; id: number; n: string; pts: number; gd: number; gf: number; ga: number; p: number; w: number; d: number; l: number;
  form: string; desc: string | null; group: string | null; liveRank?: number;
  live: { res: 'W' | 'D' | 'L'; pts: number; gd: number; gf: number; ga: number; vs: string; id: number } | null;
};
export type H2H = { meetings: (Row & { lgName: string })[]; form: Record<string, Row[]> };

// ── Helpers ──────────────────────────────────────────────────────────────────
export const teamLogo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
export const leagueLogo = (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`;
export const playerPhoto = (id: number) => `https://media.api-sports.io/football/players/${id}.png`;

const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']);
const DONE = new Set(['FT', 'AET', 'PEN']);
const OFF = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO']);
export const isLive = (st: string) => LIVE.has(st);
export const isFinished = (st: string) => DONE.has(st);
export const isOff = (st: string) => OFF.has(st);

/** "67'", "45+2'", "HT" … for live matches; null otherwise. */
export function minuteOf(r: Pick<Row, 'st' | 'min' | 'ex'>): string | null {
  if (!isLive(r.st)) return null;
  if (r.st === 'HT' || r.st === 'BT' || r.st === 'P' || r.st === 'SUSP' || r.st === 'INT') return r.st === 'P' ? 'PEN' : r.st;
  if (r.min == null) return 'LIVE';
  return `${r.min}${r.ex ? `+${r.ex}` : ''}'`;
}

export const kickoffTime = (ts: number, lang: string) => new Date(ts * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: false });

/** Local calendar day as YYYY-MM-DD (offset in days from today). */
export function localDay(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(fc|cf|afc|sc|sv|ac|as|cd|ud|fk|nk|sk|bk|if|club|de|the|football|calcio)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

/** Same club across data sources ("FC Bayern München" ~ "Bayern Munich")? Loose on purpose. */
export function sameTeam(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const wx = x.split(' ').filter((w) => w.length > 3);
  const wy = new Set(y.split(' ').filter((w) => w.length > 3));
  return wx.some((w) => wy.has(w)) && (wx.length <= 2 || wy.size <= 2);
}

// ── Requests ─────────────────────────────────────────────────────────────────
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${LIVE_API}${path}`);
  if (!res.ok) throw new Error(`live ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchDay = (date: string) => get<DayData>(`/v1/live/day?date=${date}&tz=${-new Date().getTimezoneOffset()}`);
/** The starred teams' next matches and the starred matches (ids comma-separated), finished ones left out. */
export const fetchNext = (teams: string, matches: string) =>
  get<{ games: { r: Row; lg: League }[] }>(`/v1/live/next?teams=${teams}&matches=${matches}`).then((d) => d.games);
export const fetchMatch = (id: number) => get<{ serverNow: number; match: MatchDetail }>(`/v1/live/match/${id}`).then((d) => d.match);
export const fetchTable = (league: number, season: number) => get<{ groups: TableRow[][] }>(`/v1/live/table/${league}?season=${season}`).then((d) => d.groups);
export const fetchH2H = (home: number, away: number) => get<H2H>(`/v1/live/h2h/${home}/${away}`);
export const fetchTake = (id: number, lang: string) => get<{ take: string; phase: string }>(`/v1/live/take/${id}?lang=${lang}`).then((d) => d.take);

// ── Shared live poll ─────────────────────────────────────────────────────────
let now: NowData | null = null;
let lastSeq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let foreground = AppState.currentState !== 'background';
const listeners = new Set<() => void>();
const incidentListeners = new Set<(list: Incident[]) => void>();
const wants = new Map<number, number>(); // consumer -> wanted interval
let nextConsumer = 1;

const interval = () => Math.min(...wants.values(), 60_000);

async function tick() {
  timer = null;
  if (!wants.size || !foreground) return;
  try {
    const d = await get<NowData>(`/v1/live/now${lastSeq ? `?since=${lastSeq}` : ''}`);
    // A restarted server counts from 0 again: start over without replaying.
    const fresh = lastSeq && d.seq >= lastSeq ? d.incidents : [];
    lastSeq = d.seq;
    now = d;
    listeners.forEach((f) => f());
    if (fresh.length) incidentListeners.forEach((f) => f(fresh));
  } catch {
    // offline: keep the last state, try again next round
  }
  schedule();
}

function schedule(soon = false) {
  if (timer || !wants.size || !foreground) return;
  timer = setTimeout(tick, soon ? 0 : interval());
}

AppState.addEventListener('change', (s) => {
  const fg = s === 'active';
  if (fg === foreground) return;
  foreground = fg;
  if (fg) schedule(true);
  else if (timer) { clearTimeout(timer); timer = null; }
});

/** Live matches, refreshed every `everyMs` while the calling component is mounted (null: just read). */
export function useLiveNow(everyMs: number | null = 30_000): NowData | null {
  useEffect(() => {
    if (everyMs == null) return undefined;
    const id = nextConsumer++;
    const first = !wants.size;
    wants.set(id, everyMs);
    if (first || !now) schedule(true);
    else if (everyMs < 30_000 && timer) { clearTimeout(timer); timer = null; schedule(true); }
    return () => { wants.delete(id); };
  }, [everyMs]);
  return useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, () => now, () => now);
}

/** New incidents (goals, cards, kickoff, HT, FT) as the poll finds them. */
export function onIncidents(fn: (list: Incident[]) => void): () => void {
  incidentListeners.add(fn);
  return () => { incidentListeners.delete(fn); };
}

/** The freshest known state of one match (live poll first). */
export function liveRow(id: number): Row | undefined {
  return now?.matches.find((m) => m.id === id);
}
