// BETina API — BETina's own backend services on betina-server.
// Listens on localhost only; Caddy terminates HTTPS and proxies to it.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cardPng } from './card.js';
import { G2PError } from './g2p.js';
import {
  liveDay, liveFind, liveH2H, liveIncidents, liveMatch, liveNext, liveNow, liveStatus, liveTable, liveTake,
} from './livescore.js';
import { newsArticle, newsList, newsPool } from './news.js';
import { lookupEvent, lookupTeam, searchTeams, teamLast, teamNext } from './sportsdb.js';
import { voiceBudget, voiceSearch, voiceSession, voiceUsage } from './voice.js';

const PORT = Number(process.env.PORT ?? 3000);
const VERSION = process.env.BETINA_API_VERSION ?? 'dev';
const startedAt = Date.now();

const app = new Hono();

// The Expo web app and native apps call this API directly.
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'betina-api',
    version: VERSION,
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
  }),
);

// --- News (Genius2Play) ------------------------------------------------------
// Same shapes as the app's existing news/article responses.
function send(c, result, maxAge) {
  if (result.cache) c.header('X-Cache', result.cache);
  if (result.status === 200) c.header('Cache-Control', `public, max-age=${maxAge}`);
  return c.json(result.body, result.status);
}

app.get('/v1/news', async (c) => {
  const { sport, count, lang } = c.req.query();
  return send(c, await newsList({ sport, count, lang }), 300);
});

// All outlets in all languages, for the news desk (see newsPool).
app.get('/v1/pool', async (c) => send(c, await newsPool(), 300));

app.get('/v1/article', async (c) => {
  const { url } = c.req.query();
  if (!url) return c.json({ error: 'missing_url' }, 400);
  return send(c, await newsArticle({ url }), 3600);
});

// --- Sports data (TheSportsDB) ---------------------------------------------------
app.get('/v1/sports/team/:id/next', async (c) => send(c, await teamNext(c.req.param('id')), 600));
app.get('/v1/sports/team/:id/last', async (c) => send(c, await teamLast(c.req.param('id')), 600));
app.get('/v1/sports/event/:id', async (c) => send(c, await lookupEvent(c.req.param('id')), 300));
app.get('/v1/sports/team/:id', async (c) => send(c, await lookupTeam(c.req.param('id')), 86400));
app.get('/v1/sports/teams', async (c) => send(c, await searchTeams(c.req.query('t')), 3600));

// --- Voice chat (OpenAI Realtime, ephemeral secrets) -----------------------------
// --- Live scores (API-Football) ------------------------------------------
app.get('/v1/live/now', (c) => send(c, liveNow(c.req.query('since')), 5));
app.get('/v1/live/incidents', (c) => send(c, liveIncidents(c.req.query('since')), 5));
app.get('/v1/live/day', async (c) => send(c, await liveDay({ date: c.req.query('date'), tz: c.req.query('tz') }), 30));
app.get('/v1/live/match/:id', async (c) => send(c, await liveMatch(c.req.param('id')), 10));
app.get('/v1/live/table/:league', async (c) => send(c, await liveTable(c.req.param('league'), c.req.query('season')), 30));
app.get('/v1/live/h2h/:home/:away', async (c) => send(c, await liveH2H(c.req.param('home'), c.req.param('away')), 3600));
app.get('/v1/live/find', async (c) => send(c, await liveFind(c.req.query('q')), 15));
app.get('/v1/live/take/:id', async (c) => send(c, await liveTake(c.req.param('id'), c.req.query('lang')), 30));
app.get('/v1/live/next', async (c) => send(c, await liveNext({ teams: c.req.query('teams'), matches: c.req.query('matches') }), 30));
app.get('/v1/live/status', (c) => send(c, liveStatus(), 0));

app.get('/v1/voice/budget', voiceBudget);
app.post('/v1/voice/session', voiceSession);
app.post('/v1/voice/usage', voiceUsage);
app.post('/v1/voice/search', voiceSearch);

// --- Image cards for BETina's posts on X (social-desk) ---------------------
app.get('/v1/social/card/:id', cardPng);

app.notFound((c) => c.json({ error: 'not_found' }, 404));
app.onError((err, c) => {
  const upstream = /^(article|feed|sportsdb) \d+|^api-football|^not_configured|too_many_redirects|host_not_allowed|fetch failed/.test(err?.message ?? '');
  if (err instanceof G2PError || err?.name === 'TimeoutError' || upstream) {
    console.error('upstream:', err.message);
    return c.json({ error: 'upstream_unavailable' }, 502);
  }
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

serve({ fetch: app.fetch, port: PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`betina-api ${VERSION} listening on http://127.0.0.1:${info.port}`);
});
