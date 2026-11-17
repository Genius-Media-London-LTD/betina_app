// Feature pages of the landing site (/prediction-game, /de/tippspiel, …):
// descriptive pages about one part of the app each, so search engines have
// something to rank for besides the brand name. The features themselves stay
// in the app; these pages lead there.
//
// Content lives in scripts/landing-features/<feature>.mjs (English and German)
// and in scripts/landing-features/lang/<lang>.mjs (all three pages of one
// further language). build-landing-langs.mjs calls buildFeatures() and puts the pages
// into the sitemap — run that script after changing content or this template.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const out = fileURLToPath(new URL('../web/landing/', import.meta.url));
const src = fileURLToPath(new URL('./landing-features/', import.meta.url));
const { T } = createRequire(import.meta.url)(out + 'i18n.js');
const BASE = 'https://betina.geniusbet.com';
const APPLE = 'https://apps.apple.com/app/betina-ai/id6796780870';
const PLAY = 'https://play.google.com/store/apps/details?id=com.geniusbet.betina&pcampaignid=web_share&referrer=utm_source%3Dbetina_web%26utm_medium%3Dfeature';
const WEB = 'https://app.betina.geniusbet.com';
const OG_LOCALE = { en: 'en_US', de: 'de_DE', es: 'es_ES', fr: 'fr_FR', pt: 'pt_PT', it: 'it_IT', ro: 'ro_RO', tr: 'tr_TR', hr: 'hr_HR' };

// Interface texts: English here, the other languages from the landing page's dictionary.
const EN = {
  navSupport: 'Support', navWeb: 'Web app →', storeApple: 'Download on the', storeGoogle: 'Get it on',
  tryWeb: 'or try it on the web →', heroFree: 'Free · No money, no stakes · iPhone, Android & web',
  fPrivacy: 'Privacy', fTerms: 'Terms', fDelete: 'Delete account', fContact: 'Contact',
  fFine: '18+ only. BETina is an AI companion for sports fans and entertainment — no real money is wagered or moved in the app.',
  ckText: "We'd like to use cookies for anonymous usage statistics.", ckNo: 'Essential only', ckYes: 'Accept all',
};
const LOCAL = {
  en: { home: 'Home', more: 'More from BETina', faq: 'Questions & answers', now: 'now' },
  de: { home: 'Startseite', more: 'Mehr von BETina', faq: 'Fragen & Antworten', now: 'jetzt' },
};
const COMPS = [['bundesliga', 'Bundesliga'], ['premier-league', 'Premier League'], ['laliga', 'LaLiga'], ['serie-a', 'Serie A'], ['champions-league', 'Champions League']];
const NAMES = { en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', pt: 'Português', it: 'Italiano', ro: 'Română', tr: 'Türkçe', hr: 'Hrvatski' };
const ORDER = Object.keys(NAMES);
const ui = (lang, key) => (lang === 'en' ? EN[key] : T[lang][key]) ?? EN[key];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const home = (lang) => (lang === 'en' ? '/' : `/${lang}`);
const words = (html) => html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

const CSS = `
@font-face{font-family:'Archivo Fallback';src:local('Arial');size-adjust:97.5%}
@font-face{font-family:'Archivo';font-style:italic;font-weight:900;font-display:swap;src:url(/assets/fonts/archivo-italic-900-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF}
@font-face{font-family:'Archivo';font-style:italic;font-weight:900;font-display:swap;src:url(/assets/fonts/archivo-italic-900-latin.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
@font-face{font-family:'Archivo';font-style:normal;font-weight:400 900;font-display:swap;src:url(/assets/fonts/archivo-variable-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF}
@font-face{font-family:'Archivo';font-style:normal;font-weight:400 900;font-display:swap;src:url(/assets/fonts/archivo-variable-latin.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
:root { --lime: #B8E926; --lime-ink: #10120A; --violet: #8B5CF6; --bg: #0D0B11; --surface: #14111A; --raised: #1B1723;
  --line: rgba(242, 240, 245, .10); --text: #F2F0F5; --soft: #CFC9DA; --muted: #A29AAF; --gutter: 28px; --max: 1180px; --ease: cubic-bezier(.2, .8, .2, 1); }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Archivo','Archivo Fallback', system-ui, sans-serif; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
body::after { content: ''; position: fixed; inset: 0; z-index: 90; pointer-events: none; opacity: .07;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; }
.wrap { max-width: var(--max); margin: 0 auto; padding: 0 var(--gutter); }
.display { font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -.025em; line-height: .94; margin: 0; }
.accent { color: var(--lime); }
.kicker { display: inline-flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; color: var(--lime); }
.kicker::before { content: ''; width: 28px; height: 2px; background: var(--lime); }
.sticker { display: inline-block; background: var(--lime); color: var(--lime-ink); font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: .02em;
  font-size: 13px; line-height: 1.15; padding: 7px 11px; transform: rotate(-3deg); box-shadow: 4px 4px 0 rgba(0, 0, 0, .6); }
.sticker.violet { background: var(--violet); color: #fff; }

nav { position: fixed; top: 0; left: 0; right: 0; z-index: 60; background: rgba(13, 11, 17, .82); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--line); }
nav .wrap { display: flex; align-items: center; gap: 22px; height: 68px; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand img { width: 26px; }
.brand b { font-weight: 900; font-style: italic; font-size: 22px; letter-spacing: -.01em; }
.brand b span { color: var(--lime); }
.brand small { font-size: 10px; font-weight: 700; letter-spacing: .16em; color: var(--muted); text-transform: uppercase; }
.navlinks { display: flex; gap: 26px; margin-left: auto; font-size: 14px; font-weight: 600; color: var(--soft); }
.navlinks a:hover, .navlinks a[aria-current] { color: var(--lime); }
.langmenu { position: relative; font: 700 13px 'Archivo', sans-serif; }
.langmenu summary { list-style: none; cursor: pointer; white-space: nowrap; border: 1px solid var(--line); padding: 8px 12px; background: rgba(255, 255, 255, .04); }
.langmenu summary::-webkit-details-marker { display: none; }
.langmenu summary::after { content: ' ▾'; color: var(--muted); }
.langmenu[open] summary, .langmenu summary:hover { border-color: var(--lime); }
.langmenu div { position: absolute; right: 0; top: calc(100% + 6px); min-width: 150px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 20px 44px rgba(0, 0, 0, .5); padding: 6px 0; }
.langmenu a { display: block; padding: 8px 14px; color: var(--soft); }
.langmenu a:hover { color: var(--lime); background: rgba(255, 255, 255, .04); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: .02em;
  font-size: 14px; padding: 12px 18px; background: var(--lime); color: var(--lime-ink); transition: transform .2s var(--ease), box-shadow .2s var(--ease); }
.btn:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 rgba(184, 233, 38, .35); }

.stores { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.store { display: inline-flex; align-items: center; gap: 12px; background: var(--text); color: #000; padding: 11px 20px 11px 16px; min-width: 200px; transition: transform .2s var(--ease), box-shadow .2s var(--ease); }
.store:hover { transform: translate(-3px, -3px); box-shadow: 5px 5px 0 var(--lime); }
.store svg { width: 26px; height: 26px; flex: none; }
.store span { display: flex; flex-direction: column; line-height: 1.1; }
.store small { font-size: 11px; font-weight: 600; }
.store strong { font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
.weblink { display: inline-block; font-weight: 800; color: var(--lime); font-size: 15px; padding: 12px 2px 4px; }
.weblink:hover { text-decoration: underline; text-underline-offset: 4px; }
.free { margin-top: 10px; font-size: 13px; color: var(--muted); font-weight: 600; letter-spacing: .04em; }

.phone { position: relative; width: 300px; padding: 9px; border-radius: 50px; background: #050505;
  box-shadow: inset 0 0 0 1.5px #3A3A40, 0 0 0 1px #1C1C20, 0 50px 90px rgba(0, 0, 0, .65), 0 0 140px rgba(184, 233, 38, .16); }
.phone::before { content: ''; position: absolute; right: -3px; top: 22%; width: 3px; height: 70px; border-radius: 2px; background: #2A2A30; }
.scr { position: relative; aspect-ratio: 640 / 1344; border-radius: 41px; overflow: hidden; background: #000; }
.scr img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* ---------- Hero ---------- */
.fhero { position: relative; padding: 132px 0 90px; overflow: hidden; }
.fhero::before { content: ''; position: absolute; right: -12%; top: -20%; width: 62vw; height: 62vw; background: radial-gradient(circle, rgba(184, 233, 38, .13), transparent 62%); pointer-events: none; }
.fhero .wrap { position: relative; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); gap: 50px; align-items: center; }
.crumbs { font-size: 13px; font-weight: 600; color: var(--muted); margin: 0 0 26px; }
.crumbs a:hover { color: var(--lime); }
.crumbs span { margin: 0 8px; opacity: .5; }
.fhero h1 { font-size: clamp(40px, 5.6vw, 82px); margin: 22px 0 24px; overflow-wrap: break-word; hyphens: auto; }
.fhero h1 span { display: block; }
.fhero .lead { font-size: 19px; color: var(--soft); max-width: 600px; margin: 0 0 32px; }
.fhero .art { position: relative; justify-self: center; }
.fhero .art .phone { transform: rotate(5deg); width: clamp(230px, 24vw, 300px); }
.fhero .art .sticker { position: absolute; z-index: 2; left: -26px; top: 34px; transform: rotate(-9deg); }
.push { position: absolute; z-index: 3; left: -70px; bottom: 90px; width: 260px; display: flex; gap: 12px; align-items: center; background: rgba(242, 240, 245, .97); color: #111;
  padding: 12px 14px; transform: rotate(-4deg); box-shadow: 0 24px 50px rgba(0, 0, 0, .5); }
.push img { width: 32px; height: 32px; background: #111; padding: 6px; flex: none; }
.push small { display: block; font-size: 11px; color: #555; font-weight: 700; }
.push strong { font-size: 14px; font-weight: 800; line-height: 1.25; }

/* ---------- Quick facts ---------- */
.facts { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.fact { padding: 30px 24px 28px; border-left: 1px solid var(--line); }
.fact:first-child { border-left: 0; padding-left: 0; }
.fact b { display: block; font-weight: 900; font-style: italic; font-size: clamp(34px, 3.6vw, 52px); line-height: 1; color: var(--lime); letter-spacing: -.03em; }
.fact span { display: block; margin-top: 10px; font-size: 14px; color: var(--soft); font-weight: 600; line-height: 1.4; }

/* ---------- Sections ---------- */
.sec { padding: 96px 0 0; }
.sec > .wrap > h2, .sec .col h2 { font-size: clamp(32px, 4.4vw, 60px); margin: 18px 0 26px; max-width: 900px; overflow-wrap: break-word; hyphens: auto; }
.prose { max-width: 760px; }
.prose p, .intro { font-size: 18px; color: var(--soft); margin: 0 0 18px; }
.prose p:last-child { margin-bottom: 0; }
.prose strong, .intro strong { color: var(--text); font-weight: 700; }
.prose a, .qa a, .intro a { color: var(--lime); text-decoration: underline; text-underline-offset: 3px; }
.intro { max-width: 760px; margin-bottom: 34px; }
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 60px; align-items: center; }
.split.flip .col { order: 2; }

.steps { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 10px; }
.steps.four { grid-template-columns: repeat(4, 1fr); }
.step { padding: 10px 34px 0 0; }
.step + .step { padding-left: 34px; border-left: 1px solid var(--line); }
.step .n { font-weight: 900; font-style: italic; font-size: 84px; line-height: .85; letter-spacing: -.05em; color: transparent; -webkit-text-stroke: 1.5px var(--lime); }
.step h3 { margin: 22px 0 8px; font-size: 22px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -.01em; line-height: 1.1; }
.step p { margin: 0; color: var(--muted); font-size: 16px; }

.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.cards.two { grid-template-columns: repeat(2, 1fr); }
.card { position: relative; background: var(--surface); border: 1px solid var(--line); padding: 28px 26px 30px; transition: transform .25s var(--ease), border-color .25s; }
.card:hover { transform: translateY(-4px); border-color: rgba(184, 233, 38, .45); }
.card .big { font-weight: 900; font-style: italic; font-size: 64px; line-height: .9; letter-spacing: -.04em; color: var(--lime); }
.card .big small { font-size: 16px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-left: 8px; font-style: normal; font-weight: 800; }
.card .eg { display: inline-flex; gap: 8px; align-items: center; margin-top: 16px; font-size: 13px; font-weight: 800; letter-spacing: .04em; background: rgba(255, 255, 255, .06); padding: 6px 10px; color: var(--soft); }
.card h3 { margin: 16px 0 8px; font-size: 20px; font-weight: 800; letter-spacing: -.01em; line-height: 1.2; }
.card p { margin: 0; color: var(--muted); font-size: 16px; }
.card .tag { position: absolute; right: 16px; top: -12px; }

.chat { background: var(--surface); border: 1px solid var(--line); padding: 26px 22px; display: flex; flex-direction: column; gap: 12px; max-width: 520px; width: 100%; justify-self: center; box-shadow: 0 40px 80px rgba(0, 0, 0, .45); }
.chat .who { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 14px; padding-bottom: 14px; margin-bottom: 4px; border-bottom: 1px solid var(--line); }
.chat .who img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
.chat .who i { font-style: normal; color: var(--lime); font-size: 12px; font-weight: 700; margin-left: auto; }
.msg { max-width: 86%; padding: 11px 14px; font-size: 15.5px; line-height: 1.45; border-radius: 16px; }
.msg.b { align-self: flex-start; background: var(--raised); color: var(--text); border-bottom-left-radius: 4px; }
.msg.me { align-self: flex-end; background: var(--lime); color: var(--lime-ink); font-weight: 600; border-bottom-right-radius: 4px; }
.chat .note { font-size: 12px; color: var(--muted); margin: 6px 0 0; }

.feed { display: flex; flex-direction: column; gap: 12px; max-width: 440px; width: 100%; justify-self: center; }
.note-card { display: flex; gap: 12px; align-items: center; background: rgba(242, 240, 245, .97); color: #111; padding: 13px 15px; box-shadow: 0 20px 44px rgba(0, 0, 0, .45); }
.note-card:nth-child(odd) { transform: rotate(-1.2deg); }
.note-card:nth-child(even) { transform: rotate(1deg) translateX(14px); }
.note-card img { width: 34px; height: 34px; background: #111; padding: 6px; flex: none; }
.note-card small { display: block; font-size: 11px; color: #555; font-weight: 700; }
.note-card strong { font-size: 14.5px; font-weight: 800; line-height: 1.3; }

.tbl { width: 100%; border-collapse: collapse; font-size: 16px; }
.tblwrap { overflow-x: auto; border: 1px solid var(--line); background: var(--surface); }
.tbl th, .tbl td { text-align: left; padding: 15px 18px; border-bottom: 1px solid var(--line); vertical-align: top; }
.tbl tr:last-child td { border-bottom: 0; }
.tbl th { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); font-weight: 800; white-space: nowrap; }
.tbl td:first-child { font-weight: 700; color: var(--text); }
.tbl td { color: var(--soft); }
.tbl .hl { color: var(--lime); font-weight: 800; }

.ticks { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 40px; max-width: 900px; }
.ticks li { position: relative; padding-left: 30px; color: var(--soft); font-size: 17px; }
.ticks li::before { content: '✦'; position: absolute; left: 0; top: 0; color: var(--lime); }
.ticks strong { color: var(--text); }

.faq { display: grid; grid-template-columns: 1fr 1fr; gap: 0 60px; }
.qa { padding: 26px 0 28px; border-top: 1px solid var(--line); }
.qa h3 { margin: 0 0 8px; font-size: 20px; font-weight: 800; letter-spacing: -.01em; line-height: 1.25; }
.qa p { margin: 0; color: var(--muted); font-size: 16px; }

.also { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.also a { display: block; background: var(--surface); border: 1px solid var(--line); padding: 26px; transition: transform .25s var(--ease), border-color .25s; }
.also a:hover { transform: translateY(-4px); border-color: var(--lime); }
.also b { display: block; font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 24px; line-height: 1.05; letter-spacing: -.01em; }
.also span { display: block; margin-top: 10px; color: var(--muted); font-size: 15px; }
.also i { display: block; margin-top: 16px; font-style: normal; font-weight: 800; color: var(--lime); font-size: 14px; }

.cta { position: relative; margin-top: 110px; min-height: 78vh; display: flex; align-items: center; overflow: hidden; }
.cta-bg { position: absolute; top: 0; bottom: 0; right: 0; width: 52%; max-width: 780px; }
.cta-bg img { width: 100%; height: 100%; object-fit: cover; object-position: 60% 30%; -webkit-mask-image: linear-gradient(90deg, transparent, #000 35%); mask-image: linear-gradient(90deg, transparent, #000 35%); }
.cta-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, var(--bg), transparent 28%), linear-gradient(180deg, var(--bg), transparent 22%); }
.cta .wrap { position: relative; z-index: 2; width: 100%; padding-top: 90px; padding-bottom: 90px; }
.cta h2 { font-size: clamp(42px, 6vw, 92px); max-width: 720px; margin-bottom: 24px; overflow-wrap: break-word; hyphens: auto; }
.cta p { font-size: 19px; color: var(--soft); margin: 0 0 32px; max-width: 480px; }

footer { border-top: 1px solid var(--line); padding: 48px 0 60px; color: var(--muted); font-size: 14px; }
footer .top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px; align-items: center; margin-bottom: 26px; }
footer .links { display: flex; flex-wrap: wrap; gap: 14px 24px; font-weight: 600; color: var(--soft); }
footer .links a:hover { color: var(--lime); }
footer .fine { font-size: 13px; line-height: 1.6; max-width: 820px; margin: 0; }

#ck { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 100; max-width: 640px; margin: 0 auto; display: none; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: space-between;
  background: rgba(20, 17, 26, .96); backdrop-filter: blur(12px); border: 1px solid rgba(184, 233, 38, .35); padding: 14px 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, .5); }
#ck.show { display: flex; }
#ck span { font-size: 13px; color: var(--soft); }
#ck a { color: var(--lime); text-decoration: underline; }
#ck .row { display: flex; gap: 8px; }
#ck button { font: 800 13px 'Archivo', sans-serif; padding: 9px 14px; cursor: pointer; border: 1px solid var(--line); background: transparent; color: var(--text); }
#ck button.yes { background: var(--lime); color: var(--lime-ink); border-color: var(--lime); }

@media (max-width: 900px) {
  :root { --gutter: 20px; }
  .navlinks { display: none; }
  .langmenu { margin-left: auto; }
  .fhero { padding: 104px 0 60px; }
  .fhero .wrap { grid-template-columns: 1fr; gap: 56px; }
  .fhero .art .phone { width: 250px; transform: rotate(3deg); }
  .push { left: -40px; width: 230px; }
  .facts { grid-template-columns: 1fr 1fr; }
  .fact { padding: 24px 16px; }
  .fact:nth-child(3) { border-left: 0; padding-left: 0; }
  .fact:nth-child(n+3) { border-top: 1px solid var(--line); }
  .sec { padding-top: 72px; }
  .split { grid-template-columns: 1fr; gap: 40px; }
  .split.flip .col { order: 0; }
  .steps, .steps.four { grid-template-columns: 1fr; }
  .step, .step + .step { padding: 26px 0; border-left: 0; border-top: 1px solid var(--line); }
  .step .n { font-size: 68px; }
  .cards, .cards.two, .also { grid-template-columns: 1fr; }
  .ticks, .faq { grid-template-columns: 1fr; }
  .prose p, .intro { font-size: 17px; }
  .cta { display: block; min-height: 0; margin-top: 80px; }
  .cta-bg { position: relative; width: 100%; height: 62vh; }
  .cta-bg img { -webkit-mask-image: none; mask-image: none; }
  .cta-bg::after { background: linear-gradient(0deg, var(--bg) 4%, transparent 50%), linear-gradient(180deg, var(--bg), transparent 25%); }
  .cta .wrap { margin-top: -20vh; padding-top: 0; padding-bottom: 80px; }
  .note-card:nth-child(even) { transform: rotate(1deg); }
}
@media (max-width: 520px) {
  .brand small { display: none; }
  nav .wrap { gap: 10px; }
  .brand b { font-size: 19px; }
  nav .btn { padding: 9px 10px; font-size: 11px; white-space: nowrap; }
  .fhero h1 { font-size: 35px; }
  .sec > .wrap > h2, .sec .col h2 { font-size: 30px; }
  .cta h2 { font-size: 38px; }
  .store { flex: 1 1 100%; }
  .push { display: none; }
}
`;

const APPLE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.7c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.52.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.71-4.14zM13.8 5.06c.71-.86 1.19-2.06 1.06-3.26-1.03.04-2.27.69-3.01 1.55-.66.76-1.24 1.98-1.08 3.16 1.14.09 2.31-.58 3.03-1.45z"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D7FE" d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2z"/><path fill="#FFCE00" d="m17 8.4 3.3 1.9c1 .6 1 2.8 0 3.4L17 15.6 13.4 12z"/><path fill="#FF3A44" d="M17 15.6 13.4 12 3.6 22.2c.4.2.9.2 1.4-.1z"/><path fill="#00F076" d="M5 1.9c-.5-.3-1-.3-1.4-.1L13.4 12 17 8.4z"/></svg>';

const stores = (lang) => `<div class="stores">
        <a class="store" href="${APPLE}" target="_blank" rel="noopener">${APPLE_SVG}<span><small>${esc(ui(lang, 'storeApple'))}</small><strong>App Store</strong></span></a>
        <a class="store" href="${attr(PLAY)}" target="_blank" rel="noopener">${PLAY_SVG}<span><small>${esc(ui(lang, 'storeGoogle'))}</small><strong>Google Play</strong></span></a>
      </div>
      <a class="weblink" href="${WEB}">${esc(ui(lang, 'tryWeb'))}</a>`;

// Section renderers. Text fields are trusted HTML written in the content files.
const head2 = (s) => `${s.kicker ? `<span class="kicker">${s.kicker}</span>` : ''}<h2 class="display">${s.h2}${s.h2b ? ` <span class="accent">${s.h2b}</span>` : ''}</h2>`;
const paras = (list) => list.map((p) => `<p>${p}</p>`).join('\n        ');
const RENDER = {
  prose: (s) => `${head2(s)}\n      <div class="prose">\n        ${paras(s.paras)}\n      </div>`,
  steps: (s) => `${head2(s)}${s.intro ? `\n      <p class="intro">${s.intro}</p>` : ''}
      <div class="steps${s.items.length === 4 ? ' four' : ''}">
        ${s.items.map((it, i) => `<div class="step"><div class="n">0${i + 1}</div><h3>${it.t}</h3><p>${it.p}</p></div>`).join('\n        ')}
      </div>`,
  cards: (s) => `${head2(s)}${s.intro ? `\n      <p class="intro">${s.intro}</p>` : ''}
      <div class="cards${s.items.length % 3 ? ' two' : ''}">
        ${s.items.map((it) => `<div class="card">${it.tag ? `<span class="sticker violet tag">${it.tag}</span>` : ''}${it.big ? `<div class="big">${it.big}${it.unit ? `<small>${it.unit}</small>` : ''}</div>` : ''}<h3>${it.t}</h3><p>${it.p}</p>${it.eg ? `<span class="eg">${it.eg}</span>` : ''}</div>`).join('\n        ')}
      </div>${s.after ? `\n      <div class="prose" style="margin-top:30px">\n        ${paras(s.after)}\n      </div>` : ''}`,
  chat: (s, lang) => `<div class="split${s.flip ? ' flip' : ''}">
        <div class="col">${head2(s)}<div class="prose">${paras(s.paras)}</div></div>
        <div class="chat" role="group" aria-label="${attr(s.label)}">
          <div class="who"><img src="/assets/v2/betina-avatar.jpg" alt="" width="34" height="34" loading="lazy">BETina<i>● online</i></div>
          ${s.msgs.map(([who, text]) => `<div class="msg ${who}">${text}</div>`).join('\n          ')}
          ${s.note ? `<p class="note">${s.note}</p>` : ''}
        </div>
      </div>`,
  feed: (s, lang) => `<div class="split${s.flip ? ' flip' : ''}">
        <div class="col">${head2(s)}<div class="prose">${paras(s.paras)}</div></div>
        <div class="feed" role="group" aria-label="${attr(s.label)}">
          ${s.items.map(([when, text]) => `<div class="note-card"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128" loading="lazy"><div><small>BETina · ${when}</small><strong>${text}</strong></div></div>`).join('\n          ')}
        </div>
      </div>`,
  shot: (s) => `<div class="split${s.flip ? ' flip' : ''}">
        <div class="col">${head2(s)}<div class="prose">${paras(s.paras)}</div></div>
        <div class="phone" style="justify-self:center"><div class="scr"><img src="/assets/v2/${s.img}.webp" alt="${attr(s.alt)}" width="640" height="1344" loading="lazy"></div></div>
      </div>`,
  table: (s) => `${head2(s)}${s.intro ? `\n      <p class="intro">${s.intro}</p>` : ''}
      <div class="tblwrap"><table class="tbl">
        <thead><tr>${s.cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${s.rows.map((r) => `<tr>${r.map((c, i) => `<td${i === s.hl ? ' class="hl"' : ''}>${c}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table></div>${s.after ? `\n      <div class="prose" style="margin-top:26px">\n        ${paras(s.after)}\n      </div>` : ''}`,
  ticks: (s) => `${head2(s)}${s.intro ? `\n      <p class="intro">${s.intro}</p>` : ''}
      <ul class="ticks">
        ${s.items.map((it) => `<li>${it}</li>`).join('\n        ')}
      </ul>`,
};

function render(feature, lang, all) {
  const p = feature.pages[lang];
  const L = LOCAL[lang];
  const url = BASE + p.path;
  const langs = ORDER.filter((l) => feature.pages[l]);
  const other = langs.filter((l) => l !== lang);
  const alternates = [
    ...langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${BASE}${feature.pages[l].path}">`),
    `<link rel="alternate" hreflang="x-default" href="${BASE}${feature.pages.en.path}">`,
  ].join('\n');
  const siblings = all.filter((f) => f.id !== feature.id && f.pages[lang]);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: p.title, description: p.desc, inLanguage: lang,
        isPartOf: { '@id': `${BASE}/#website` }, about: { '@id': `${BASE}/#app` }, publisher: { '@id': `${BASE}/#org` },
        primaryImageOfPage: `${BASE}/assets/v2/${feature.shot}.jpg`, dateModified: new Date().toISOString().slice(0, 10) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) },
        { '@type': 'ListItem', position: 2, name: p.crumb, item: url },
      ] },
    ],
  };
  const body = p.sections.map((s) => `  <section class="sec"${s.id ? ` id="${s.id}"` : ''}>
    <div class="wrap">
      ${RENDER[s.type](s, lang)}
    </div>
  </section>`).join('\n\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${attr(p.desc)}">
<meta name="theme-color" content="#0D0B11">
<meta property="og:title" content="${attr(p.title)}">
<meta property="og:description" content="${attr(p.desc)}">
<meta property="og:image" content="${BASE}/assets/v2/share-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:site_name" content="BETina">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@betina_sports">
<meta name="apple-itunes-app" content="app-id=6796780870">
<link rel="canonical" href="${url}">
${alternates}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-variable-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-italic-900-latin.woff2" crossorigin>
<link rel="preload" as="image" href="/assets/v2/${feature.shot}.webp" fetchpriority="high">
<style>${CSS}</style>
</head>
<body>

<nav>
  <div class="wrap">
    <a class="brand" href="${home(lang)}" aria-label="BETina"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128"><b>BET<span>INA</span></b><small>by GeniusBet</small></a>
    <div class="navlinks">
      ${all.filter((f) => f.pages[lang]).map((f) => `<a href="${f.pages[lang].path}"${f.id === feature.id ? ' aria-current="page"' : ''}>${f.pages[lang].nav}</a>`).join('\n      ')}
      <a href="/support">${esc(ui(lang, 'navSupport'))}</a>
    </div>
    <details class="langmenu">
      <summary aria-label="Language">${lang.toUpperCase()}</summary>
      <div>${other.map((l) => `<a href="${feature.pages[l].path}" hreflang="${l}" lang="${l}">${NAMES[l]}</a>`).join('')}</div>
    </details>
    <a class="btn" href="${WEB}">${esc(ui(lang, 'navWeb'))}</a>
  </div>
</nav>

<main>
  <header class="fhero">
    <div class="wrap">
      <div>
        <p class="crumbs"><a href="${home(lang)}">BETina</a><span>/</span>${p.crumb}</p>
        <span class="sticker">${p.sticker}</span>
        <h1 class="display"><span>${p.h1}</span><span class="accent">${p.h1b}</span></h1>
        <p class="lead">${p.lead}</p>
        ${stores(lang)}
        <div class="free">${esc(ui(lang, 'heroFree'))}</div>
      </div>
      <div class="art">
        ${p.badge ? `<span class="sticker violet">${p.badge}</span>` : ''}
        ${p.push ? `<div class="push"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128"><div><small>BETina · ${L.now}</small><strong>${p.push}</strong></div></div>` : ''}
        <div class="phone"><div class="scr"><img src="/assets/v2/${feature.shot}.webp" alt="${attr(p.shotAlt)}" width="640" height="1344" fetchpriority="high"></div></div>
      </div>
    </div>
  </header>

  <div class="wrap">
    <div class="facts">
      ${p.facts.map(([big, text]) => `<div class="fact"><b>${big}</b><span>${text}</span></div>`).join('\n      ')}
    </div>
  </div>

${body}

  <section class="sec" id="faq">
    <div class="wrap">
      <span class="kicker">${L.faq}</span><h2 class="display">${p.faqH2} <span class="accent">${p.faqH2b}</span></h2>
      <div class="faq">
        ${p.faq.map(([q, a]) => `<div class="qa"><h3>${q}</h3><p>${a}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <span class="kicker">${L.more}</span><h2 class="display">${p.alsoH2} <span class="accent">${p.alsoH2b}</span></h2>
      <div class="also">
        ${siblings.map((f) => `<a href="${f.pages[lang].path}"><b>${f.pages[lang].nav}</b><span>${f.pages[lang].teaser}</span><i>${f.pages[lang].more} →</i></a>`).join('\n        ')}
        <a href="${home(lang)}"><b>BETina</b><span>${p.homeTeaser}</span><i>${L.home} →</i></a>
      </div>
    </div>
  </section>

  <section class="cta" id="download">
    <div class="cta-bg"><img src="/assets/v2/betina-wink.webp" alt="" width="752" height="1344" loading="lazy"></div>
    <div class="wrap">
      <h2 class="display">${p.ctaH2} <span class="accent">${p.ctaH2b}</span></h2>
      <p>${p.ctaText}</p>
      ${stores(lang)}
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <div class="top">
      <a class="brand" href="${home(lang)}" aria-label="BETina"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128" loading="lazy"><b>BET<span>INA</span></b><small>by GeniusBet</small></a>
      <div class="links">
        ${all.filter((f) => f.pages[lang]).map((f) => `<a href="${f.pages[lang].path}">${f.pages[lang].nav}</a>`).join('\n        ')}
        ${COMPS.map(([c, n]) => `<a href="${lang === 'en' ? '' : '/' + lang}/${c}">${n}</a>`).join('\n        ')}
        <a href="/privacy">${esc(ui(lang, 'fPrivacy'))}</a>
        <a href="/privacy#terms">${esc(ui(lang, 'fTerms'))}</a>
        <a href="/support">${esc(ui(lang, 'navSupport'))}</a>
        <a href="/delete-account">${esc(ui(lang, 'fDelete'))}</a>
        <a href="mailto:marketing@geniusbet.com">${esc(ui(lang, 'fContact'))}</a>
        <a href="https://x.com/betina_sports" target="_blank" rel="me noopener">X</a>
        <a href="https://www.instagram.com/geniusbet.betina/" target="_blank" rel="me noopener">Instagram</a>
        <a href="https://www.facebook.com/profile.php?id=61593822575539" target="_blank" rel="me noopener">Facebook</a>
      </div>
    </div>
    <p class="fine">${esc(ui(lang, 'fFine'))}<br>© 2026 Genius Media London Ltd · Company No. 11133948</p>
  </div>
</footer>

<div id="ck" role="dialog" aria-label="Cookies">
  <span>${esc(ui(lang, 'ckText'))} <a href="/privacy">${esc(ui(lang, 'fPrivacy'))}</a></span>
  <div class="row"><button id="ck-e">${esc(ui(lang, 'ckNo'))}</button><button id="ck-a" class="yes">${esc(ui(lang, 'ckYes'))}</button></div>
</div>

<script>
// Analytics only after consent; "essential" keeps Google out entirely.
(function () {
  var KEY = 'betina_ck';
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function loadGA() {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-LRFD2P7EPN';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-LRFD2P7EPN', { anonymize_ip: true });
  }
  var choice = read();
  if (choice === 'all') loadGA();
  else if (choice !== 'essential') {
    var bar = document.getElementById('ck');
    bar.classList.add('show');
    document.getElementById('ck-a').onclick = function () { store('all'); bar.remove(); loadGA(); };
    document.getElementById('ck-e').onclick = function () { store('essential'); bar.remove(); };
  }
})();
</script>
</body>
</html>
`;
}

/** Writes every feature page and returns their sitemap entries. */
export async function buildFeatures() {
  const files = readdirSync(src).filter((f) => f.endsWith('.mjs')).sort();
  const all = [];
  for (const f of files) all.push((await import(pathToFileURL(src + f).href)).default);
  all.sort((a, b) => a.order - b.order);
  let extra = [];
  try { extra = readdirSync(src + 'lang').filter((f) => f.endsWith('.mjs')).sort(); } catch { /* no further languages yet */ }
  const homeLinks = {};
  for (const f of extra) {
    const lang = f.replace('.mjs', '');
    const mod = (await import(pathToFileURL(src + 'lang/' + f).href)).default;
    LOCAL[lang] = mod.local;
    homeLinks[lang] = mod.home;
    for (const feature of all) {
      if (!mod[feature.id]) throw new Error(`${f}: no page for ${feature.id}`);
      feature.pages[lang] = mod[feature.id];
    }
  }
  const entries = [];
  for (const feature of all) {
    for (const lang of ORDER.filter((l) => feature.pages[l])) {
      const page = feature.pages[lang];
      const html = render(feature, lang, all);
      const file = out + page.path.slice(1) + '.html';
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      console.log(`  ${page.path}: ${words(html.slice(html.indexOf('<main>'), html.indexOf('</main>')))} words, title ${page.title.length}, description ${page.desc.length}`);
      entries.push({
        loc: BASE + page.path,
        alternates: [
          ...ORDER.filter((l) => feature.pages[l]).map((l) => [l, BASE + feature.pages[l].path]),
          ['x-default', BASE + feature.pages.en.path],
        ],
      });
    }
  }
  return { entries, features: all, homeLinks };
}
