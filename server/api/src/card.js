// Image cards for BETina's posts on X (goal, full time, poll, time travel,
// news). The social-desk function stores what a card shows in
// social_posts.card; this endpoint only renders a post's stored card, so
// nobody can make BETina-branded images with their own text.
//   GET /v1/social/card/:id.png       -> 1200×675 PNG (X)
//   GET /v1/social/card/:id-4x5.jpg   -> 1080×1350 JPEG (Instagram, Facebook)
import { readFileSync, readdirSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const SUPABASE = 'https://djnmrvhdklpclbrhxxqs.supabase.co';
// The publishable key the apps ship with (public); the RPC returns only cards.
const PUBLISHABLE_KEY = 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';

const W = 1200;
const H = 675;
const C = { bg: '#0D0B11', lime: '#B8E926', violet: '#8B5CF6', text: '#F2F0F5', muted: '#A29AAF', line: '#2A2433', ink: '#0D0B11' };

const asset = (p) => new URL(`../assets/${p}`, import.meta.url);
const FONTS = [
  { name: 'Archivo', data: readFileSync(asset('fonts/Archivo_700Bold.ttf')), weight: 700, style: 'normal' },
  { name: 'Archivo', data: readFileSync(asset('fonts/Archivo_800ExtraBold.ttf')), weight: 800, style: 'normal' },
  { name: 'ArchivoBI', data: readFileSync(asset('fonts/Archivo_900Black_Italic.ttf')), weight: 900, style: 'italic' },
];
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(asset(file)).toString('base64')}`;
const LOGO = dataUrl('logo-mark.png', 'image/png');
/** BETina in different moods (assets/betina/<mood>.jpg, 16:9). */
const MOODS = Object.fromEntries(
  readdirSync(asset('betina')).filter((f) => f.endsWith('.jpg')).map((f) => [f.slice(0, -4), dataUrl(`betina/${f}`, 'image/jpeg')]),
);
export const moods = () => Object.keys(MOODS);

// ── Tiny element helper (satori takes React-like objects) ───────────────────
function h(type, style, ...children) {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  const props = type === 'img' ? { ...style } : { style: { display: 'flex', ...style } };
  if (type !== 'img') props.children = kids.length === 1 ? kids[0] : kids;
  return { type, props };
}
const img = (src, style) => h('img', { src, style });
const glow = (x, y, w, hgt, rgb, a) => h('div', {
  position: 'absolute', left: x, top: y, width: w, height: hgt,
  backgroundImage: `radial-gradient(closest-side, rgba(${rgb},${a}), rgba(${rgb},0))`,
});

/** Long names get smaller type so they fit on one line. */
const fit = (s, base, maxChars) => (s.length <= maxChars ? base : Math.max(Math.round(base * 0.55), Math.round(base * maxChars / s.length)));

function brand(...chips) {
  return h('div', { position: 'absolute', left: 54, top: 44, alignItems: 'center', gap: 12 },
    img(LOGO, { width: 30, height: 34 }),
    h('div', { fontFamily: 'ArchivoBI', fontSize: 30, letterSpacing: -1, color: C.text, marginRight: 8 },
      'BET', h('span', { color: C.lime }, 'INA')),
    ...chips.filter(Boolean).map((c) => chip(c.text, c.live)),
  );
}
// The fonts have no "●", so a live chip gets a drawn dot.
const chip = (text, live) => h('div', {
  alignItems: 'center', gap: 7,
  border: `2px solid ${live ? C.lime : C.line}`, background: live ? C.lime : 'transparent',
  color: live ? C.ink : C.muted, padding: '6px 11px', fontWeight: 800, fontSize: 14, letterSpacing: 1.5,
}, text === 'Live' ? h('div', { width: 9, height: 9, borderRadius: 5, background: C.ink }) : null, text.toUpperCase());
const sticker = (text, lime) => h('div', {
  background: lime ? C.lime : C.violet, color: lime ? C.ink : '#fff', fontWeight: 800, fontSize: 20,
  letterSpacing: 1, padding: '9px 16px', transform: 'rotate(-3deg)',
}, text.toUpperCase());
const foot = (...parts) => h('div', {
  position: 'absolute', left: 54, bottom: 40, fontWeight: 800, fontSize: 15, letterSpacing: 1.5, color: C.muted,
}, ...parts);

/** BETina on the right, fading into the background on the left. */
function photo(mood, left = 380) {
  const src = MOODS[mood] ?? MOODS.zwinkern;
  return [
    img(src, { position: 'absolute', left, top: 0, width: H * 16 / 9, height: H }),
    h('div', { position: 'absolute', left: left - 2, top: 0, width: 420, height: H,
      backgroundImage: `linear-gradient(to right, ${C.bg}, rgba(13,11,17,0.75) 40%, rgba(13,11,17,0))` }),
    h('div', { position: 'absolute', left: 0, top: 0, width: left, height: H, background: C.bg }),
    h('div', { position: 'absolute', left: 0, bottom: 0, width: W, height: 160,
      backgroundImage: 'linear-gradient(to top, rgba(13,11,17,0.85), rgba(13,11,17,0))' }),
  ];
}

function frame(...children) {
  return h('div', { position: 'relative', width: W, height: H, background: C.bg, fontFamily: 'Archivo', color: C.text, overflow: 'hidden' }, ...children);
}
const teamRow = (name, score, { size = 42, color = C.text, bar = C.lime, scoreColor = color } = {}) =>
  h('div', { alignItems: 'center', gap: 14, fontFamily: 'ArchivoBI', fontSize: fit(name, size, 14), letterSpacing: -1, color, textTransform: 'uppercase' },
    h('div', { width: 12, height: size + 4, background: bar, transform: 'skewX(-12deg)' }),
    name,
    score !== undefined ? h('span', { color: scoreColor, marginLeft: 12 }, String(score)) : null);

// ── The cards ────────────────────────────────────────────────────────────────
function goal(c) {
  const scorer = c.side === 1 ? 'away' : 'home';
  return frame(
    glow(-150, 150, 700, 550, '184,233,38', 0.22), glow(520, -150, 700, 700, '139,92,246', 0.4),
    ...photo(c.mood),
    brand({ text: 'Live', live: true }, c.league && { text: c.league }),
    h('div', { position: 'absolute', left: 46, top: 96, fontFamily: 'ArchivoBI', fontSize: 210, letterSpacing: -6, color: C.lime, lineHeight: 1 }, 'GOAL!'),
    h('div', { position: 'absolute', left: 54, top: 320, flexDirection: 'column', gap: 12 },
      teamRow(c.home, c.hs, { color: scorer === 'home' ? C.text : C.muted, bar: scorer === 'home' ? C.lime : C.line, scoreColor: scorer === 'home' ? C.lime : C.muted }),
      teamRow(c.away, c.as, { color: scorer === 'away' ? C.text : C.muted, bar: scorer === 'away' ? C.lime : C.line, scoreColor: scorer === 'away' ? C.lime : C.muted })),
    (c.scorer || c.min) && h('div', { position: 'absolute', left: 54, top: 462, fontWeight: 800, fontSize: 30, gap: 10 },
      c.scorer ?? '', c.min ? h('span', { fontFamily: 'ArchivoBI', color: C.lime }, `${c.min}'`) : null),
    c.tag && h('div', { position: 'absolute', left: 54, top: 530 }, sticker(c.tag)),
  );
}

function result(c) {
  return frame(
    glow(150, 80, 760, 600, '139,92,246', 0.38),
    ...photo(c.mood),
    brand({ text: 'Full time' }, c.league && { text: c.league }),
    h('div', { position: 'absolute', left: 54, top: 120 }, teamRow(c.home, undefined, { size: 46 })),
    h('div', { position: 'absolute', left: 42, top: 178, fontFamily: 'ArchivoBI', fontSize: 240, letterSpacing: -6, lineHeight: 1 },
      String(c.hs), h('span', { color: C.lime }, '–'), String(c.as)),
    h('div', { position: 'absolute', left: 54, top: 432 }, teamRow(c.away, undefined, { size: 46, color: C.muted, bar: C.line })),
    c.tag && h('div', { position: 'absolute', left: 54, top: 520 }, sticker(c.tag, true)),
  );
}

function poll(c) {
  const opt = (t, on) => h('div', { border: `3px solid ${on ? C.lime : C.line}`, padding: '10px 18px', fontWeight: 800, fontSize: fit(t, 22, 14), color: on ? C.text : C.muted }, t);
  return frame(
    glow(-120, 120, 700, 600, '255,140,0', 0.16), glow(480, -120, 700, 700, '139,92,246', 0.4),
    ...photo(c.mood),
    brand({ text: [c.league, c.kickoff].filter(Boolean).join(' · ') || 'Today' }),
    h('div', { position: 'absolute', left: 48, top: 112, flexDirection: 'column', fontFamily: 'ArchivoBI', fontSize: 116, letterSpacing: -4, lineHeight: 0.86 },
      'WHO TAKES', h('span', { color: C.lime }, 'IT?')),
    h('div', { position: 'absolute', left: 54, top: 345, flexDirection: 'column', gap: 6 },
      teamRow(c.home, undefined, { size: 40 }),
      h('div', { fontFamily: 'ArchivoBI', fontSize: 26, color: C.muted, marginLeft: 26 }, 'VS'),
      teamRow(c.away, undefined, { size: 40, bar: C.violet })),
    h('div', { position: 'absolute', left: 54, top: 520, gap: 10 }, opt(c.home, true), opt('Draw', false), opt(c.away, true)),
    foot('VOTE BELOW'),
  );
}

function history(c) {
  const src = MOODS[c.mood] ?? MOODS['zeitreise-1986'];
  return frame(
    img(src, { position: 'absolute', left: 200, top: 0, width: H * 16 / 9, height: H }),
    h('div', { position: 'absolute', left: 198, top: 0, width: 460, height: H,
      backgroundImage: `linear-gradient(to right, ${C.bg}, rgba(13,11,17,0.7) 45%, rgba(13,11,17,0))` }),
    h('div', { position: 'absolute', left: 0, top: 0, width: 200, height: H, background: C.bg }),
    h('div', { position: 'absolute', left: 0, bottom: 0, width: W, height: 200,
      backgroundImage: 'linear-gradient(to top, rgba(13,11,17,0.9), rgba(13,11,17,0))' }),
    brand({ text: c.today ? 'On this day' : 'Time travel', live: true }),
    h('div', { position: 'absolute', left: 44, top: 120, fontFamily: 'ArchivoBI', fontSize: 190, letterSpacing: -6, color: C.lime, lineHeight: 1 }, String(c.year)),
    h('div', { position: 'absolute', left: 54, top: 330, width: 560, fontFamily: 'ArchivoBI', fontSize: fit(c.title, 58, 16), letterSpacing: -1, lineHeight: 0.95, textTransform: 'uppercase' }, c.title),
    c.place && h('div', { position: 'absolute', left: 54, top: 470, width: 520, fontWeight: 700, fontSize: 24, color: C.muted }, c.place),
    h('div', { position: 'absolute', left: 54, top: 540 }, sticker('I was there')),
  );
}

function news(c) {
  const size = c.headline.length > 70 ? 54 : c.headline.length > 45 ? 64 : 76;
  return frame(
    glow(-150, 150, 760, 600, '139,92,246', 0.34),
    ...photo(c.mood),
    brand({ text: 'News', live: true }, c.sport && { text: c.sport }),
    h('div', { position: 'absolute', left: 54, top: 130, width: 640, fontFamily: 'ArchivoBI', fontSize: size, letterSpacing: -2, lineHeight: 0.98, textTransform: 'uppercase' }, c.headline),
    foot('FULL STORY IN THE', h('span', { color: C.lime, marginLeft: 6 }, 'BETINA APP')),
  );
}

const KINDS = { goal, result, poll, history, news };

// ── Portrait 4:5 for Instagram and Facebook (1080×1350) ─────────────────────
// BETina's photo fills the top, the story sits underneath.
const PW = 1080;
const PH = 1350;
const PHOTO_H = 860;

function pframe(mood, fallback, ...children) {
  const src = MOODS[mood] ?? MOODS[fallback];
  const pw = PHOTO_H * 16 / 9;
  return h('div', { position: 'relative', width: PW, height: PH, background: C.bg, fontFamily: 'Archivo', color: C.text, overflow: 'hidden' },
    img(src, { position: 'absolute', left: (PW - pw) / 2, top: 0, width: pw, height: PHOTO_H }),
    h('div', { position: 'absolute', left: 0, top: PHOTO_H - 380, width: PW, height: 382,
      backgroundImage: `linear-gradient(to bottom, rgba(13,11,17,0), rgba(13,11,17,0.8) 55%, ${C.bg})` }),
    h('div', { position: 'absolute', left: 0, top: 0, width: PW, height: 200,
      backgroundImage: 'linear-gradient(to bottom, rgba(13,11,17,0.75), rgba(13,11,17,0))' }),
    ...children);
}
const pbrand = (...chips) => h('div', { position: 'absolute', left: 60, top: 56, alignItems: 'center', gap: 14 },
  img(LOGO, { width: 36, height: 41 }),
  h('div', { fontFamily: 'ArchivoBI', fontSize: 38, letterSpacing: -1, color: C.text, marginRight: 8 }, 'BET', h('span', { color: C.lime }, 'INA')),
  ...chips.filter(Boolean).map((c) => chip(c.text, c.live)));
const pfoot = () => h('div', { position: 'absolute', left: 60, bottom: 56, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: C.muted },
  'FREE APP ·', h('span', { color: C.lime, marginLeft: 8 }, 'LINK IN BIO'));

const PORTRAIT = {
  history: (c) => pframe(c.mood, 'zeitreise-1986',
    pbrand({ text: c.today ? 'On this day' : 'Time travel', live: true }),
    h('div', { position: 'absolute', left: 50, top: 700, fontFamily: 'ArchivoBI', fontSize: 230, letterSpacing: -8, color: C.lime, lineHeight: 1 }, String(c.year)),
    h('div', { position: 'absolute', left: 60, top: 940, width: 960, fontFamily: 'ArchivoBI', fontSize: fit(c.title, 84, 18), letterSpacing: -2, lineHeight: 0.95, textTransform: 'uppercase' }, c.title),
    c.place && h('div', { position: 'absolute', left: 60, top: 1090, width: 900, fontWeight: 700, fontSize: 30, color: C.muted }, c.place),
    h('div', { position: 'absolute', right: 60, bottom: 50 }, sticker('I was there')),
    pfoot()),
  result: (c) => pframe(c.mood, 'jubel',
    pbrand({ text: 'Full time' }, c.league && { text: c.league }),
    h('div', { position: 'absolute', left: 60, top: 720, width: 960, flexDirection: 'column', gap: 6 },
      teamRow(c.home, undefined, { size: 56 }),
      h('div', { fontFamily: 'ArchivoBI', fontSize: 250, letterSpacing: -8, lineHeight: 1, marginLeft: -10 },
        String(c.hs), h('span', { color: C.lime }, '–'), String(c.as)),
      teamRow(c.away, undefined, { size: 56, color: C.muted, bar: C.line })),
    c.tag && h('div', { position: 'absolute', right: 60, bottom: 50 }, sticker(c.tag, true)),
    pfoot()),
  news: (c) => {
    const size = c.headline.length > 70 ? 66 : c.headline.length > 45 ? 78 : 92;
    return pframe(c.mood, 'studio',
      pbrand({ text: 'News', live: true }, c.sport && { text: c.sport }),
      h('div', { position: 'absolute', left: 60, top: 760, width: 960, fontFamily: 'ArchivoBI', fontSize: size, letterSpacing: -2, lineHeight: 0.98, textTransform: 'uppercase' }, c.headline),
      h('div', { position: 'absolute', left: 60, bottom: 56, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: C.muted },
        'FULL STORY IN THE', h('span', { color: C.lime, marginLeft: 8 }, 'BETINA APP')));
  },
};

/** format: 'wide' (1200×675, X) or 'portrait' (1080×1350, Instagram/Facebook). */
export async function renderCard(card, format = 'wide') {
  const portrait = format === 'portrait';
  const build = (portrait ? PORTRAIT : KINDS)[card?.t];
  if (!build) throw Object.assign(new Error('unknown card'), { status: 404 });
  const [w, hgt] = portrait ? [PW, PH] : [W, H];
  const svg = await satori(build(card), { width: w, height: hgt, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng();
}

// Rendered cards don't change; keep the recent ones.
const cache = new Map();

// GET /v1/social/card/<id>.png        -> wide PNG (X)
// GET /v1/social/card/<id>-4x5.jpg    -> portrait JPEG (Instagram only takes JPEG)
export async function cardPng(c) {
  const m = /^(\d+)(-4x5)?\.(png|jpg)$/.exec(String(c.req.param('id')));
  if (!m) return c.text('bad id', 400);
  const id = Number(m[1]);
  const format = m[2] ? 'portrait' : 'wide';
  const jpeg = m[3] === 'jpg';
  const key = `${id}:${format}:${m[3]}`;
  let body = cache.get(key);
  if (!body) {
    const r = await fetch(`${SUPABASE}/rest/v1/rpc/social_card`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: id }),
      signal: AbortSignal.timeout(10_000),
    });
    const card = r.ok ? await r.json() : null;
    if (!card) return c.text('no card', 404);
    const png = await renderCard(card, format).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!png) return c.text('no card in this format', 404);
    body = jpeg ? await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toBuffer() : png;
    cache.set(key, body);
    if (cache.size > 300) cache.delete(cache.keys().next().value);
  }
  return c.body(body, 200, { 'Content-Type': jpeg ? 'image/jpeg' : 'image/png', 'Cache-Control': 'public, max-age=3600' });
}
