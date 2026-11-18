// Video pages of the landing site: a gallery (/videos, /de/videos, …) and one page per
// time-travel video with the story of the moment. Texts live in landing-videos/<lang>.mjs.
// The videos themselves stay on YouTube and load only when someone presses play.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { head, foot, stores, BASE, NAMES, ORDER, ui, esc, attr, home, words, out } from './landing-features.mjs';
import { createRequire } from 'node:module';

const { menu, BURGER } = createRequire(import.meta.url)(out + 'api/_md/menu.js');
const src = fileURLToPath(new URL('./landing-videos/', import.meta.url));
const WEB = 'https://app.betina.geniusbet.com';
const CHANNEL = 'https://www.youtube.com/@BETinaSports';

// id on YouTube, length in seconds, upload time. `key` is the text key in the language files.
export const VIDEOS = {
  intro: { yt: '3iA633VJvNA', sec: 45, up: '2026-10-01T05:57:19-07:00' },
  m1930: { yt: 'DiqaG7b-4IU', sec: 66, up: '2026-10-02T05:08:00-07:00' },
  m1970: { yt: 'sxboL9-vC2E', sec: 46, up: '2026-10-09T02:30:29-07:00' },
  m1986: { yt: '3NG0nEBdXto', sec: 72, up: '2026-10-26T09:19:06-07:00' },
  m1992: { yt: 'b15bWRI0ozE', sec: 69, up: '2026-11-07T00:41:27-08:00' },
  m1996: { yt: 'RQbc__6eX1Q', sec: 72, up: '2026-11-10T03:46:27-08:00' },
  m1998: { yt: '4j0P0SHtxcE', sec: 44, up: '2026-11-18T01:32:55-08:00' },
  matchday: { yt: '2Fz4NMSYJKU', sec: 26, up: '2026-11-14T05:02:13-08:00' },
  eyes: { yt: 'Pk3IRhMJZM0', sec: 20, up: '2026-11-13T05:07:14-08:00' },
};
const MOMENTS = ['m1930', 'm1970', 'm1986', 'm1992', 'm1996', 'm1998'];
const HOME = ['intro', 'm1986', 'm1930'];
const dur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const thumb = (key) => `/assets/videos/${VIDEOS[key].yt}.webp`;
export const galleryPath = (lang) => (lang === 'en' ? '/videos' : `/${lang}/videos`);
const momentPath = (lang, slug) => `${galleryPath(lang)}/${slug}`;

export const VIDEO_CSS = `
.vgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 22px}
.vcard h3{margin:14px 0 6px;font-size:18px;font-weight:800;line-height:1.25;letter-spacing:-.01em}
.vcard h3 a:hover{color:var(--lime)}
.vcard p{margin:0;color:var(--muted);font-size:15px;line-height:1.5}
.vcard .go{display:inline-block;margin-top:10px;font-size:14px;font-weight:800;color:var(--lime)}
.vcard .go:hover{text-decoration:underline;text-underline-offset:4px}
.vid{position:relative;display:block;aspect-ratio:9/16;background:#000;border:1px solid var(--line);overflow:hidden;cursor:pointer}
.vid img,.vid iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}
.vid img{transition:transform .5s var(--ease)}
.vid:hover img{transform:scale(1.04)}
.vid::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(13,11,17,.7),transparent 42%);pointer-events:none}
.vid .play{position:absolute;z-index:2;left:50%;top:50%;width:68px;height:68px;margin:-34px 0 0 -34px;background:var(--lime);display:grid;place-items:center;transition:transform .2s var(--ease)}
.vid .play::before{content:'';border-style:solid;border-width:11px 0 11px 18px;border-color:transparent transparent transparent var(--lime-ink);margin-left:4px}
.vid:hover .play{transform:scale(1.08)}
.vid .dur{position:absolute;z-index:2;right:10px;bottom:10px;font-size:12px;font-weight:800;background:rgba(0,0,0,.72);color:#fff;padding:3px 7px}
.vid.on::after,.vid.on .play,.vid.on .dur{display:none}
.vnote{margin:26px 0 0;font-size:13px;color:var(--muted)}
.vnote a{color:var(--lime);font-weight:800}
@media (max-width:900px){.vgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 14px}.vcard h3{font-size:16px}.vcard p{font-size:14px}.vid .play{width:54px;height:54px;margin:-27px 0 0 -27px}
.vgrid.row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;margin:0 calc(var(--gutter) * -1);padding:0 var(--gutter) 6px;scrollbar-width:none}.vgrid.row::-webkit-scrollbar{display:none}.vgrid.row .vcard{flex:0 0 64%;scroll-snap-align:center}}
`;
const PAGE_CSS = `
.vhero{padding:132px 0 0}
.vhero h1{font-size:clamp(40px,5.6vw,82px);margin:22px 0 24px;overflow-wrap:break-word;hyphens:auto}
.vhero h1 span{display:block}
.vhero .lead{font-size:19px;color:var(--soft);max-width:680px;margin:0}
.vfeat{display:grid;grid-template-columns:minmax(0,330px) minmax(0,1fr);gap:56px;align-items:center}
.vfeat h2{font-size:clamp(30px,4vw,54px);margin:16px 0 18px}
.vfeat p{font-size:18px;color:var(--soft);margin:0 0 26px;max-width:560px}
.watch{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,340px);grid-template-areas:"intro art" "facts art";gap:30px 56px;align-items:start}
.w-intro{grid-area:intro}.w-facts{grid-area:facts}.watch .art{grid-area:art}
.w-facts .kicker{margin-bottom:10px}
.ftable{width:100%;border-collapse:collapse;margin:0;font-size:16px}
.ftable th,.ftable td{text-align:left;padding:13px 0;border-top:1px solid var(--line);vertical-align:top}
.ftable th{color:var(--muted);font-weight:600;width:42%;padding-right:18px}
.ftable td{color:var(--text);font-weight:700}
.story h2{font-size:clamp(26px,3.2vw,40px);margin:54px 0 18px;max-width:820px}
.story h2:first-child{margin-top:0}
.sec.tight{padding-top:70px}
@media (max-width:900px){.vhero{padding-top:104px}.vfeat,.watch{grid-template-columns:1fr;gap:34px}.watch{grid-template-areas:"intro" "art" "facts"}.vfeat .vid,.watch .vid{max-width:320px;margin:0 auto;width:100%}}
`;
// One listener for every card: the anchor leads to YouTube without JavaScript, with it the player opens in place.
export const VIDEO_JS = `<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a.vid[data-yt]');
  if (!a || a.classList.contains('on')) return;
  e.preventDefault();
  var f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1';
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  f.title = a.getAttribute('aria-label') || 'Video';
  a.classList.add('on');
  a.appendChild(f);
});
</script>`;

const player = (key, label, eager = false) =>
  `<a class="vid" href="https://www.youtube.com/shorts/${VIDEOS[key].yt}" data-yt="${VIDEOS[key].yt}" target="_blank" rel="noopener" aria-label="${attr(label)}"><img src="${thumb(key)}" alt="${attr(label)}" width="540" height="960"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}><span class="play"></span><span class="dur">${dur(VIDEOS[key].sec)}</span></a>`;

/** The three videos on the home page. `attrs` marks texts for the in-browser language swap on "/". */
export function homeSection(lang, t, attrs = false) {
  const i = (key) => (attrs ? ` data-i="${key}"` : '');
  const title = (key) => (t.moments[key] ?? t.clips[key]).t;
  return `<section id="videos">
  <div class="wrap">
    <div class="head rv">
      <span class="kicker"${i('vidKicker')}>${esc(t.page.homeK)}</span>
      <h2 class="display"><span${i('vidA')}>${esc(t.page.homeA)}</span> <span class="accent"${i('vidB')}>${esc(t.page.homeB)}</span></h2>
    </div>
    <div class="vgrid row rv">
      ${HOME.map((key, n) => `<div class="vcard">${player(key, title(key))}<h3${i('vid' + (n + 1))}>${esc(title(key))}</h3></div>`).join('\n      ')}
    </div>
    <a class="more" href="${galleryPath(lang)}" data-i="vidAll" data-i-href="hrefVideos">${esc(t.page.homeAll)}</a>
  </div>
</section>`;
}

/** Keys the home page needs in i18n.js for one language. */
export const homeKeys = (lang, t) => ({
  mVideos: t.page.nav, hrefVideos: galleryPath(lang), vidKicker: t.page.homeK, vidA: t.page.homeA, vidB: t.page.homeB, vidAll: t.page.homeAll,
  ...Object.fromEntries(HOME.map((key, n) => ['vid' + (n + 1), (t.moments[key] ?? t.clips[key]).t])),
});

const videoLd = (key, name, description) => ({
  '@type': 'VideoObject', name, description,
  thumbnailUrl: [BASE + thumb(key)], uploadDate: VIDEOS[key].up, duration: `PT${VIDEOS[key].sec}S`,
  embedUrl: `https://www.youtube.com/embed/${VIDEOS[key].yt}`,
  publisher: { '@id': `${BASE}/#org` },
});

function nav(lang, links) {
  return `
<nav>
  <div class="wrap">
    <a class="brand" href="${home(lang)}" aria-label="BETina"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128"><b>BET<span>INA</span></b><small>by GeniusBet</small></a>
    ${menu(lang, 'videos')}
    <details class="langmenu">
      <summary aria-label="Language">${lang.toUpperCase()}</summary>
      <div>${ORDER.filter((l) => l !== lang && links[l]).map((l) => `<a href="${links[l]}" hreflang="${l}" lang="${l}">${NAMES[l]}</a>`).join('')}</div>
    </details>
    <a class="btn" href="${WEB}">${esc(ui(lang, 'navWeb'))}</a>
    ${BURGER}
  </div>
</nav>
`;
}
const alternates = (links) => [...ORDER.filter((l) => links[l]).map((l) => [l, BASE + links[l]]), ['x-default', BASE + links.en]];
const altTags = (links) => alternates(links).map(([l, href]) => `<link rel="alternate" hreflang="${l}" href="${href}">`).join('\n');
const cta = (lang, P) => `
  <section class="cta" id="download">
    <div class="cta-bg"><img src="/assets/v2/betina-wink.webp" alt="" width="752" height="1344" loading="lazy"></div>
    <div class="wrap">
      <h2 class="display">${esc(P.ctaA)} <span class="accent">${esc(P.ctaB)}</span></h2>
      <p>${esc(P.ctaText)}</p>
      ${stores(lang)}
    </div>
  </section>
</main>

`;
const card = (lang, t, key) => {
  const m = t.moments[key];
  if (!m) { const c = t.clips[key]; return `<div class="vcard">${player(key, c.t)}<h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></div>`; }
  const href = momentPath(lang, m.slug);
  return `<div class="vcard">${player(key, m.t)}<h3><a href="${href}">${esc(m.t)}</a></h3><p>${esc(m.d)}</p><a class="go" href="${href}">${esc(t.page.story)} →</a></div>`;
};

function gallery(lang, t, links, features) {
  const P = t.page, url = BASE + links[lang];
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: P.title, description: P.desc, inLanguage: lang, isPartOf: { '@id': `${BASE}/#website` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) }, { '@type': 'ListItem', position: 2, name: P.nav, item: url }] },
    { '@type': 'ItemList', itemListElement: MOMENTS.map((key, n) => ({ '@type': 'ListItem', position: n + 1, name: t.moments[key].t, url: BASE + momentPath(lang, t.moments[key].slug) })) },
  ] };
  return head({ lang, title: P.title, desc: P.desc, url, alternates: altTags(links), ld, css: VIDEO_CSS + PAGE_CSS, preload: `<link rel="preload" as="image" href="${thumb('intro')}" fetchpriority="high">` }) + nav(lang, links) + `<main>
  <header class="vhero">
    <div class="wrap">
      <p class="crumbs"><a href="${home(lang)}">BETina</a><span>/</span>${esc(P.nav)}</p>
      <span class="sticker">${esc(P.sticker)}</span>
      <h1 class="display"><span>${esc(P.h1a)}</span><span class="accent">${esc(P.h1b)}</span></h1>
      <p class="lead">${esc(P.lead)}</p>
    </div>
  </header>

  <section class="sec tight">
    <div class="wrap vfeat">
      ${player('intro', t.clips.intro.t, true)}
      <div>
        <span class="kicker">${esc(P.startK)}</span>
        <h2 class="display">${esc(t.clips.intro.t)}</h2>
        <p>${esc(t.clips.intro.d)}</p>
        ${stores(lang)}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <span class="kicker">${esc(P.timeK)}</span>
      <h2 class="display">${esc(P.timeA)} <span class="accent">${esc(P.timeB)}</span></h2>
      <p class="intro">${esc(P.timeIntro)}</p>
      <div class="vgrid">
        ${MOMENTS.map((key) => card(lang, t, key)).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <span class="kicker">${esc(P.stadK)}</span>
      <h2 class="display">${esc(P.stadA)} <span class="accent">${esc(P.stadB)}</span></h2>
      <p class="intro">${esc(P.stadIntro)}</p>
      <div class="vgrid">
        ${['matchday', 'eyes'].map((key) => card(lang, t, key)).join('\n        ')}
      </div>
      <p class="vnote">${esc(P.note)} <a href="${CHANNEL}" target="_blank" rel="me noopener">${esc(P.yt)} →</a></p>
    </div>
  </section>
${cta(lang, P)}` + foot(lang, features).replace('</body>', VIDEO_JS + '\n</body>');
}

function moment(lang, t, key, links, features) {
  const P = t.page, m = t.moments[key], url = BASE + links[lang];
  // Show the three moments that follow this one, wrapping around.
  const i = MOMENTS.indexOf(key);
  const next = [1, 2, 3].map((d) => MOMENTS[(i + d) % MOMENTS.length]);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: m.title, description: m.desc, inLanguage: lang, isPartOf: { '@id': `${BASE}/#website` }, mainEntity: { '@id': `${url}#video` } },
    { ...videoLd(key, m.t, m.d), '@id': `${url}#video` },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) },
      { '@type': 'ListItem', position: 2, name: P.nav, item: BASE + galleryPath(lang) },
      { '@type': 'ListItem', position: 3, name: m.t, item: url }] },
    { '@type': 'FAQPage', mainEntity: m.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ] };
  return head({ lang, title: m.title, desc: m.desc, url, alternates: altTags(links), ld, css: VIDEO_CSS + PAGE_CSS, image: BASE + thumb(key), preload: `<link rel="preload" as="image" href="${thumb(key)}" fetchpriority="high">` }) + nav(lang, links) + `<main>
  <header class="vhero">
    <div class="wrap watch">
      <div class="w-intro">
        <p class="crumbs"><a href="${home(lang)}">BETina</a><span>/</span><a href="${galleryPath(lang)}">${esc(P.nav)}</a><span>/</span>${esc(m.t)}</p>
        <span class="sticker">${esc(P.timeK)}</span>
        <h1 class="display"><span>${esc(m.h1a)}</span><span class="accent">${esc(m.h1b)}</span></h1>
        <p class="lead">${esc(m.lead)}</p>
      </div>
      <div class="w-facts">
        <span class="kicker">${esc(P.factsK)}</span>
        <table class="ftable"><tbody>
          ${m.facts.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('\n          ')}
        </tbody></table>
      </div>
      <div class="art">
        ${player(key, m.t, true)}
        <p class="vnote">${esc(P.note)}</p>
      </div>
    </div>
  </header>

  <section class="sec tight">
    <div class="wrap story prose">
      ${m.sections.map((s) => `<h2 class="display">${esc(s.h)}</h2>\n      ${s.p.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}`).join('\n      ')}
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <span class="kicker">${esc(P.faqK)}</span>
      <h2 class="display">${esc(P.faqA)} <span class="accent">${esc(P.faqB)}</span></h2>
      <div class="faq">
        ${m.faq.map(([q, a]) => `<div class="qa"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <span class="kicker">${esc(P.moreK)}</span>
      <h2 class="display">${esc(P.moreA)} <span class="accent">${esc(P.moreB)}</span></h2>
      <div class="vgrid">
        ${next.map((k) => card(lang, t, k)).join('\n        ')}
      </div>
      <p class="vnote"><a href="${galleryPath(lang)}">${esc(P.all)} →</a></p>
    </div>
  </section>
${cta(lang, P)}` + foot(lang, features).replace('</body>', VIDEO_JS + '\n</body>');
}

/** Loads the texts of every language that has a file. */
export async function loadVideoTexts() {
  const texts = {};
  for (const lang of ORDER) {
    const file = `${src}${lang}.mjs`;
    if (existsSync(file)) texts[lang] = (await import(pathToFileURL(file).href)).default;
  }
  return texts;
}

/** Writes the gallery and the moment pages; returns their sitemap entries. */
export async function buildVideos(features, texts) {
  const entries = [];
  const write = (path, html) => {
    const file = `${out}${path.slice(1)}.html`;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  };
  const langs = Object.keys(texts);
  const gLinks = Object.fromEntries(langs.map((l) => [l, galleryPath(l)]));
  for (const lang of langs) {
    write(gLinks[lang], gallery(lang, texts[lang], gLinks, features));
    entries.push({ loc: BASE + gLinks[lang], alternates: alternates(gLinks) });
  }
  for (const key of MOMENTS) {
    const links = Object.fromEntries(langs.map((l) => [l, momentPath(l, texts[l].moments[key].slug)]));
    for (const lang of langs) {
      const html = moment(lang, texts[lang], key, links, features);
      write(links[lang], html);
      const m = texts[lang].moments[key];
      console.log(`  ${links[lang]}: ${words(html)} words, title ${m.title.length}, description ${m.desc.length}`);
      entries.push({ loc: BASE + links[lang], alternates: alternates(links) });
    }
  }
  return entries;
}
