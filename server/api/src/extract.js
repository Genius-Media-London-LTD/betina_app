// Full-text extraction for publisher article pages (BBC, Sportschau, Marca,
// RMC, Record, …). Prefers schema.org JSON-LD `articleBody`, falls back to
// Mozilla Readability (Firefox reader mode). jsdom never executes page scripts.
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { articleSource } from './sources.js';
import { cleanText, readText, USER_AGENT } from './rss.js';

const quiet = new VirtualConsole(); // swallow CSS/script parse noise
const MAX_HTML = 3_000_000;

/** Fetch an article page, following redirects only within allowed publishers. */
async function fetchHtml(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop < 4; hop++) {
    if (!articleSource(url)) throw new Error('host_not_allowed');
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`article ${res.status}`);
    const html = await readText(res);
    return { html: html.slice(0, MAX_HTML), finalUrl: url };
  }
  throw new Error('too_many_redirects');
}

function meta(doc, ...names) {
  for (const n of names) {
    const v = doc.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.getAttribute('content');
    if (v) return v.trim();
  }
  return '';
}

function jsonLdArticle(doc) {
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(s.textContent);
    } catch {
      continue;
    }
    const nodes = [data, ...(Array.isArray(data) ? data : []), ...(data?.['@graph'] ?? [])].flat();
    const hit = nodes.find((n) => n && typeof n === 'object' && typeof n.articleBody === 'string' && n.articleBody.length > 200);
    if (hit) return hit;
  }
  return null;
}

const BOILERPLATE = /^(read more|related|lesen sie auch|mehr zum thema|más información|lee también|à lire aussi|plus d'infos|leia também|leggi anche|citește și|follow us|folgen sie|síguenos|suivez-nous|©|copyright)/i;
// Dateline / byline rows that open many article pages.
const DATELINE = /^(stand:|actualizado|publicado|atualizado|aggiornato|articol de|publicat|mis à jour|updated|published|von [\p{Lu}]|by [\p{Lu}])/iu;

function cleanParagraphs(list, title) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const p = cleanText(raw);
    if (p.length < 25 || BOILERPLATE.test(p)) continue;
    if (DATELINE.test(p) && p.length < 160) continue;
    if (title && p.toLowerCase() === title.toLowerCase()) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export async function extractArticle(url) {
  const source = articleSource(url);
  if (!source) return { status: 400, body: { error: 'unsupported_url' } };

  const { html, finalUrl } = await fetchHtml(url);
  const dom = new JSDOM(html, { url: finalUrl, virtualConsole: quiet });
  const doc = dom.window.document;

  const title = cleanText(meta(doc, 'og:title') || doc.title);
  const image = meta(doc, 'og:image', 'twitter:image');
  const description = cleanText(meta(doc, 'og:description', 'description'));

  // 1) Readability: keeps real paragraph structure.
  let paragraphs = [];
  const article = new Readability(doc.cloneNode(true)).parse();
  if (article?.content) {
    const frag = new JSDOM(article.content).window.document;
    paragraphs = cleanParagraphs([...frag.querySelectorAll('p, li, h2, h3')].map((n) => n.textContent), title);
  }
  // 2) JSON-LD articleBody when Readability came back thin.
  if (paragraphs.join(' ').length < 400) {
    const ld = jsonLdArticle(doc);
    if (ld) paragraphs = cleanParagraphs(ld.articleBody.split(/\n+|(?<=[.!?])\s{2,}/), title);
  }
  dom.window.close();

  if (!title && paragraphs.length === 0) return { status: 404, body: { error: 'not_found' } };
  return {
    status: 200,
    body: { title, image, description, paragraphs, source, url: finalUrl },
  };
}
