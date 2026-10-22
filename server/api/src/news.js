// News for the BETina apps, sourced from Genius2Play (GeniusBet's own
// editorial content). Response shapes match what the app already renders, so
// switching the app over is only a URL change.
import { createCache } from './cache.js';
import { G2PError, getArticle, isConfigured, listArticles } from './g2p.js';
import { markdownToParagraphs } from './markdown.js';

const SOURCE = 'Genius2Play';

// App language -> Genius2Play edition. Languages without their own edition
// (it, ro, tr, …) fall back to the English one.
const EDITION_BY_LANG = { en: 'global', de: 'de', es: 'es', fr: 'fr', pt: 'pt-BR' };
// Canonical URLs use "en" in the path for the global edition.
const EDITION_BY_PATH = { en: 'global', de: 'de', es: 'es', fr: 'fr', 'pt-br': 'pt-BR' };

// App sport ids -> Genius2Play sports. Missing / "sport" = all sports.
const SPORTS_BY_APP_ID = {
  football: ['football'],
  soccer: ['football'],
  tennis: ['tennis'],
  basketball: ['basketball'],
  cricket: ['cricket'],
  rugby: ['rugby', 'rugby-league'],
  athletics: ['athletics'],
  golf: ['golf'],
  hockey: ['hockey'],
  nfl: ['american-football'],
  mma: ['mma'],
  boxing: ['boxing'],
};

// BETina is a companion app, not a betting app: leave out betting tips and
// odds-led match previews (EXPERT_PICK / MATCH_PREVIEW).
const NEWS_TYPES = ['SPORT_NEWS', 'BREAKING', 'TRANSFER', 'INJURY_REPORT', 'HERO_FEATURE', 'OPINION', 'PROFILE'];
const ODDS_WORDS = /\b(odds|quoten|cuotas|cotes|quotas|betting tips?|wett-?tipps?)\b/i;

const listCache = createCache({ ttlMs: 10 * 60_000 });
const articleCache = createCache({ ttlMs: 6 * 60 * 60_000 });

export const editionFor = (lang) => EDITION_BY_LANG[String(lang ?? '').toLowerCase().slice(0, 2)] ?? 'global';

function keep(a) {
  if (a.publishedDateStatus && a.publishedDateStatus !== 'available') return false;
  if (/\bTBD\b/.test(a.title ?? '')) return false; // placeholder fixtures
  if (ODDS_WORDS.test(a.title ?? '')) return false;
  return Boolean(a.title && a.canonicalUrl);
}

// Genius2Play sometimes publishes near-identical rewrites of one story
// ("Liverpools 6 Europapokalsiege: 4 Titel …" / "Liverpools 6 Europapokale: 4 Titel …").
const words = (t) => new Set(String(t).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
function dedupe(articles) {
  const seen = [];
  return articles.filter((a) => {
    const w = words(a.title);
    const dup = seen.some((s) => {
      const inter = [...w].filter((x) => s.has(x)).length;
      return inter / Math.max(1, Math.min(w.size, s.size)) >= 0.6;
    });
    if (!dup) seen.push(w);
    return !dup;
  });
}

const toItem = (a) => ({
  title: a.title,
  description: a.excerpt ?? a.subtitle ?? '',
  link: a.canonicalUrl,
  pubDate: a.publishedDate ?? null,
  image: a.image?.url ?? null,
  source: SOURCE,
});

export async function newsList({ sport, count, lang }) {
  if (!isConfigured()) return { status: 503, body: { error: 'not_configured' } };
  const edition = editionFor(lang);
  const limit = Math.min(Math.max(Number(count) || 12, 1), 30);
  const sports = SPORTS_BY_APP_ID[String(sport ?? '').toLowerCase()];
  const key = `${edition}|${(sports ?? ['*']).join(',')}|${limit}`;

  const cached = listCache.get(key);
  if (cached) return { status: 200, body: cached, cache: 'hit' };

  try {
    // Over-fetch a little: filtering drops some items.
    const res = await listArticles({
      edition,
      sport: sports,
      type: NEWS_TYPES,
      sort: 'publishedAt',
      order: 'desc',
      limit: Math.min(limit * 2, 60),
      view: 'summary',
    });
    const items = dedupe((res.data ?? []).filter(keep)).slice(0, limit).map(toItem);
    const body = { items, edition };
    listCache.set(key, body);
    return { status: 200, body, cache: 'miss' };
  } catch (err) {
    const stale = listCache.getStale(key);
    if (stale) return { status: 200, body: stale, cache: 'stale' };
    throw err;
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

export async function newsArticle({ url }) {
  if (!isConfigured()) return { status: 503, body: { error: 'not_configured' } };
  const ref = parseCanonical(url);
  if (!ref) return { status: 400, body: { error: 'unsupported_url' } };
  const key = `${ref.edition}|${ref.slug}`;

  const cached = articleCache.get(key);
  if (cached) return { status: 200, body: cached, cache: 'hit' };

  try {
    const { data: a } = await getArticle(ref.slug, ref.edition);
    const body = {
      title: a.title,
      image: a.image?.url ?? '',
      description: a.subtitle ?? a.excerpt ?? '',
      paragraphs: markdownToParagraphs(a.body, a.title),
      keyTakeaways: a.keyTakeaways ?? [],
      source: SOURCE,
      url: a.canonicalUrl,
      // Genius2Play's terms: web pages rendering this must carry these.
      canonical: a.syndication?.canonical ?? a.canonicalUrl,
      robots: a.syndication?.robots ?? 'noindex, nofollow',
    };
    articleCache.set(key, body);
    return { status: 200, body, cache: 'miss' };
  } catch (err) {
    if (err instanceof G2PError && err.status === 404) return { status: 404, body: { error: 'not_found' } };
    const stale = articleCache.getStale(key);
    if (stale) return { status: 200, body: stale, cache: 'stale' };
    throw err;
  }
}
