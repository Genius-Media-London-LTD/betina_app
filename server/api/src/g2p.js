// Genius2Play Content API client (read-only). The key stays on this server:
// it is read from GENIUS2PLAY_API_KEY and never sent to the apps.
const BASE = 'https://www.genius2play.com/api/v1';

export class G2PError extends Error {
  constructor(status, code) {
    super(`genius2play ${status} ${code}`);
    this.status = status;
    this.code = code;
  }
}

export function isConfigured() {
  return Boolean(process.env.GENIUS2PLAY_API_KEY);
}

async function call(path, params = {}, attempt = 0) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    for (const item of [].concat(v)) url.searchParams.append(k, String(item));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.GENIUS2PLAY_API_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  // One retry for rate limits / transient upstream errors.
  if ((res.status === 429 || res.status >= 500) && attempt === 0) {
    const wait = Math.min(Number(res.headers.get('retry-after') ?? 1), 5) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return call(path, params, 1);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new G2PError(res.status, body?.error?.code ?? 'http_error');
  return body;
}

export const listArticles = (params) => call('/articles', params);
export const getArticle = (slug, edition) =>
  call(`/articles/${encodeURIComponent(slug)}`, { edition });
