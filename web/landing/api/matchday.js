'use strict';
// Matchday pages (/bundesliga/matchday-11, /de/bundesliga/spieltag-11, …) and
// competition hubs (/bundesliga, /de/bundesliga), rendered from the prediction
// game's own match data: fixtures and results, a table calculated from them,
// form, and BETina's predictions once a match has kicked off. The CDN caches
// each page for a few minutes, so the pages follow the data without a deploy.
//
// vercel.json rewrites the public paths to this function; /sitemap-matchdays.xml
// lists the pages search engines should index (the current matchday and its
// neighbours per competition, older and later ones are reachable but noindex).
const S = require('./_md/strings.js');
const TB = require('./_md/table-strings.js');
const { menu, tgCard, BURGER, MENU_CSS } = require('./_md/menu.js');
const { T } = require('../i18n.js');

const BASE = 'https://betina.geniusbet.com';
const DB = 'https://djnmrvhdklpclbrhxxqs.supabase.co/rest/v1';
// The app's publishable key (same one the web app ships); the tables read here are public.
const KEY = 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';
const WEB = 'https://app.betina.geniusbet.com';
const APPLE = 'https://apps.apple.com/app/betina-ai/id6796780870';
const PLAY = 'https://play.google.com/store/apps/details?id=com.geniusbet.betina&pcampaignid=web_share&referrer=utm_source%3Dbetina_web%26utm_medium%3Dmatchday';
const COMPS = {
  'bundesliga': { code: 'BL1', name: 'Bundesliga' },
  'premier-league': { code: 'PL', name: 'Premier League' },
  'laliga': { code: 'PD', name: 'LaLiga' },
  'serie-a': { code: 'SA', name: 'Serie A' },
  'champions-league': { code: 'CL', name: 'Champions League' },
};
const ORDER = ['en', 'de', 'es', 'fr', 'pt', 'it', 'ro', 'tr', 'hr'];
const LANGS = ORDER.filter((l) => S[l]);
const NAMES = { en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', pt: 'Português', it: 'Italiano', ro: 'Română', tr: 'Türkçe', hr: 'Hrvatski' };
const OG_LOCALE = { en: 'en_US', de: 'de_DE', es: 'es_ES', fr: 'fr_FR', pt: 'pt_PT', it: 'it_IT', ro: 'ro_RO', tr: 'tr_TR', hr: 'hr_HR' };
const EN_UI = { ckText: "We'd like to use cookies for anonymous usage statistics.", ckNo: 'Essential only', ckYes: 'Accept all', navSupport: 'Support', navWeb: 'Web app →', storeApple: 'Download on the', storeGoogle: 'Get it on', fPrivacy: 'Privacy', fTerms: 'Terms', fDelete: 'Delete account', fContact: 'Contact',
  fFine: '18+ only. BETina is an AI companion for sports fans and entertainment. No real money is wagered or moved in the app.' };
const ui = (lang, key) => (lang !== 'en' && T[lang] && T[lang][key]) || EN_UI[key];

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (all, k) => (vars[k] == null ? all : vars[k]));
const mdl = (L, n) => (n === 1 && L.md1) || fill(L.md, { n });
const home = (lang) => (lang === 'en' ? '/' : `/${lang}`);
const path = (lang, comp, n) => `${lang === 'en' ? '' : `/${lang}`}/${comp}${n ? `/${S[lang].slug}-${n}` : ''}`;
const tablePath = (lang, comp) => `${lang === 'en' ? '' : `/${lang}`}/${comp}/${TB[lang].slug}`;
const DONE = new Set(['FINISHED', 'AWARDED']);
const OFF = new Set(['POSTPONED', 'CANCELLED', 'SUSPENDED']);
const RUNNING = new Set(['IN_PLAY', 'PAUSED']);

// ---- data -------------------------------------------------------------------
const cache = new Map();
async function db(query) {
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  const res = await fetch(`${DB}/${query}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`data ${res.status}`);
  const data = await res.json();
  cache.set(query, { at: Date.now(), data });
  return data;
}

async function load(code) {
  const [comp] = await db(`tip_competitions?code=eq.${code}&select=code,name,current_season,current_matchday`);
  if (!comp) return null;
  const rows = await db(`tip_matches?competition=eq.${code}&season=eq.${comp.current_season}&matchday=not.is.null`
    + '&select=id,matchday,stage,kickoff,status,home_team_id,home_short,home_name,home_tla,away_team_id,away_short,away_name,away_tla,home_score,away_score,updated_at,betina_tips(home,away,points)'
    + '&order=kickoff&limit=1000');
  // Champions League: the league phase has matchdays and one table; knockout rounds are left out.
  const matches = rows.filter((m) => code !== 'CL' || m.stage === 'LEAGUE_STAGE').map((m) => {
    const t = Array.isArray(m.betina_tips) ? m.betina_tips[0] : m.betina_tips;
    return { ...m, tip: t || null, home: m.home_short || m.home_name, away: m.away_short || m.away_name, done: DONE.has(m.status) && m.home_score != null };
  });
  const days = new Map();
  for (const m of matches) { if (!days.has(m.matchday)) days.set(m.matchday, []); days.get(m.matchday).push(m); }
  const numbers = [...days.keys()].sort((a, b) => a - b);
  const state = (n) => {
    const list = days.get(n).filter((m) => !OFF.has(m.status));
    const done = list.filter((m) => m.done).length;
    if (list.length && done === list.length) return 'finished';
    if (done > 0 || list.some((m) => RUNNING.has(m.status))) return 'live';
    return 'upcoming';
  };
  // The matchday in focus: the first one that still has at least half of its matches to play.
  let focus = numbers[numbers.length - 1];
  for (const n of numbers) {
    const list = days.get(n).filter((m) => !OFF.has(m.status));
    if (list.filter((m) => !m.done).length * 2 >= list.length && list.length) { focus = n; break; }
  }
  return { comp, season: comp.current_season, matches, days, numbers, state, focus };
}

async function trend(code, season, n) {
  const key = `trend:${code}:${season}:${n}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  let data = new Map();
  try {
    const res = await fetch(`${DB}/rpc/tip_matchday_trend`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_competition: code, p_season: season, p_matchday: n }) });
    if (res.ok) data = new Map((await res.json()).map((r) => [r.match_id, r]));
  } catch (err) { /* the page works without the trend */ }
  cache.set(key, { at: Date.now(), data });
  return data;
}

function table(matches, upTo, side) {
  const teams = new Map();
  const row = (id, name, tla) => {
    if (!teams.has(id)) teams.set(id, { id, name, tla, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] });
    return teams.get(id);
  };
  for (const m of matches) { row(m.home_team_id, m.home, m.home_tla); row(m.away_team_id, m.away, m.away_tla); }
  for (const m of matches.filter((x) => x.done && x.matchday <= upTo)) {
    // `side` counts a match only for the home team ('home') or only for the away team ('away').
    const blank = () => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] });
    const h = side === 'away' ? blank() : teams.get(m.home_team_id), a = side === 'home' ? blank() : teams.get(m.away_team_id);
    h.p++; a.p++; h.gf += m.home_score; h.ga += m.away_score; a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.w++; a.l++; h.pts += 3; h.form.push('W'); a.form.push('L'); }
    else if (m.home_score < m.away_score) { a.w++; h.l++; a.pts += 3; a.form.push('W'); h.form.push('L'); }
    else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('D'); a.form.push('D'); }
  }
  const list = [...teams.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.name.localeCompare(y.name));
  list.forEach((t, i) => { t.pos = i + 1; t.form = t.form.slice(-5); });
  return list;
}

// ---- page parts -------------------------------------------------------------
const CSS = `
@font-face{font-family:'Archivo Fallback';src:local('Arial');size-adjust:97.5%}
@font-face{font-family:'Archivo';font-style:italic;font-weight:900;font-display:swap;src:url(/assets/fonts/archivo-italic-900-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF}
@font-face{font-family:'Archivo';font-style:italic;font-weight:900;font-display:swap;src:url(/assets/fonts/archivo-italic-900-latin.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
@font-face{font-family:'Archivo';font-style:normal;font-weight:400 900;font-display:swap;src:url(/assets/fonts/archivo-variable-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF}
@font-face{font-family:'Archivo';font-style:normal;font-weight:400 900;font-display:swap;src:url(/assets/fonts/archivo-variable-latin.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
:root{--lime:#B8E926;--lime-ink:#10120A;--violet:#8B5CF6;--bg:#0D0B11;--surface:#14111A;--raised:#1B1723;--line:rgba(242,240,245,.10);--text:#F2F0F5;--soft:#CFC9DA;--muted:#A29AAF;--gutter:28px;--max:1100px;--ease:cubic-bezier(.2,.8,.2,1)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Archivo','Archivo Fallback',system-ui,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%;height:auto}a{color:inherit;text-decoration:none}
.wrap{max-width:var(--max);margin:0 auto;padding:0 var(--gutter)}
.display{font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.025em;line-height:.96;margin:0}
.accent{color:var(--lime)}
.kicker{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--lime)}
.kicker::before{content:'';width:28px;height:2px;background:var(--lime)}
nav{position:fixed;top:0;left:0;right:0;z-index:60;background:rgba(13,11,17,.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
nav .wrap{display:flex;align-items:center;gap:22px;height:68px}
.brand{display:flex;align-items:center;gap:10px}.brand img{width:26px}
.brand b{font-weight:900;font-style:italic;font-size:22px;letter-spacing:-.01em}.brand b span{color:var(--lime)}
.brand small{font-size:10px;font-weight:700;letter-spacing:.16em;color:var(--muted);text-transform:uppercase}
.navlinks{display:flex;gap:24px;margin-left:auto;font-size:14px;font-weight:600;color:var(--soft)}
.navlinks a:hover,.navlinks a[aria-current]{color:var(--lime)}
.langmenu{position:relative;font:700 13px 'Archivo',sans-serif}
.langmenu summary{list-style:none;cursor:pointer;white-space:nowrap;border:1px solid var(--line);padding:8px 12px;background:rgba(255,255,255,.04)}
.langmenu summary::-webkit-details-marker{display:none}.langmenu summary::after{content:' ▾';color:var(--muted)}
.langmenu[open] summary,.langmenu summary:hover{border-color:var(--lime)}
.langmenu div{position:absolute;right:0;top:calc(100% + 6px);min-width:150px;background:var(--surface);border:1px solid var(--line);box-shadow:0 20px 44px rgba(0,0,0,.5);padding:6px 0}
.langmenu a{display:block;padding:8px 14px;color:var(--soft)}.langmenu a:hover{color:var(--lime);background:rgba(255,255,255,.04)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:.02em;font-size:14px;padding:12px 18px;background:var(--lime);color:var(--lime-ink);white-space:nowrap;transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.btn:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 rgba(184,233,38,.35)}
.hero{position:relative;padding:124px 0 46px;overflow:hidden}
.hero::before{content:'';position:absolute;right:-14%;top:-40%;width:60vw;height:60vw;background:radial-gradient(circle,rgba(184,233,38,.12),transparent 62%);pointer-events:none}
.hero .wrap{position:relative}
.crumbs{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 22px}.crumbs a:hover{color:var(--lime)}.crumbs span{margin:0 8px;opacity:.5}
.state{display:inline-block;background:var(--lime);color:var(--lime-ink);font-weight:900;font-style:italic;text-transform:uppercase;font-size:13px;padding:6px 11px;transform:rotate(-3deg);box-shadow:4px 4px 0 rgba(0,0,0,.6)}
.state.live{background:var(--violet);color:#fff}
h1{font-size:clamp(36px,5.4vw,76px);margin:20px 0 26px;overflow-wrap:break-word}h1 span{display:block}
.lead{font-size:18px;color:var(--soft);max-width:800px;margin:0 0 10px}.lead strong{color:var(--text)}
.pager{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.pager a{border:1px solid var(--line);padding:9px 14px;font-weight:700;font-size:14px;color:var(--soft);background:rgba(255,255,255,.03)}
.pager a:hover{border-color:var(--lime);color:var(--lime)}
.sec{padding:64px 0 0}
h2{font-size:clamp(28px,3.8vw,48px);margin:14px 0 22px}
.note{color:var(--muted);font-size:14px;margin:14px 0 0;max-width:800px}
.day{margin:26px 0 10px;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.match{display:grid;grid-template-columns:64px minmax(0,1fr) 84px minmax(0,1fr);align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);padding:14px 18px;margin-top:8px}
.match time{font-weight:800;font-size:14px;color:var(--soft)}
.team{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;min-width:0}
.team.h{justify-content:flex-end;text-align:right}
.team span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tla{flex:none;font-size:11px;font-weight:800;letter-spacing:.06em;padding:4px 6px;background:rgba(255,255,255,.07);color:var(--soft)}
.score{text-align:center;font-weight:900;font-style:italic;font-size:24px;letter-spacing:-.01em}
.score.wait{color:var(--muted);font-size:18px}.score.on{color:var(--violet)}
.score small{display:block;font-style:normal;font-size:10px;letter-spacing:.14em;font-weight:800;text-transform:uppercase;color:var(--violet)}
.tipline{grid-column:1/-1;border-top:1px solid var(--line);margin-top:4px;padding-top:10px;font-size:13px;color:var(--muted);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.tipline b{color:var(--text)}.tipline .p{font-weight:800;padding:2px 8px;background:rgba(255,255,255,.07);color:var(--soft)}
.tipline .p.p3{background:var(--lime);color:var(--lime-ink)}.tipline .p.p2,.tipline .p.p1{background:rgba(184,233,38,.18);color:var(--lime)}
.tblwrap{overflow-x:auto;border:1px solid var(--line);background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{padding:11px 12px;border-bottom:1px solid var(--line);text-align:center;white-space:nowrap}
tr:last-child td{border-bottom:0}
th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:800}
td.t,th.t{text-align:left}td.t{font-weight:700}td.pts{font-weight:900;color:var(--lime)}td.pos{color:var(--muted);font-weight:800}
.form{display:inline-flex;gap:3px}.form i{font-style:normal;font-size:10px;font-weight:800;width:18px;height:18px;line-height:18px;background:rgba(255,255,255,.08);color:var(--soft)}
.form i.W{background:var(--lime);color:var(--lime-ink)}.form i.L{background:rgba(255,90,90,.22);color:#ff9b9b}
.prose{max-width:800px}.prose p{font-size:17px;color:var(--soft);margin:0 0 14px}.prose strong{color:var(--text)}
.cta{margin-top:64px;border:1px solid rgba(184,233,38,.35);background:linear-gradient(120deg,rgba(184,233,38,.10),transparent 60%),var(--surface);padding:40px 36px}
.cta h2{margin-top:0}.cta p{color:var(--soft);font-size:18px;max-width:640px;margin:0 0 24px}
.stores{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.store{display:inline-flex;align-items:center;gap:12px;background:var(--text);color:#000;padding:11px 20px 11px 16px;min-width:190px;transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.store:hover{transform:translate(-3px,-3px);box-shadow:5px 5px 0 var(--lime)}
.store svg{width:26px;height:26px;flex:none}.store span{display:flex;flex-direction:column;line-height:1.1}
.store small{font-size:11px;font-weight:600}.store strong{font-size:18px;font-weight:800;letter-spacing:-.01em}
.more{display:inline-block;margin-top:18px;font-weight:800;color:var(--lime)}.more:hover{text-decoration:underline;text-underline-offset:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.grid a{display:block;border:1px solid var(--line);background:var(--surface);padding:12px 14px;font-weight:700;font-size:14px}
.grid a small{display:block;font-weight:600;color:var(--muted);font-size:12px;margin-top:2px}
.grid a:hover,.grid a[aria-current]{border-color:var(--lime);color:var(--lime)}
.faq{display:grid;grid-template-columns:1fr 1fr;gap:0 50px}
.qa{padding:22px 0 24px;border-top:1px solid var(--line)}.qa h3{margin:0 0 8px;font-size:19px;font-weight:800;line-height:1.25}.qa p{margin:0;color:var(--muted)}
footer{border-top:1px solid var(--line);margin-top:80px;padding:44px 0 56px;color:var(--muted);font-size:14px}
footer .top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:22px;align-items:center;margin-bottom:22px}
footer .links{display:flex;flex-wrap:wrap;gap:12px 22px;font-weight:600;color:var(--soft)}footer .links a:hover{color:var(--lime)}
footer .fine{font-size:13px;max-width:820px;margin:0}
#ck{position:fixed;left:16px;right:16px;bottom:16px;z-index:100;max-width:640px;margin:0 auto;display:none;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;background:rgba(20,17,26,.96);backdrop-filter:blur(12px);border:1px solid rgba(184,233,38,.35);padding:14px 16px;box-shadow:0 20px 50px rgba(0,0,0,.5)}
#ck.show{display:flex}#ck span{font-size:13px;color:var(--soft)}#ck a{color:var(--lime);text-decoration:underline}#ck .row{display:flex;gap:8px}
#ck button{font:800 13px 'Archivo',sans-serif;padding:9px 14px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--text)}#ck button.yes{background:var(--lime);color:var(--lime-ink);border-color:var(--lime)}
@media (max-width:900px){:root{--gutter:20px}.navlinks{display:none}.langmenu{margin-left:auto}.hero{padding-top:100px}.faq{grid-template-columns:1fr}.cta{padding:30px 22px}}
@media (max-width:620px){.brand small{display:none}nav .wrap{gap:10px}.brand b{font-size:19px}nav .btn{padding:9px 10px;font-size:11px}
.match{grid-template-columns:minmax(0,1fr) 70px minmax(0,1fr);padding:12px}.match time{grid-column:1/-1;font-size:12px;color:var(--muted)}
.team{font-size:15px;gap:6px}.tla{display:none}.score{font-size:21px}.store{flex:1 1 100%}th,td{padding:9px 7px;font-size:13px}.hide-s{display:none}}
`;
const APPLE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.7c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.52.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.71-4.14zM13.8 5.06c.71-.86 1.19-2.06 1.06-3.26-1.03.04-2.27.69-3.01 1.55-.66.76-1.24 1.98-1.08 3.16 1.14.09 2.31-.58 3.03-1.45z"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D7FE" d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2z"/><path fill="#FFCE00" d="m17 8.4 3.3 1.9c1 .6 1 2.8 0 3.4L17 15.6 13.4 12z"/><path fill="#FF3A44" d="M17 15.6 13.4 12 3.6 22.2c.4.2.9.2 1.4-.1z"/><path fill="#00F076" d="M5 1.9c-.5-.3-1-.3-1.4-.1L13.4 12 17 8.4z"/></svg>';

function shell({ lang, title, desc, url, alternates, index, ld, body, compSlug }) {
  const L = S[lang];
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${index ? '' : '<meta name="robots" content="noindex, follow">\n'}<meta name="theme-color" content="#0D0B11">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${BASE}/assets/v2/share-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:site_name" content="BETina">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-itunes-app" content="app-id=6796780870">
<link rel="canonical" href="${url}">
${alternates.map(([l, href]) => `<link rel="alternate" hreflang="${l}" href="${href}">`).join('\n')}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-variable-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-italic-900-latin.woff2" crossorigin>
<style>${CSS}
${MENU_CSS}</style>
</head>
<body>
<nav><div class="wrap">
  <a class="brand" href="${home(lang)}" aria-label="BETina"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128"><b>BET<span>INA</span></b><small>by GeniusBet</small></a>
  ${menu(lang, compSlug)}
  <details class="langmenu"><summary aria-label="Language">${lang.toUpperCase()}</summary><div>${alternates.filter(([l]) => l !== lang && l !== 'x-default').map(([l, href]) => `<a href="${href.replace(BASE, '')}" hreflang="${l}" lang="${l}">${NAMES[l]}</a>`).join('')}</div></details>
  <a class="btn" href="${WEB}">${esc(ui(lang, 'navWeb'))}</a>
  ${BURGER}
</div></nav>
<main>
${body}
  <div class="wrap">
    <section class="cta">
      <h2 class="display">${L.ctaH2} <span class="accent">${L.ctaH2b}</span></h2>
      <p>${L.ctaText}</p>
      <div class="stores">
        <a class="store" href="${APPLE}" target="_blank" rel="noopener">${APPLE_SVG}<span><small>${esc(ui(lang, 'storeApple'))}</small><strong>App Store</strong></span></a>
        <a class="store" href="${esc(PLAY)}" target="_blank" rel="noopener">${PLAY_SVG}<span><small>${esc(ui(lang, 'storeGoogle'))}</small><strong>Google Play</strong></span></a>
      </div>
      <a class="more" href="${L.gamePath}">${L.ctaLink}</a>
    </section>
  </div>
</main>
<footer><div class="wrap">
  <div class="top">
    <a class="brand" href="${home(lang)}" aria-label="BETina"><img src="/assets/v2/logo-mark.webp" alt="" width="114" height="128" loading="lazy"><b>BET<span>INA</span></b><small>by GeniusBet</small></a>
    <div class="links">
      ${Object.keys(COMPS).map((c) => `<a href="${path(lang, c)}">${COMPS[c].name}</a>`).join('\n      ')}
      <a href="/privacy">${esc(ui(lang, 'fPrivacy'))}</a><a href="/privacy#terms">${esc(ui(lang, 'fTerms'))}</a><a href="/support">${esc(ui(lang, 'navSupport'))}</a>
      <a href="/delete-account">${esc(ui(lang, 'fDelete'))}</a><a href="mailto:marketing@geniusbet.com">${esc(ui(lang, 'fContact'))}</a>
    </div>
  </div>
  <p class="fine">${esc(ui(lang, 'fFine'))}<br>© 2026 Genius Media London Ltd · Company No. 11133948</p>
</div></footer>
<div id="ck" role="dialog" aria-label="Cookies">
  <span>${esc(ui(lang, 'ckText'))} <a href="/privacy">${esc(ui(lang, 'fPrivacy'))}</a></span>
  <div class="row"><button id="ck-e">${esc(ui(lang, 'ckNo'))}</button><button id="ck-a" class="yes">${esc(ui(lang, 'ckYes'))}</button></div>
</div>
<script>
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
${tgCard(lang)}
</body>
</html>
`;
}

function tableHtml(L, rows) {
  const c = L.cols, long = L.colsLong;
  return `<div class="tblwrap"><table>
  <thead><tr><th>${c.pos}</th><th class="t">${c.team}</th><th title="${esc(long.p)}">${c.p}</th><th title="${esc(long.w)}">${c.w}</th><th title="${esc(long.d)}">${c.d}</th><th title="${esc(long.l)}">${c.l}</th><th class="hide-s" title="${esc(long.goals)}">${c.goals}</th><th title="${esc(long.diff)}">${c.diff}</th><th title="${esc(long.pts)}">${c.pts}</th><th class="hide-s" title="${esc(long.form)}">${c.form}</th></tr></thead>
  <tbody>
${rows.map((t) => `  <tr><td class="pos">${t.pos}</td><td class="t">${esc(t.name)}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td class="hide-s">${t.gf}:${t.ga}</td><td>${t.gf - t.ga > 0 ? '+' : ''}${t.gf - t.ga}</td><td class="pts">${t.pts}</td><td class="hide-s"><span class="form">${t.form.map((f) => `<i class="${f}">${L.formLetters[f]}</i>`).join('')}</span></td></tr>`).join('\n')}
  </tbody>
</table></div>`;
}

const seasonLabel = (s) => `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
function dates(L, list) {
  const day = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', timeZone: L.tz });
  const key = new Intl.DateTimeFormat('en-CA', { timeZone: L.tz });
  const sorted = list.filter((m) => !OFF.has(m.status)).map((m) => new Date(m.kickoff)).sort((a, b) => a - b);
  const pick = sorted.length ? sorted : list.map((m) => new Date(m.kickoff));
  const from = pick[0], to = pick[pick.length - 1];
  return { from: day.format(from), to: day.format(to), oneDay: key.format(from) === key.format(to) };
}

function betinaRecord(matches) {
  const scored = matches.filter((m) => m.done && m.tip && m.tip.points != null);
  return { n: scored.length, p: scored.reduce((s, m) => s + m.tip.points, 0), exact: scored.filter((m) => m.tip.points === 3).length };
}

function matchdayPage(lang, compSlug, d, n, crowd) {
  const L = S[lang];
  const comp = COMPS[compSlug].name;
  const md = mdl(L, n);
  const list = d.days.get(n);
  const state = d.state(n);
  const season = seasonLabel(d.season);
  const when = dates(L, list);
  const played = list.filter((m) => m.done);
  const rows = table(d.matches, state === 'finished' ? n : Infinity);
  const pos = new Map(rows.map((t) => [t.id, t.pos]));
  const hasTable = rows.some((t) => t.p > 0);
  const goals = played.reduce((s, m) => s + m.home_score + m.away_score, 0);
  const vars = { comp, md, season, count: list.length, done: played.length, from: when.from, to: when.to, goals, tz: L.tzLabel, gameName: L.gameName,
    avg: played.length ? (goals / played.length).toLocaleString(L.locale, { maximumFractionDigits: 1 }) : 0,
    hw: played.filter((m) => m.home_score > m.away_score).length, dr: played.filter((m) => m.home_score === m.away_score).length, aw: played.filter((m) => m.home_score < m.away_score).length };

  // Intro: facts of this matchday only.
  const intro = [];
  if (state === 'finished') {
    intro.push(fill(L.introFinished, vars));
    const big = [...played].sort((a, b) => Math.abs(b.home_score - b.away_score) - Math.abs(a.home_score - a.away_score) || (b.home_score + b.away_score) - (a.home_score + a.away_score))[0];
    if (big && big.home_score !== big.away_score) {
      const homeWon = big.home_score > big.away_score;
      intro.push(fill(L.introBiggest, { winner: esc(homeWon ? big.home : big.away), loser: esc(homeWon ? big.away : big.home),
        score: homeWon ? `${big.home_score}${L.sep}${big.away_score}` : `${big.away_score}${L.sep}${big.home_score}` }));
    }
    if (hasTable) intro.push(fill(L.introLeader, { leader: esc(rows[0].name), pts: rows[0].pts }));
  } else {
    intro.push(fill(state === 'live' ? L.introLive : (when.oneDay ? L.introUpcomingOneDay : L.introUpcoming), vars));
    if (hasTable) {
      const top = [...list].sort((a, b) => (pos.get(a.home_team_id) + pos.get(a.away_team_id)) - (pos.get(b.home_team_id) + pos.get(b.away_team_id)))[0];
      if (state === 'upcoming' && top) intro.push(fill(L.introTop, { home: esc(top.home), away: esc(top.away), posHome: fill(L.ord, { n: pos.get(top.home_team_id) }), posAway: fill(L.ord, { n: pos.get(top.away_team_id) }) }));
      intro.push(fill(L.introLeaderNow, { leader: esc(rows[0].name), pts: rows[0].pts }));
    }
  }

  // Fixtures, grouped by day in the language's time zone.
  const dayFmt = new Intl.DateTimeFormat(L.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: L.tz });
  const timeFmt = new Intl.DateTimeFormat(L.locale, { hour: '2-digit', minute: '2-digit', timeZone: L.tz });
  let last = '';
  const fixtures = list.map((m) => {
    const when2 = new Date(m.kickoff), dayName = dayFmt.format(when2);
    const head = dayName !== last ? `<p class="day">${esc(dayName)}</p>\n` : '';
    last = dayName;
    const running = RUNNING.has(m.status);
    const score = OFF.has(m.status) ? `<div class="score wait">${m.status === 'CANCELLED' ? L.cancelled : L.postponed}</div>`
      : (m.done || (running && m.home_score != null)) ? `<div class="score${running ? ' on' : ''}">${running ? `<small>${L.live}</small>` : ''}${m.home_score}${L.sep}${m.away_score}</div>`
      : '<div class="score wait">–</div>';
    const started = when2 <= new Date();
    const tip = m.tip ? `<b>${L.tip}:</b> ${m.tip.home}${L.sep}${m.tip.away}${m.done && m.tip.points != null ? ` <span class="p p${m.tip.points}">${fill(L.pts, { p: m.tip.points })}</span>` : ''}`
      : (!started && !OFF.has(m.status) ? esc(L.tipHidden) : '');
    const c = crowd.get(m.id);
    const pct = (x) => Math.round((x / c.players) * 100);
    const crowdLine = c ? `<div class="tipline"><b>${L.crowd}:</b> ${fill(L.crowdSplit, { h: pct(c.home_wins), d: pct(c.draws), a: pct(c.away_wins) })} · ${fill(L.crowdTop, { score: `${c.top_home}${L.sep}${c.top_away}` })} · ${fill(L.crowdN, { n: c.players })}</div>` : '';
    return `${head}<div class="match"><time datetime="${m.kickoff}">${timeFmt.format(when2)}</time>
  <div class="team h"><span>${esc(m.home)}</span>${m.home_tla ? `<i class="tla" aria-hidden="true">${esc(m.home_tla)}</i>` : ''}</div>${score}
  <div class="team">${m.away_tla ? `<i class="tla" aria-hidden="true">${esc(m.away_tla)}</i>` : ''}<span>${esc(m.away)}</span></div>${tip ? `\n  <div class="tipline">${tip}</div>` : ''}${crowdLine}</div>`;
  }).join('\n');

  const rec = betinaRecord(list), all = betinaRecord(d.matches);
  const i = d.numbers.indexOf(n), prev = d.numbers[i - 1], next = d.numbers[i + 1];
  const url = BASE + path(lang, compSlug, n);
  const alternates = [...LANGS.map((l) => [l, BASE + path(l, compSlug, n)]), ['x-default', BASE + path('en', compSlug, n)]];
  const title = fill(L.title, vars);
  const desc = fill(state === 'finished' ? L.descFinished : state === 'live' ? L.descLive : L.descUpcoming, vars);
  const lastmod = list.map((m) => m.updated_at).filter(Boolean).sort().pop();
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description: desc, inLanguage: lang, isPartOf: { '@id': `${BASE}/#website` }, publisher: { '@id': `${BASE}/#org` }, ...(lastmod ? { dateModified: lastmod } : {}) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) },
      { '@type': 'ListItem', position: 2, name: comp, item: BASE + path(lang, compSlug) },
      { '@type': 'ListItem', position: 3, name: md, item: url } ] },
    { '@type': 'ItemList', name: `${comp} ${md}`, itemListElement: list.map((m, k) => ({ '@type': 'ListItem', position: k + 1, item: {
      '@type': 'SportsEvent', name: `${m.home} – ${m.away}`, startDate: m.kickoff, sport: 'Football',
      eventStatus: OFF.has(m.status) ? 'https://schema.org/EventPostponed' : 'https://schema.org/EventScheduled',
      homeTeam: { '@type': 'SportsTeam', name: m.home_name }, awayTeam: { '@type': 'SportsTeam', name: m.away_name } } })) },
  ] };

  const body = `  <header class="hero"><div class="wrap">
    <p class="crumbs"><a href="${home(lang)}">${L.crumbHome}</a><span>/</span><a href="${path(lang, compSlug)}">${comp}</a><span>/</span>${md}</p>
    <span class="state${state === 'live' ? ' live' : ''}">${season} · ${L.mdState[state]}</span>
    <h1 class="display"><span>${comp}, ${md}:</span><span class="accent">${L.h1b}</span></h1>
    ${intro.map((p) => `<p class="lead">${p}</p>`).join('\n    ')}
    <div class="pager">${prev ? `<a href="${path(lang, compSlug, prev)}" rel="prev">${fill(L.prev, { md: mdl(L, prev) })}</a>` : ''}<a href="${path(lang, compSlug)}">${L.allMd}</a>${next ? `<a href="${path(lang, compSlug, next)}" rel="next">${fill(L.next, { md: mdl(L, next) })}</a>` : ''}</div>
  </div></header>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} · ${md}</span><h2 class="display">${L.fixturesH2} <span class="accent">${L.fixturesH2b}</span></h2>
${fixtures}
    <p class="note">${fill(L.times, vars)}</p>
  </div></section>
${hasTable ? `
  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${L.tableH2} <span class="accent">${state === 'finished' ? fill(L.tableAfter, { md }) : L.tableNow}</span></h2>
    ${tableHtml(L, rows)}
    <p class="note">${L.tableNote}</p>
  </div></section>` : ''}

  <section class="sec"><div class="wrap">
    <span class="kicker">${L.gameName}</span><h2 class="display">${L.betinaH2} <span class="accent">${L.betinaH2b}</span></h2>
    <div class="prose">
      <p>${fill(L.betinaText, vars)}</p>
      ${rec.n ? `<p><strong>${fill(L.betinaMd, rec)}</strong></p>` : ''}
      ${all.n ? `<p>${fill(L.betinaSeason, { ...all, comp })}</p>` : ''}
      <p>${crowd.size ? L.crowdText : L.crowdNone}</p>
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">FAQ</span><h2 class="display">${L.faqH2} <span class="accent">${L.faqH2b}</span></h2>
    <div class="faq">
      <div class="qa"><h3>${fill(L.q1, vars)}</h3><p>${fill(when.oneDay ? L.a1One : L.a1, vars)}</p></div>
      <div class="qa"><h3>${L.q3}</h3><p>${L.a3}</p></div>
      <div class="qa"><h3>${L.q2}</h3><p>${L.a2}</p></div>
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${L.allMd}</h2>
    <div class="grid">${d.numbers.map((k) => `<a href="${path(lang, compSlug, k)}"${k === n ? ' aria-current="page"' : ''}>${mdl(L, k)}<small>${L.mdState[d.state(k)]}</small></a>`).join('')}</div>
  </div></section>
`;
  return shell({ lang, title, desc, url, alternates, index: Math.abs(n - d.focus) <= 1, ld, body, compSlug });
}

function hubPage(lang, compSlug, d) {
  const L = S[lang];
  const comp = COMPS[compSlug].name, season = seasonLabel(d.season);
  const rows = table(d.matches, Infinity);
  const all = betinaRecord(d.matches);
  const done = d.matches.filter((m) => m.done).length;
  const vars = { comp, season, done, total: d.matches.length, gameName: L.gameName };
  const url = BASE + path(lang, compSlug);
  const alternates = [...LANGS.map((l) => [l, BASE + path(l, compSlug)]), ['x-default', BASE + path('en', compSlug)]];
  const title = fill(L.hubTitle, vars), desc = fill(L.hubDesc, vars);
  const dayFmt = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'short', timeZone: L.tz });
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: title, description: desc, inLanguage: lang, isPartOf: { '@id': `${BASE}/#website` }, publisher: { '@id': `${BASE}/#org` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) },
      { '@type': 'ListItem', position: 2, name: comp, item: url } ] },
  ] };
  const focusMd = mdl(L, d.focus);
  const body = `  <header class="hero"><div class="wrap">
    <p class="crumbs"><a href="${home(lang)}">${L.crumbHome}</a><span>/</span>${comp}</p>
    <span class="state">${season}</span>
    <h1 class="display"><span>${comp} ${season}:</span><span class="accent">${L.hubH1b}</span></h1>
    <p class="lead">${fill(L.hubIntro, vars)}</p>
    ${rows.some((t) => t.p > 0) ? `<p class="lead">${fill(L.introLeaderNow, { leader: esc(rows[0].name), pts: rows[0].pts })}</p>` : ''}
    <div class="pager"><a href="${path(lang, compSlug, d.focus)}">${fill(L.next, { md: focusMd })}</a><a href="${tablePath(lang, compSlug)}">${fill(TB[lang].link, { comp })} →</a></div>
  </div></header>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${L.tableH2} <span class="accent">${L.tableNow}</span></h2>
    ${tableHtml(L, rows)}
    <p class="note">${L.tableNote} <a href="${tablePath(lang, compSlug)}">${fill(TB[lang].link, { comp })} →</a></p>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${L.allMd}</h2>
    <div class="grid">${d.numbers.map((k) => { const w = dates(L, d.days.get(k)); const first = d.days.get(k)[0]; return `<a href="${path(lang, compSlug, k)}"${k === d.focus ? ' aria-current="true"' : ''}>${mdl(L, k)}<small>${dayFmt.format(new Date(first.kickoff))} · ${L.mdState[d.state(k)]}</small></a>`; }).join('')}</div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">${L.gameName}</span><h2 class="display">${L.betinaH2} <span class="accent">${L.betinaH2b}</span></h2>
    <div class="prose">
      <p>${fill(L.betinaText, vars)}</p>
      ${all.n ? `<p><strong>${fill(L.betinaSeason, { ...all, comp })}</strong></p>` : ''}
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">BETina</span><h2 class="display">${L.other}</h2>
    <div class="grid">${Object.keys(COMPS).filter((c) => c !== compSlug).map((c) => `<a href="${path(lang, c)}">${COMPS[c].name}</a>`).join('')}</div>
  </div></section>
`;
  return shell({ lang, title, desc, url, alternates, index: true, ld, body, compSlug });
}

/** Number and its word, for languages where the word changes with the number. */
function count(T, n) {
  if (n === 1) return `1 ${T.point}`;
  if (T.few && n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return `${n} ${T.few}`;
  if (T.many && (n % 100 >= 20 || n % 100 === 0)) return `${n} ${T.many}`;
  return `${n} ${T.points}`;
}

/** The league table as a page of its own: overall, home and away, with what stands out. */
function tablePage(lang, compSlug, d) {
  const L = S[lang], T = TB[lang];
  const comp = COMPS[compSlug].name, season = seasonLabel(d.season);
  const rows = table(d.matches, Infinity);
  const homeRows = table(d.matches, Infinity, 'home'), awayRows = table(d.matches, Infinity, 'away');
  const started = rows.some((t) => t.p > 0);
  const done = d.matches.filter((m) => m.done).length;
  const date = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: L.tz }).format(new Date());
  const first = rows[0], second = rows[1];
  const gap = started && second ? first.pts - second.pts : 0;
  const vars = { comp, season, leader: started ? esc(first.name) : '', second: second ? esc(second.name) : '', pts: started ? first.pts : 0,
    ptsW: started ? count(T, first.pts) : '', played: started ? first.p : 0, gap: count(T, gap), date, done, total: d.matches.length };
  const url = BASE + tablePath(lang, compSlug);
  const alternates = [...LANGS.map((l) => [l, BASE + tablePath(l, compSlug)]), ['x-default', BASE + tablePath('en', compSlug)]];
  const title = fill(T.title, vars), desc = fill(T.desc, vars);
  const faq = [[fill(T.q1, vars), started ? fill(T.a1, vars) : fill(T.leadPre, vars)], [fill(T.q2, vars), T.a2], [T.q3, T.a3]];
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description: desc, inLanguage: lang, isPartOf: { '@id': `${BASE}/#website` }, publisher: { '@id': `${BASE}/#org` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BETina', item: BASE + home(lang) },
      { '@type': 'ListItem', position: 2, name: comp, item: BASE + path(lang, compSlug) },
      { '@type': 'ListItem', position: 3, name: fill(T.link, vars), item: url } ] },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: String(a).replace(/<[^>]+>/g, '') } })) },
  ] };
  const best = (list, by) => list.filter((t) => t.p > 0).sort(by)[0];
  const attack = best(rows, (a, b) => b.gf - a.gf), defence = best(rows, (a, b) => a.ga - b.ga || b.p - a.p);
  const formPts = (t) => t.form.reduce((n, f) => n + (f === 'W' ? 3 : f === 'D' ? 1 : 0), 0);
  const form = best(rows, (a, b) => formPts(b) - formPts(a) || a.pos - b.pos);
  const body = `  <header class="hero"><div class="wrap">
    <p class="crumbs"><a href="${home(lang)}">${L.crumbHome}</a><span>/</span><a href="${path(lang, compSlug)}">${comp}</a><span>/</span>${fill(T.link, vars)}</p>
    <span class="state">${season}</span>
    <h1 class="display"><span>${fill(T.h1a, vars)}</span><span class="accent">${T.h1b}</span></h1>
    <p class="lead">${started ? fill(gap > 0 ? T.lead : T.leadLevel, vars) : fill(T.leadPre, vars)}</p>
    <div class="pager"><a href="${path(lang, compSlug, d.focus)}">${fill(L.next, { md: mdl(L, d.focus) })}</a><a href="${path(lang, compSlug)}">${T.toHub}</a></div>
  </div></header>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${L.tableH2} <span class="accent">${L.tableNow}</span></h2>
    ${tableHtml(L, rows)}
    <p class="note">${fill(T.stand, vars)}</p>
  </div></section>
${started ? `
  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${T.factsH2} <span class="accent">${T.factsH2b}</span></h2>
    <div class="prose">
      <p>${fill(T.attack, { team: esc(attack.name), n: attack.gf })}</p>
      <p>${fill(T.defence, { team: esc(defence.name), n: defence.ga })}</p>
      <p>${fill(T.form, { team: esc(form.name), n: formPts(form) })}</p>
      <p>${T.how}</p>
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${T.homeH2} <span class="accent">${T.homeH2b}</span></h2>
    ${tableHtml(L, homeRows)}
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">${comp} ${season}</span><h2 class="display">${T.awayH2} <span class="accent">${T.awayH2b}</span></h2>
    ${tableHtml(L, awayRows)}
  </div></section>
` : ''}
  <section class="sec"><div class="wrap">
    <span class="kicker">${comp}</span><h2 class="display">${T.faqH2} <span class="accent">${T.faqH2b}</span></h2>
    <div class="faq">${faq.map(([q, a]) => `<div class="qa"><h3>${q}</h3><p>${a}</p></div>`).join('')}</div>
  </div></section>

  <section class="sec"><div class="wrap">
    <span class="kicker">BETina</span><h2 class="display">${T.otherH2} <span class="accent">${T.otherH2b}</span></h2>
    <div class="grid">${Object.keys(COMPS).filter((c) => c !== compSlug).map((c) => `<a href="${tablePath(lang, c)}">${fill(T.link, { comp: COMPS[c].name })}</a>`).join('')}</div>
  </div></section>
`;
  return shell({ lang, title, desc, url, alternates, index: true, ld, body, compSlug });
}

async function sitemap() {
  const out = [];
  for (const slug of Object.keys(COMPS)) {
    const d = await load(COMPS[slug].code);
    if (!d) continue;
    const pages = [null, ...d.numbers.filter((n) => Math.abs(n - d.focus) <= 1)];
    {
      const mod = d.matches.map((m) => m.updated_at).filter(Boolean).sort().pop();
      const alt = [...LANGS.map((l) => [l, BASE + tablePath(l, slug)]), ['x-default', BASE + tablePath('en', slug)]]
        .map(([l, href]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`).join('\n');
      for (const l of LANGS) out.push(`  <url>\n    <loc>${BASE}${tablePath(l, slug)}</loc>\n${mod ? `    <lastmod>${mod.slice(0, 10)}</lastmod>\n` : ''}${alt}\n  </url>`);
    }
    for (const n of pages) {
      const mod = (n ? d.days.get(n) : d.matches).map((m) => m.updated_at).filter(Boolean).sort().pop();
      const alt = [...LANGS.map((l) => [l, BASE + path(l, slug, n)]), ['x-default', BASE + path('en', slug, n)]]
        .map(([l, href]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`).join('\n');
      for (const l of LANGS) out.push(`  <url>\n    <loc>${BASE}${path(l, slug, n)}</loc>\n${mod ? `    <lastmod>${mod.slice(0, 10)}</lastmod>\n` : ''}${alt}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${out.join('\n')}\n</urlset>\n`;
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.end('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | BETina</title><body style="background:#0D0B11;color:#F2F0F5;font-family:system-ui;padding:40px"><h1>This page is offside.</h1><p><a style="color:#B8E926" href="/">BETina home</a></p>');
}

module.exports = async function matchday(req, res) {
  try {
    const q = new URL(req.url, BASE).searchParams;
    if (q.get('sitemap')) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
      return res.end(await sitemap());
    }
    const lang = q.get('lang') || 'en', compSlug = q.get('comp'), md = q.get('md');
    if (!S[lang] || !COMPS[compSlug]) return notFound(res);
    const d = await load(COMPS[compSlug].code);
    if (!d || !d.numbers.length) return notFound(res);
    let html;
    if (md && md === TB[lang].slug) html = tablePage(lang, compSlug, d);
    else if (md) {
      const m = new RegExp(`^${S[lang].slug}-(\\d{1,2})$`).exec(md);
      const n = m ? Number(m[1]) : NaN;
      if (!d.days.has(n)) return notFound(res);
      html = matchdayPage(lang, compSlug, d, n, await trend(COMPS[compSlug].code, d.season, n));
    } else html = hubPage(lang, compSlug, d);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.end(html);
  } catch (err) {
    console.error(err);
    res.statusCode = 503;
    res.setHeader('Retry-After', '120');
    res.setHeader('Cache-Control', 'no-store');
    res.end('Temporarily unavailable');
  }
};
