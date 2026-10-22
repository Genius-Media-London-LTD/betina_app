// BETina API — BETina's own backend services on betina-server.
// Listens on localhost only; Caddy terminates HTTPS and proxies to it.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

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

app.notFound((c) => c.json({ error: 'not_found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

serve({ fetch: app.fetch, port: PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`betina-api ${VERSION} listening on http://127.0.0.1:${info.port}`);
});
