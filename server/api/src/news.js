// News for the BETina apps. Fresh daily news comes from each language's
// sports outlets (RSS, see sources.js); Genius2Play — GeniusBet's own
// editorial content — is mixed in only while it publishes fresh real news.
// Response shapes match what the app already renders (switch = URL change).
import { createCache } from './cache.js';
import { extractArticle } from './extract.js';
import { G2PError, getArticle, isConfigured, listArticles } from './g2p.js';
import { markdownToParagraphs } from './markdown.js';
import { fetchFeed } from './rss.js';
import { BETTING_TITLE, feedFor, LIVE_LINK, LIVE_TITLE } from './sources.js';

const feedCache = createCache({ ttlMs: 10 * 60_000 });
const g2pCache = createCache({ ttlMs: 30 * 60_000 });
const articleCache = createCache({ ttlMs: 6 * 60 * 60_000 });

// ---- Genius2Play -------------------------------------------------------------
const G2P_SOURCE = 'Genius2Play';
const G2P_FRESH_DAYS = 3;
const EDITION_BY_LANG = { en: 'global', de: 'de', es: 'es', fr: 'fr', pt: 'pt-BR' };
// Canonical URLs use "en" in the path for the global edition.
const EDITION_BY_PATH = { en: 'global', de: 'de', es: 'es', fr: 'fr', 'pt-br': 'pt-BR' };
const G2P_SPORTS = {
  football: ['football'], tennis: ['tennis'], basketball: ['basketball'], cricket: ['cricket'],
  rugby: ['rugby', 'rugby-league'], athletics: ['athletics'], golf: ['golf'], hockey: ['hockey'],
  nfl: ['american-football'], mma: ['mma'], boxing: ['boxing'], cycling: ['cycling'],
};
// No betting tips (EXPERT_PICK) or odds-led previews (MATCH_PREVIEW).
const G2P_NEWS_TYPES = ['SPORT_NEWS', 'BREAKING', 'TRANSFER', 'INJURY_REPORT', 'HERO_FEATURE', 'OPINION', 'PROFILE'];

async function freshG2P(lang, sport) {
  const edition = EDITION_BY_LANG[lang];
  if (!edition || !isConfigured()) return [];
  const sports = G2P_SPORTS[String(sport ?? '').toLowerCase()];
  const key = `${edition}|${(sports ?? ['*']).join(',')}`;
  const cached = g2pCache.get(key);
  if (cached) return cached;
  try {
    const res = await listArticles({
      edition, sport: sports, type: G2P_NEWS_TYPES, sort: 'publishedAt', order: 'desc', limit: 20, view: 'summary',
    });
    const cutoff = Date.now() - G2P_FRESH_DAYS * 86_400_000;
    const items = (res.data ?? [])
      .filter((a) => a.title && a.canonicalUrl && a.publishedDateStatus === 'available')
      .filter((a) => new Date(a.publishedDate).getTime() >= cutoff)
      .map((a) => ({
        title: a.title,
        description: a.excerpt ?? a.subtitle ?? '',
        link: a.canonicalUrl,
        pubDate: a.publishedDate ? new Date(a.publishedDate).toISOString() : null,
        image: a.image?.url ?? null,
        source: G2P_SOURCE,
      }));
    g2pCache.set(key, items);
    return items;
  } catch (err) {
    console.error('g2p list:', err.message);
    return g2pCache.getStale(key) ?? [];
  }
}

/** Parse a Genius2Play canonical URL into { slug, edition }. */
export function parseCanonical(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)genius2play\.com$/.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean); // [lang, sport, 'news', slug]
    const edition = EDITION_BY_PATH[(parts[0] ?? '').toLowerCase()];
    const slug = parts[parts.length - 1];
    return edition && slug ? { slug, edition } : null;
  } catch {
    return null;
  }
}

async function g2pArticle(ref) {
  if (!isConfigured()) return { status: 503, body: { error: 'not_configured' } };
  try {
    const { data: a } = await getArticle(ref.slug, ref.edition);
    return {
      status: 200,
      body: {
        title: a.title,
        image: a.image?.url ?? '',
        description: a.subtitle ?? a.excerpt ?? '',
        paragraphs: markdownToParagraphs(a.body, a.title),
        keyTakeaways: a.keyTakeaways ?? [],
        source: G2P_SOURCE,
        url: a.canonicalUrl,
        // Genius2Play's terms: web pages rendering this must carry these.
        canonical: a.syndication?.canonical ?? a.canonicalUrl,
        robots: a.syndication?.robots ?? 'noindex, nofollow',
      },
    };
  } catch (err) {
    if (err instanceof G2PError && err.status === 404) return { status: 404, body: { error: 'not_found' } };
    throw err;
  }
}

// ---- List --------------------------------------------------------------------
async function cachedFeed(feed) {
  const hit = feedCache.get(feed.url);
  if (hit) return { items: hit, ok: true };
  try {
    const items = await fetchFeed(feed);
    feedCache.set(feed.url, items);
    return { items, ok: true };
  } catch (err) {
    console.error('feed:', err.message);
    const stale = feedCache.getStale(feed.url);
    return { items: stale ?? [], ok: Boolean(stale) };
  }
}

// Outlets (and Genius2Play) sometimes publish near-identical rewrites of a story.
const words = (t) => new Set(String(t).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
function dedupe(items) {
  const seen = [];
  return items.filter((it) => {
    const w = words(it.title);
    const dup = seen.some((s) => [...w].filter((x) => s.has(x)).length / Math.max(1, Math.min(w.size, s.size)) >= 0.6);
    if (!dup) seen.push(w);
    return !dup;
  });
}

export async function newsList({ sport, count, lang }) {
  const { lang: l, feed } = feedFor(lang, sport);
  const limit = Math.min(Math.max(Number(count) || 12, 1), 30);
  const [rss, g2p] = await Promise.all([cachedFeed(feed), freshG2P(l, sport)]);
  if (!rss.ok && g2p.length === 0) return { status: 502, body: { error: 'upstream_unavailable', items: [] } };

  const items = dedupe(
    [...g2p, ...rss.items]
      .filter((it) => !BETTING_TITLE.test(it.title) && !LIVE_TITLE.test(it.title) && !LIVE_LINK.test(it.link))
      .sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0)),
  ).slice(0, limit);
  return { status: 200, body: { items, lang: l } };
}

// ---- Article -------------------------------------------------------------------
export async function newsArticle({ url }) {
  const cached = articleCache.get(url);
  if (cached) return { status: 200, body: cached, cache: 'hit' };

  const g2pRef = parseCanonical(url);
  let result;
  try {
    result = g2pRef ? await g2pArticle(g2pRef) : await extractArticle(url);
  } catch (err) {
    const stale = articleCache.getStale(url);
    if (stale) return { status: 200, body: stale, cache: 'stale' };
    throw err;
  }
  if (result.status === 200) articleCache.set(url, result.body);
  return { ...result, cache: 'miss' };
}
