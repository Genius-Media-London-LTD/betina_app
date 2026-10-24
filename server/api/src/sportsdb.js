// TheSportsDB proxy for the BETina apps and Supabase functions: team search,
// team lookup, next / last matches. The key stays on this server
// (THESPORTSDB_KEY; the public test key "123" until a premium key is set —
// the old free key "3" was switched off in Oct 2026). Cached, because the
// free tier allows only ~30 requests per minute.
import { createCache } from './cache.js';

const KEY = () => process.env.THESPORTSDB_KEY || '123';
const cache = createCache({ ttlMs: 10 * 60_000, maxEntries: 2000 });
const longCache = createCache({ ttlMs: 24 * 60 * 60_000, maxEntries: 2000 });

async function call(path, params, store) {
  const url = new URL(`https://www.thesportsdb.com/api/v1/json/${KEY()}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const key = url.pathname.split('/').pop() + url.search;
  const hit = store.get(key);
  if (hit) return hit;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`sportsdb ${res.status}`);
    const body = await res.json();
    store.set(key, body);
    return body;
  } catch (err) {
    const stale = store.getStale(key);
    if (stale) return stale;
    throw err;
  }
}

// Same event shape the intelligence API served (the apps already render it).
const fmtEvents = (events) =>
  (events ?? []).slice(0, 5).map((e) => ({
    id: e.idEvent,
    name: e.strEvent,
    home: e.strHomeTeam,
    away: e.strAwayTeam,
    homeScore: e.intHomeScore,
    awayScore: e.intAwayScore,
    date: e.dateEvent,
    time: e.strTime,
    league: e.strLeague,
    venue: e.strVenue,
  }));

const validId = (id) => /^\d{1,10}$/.test(String(id ?? ''));

export async function teamNext(id) {
  if (!validId(id)) return { status: 400, body: { error: 'bad_id', events: [] } };
  const d = await call('eventsnext.php', { id }, cache);
  return { status: 200, body: { events: fmtEvents(d.events) } };
}

export async function teamLast(id) {
  if (!validId(id)) return { status: 400, body: { error: 'bad_id', events: [] } };
  const d = await call('eventslast.php', { id }, cache);
  return { status: 200, body: { events: fmtEvents(d.results) } };
}

/** Raw TheSportsDB searchteams response ({ teams: [...] | null }). */
export async function searchTeams(q) {
  const t = String(q ?? '').trim().slice(0, 60);
  if (t.length < 2) return { status: 200, body: { teams: null } };
  return { status: 200, body: await call('searchteams.php', { t }, longCache) };
}

/** Raw TheSportsDB lookupteam response ({ teams: [...] }). */
export async function lookupTeam(id) {
  if (!validId(id)) return { status: 400, body: { error: 'bad_id', teams: null } };
  return { status: 200, body: await call('lookupteam.php', { id }, longCache) };
}
