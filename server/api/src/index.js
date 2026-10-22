// BETina API — BETina's own backend services on betina-server.
// Listens on localhost only; Caddy terminates HTTPS and proxies to it.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { G2PError } from './g2p.js';
import { newsArticle, newsList } from './news.js';

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

app.get('/v1/article', async (c) => {
  const { url } = c.req.query();
  if (!url) return c.json({ error: 'missing_url' }, 400);
  return send(c, await newsArticle({ url }), 3600);
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));
app.onError((err, c) => {
  const upstream = /^(article|feed) \d+|too_many_redirects|host_not_allowed|fetch failed/.test(err?.message ?? '');
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
