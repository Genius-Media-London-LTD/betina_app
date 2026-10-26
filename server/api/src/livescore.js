// BETina Live: football live scores from API-Football (api-sports.io).
// One poll of all live matches every 15 s feeds every player (the key —
// API_FOOTBALL_KEY — stays on this server); schedules, match details, tables
// and head-to-heads are cached per request. Scores, stats and lineups only:
// no odds, no betting data.
//
// The poll also writes "incidents" (kickoff, goal, red card, half time, full
// time) with a running sequence number: the app shows its TOR moment from
// them and the live-alerts function sends the goal pushes.
import { liveTakeInstructions } from './persona.js';

const AF = 'https://v3.football.api-sports.io';
const KEY = () => process.env.API_FOOTBALL_KEY;
const POLL_MS = 15_000;

export const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE']);
export const FINISHED = new Set(['FT', 'AET', 'PEN']);

// Leagues first in the list (big competitions, then GeniusBet's markets);
// everything else follows by country.
const PRIORITY = [
  1, 2, 3, 848, 4, 5, 9, 15, // World Cup, UCL, UEL, UECL, EURO, Nations League, Copa América, Club WC
  39, 140, 135, 78, 61, // England, Spain, Italy, Germany, France
  218, 210, 283, 203, 94, 88, 144, 179, 207, 197, // Austria, Croatia, Romania, Türkiye, Portugal, NL, Belgium, Scotland, Switzerland, Greece
  71, 128, 253, 262, 13, 11, 307, // Brazil, Argentina, MLS, Liga MX, Libertadores, Sudamericana, Saudi
  6, 12, 29, 30, 31, 32, 34, // AFCON, CAF CL, WC qualifiers
  40, 141, 136, 79, 62, // second divisions of the big five
  45, 143, 137, 81, 66, // national cups of the big five
];
const RANK = new Map(PRIORITY.map((id, i) => [id, i]));

let quota = { remaining: null, limit: null, at: 0 };

async function af(path, params = {}) {
  if (!KEY()) throw new Error('not_configured');
  const url = new URL(`${AF}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'x-apisports-key': KEY() }, signal: AbortSignal.timeout(12_000) });
  const left = res.headers.get('x-ratelimit-requests-remaining');
  if (left != null) quota = { remaining: Number(left), limit: Number(res.headers.get('x-ratelimit-requests-limit')), at: Date.now() };
  if (!res.ok) throw new Error(`api-football ${res.status}`);
  const d = await res.json();
  const errs = Array.isArray(d.errors) ? d.errors : Object.values(d.errors ?? {});
  if (errs.length) throw new Error(`api-football: ${JSON.stringify(d.errors).slice(0, 200)}`);
  return d.response ?? [];
}

// Small TTL memo with in-flight de-duplication and stale fallback on errors.
const memo = new Map(); // key -> { value, exp, pending }
async function cached(key, ttlMs, fn) {
  const hit = memo.get(key);
  if (hit?.value !== undefined && hit.exp > Date.now()) return hit.value;
  if (hit?.pending) return hit.pending;
  const pending = (async () => {
    try {
      const value = await fn();
      const ttl = typeof ttlMs === 'function' ? ttlMs(value) : ttlMs;
      memo.set(key, { value, exp: Date.now() + ttl });
      if (memo.size > 3000) memo.delete(memo.keys().next().value);
      return value;
    } catch (err) {
      if (hit?.value !== undefined) {
        memo.set(key, { value: hit.value, exp: Date.now() + 15_000 });
        return hit.value;
      }
      memo.delete(key);
      throw err;
    }
  })();
  memo.set(key, { ...hit, pending });
  return pending;
}

// ── Shapes ───────────────────────────────────────────────────────────────────
// Logos aren't sent: the app builds them from the ids
// (media.api-sports.io/football/teams/<id>.png, …/leagues/<id>.png).
const side = (f, teamId) => (teamId === f.teams.away.id ? 1 : 0);

function reds(f) {
  if (!f.events) return undefined;
  const r = [0, 0];
  for (const e of f.events) if (e.type === 'Card' && /red/i.test(e.detail ?? '')) r[side(f, e.team?.id)] += 1;
  return r;
}

function scorers(f) {
  return (f.events ?? [])
    .filter((e) => e.type === 'Goal' && !/missed/i.test(e.detail ?? ''))
    .map((e) => ({ s: side(f, e.team?.id), m: e.time?.elapsed ?? null, x: e.time?.extra ?? null, p: e.player?.name ?? '', d: e.detail ?? '' }));
}

/** Compact list row. */
function row(f) {
  const pen = f.score?.penalty;
  return {
    id: f.fixture.id,
    ts: f.fixture.timestamp,
    st: f.fixture.status.short,
    min: f.fixture.status.elapsed ?? null,
    ex: f.fixture.status.extra ?? null,
    lg: f.league.id,
    h: { id: f.teams.home.id, n: f.teams.home.name },
    a: { id: f.teams.away.id, n: f.teams.away.name },
    g: [f.goals.home, f.goals.away],
    pen: pen?.home != null ? [pen.home, pen.away] : null,
    red: reds(f),
  };
}

const leagueOf = (f) => ({ id: f.league.id, name: f.league.name, country: f.league.country, season: f.league.season, round: f.league.round });

// ── Live poll + incidents ────────────────────────────────────────────────────
let live = new Map(); // id -> row (+ scorers, league)
let liveAt = 0;
const finished = new Map(); // recently finished rows (2 h), so lists don't show stale "live"
let seq = 0;
const incidents = []; // { seq, at, type, id, side?, min?, player?, row, league }

function addIncident(type, r, lg, extra = {}) {
  seq += 1;
  incidents.push({ seq, at: Date.now(), type, id: r.id, row: r, league: lg, ...extra });
  while (incidents.length > 3000 || (incidents.length && Date.now() - incidents[0].at > 3 * 3_600_000)) incidents.shift();
}

async function pollLive() {
  if (!KEY()) return;
  try {
    const list = await af('fixtures', { live: 'all' });
    const next = new Map();
    for (const f of list) {
      const r = row(f);
      const lg = leagueOf(f);
      const sc = scorers(f);
      const prev = live.get(r.id);
      r.goalAt = prev?.goalAt ?? null;
      if (!prev) {
        if (r.st === '1H' && (r.min ?? 0) <= 5) addIncident('kickoff', r, lg);
      } else {
        for (const s of [0, 1]) {
          const before = prev.g[s] ?? 0;
          const now = r.g[s] ?? 0;
          if (now > before) {
            r.goalAt = Date.now();
            const last = [...sc].reverse().find((x) => x.s === s);
            addIncident('goal', r, lg, { side: s, min: last?.m ?? r.min, player: last?.p ?? null, detail: last?.d ?? null });
          } else if (now < before) {
            addIncident('disallowed', r, lg, { side: s, min: r.min });
          }
          if (r.red && prev.red && r.red[s] > prev.red[s]) addIncident('red', r, lg, { side: s, min: r.min });
        }
        if (prev.st !== 'HT' && r.st === 'HT') addIncident('ht', r, lg);
      }
      next.set(r.id, { ...r, sc, lgx: lg });
    }
    // Gone from the live list: finished (or abandoned) — fetch the final state.
    const gone = [...live.keys()].filter((id) => !next.has(id));
    for (let i = 0; i < gone.length; i += 20) {
      const fin = await af('fixtures', { ids: gone.slice(i, i + 20).join('-') });
      for (const f of fin) {
        const r = row(f);
        finished.set(r.id, { r, at: Date.now() });
        if (FINISHED.has(r.st)) addIncident('ft', r, leagueOf(f));
      }
    }
    for (const [id, v] of finished) if (Date.now() - v.at > 2 * 3_600_000) finished.delete(id);
    live = next;
    liveAt = Date.now();
  } catch (err) {
    console.error('live poll:', err.message);
  }
}

if (KEY()) {
  pollLive();
  setInterval(pollLive, POLL_MS).unref?.();
}

const strip = ({ sc, lgx, ...r }) => r;

/** GET /v1/live/now?since=<seq> — every live match + incidents after `since`. */
export function liveNow(since) {
  const s = Number(since);
  const leagues = {};
  const matches = [...live.values()].map((v) => {
    leagues[v.lgx.id] = v.lgx;
    return { ...strip(v), sc: v.sc };
  });
  return {
    status: 200,
    body: {
      serverNow: Date.now(),
      updated: liveAt,
      seq,
      matches,
      leagues,
      incidents: Number.isFinite(s) && s > 0
        ? incidents.filter((i) => i.seq > s).slice(-100).map(({ row: r, league, ...i }) => ({ ...i, h: r.h, a: r.a, g: r.g, lg: league.id }))
        : [],
    },
  };
}

/** GET /v1/live/incidents?since=<seq> — for the push function. */
export function liveIncidents(since) {
  const s = Number(since) || 0;
  const list = incidents.filter((i) => i.seq > s).slice(-500);
  return { status: 200, body: { seq, incidents: list.map(({ row: r, league, ...i }) => ({ ...i, h: r.h, a: r.a, g: r.g, st: r.st, min: r.min, league })) } };
}

// ── Day schedule ─────────────────────────────────────────────────────────────
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

function dayTtl(date) {
  const diff = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${isoDay(Date.now())}T00:00:00Z`)) / 86_400_000;
  if (Math.abs(diff) <= 1) return 5 * 60_000;
  return diff < 0 ? 6 * 3_600_000 : 30 * 60_000;
}

const dayRaw = (date) => cached(`day:${date}`, dayTtl(date), async () => {
  const list = await af('fixtures', { date });
  return list.map((f) => ({ r: row(f), lg: leagueOf(f) }));
});

/**
 * GET /v1/live/day?date=YYYY-MM-DD&tz=<minutes east of UTC>
 * The player's local day, grouped by league (priority order), with live
 * and just-finished matches merged in fresh from the poll.
 */
export async function liveDay({ date, tz }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return { status: 400, body: { error: 'bad_date' } };
  const off = Math.max(-840, Math.min(840, Number(tz) || 0));
  const start = Date.parse(`${date}T00:00:00Z`) - off * 60_000;
  const end = start + 86_400_000;
  const days = [...new Set([isoDay(start), isoDay(end - 1)])];
  const raw = (await Promise.all(days.map(dayRaw))).flat();

  const groups = new Map();
  let liveCount = 0;
  for (const { r: base, lg } of raw) {
    if (base.ts * 1000 < start || base.ts * 1000 >= end) continue;
    const fresh = live.get(base.id);
    const r = fresh ? strip(fresh) : finished.get(base.id)?.r ?? base;
    if (LIVE.has(r.st)) liveCount += 1;
    if (!groups.has(lg.id)) groups.set(lg.id, { league: lg, matches: [] });
    groups.get(lg.id).matches.push(r);
  }
  const leagues = [...groups.values()]
    .map((g) => ({ ...g, matches: g.matches.sort((x, y) => x.ts - y.ts || x.id - y.id) }))
    .sort((x, y) => (RANK.get(x.league.id) ?? 999) - (RANK.get(y.league.id) ?? 999)
      || x.league.country.localeCompare(y.league.country) || x.league.name.localeCompare(y.league.name));
  return { status: 200, body: { date, serverNow: Date.now(), liveCount, leagues } };
}

// ── Match detail ─────────────────────────────────────────────────────────────
function detail(f) {
  const home = f.teams.home.id;
  const sideOf = (id) => (id === home ? 0 : 1);
  const stats = [];
  const [hs, as] = [f.statistics?.find((s) => s.team.id === home), f.statistics?.find((s) => s.team.id !== home)];
  for (const s of hs?.statistics ?? []) {
    stats.push({ type: s.type, h: s.value, a: as?.statistics?.find((x) => x.type === s.type)?.value ?? null });
  }
  const ratings = {};
  for (const t of f.players ?? []) {
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0] ?? {};
      ratings[p.player.id] = {
        r: st.games?.rating ? Number(st.games.rating) : null,
        min: st.games?.minutes ?? null,
        g: st.goals?.total ?? 0,
        as: st.goals?.assists ?? 0,
        y: st.cards?.yellow ?? 0,
        rd: st.cards?.red ?? 0,
        c: !!st.games?.captain,
      };
    }
  }
  const person = (p) => ({ id: p.player.id, n: p.player.name, no: p.player.number, pos: p.player.pos, grid: p.player.grid ?? null });
  return {
    ...row(f),
    league: leagueOf(f),
    venue: f.fixture.venue?.name ? `${f.fixture.venue.name}${f.fixture.venue.city ? `, ${f.fixture.venue.city}` : ''}` : null,
    referee: f.fixture.referee ?? null,
    ht: f.score?.halftime?.home != null ? [f.score.halftime.home, f.score.halftime.away] : null,
    events: (f.events ?? []).map((e) => ({
      m: e.time?.elapsed ?? null, x: e.time?.extra ?? null, s: sideOf(e.team?.id),
      t: e.type, d: e.detail ?? '', p: e.player?.name ?? null, pid: e.player?.id ?? null, as: e.assist?.name ?? null, c: e.comments ?? null,
    })),
    lineups: (f.lineups ?? []).map((l) => ({
      s: sideOf(l.team.id),
      formation: l.formation,
      coach: l.coach?.name ?? null,
      colors: l.team.colors ?? null,
      xi: (l.startXI ?? []).map(person),
      subs: (l.substitutes ?? []).map(person),
    })),
    stats,
    ratings,
  };
}

/** GET /v1/live/match/:id — everything for the match page. */
export async function liveMatch(id) {
  if (!/^\d{1,10}$/.test(String(id))) return { status: 400, body: { error: 'bad_id' } };
  const d = await cached(`match:${id}`, (v) => (!v ? 60_000 : LIVE.has(v.st) ? 12_000
    // Finished: stats and ratings often arrive a little after the whistle.
    : FINISHED.has(v.st) ? (v.stats.length || Date.now() / 1000 - v.ts > 6 * 3600 ? 6 * 3_600_000 : 15 * 60_000) : 5 * 60_000), async () => {
    const [f] = await af('fixtures', { id });
    return f ? detail(f) : null;
  });
  if (!d) return { status: 404, body: { error: 'not_found' } };
  // The poll is fresher than a cached detail for score and minute.
  const fresh = live.get(d.id);
  return { status: 200, body: { serverNow: Date.now(), match: fresh ? { ...d, st: fresh.st, min: fresh.min, ex: fresh.ex, g: fresh.g, red: fresh.red ?? d.red } : d } };
}

// ── Tables (with the live state) ─────────────────────────────────────────────
const tableRaw = (league, season) => cached(`table:${league}:${season}`, 10 * 60_000, async () => {
  const [res] = await af('standings', { league, season });
  return (res?.league?.standings ?? []).map((group) => group.map((t) => ({
    rank: t.rank, id: t.team.id, n: t.team.name, pts: t.points, gd: t.goalsDiff, gf: t.all?.goals?.for ?? 0, ga: t.all?.goals?.against ?? 0,
    p: t.all?.played ?? 0, w: t.all?.win ?? 0, d: t.all?.draw ?? 0, l: t.all?.lose ?? 0, form: t.form ?? '', desc: t.description ?? null, group: t.group ?? null,
  })));
});

/** GET /v1/live/table/:league?season= — standings, re-sorted by the live scores. */
export async function liveTable(league, season) {
  if (!/^\d{1,6}$/.test(String(league)) || !/^\d{4}$/.test(String(season))) return { status: 400, body: { error: 'bad_params' } };
  const groups = await tableRaw(league, season);
  const running = [...live.values()].filter((m) => m.lg === Number(league));
  const out = groups.map((rows) => {
    const byId = new Map(rows.map((t) => [t.id, { ...t, live: null }]));
    for (const m of running) {
      const h = byId.get(m.h.id);
      const a = byId.get(m.a.id);
      if (!h || !a) continue;
      const [gh, ga] = [m.g[0] ?? 0, m.g[1] ?? 0];
      const res = gh > ga ? ['W', 'L'] : gh < ga ? ['L', 'W'] : ['D', 'D'];
      const pts = (x) => (x === 'W' ? 3 : x === 'D' ? 1 : 0);
      h.live = { res: res[0], pts: pts(res[0]), gd: gh - ga, gf: gh, ga, vs: m.a.n, id: m.id };
      a.live = { res: res[1], pts: pts(res[1]), gd: ga - gh, gf: ga, ga: gh, vs: m.h.n, id: m.id };
    }
    const list = [...byId.values()];
    const anyLive = list.some((t) => t.live);
    if (!anyLive) return list;
    const val = (t) => [t.pts + (t.live?.pts ?? 0), t.gd + (t.live?.gd ?? 0), t.gf + (t.live?.gf ?? 0)];
    return list
      .sort((x, y) => { const [a1, b1, c1] = val(x); const [a2, b2, c2] = val(y); return a2 - a1 || b2 - b1 || c2 - c1; })
      .map((t, i) => ({ ...t, liveRank: i + 1 }));
  });
  return { status: 200, body: { league: Number(league), season: Number(season), groups: out } };
}

// ── Head to head + form ──────────────────────────────────────────────────────
/** GET /v1/live/h2h/:home/:away — last meetings and both teams' last 5. */
export async function liveH2H(home, away) {
  if (!/^\d{1,8}$/.test(String(home)) || !/^\d{1,8}$/.test(String(away))) return { status: 400, body: { error: 'bad_ids' } };
  const [meet, fh, fa] = await Promise.all([
    cached(`h2h:${home}-${away}`, 12 * 3_600_000, async () => (await af('fixtures/headtohead', { h2h: `${home}-${away}`, last: 10 })).map((f) => ({ ...row(f), lgName: f.league.name }))),
    cached(`form:${home}`, 3_600_000, async () => (await af('fixtures', { team: home, last: 5 })).map(row)),
    cached(`form:${away}`, 3_600_000, async () => (await af('fixtures', { team: away, last: 5 })).map(row)),
  ]);
  return { status: 200, body: { meetings: meet.sort((x, y) => y.ts - x.ts), form: { [home]: fh, [away]: fa } } };
}

// ── For BETina (chat tool, voice tool) ───────────────────────────────────────
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(fc|cf|afc|sc|sv|ac|as|cd|ud|fk|nk|sk|bk|if|club|de|the)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function line(r, lg) {
  const state = LIVE.has(r.st) ? `LIVE ${r.st === 'HT' ? 'half time' : `${r.min}'`}` : FINISHED.has(r.st) ? 'full time' : `kick-off ${new Date(r.ts * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const score = r.g[0] != null ? `${r.g[0]}:${r.g[1]}` : 'vs';
  return `${r.h.n} ${score} ${r.a.n} — ${state} (${lg?.name ?? ''}${lg?.country ? `, ${lg.country}` : ''})`;
}

/** GET /v1/live/find?q=<team or league> — compact lines for BETina; no q: the biggest live games. */
export async function liveFind(q) {
  const query = norm(q).slice(0, 60);
  const today = isoDay(Date.now());
  const raw = [...(await dayRaw(today).catch(() => [])), ...(await dayRaw(isoDay(Date.now() - 86_400_000)).catch(() => []))];
  const rows = new Map();
  for (const { r, lg } of raw) {
    const fresh = live.get(r.id);
    rows.set(r.id, { r: fresh ? strip(fresh) : finished.get(r.id)?.r ?? r, lg, sc: fresh?.sc });
  }
  for (const v of live.values()) if (!rows.has(v.id)) rows.set(v.id, { r: strip(v), lg: v.lgx, sc: v.sc });
  let list = [...rows.values()];
  if (query) {
    const words = query.split(' ').filter((w) => w.length > 1);
    list = list.filter(({ r, lg }) => {
      const hay = `${norm(r.h.n)} ${norm(r.a.n)} ${norm(lg.name)} ${norm(lg.country)}`;
      return words.every((w) => hay.includes(w));
    });
  } else {
    list = list.filter(({ r }) => LIVE.has(r.st));
  }
  list.sort((x, y) => (LIVE.has(y.r.st) - LIVE.has(x.r.st)) || ((RANK.get(x.lg.id) ?? 999) - (RANK.get(y.lg.id) ?? 999)) || x.r.ts - y.r.ts);
  const lines = list.slice(0, 12).map(({ r, lg, sc }) => {
    const goals = (sc ?? []).map((g) => `${g.p} ${g.m}'`).join(', ');
    return `${line(r, lg)}${goals ? ` · goals: ${goals}` : ''}`;
  });
  return { status: 200, body: { answer: lines.length ? lines.join('\n') : 'No matching matches today or yesterday.' } };
}

// ── BETina's take on a match ─────────────────────────────────────────────────
const takes = new Map(); // `${id}:${lang}:${state}` -> { text, at }

/** GET /v1/live/take/:id?lang= — one or two cheeky lines from BETina about the match as it stands. */
export async function liveTake(id, lang) {
  if (!process.env.OPENAI_API_KEY) return { status: 503, body: { error: 'not_configured' } };
  const l = /^[a-z]{2}$/.test(lang ?? '') ? lang : 'en';
  const res = await liveMatch(id);
  if (res.status !== 200) return res;
  const m = res.body.match;
  const phase = LIVE.has(m.st) ? (m.st === 'HT' ? 'ht' : 'live') : FINISHED.has(m.st) ? 'ft' : 'pre';
  const key = `${m.id}:${l}:${phase}:${m.g.join('-')}:${m.red?.join('-') ?? ''}`;
  const hit = takes.get(key);
  if (hit) return { status: 200, body: { take: hit.text, phase } };

  const facts = [
    `${m.h.n} vs ${m.a.n} (${m.league.name}, ${m.league.country}, ${m.league.round})`,
    phase === 'pre' ? `Kick-off ${new Date(m.ts * 1000).toISOString()}` : `Score ${m.g[0]}:${m.g[1]}, status ${m.st}${m.min ? ` ${m.min}'` : ''}`,
    ...m.events.filter((e) => e.t === 'Goal' || (e.t === 'Card' && /red/i.test(e.d))).map((e) => `${e.m}' ${e.t === 'Goal' ? 'goal' : 'red card'} ${e.p ?? ''} (${e.s === 0 ? m.h.n : m.a.n})`),
    ...m.stats.filter((s) => /possession|expected_goals|Shots on Goal|Total Shots/i.test(s.type)).map((s) => `${s.type}: ${s.h ?? 0} – ${s.a ?? 0}`),
  ].join('\n');
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-5.4-mini', instructions: liveTakeInstructions(l, phase), input: facts, max_output_tokens: 800 }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    const d = await r.json();
    const text = (d.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join(' ').trim();
    if (!text) throw new Error('empty');
    takes.set(key, { text, at: Date.now() });
    if (takes.size > 2000) takes.delete(takes.keys().next().value);
    return { status: 200, body: { take: text, phase } };
  } catch (err) {
    console.error('live take:', err.message);
    return { status: 502, body: { error: 'take_failed' } };
  }
}

/** GET /v1/live/status — poll health and the daily quota (no secrets). */
export function liveStatus() {
  return { status: 200, body: { configured: !!KEY(), live: live.size, updated: liveAt, seq, quota } };
}
