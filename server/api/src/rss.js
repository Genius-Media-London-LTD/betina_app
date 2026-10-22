// Fetch and normalise an RSS feed into the app's news item shape.
import { XMLParser } from 'fast-xml-parser';
import { upgradeImage } from './sources.js';

export const USER_AGENT = 'Mozilla/5.0 (compatible; BETinaBot/1.0; +https://betina.geniusbet.com)';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
});

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Plain text: decode entities (some feeds double-escape), drop CDATA + tags. */
export function cleanText(value) {
  if (value == null) return '';
  let s = typeof value === 'object' ? value['#text'] ?? '' : String(value);
  s = decodeEntities(decodeEntities(s));
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/**
 * Decode a response body in its real charset. Some outlets (e.g. Record) still
 * serve ISO-8859-1; res.text() would assume UTF-8 and mangle "Ferencváros".
 */
export async function readText(res) {
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 1024).toString('latin1');
  const charset =
    res.headers.get('content-type')?.match(/charset=["']?([\w-]+)/i)?.[1] ??
    head.match(/<\?xml[^>]+encoding=["']([\w-]+)/i)?.[1] ??
    head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
    'utf-8';
  try {
    return new TextDecoder(charset.toLowerCase()).decode(buf);
  } catch {
    return new TextDecoder('utf-8').decode(buf);
  }
}

function firstImage(item) {
  for (const m of [...asArray(item['media:content']), ...asArray(item['media:thumbnail'])]) {
    const url = m?.['@_url'];
    if (url && (!m['@_medium'] || m['@_medium'] === 'image')) return url;
  }
  for (const e of asArray(item.enclosure)) {
    if (e?.['@_url'] && (!e['@_type'] || String(e['@_type']).startsWith('image'))) return e['@_url'];
  }
  const html = `${item['content:encoded'] ?? ''} ${typeof item.description === 'string' ? item.description : ''}`;
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function linkOf(item) {
  const l = item.link;
  if (typeof l === 'string') return l.trim();
  if (l?.['@_href']) return l['@_href'];
  const guid = item.guid?.['#text'] ?? item.guid;
  return typeof guid === 'string' && guid.startsWith('http') ? guid : '';
}

export async function fetchFeed({ url, source }) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`feed ${res.status} ${url}`);
  const xml = await readText(res);
  const doc = parser.parse(xml);
  const items = asArray(doc?.rss?.channel?.item);
  return items
    .map((item) => {
      const date = new Date(item.pubDate ?? item['dc:date'] ?? '');
      return {
        title: cleanText(item.title),
        description: cleanText(item.description).slice(0, 300),
        link: linkOf(item),
        pubDate: Number.isNaN(date.getTime()) ? null : date.toISOString(),
        image: upgradeImage(firstImage(item)),
        source,
      };
    })
    .filter((it) => it.title && it.link);
}
