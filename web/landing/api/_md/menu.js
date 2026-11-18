// The site menu, shared by the home pages, the feature pages and the matchday pages.
// Desktop: a bar with a drop-down for the leagues. Phones: a button that opens the full list.
const { T } = require('../../i18n.js');

const EN = {
  mGame: 'Prediction game', mLive: 'Live scores', mChat: 'AI chat', mLeagues: 'Leagues', mVideos: 'Videos', mMenu: 'Menu',
  navFeatures: 'Features', navSupport: 'Support', fPrivacy: 'Privacy', navWeb: 'Web app →',
  hrefGame: '/prediction-game', hrefLive: '/live-scores', hrefChat: '/ai-sports-chat', hrefVideos: '/videos',
  tgTitle: 'BETina is now on Telegram', tgText: 'Message her directly, whenever you like. 18+ only.', tgBtn: 'Open in Telegram',
};
const TG = 'https://t.me/GeniusBETina_bot';
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
      ${feature('videos', 'mVideos', 'hrefVideos')}
      <a class="gap" href="/support"${text('navSupport')}>${esc(t(lang, 'navSupport'))}</a>
      <a href="${TG}" target="_blank" rel="me noopener">Telegram</a>
      <a class="m-only" href="/privacy"${text('fPrivacy')}>${esc(t(lang, 'fPrivacy'))}</a>
      <a class="btn m-only" href="${WEB}"${text('navWeb')}>${esc(t(lang, 'navWeb'))}</a>
    </div>`;
}

/**
 * A small card that tells visitors BETina is on Telegram. It appears once the page has been
 * scrolled 5 %, never covers the page, waits for the cookie choice and stays away once closed.
 */
function tgCard(lang, attrs = false) {
  const text = (key) => (attrs ? ` data-i="${key}"` : '');
  return `<aside id="tg" aria-label="Telegram">
  <button class="x" type="button" aria-label="Close">×</button>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M21.5 3.5 2.5 11l6 2.2 2.3 6.3 3.2-3.6 4.6 3.4zM9.6 12.7l8-5.5-6.2 6.7-.3 3.1z"/></svg>
  <div><b${text('tgTitle')}>${esc(t(lang, 'tgTitle'))}</b><p${text('tgText')}>${esc(t(lang, 'tgText'))}</p>
  <a class="btn" href="${TG}" target="_blank" rel="noopener"${text('tgBtn')}>${esc(t(lang, 'tgBtn'))}</a></div>
</aside>
<script>
(function () {
  var KEY = 'betina_tg', card = document.getElementById('tg');
  function seen() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  if (!card || seen()) return;
  function check() {
    var d = document.documentElement, max = d.scrollHeight - window.innerHeight;
    if (max <= 0 || window.scrollY / max < 0.05) return;
    var ck = document.getElementById('ck');
    if (ck && ck.classList.contains('show')) return;
    card.classList.add('show');
    window.removeEventListener('scroll', check);
  }
  window.addEventListener('scroll', check, { passive: true });
  card.querySelector('.x').onclick = function () { mark(); card.remove(); };
  card.querySelector('a').addEventListener('click', function () { mark(); card.classList.remove('show'); });
})();
</script>`;
}

const BURGER =`<button class="burger" type="button" aria-label="Menu" aria-controls="menu" aria-expanded="false" onclick="var n=this.closest('nav'),o=n.classList.toggle('open');this.setAttribute('aria-expanded',o);document.documentElement.style.overflow=o?'hidden':''"><i></i><i></i><i></i></button>`;

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
@media (max-width:1240px){
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
@media (max-width:620px){nav .wrap>.btn{display:none}}
#tg{position:fixed;right:20px;bottom:20px;z-index:90;width:340px;max-width:calc(100vw - 24px);display:flex;gap:14px;align-items:flex-start;padding:18px 40px 18px 16px;background:rgba(20,17,26,.97);border:1px solid rgba(184,233,38,.4);box-shadow:0 24px 60px rgba(0,0,0,.6);opacity:0;visibility:hidden;transform:translateY(16px);transition:opacity .35s,transform .35s,visibility .35s}
#tg.show{opacity:1;visibility:visible;transform:none}
#tg svg{flex:none;width:38px;height:38px;padding:8px;background:var(--lime);color:var(--lime-ink)}
#tg b{display:block;font-size:16px;font-weight:800;line-height:1.25;color:var(--text)}
#tg p{margin:5px 0 12px;font-size:13px;line-height:1.45;color:var(--soft)}
#tg .btn{font-size:12px;padding:9px 13px}
#tg .x{position:absolute;top:6px;right:8px;width:30px;height:30px;background:none;border:0;color:var(--muted);font-size:22px;line-height:1;cursor:pointer}#tg .x:hover{color:var(--text)}
@media (max-width:620px){#tg{left:12px;right:12px;bottom:12px;width:auto}}
@media (prefers-reduced-motion:reduce){#tg{transition:none}}`;

module.exports = { menu, tgCard, BURGER, MENU_CSS };
