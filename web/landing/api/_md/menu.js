// The site menu, shared by the home pages, the feature pages and the matchday pages.
// Desktop: a bar with a drop-down for the leagues. Phones: a button that opens the full list.
const { T } = require('../../i18n.js');

const EN = {
  mGame: 'Prediction game', mLive: 'Live scores', mChat: 'AI chat', mLeagues: 'Leagues', mMenu: 'Menu',
  navFeatures: 'Features', navSupport: 'Support', fPrivacy: 'Privacy', navWeb: 'Web app →',
  hrefGame: '/prediction-game', hrefLive: '/live-scores', hrefChat: '/ai-sports-chat',
};
const COMPS = [['bundesliga', 'Bundesliga'], ['premier-league', 'Premier League'], ['laliga', 'LaLiga'], ['serie-a', 'Serie A'], ['champions-league', 'Champions League']];
const WEB = 'https://app.betina.geniusbet.com';
const t = (lang, key) => (lang !== 'en' && T[lang] && T[lang][key]) || EN[key];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * @param lang    page language
 * @param current 'game' | 'live' | 'chat' | a competition slug | ''
 * @param attrs   true for the English home page, whose texts and links are swapped in the browser
 */
function menu(lang, current = '', attrs = false) {
  const here = (id) => (id === current ? ' aria-current="page"' : '');
  const text = (key) => (attrs ? ` data-i="${key}"` : '');
  const feature = (id, label, href) =>
    `<a href="${t(lang, href)}"${text(label)}${attrs ? ` data-i-href="${href}"` : ''}${here(id)}>${esc(t(lang, label))}</a>`;
  const comp = ([slug, name]) =>
    `<a href="${lang === 'en' ? '' : '/' + lang}/${slug}"${attrs ? ` data-comp="${slug}"` : ''}${here(slug)}>${name}</a>`;
  return `<div class="menu" id="menu">
      <span class="grp"${text('navFeatures')}>${esc(t(lang, 'navFeatures'))}</span>
      ${feature('game', 'mGame', 'hrefGame')}
      ${feature('live', 'mLive', 'hrefLive')}
      ${feature('chat', 'mChat', 'hrefChat')}
      <div class="sub"><span tabindex="0"${text('mLeagues')}>${esc(t(lang, 'mLeagues'))}</span><div class="drop"><div>${COMPS.map(comp).join('')}</div></div></div>
      <a class="gap" href="/support"${text('navSupport')}>${esc(t(lang, 'navSupport'))}</a>
      <a class="m-only" href="/privacy"${text('fPrivacy')}>${esc(t(lang, 'fPrivacy'))}</a>
      <a class="btn m-only" href="${WEB}"${text('navWeb')}>${esc(t(lang, 'navWeb'))}</a>
    </div>`;
}

const BURGER = `<button class="burger" type="button" aria-label="Menu" aria-controls="menu" aria-expanded="false" onclick="var n=this.closest('nav'),o=n.classList.toggle('open');this.setAttribute('aria-expanded',o);document.documentElement.style.overflow=o?'hidden':''"><i></i><i></i><i></i></button>`;

const MENU_CSS = `.menu{display:flex;align-items:center;gap:26px;margin-left:auto;font-size:14px;font-weight:600;color:var(--soft)}
.menu a{white-space:nowrap}
.menu>a:hover,.menu .drop a:hover,.menu a[aria-current],.menu .sub:hover>span,.menu .sub:focus-within>span{color:var(--lime)}
.menu .grp,.menu .m-only{display:none}
.menu .sub{position:relative}
.menu .sub>span{cursor:pointer;white-space:nowrap;outline:0}.menu .sub>span::after{content:' ▾';color:var(--muted)}
.menu .drop{display:none;position:absolute;left:-16px;top:100%;padding-top:16px;min-width:200px}
.menu .drop>div{background:var(--surface);border:1px solid var(--line);box-shadow:0 20px 44px rgba(0,0,0,.5);padding:6px 0}
.menu .sub:hover .drop,.menu .sub:focus-within .drop{display:block}
.menu .drop a{display:block;padding:9px 16px}
.burger{display:none;flex-direction:column;justify-content:center;gap:5px;width:42px;height:38px;padding:0 10px;background:rgba(255,255,255,.04);border:1px solid var(--line);cursor:pointer}
.burger i{display:block;height:2px;background:var(--text);transition:transform .25s,opacity .2s}
nav.open .burger{border-color:var(--lime)}
nav.open .burger i:nth-child(1){transform:translateY(7px) rotate(45deg)}nav.open .burger i:nth-child(2){opacity:0}nav.open .burger i:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
@media (max-width:1040px){
.burger{display:flex}
nav .lang,nav .langmenu{margin-left:auto}
nav.open{background:var(--bg)}
.menu{display:none;position:absolute;left:0;right:0;top:100%;height:calc(100vh - 68px);height:calc(100dvh - 68px);overflow:auto;flex-direction:column;align-items:stretch;gap:0;margin:0;padding:4px var(--gutter) 48px;background:var(--bg);border-top:1px solid var(--line);font-size:19px}
nav.open .menu{display:flex}
.menu .grp,.menu .sub>span{display:block;margin:26px 0 6px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);cursor:default}
.menu .sub>span::after{content:''}
.menu>a,.menu .drop a{display:block;padding:14px 0;border-bottom:1px solid var(--line);color:var(--text);font-weight:700}
.menu .drop{display:block;position:static;padding:0;min-width:0}.menu .drop>div{background:none;border:0;box-shadow:none;padding:0}
.menu .m-only{display:block}.menu>a.gap{margin-top:26px}.menu a[aria-current]{color:var(--lime)}
.menu a.btn{display:flex;margin-top:28px;border:0;padding:15px 18px;color:var(--lime-ink)}
}
@media (max-width:620px){nav .wrap>.btn{display:none}}`;

module.exports = { menu, BURGER, MENU_CSS };
