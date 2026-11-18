// Writes the landing page's language pages (web/landing/de.html, es.html, …)
// and its sitemap from index.html and the texts in i18n.js, so that search
// engines can index every language under its own address (/de, /es, …).
//
// It also writes the feature pages (see landing-features.mjs).
//
// Run it after changing web/landing/index.html, i18n.js or a feature page:
//   node scripts/build-landing-langs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildFeatures } from './landing-features.mjs';

const dir = fileURLToPath(new URL('../web/landing/', import.meta.url));
const { T, SUPPORTED } = createRequire(import.meta.url)(dir + 'i18n.js');
const BASE = 'https://betina.geniusbet.com';
const OG_LOCALE = { de: 'de_DE', es: 'es_ES', fr: 'fr_FR', pt: 'pt_PT', it: 'it_IT', ro: 'ro_RO', tr: 'tr_TR', hr: 'hr_HR' };

const { menu, BURGER, MENU_CSS } = createRequire(import.meta.url)(dir + 'api/_md/menu.js');
// The menu comes from the module the feature and matchday pages use, so all pages show the same one.
const fillMenu = (html) => {
  const put = (re, text) => { if (!re.test(html)) throw new Error('index.html: marker missing for ' + re); html = html.replace(re, () => text); };
  put(/<!--menu-->[\s\S]*?<!--\/menu-->/, '<!--menu-->' + menu('en', '', true) + '<!--/menu-->');
  put(/<!--burger-->[\s\S]*?<!--\/burger-->/, '<!--burger-->' + BURGER + '<!--/burger-->');
  put(/\/\*menu\*\/[\s\S]*?\/\*\/menu\*\//, '/*menu*/\n' + MENU_CSS + '\n/*/menu*/');
  return html;
};
const source = fillMenu(readFileSync(dir + 'index.html', 'utf8').replace(/\r\n/g, '\n'));
writeFileSync(dir + 'index.html', source);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');

function page(lang) {
  const dict = T[lang];
  let html = source;
  // Exactly one match each, or the page changed in a way this script must learn about.
  const swap = (pattern, replacement) => {
    const hits = html.match(new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g')) ?? [];
    if (hits.length !== 1) throw new Error(`${lang}: expected one match for ${pattern}, found ${hits.length}`);
    html = html.replace(pattern, replacement);
  };

  // Links to feature pages: only languages that have the page keep the link.
  html = html.replace(/\s*<a class="more" href="[^"]*" data-i="[^"]+" data-i-href="([^"]+)">[^<]*<\/a>/g, (all, key) =>
    (dict[key] ? all.replace(/href="[^"]*"/, `href="${dict[key]}"`) : ''));

  // Menu links to feature pages.
  html = html.replace(/href="[^"]*"( data-i="[^"]+")? data-i-href="([^"]+)"/g, (all, text, key) =>
    (dict[key] ? all.replace(/href="[^"]*"/, `href="${dict[key]}"`) : all));

  // Competition links lead to this language's matchday pages.
  html = html.replace(/href="\/([a-z-]+)" data-comp="\1"/g, (all, comp) => `href="/${lang}/${comp}" data-comp="${comp}"`);

  // Texts: every element with data-i holds plain text only.
  let missing = [];
  html = html.replace(/(<[a-z0-9]+\b[^>]*\bdata-i="([^"]+)"[^>]*>)([^<]*)(?=<)/g, (all, open, key) => {
    if (!dict[key]) { missing.push(key); return all; }
    return open + esc(dict[key]);
  });
  // Image descriptions: <img … alt="…" data-i-alt="key">.
  html = html.replace(/\balt="[^"]*" data-i-alt="([^"]+)"/g, (all, key) => {
    if (!dict[key]) { missing.push(key); return all; }
    return `alt="${attr(dict[key])}" data-i-alt="${key}"`;
  });
  if (missing.length) console.warn(`${lang}: no text for ${[...new Set(missing)].join(', ')} — left in English`);

  const url = `${BASE}/${lang}`;
  const description = dict.desc;
  if (!description) throw new Error(`${lang}: no desc`);
  swap(/<html lang="en">/, `<html lang="${lang}">`);
  swap(/<title>[^<]*<\/title>/, `<title>${esc(dict.title)}</title>`);
  swap(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(description)}">`);
  swap(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(dict.title)}">`);
  swap(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(description)}">`);
  swap(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  swap(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${OG_LOCALE[lang]}">`);
  swap(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  swap(new RegExp(`<option value="${lang}">`), `<option value="${lang}" selected>`);
  swap(/(<script type="application\/ld\+json" id="ld">)([^<]*)(<\/script>)/, (all, open, json, close) => {
    const data = JSON.parse(json);
    const app = data['@graph'].find((node) => node['@type'] === 'MobileApplication');
    app.description = description;
    // The page node describes this language's page, not the English one.
    const node = data['@graph'].find((n) => n['@type'] === 'WebPage');
    Object.assign(node, { '@id': `${url}#webpage`, url, name: dict.title, description, inLanguage: lang });
    return open + JSON.stringify(data).replace(/</g, '\\u003c') + close;
  });
  return html;
}

console.log('feature pages:');
const { entries: featureEntries } = await buildFeatures();

const others = SUPPORTED.filter((lang) => lang !== 'en');
for (const lang of others) writeFileSync(`${dir}${lang}.html`, page(lang));

const today = new Date().toISOString().slice(0, 10);
const home = ['', ...others].map((lang) => `${BASE}/${lang}`);
const alternates = [
  `    <xhtml:link rel="alternate" hreflang="en" href="${BASE}/"/>`,
  ...others.map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}"/>`),
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/"/>`,
].join('\n');
const entry = (loc, extra = '') => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n${extra}  </url>`;
writeFileSync(`${dir}sitemap.xml`, [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...home.map((loc) => entry(loc, alternates + '\n')),
  ...featureEntries.map((e) => entry(e.loc, e.alternates.map(([l, href]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`).join('\n') + '\n')),
  entry(`${BASE}/support`),
  entry(`${BASE}/privacy`),
  entry(`${BASE}/delete-account`),
  '</urlset>',
  '',
].join('\n'));

console.log(`wrote ${others.map((lang) => lang + '.html').join(', ')} and sitemap.xml`);
