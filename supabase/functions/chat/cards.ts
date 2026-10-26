// Chat cards: BETina ends her reply with markers ([[match:ID]], [[news:ID]],
// [[link:URL]], [[tippspiel]], [[chips:a|b|c]]). Here they're cut out of the
// text and turned into card data from real sources (TheSportsDB via
// betina-server, BETina's newsroom, the page's own preview tags, the
// Tippspiel tables) — the app only renders what this returns.

const SPORTS_API = 'https://api.betina.geniusbet.com';
const MAX_CARDS = 3;

export type ChatCard =
  | {
    type: 'match'; id: string; home: string; away: string;
    homeBadge: string | null; awayBadge: string | null;
    homeScore: string | null; awayScore: string | null;
    status: string | null; kickoff: string | null; league: string | null; video: string | null;
  }
  | { type: 'news'; id: number; kicker: string; headline: string; image: string | null }
  | { type: 'link'; url: string; title: string; site: string; image: string | null }
  | { type: 'tippspiel'; open: number; next: string | null; nextKickoff: string | null };

type Marker = { kind: 'match' | 'news' | 'link' | 'tippspiel'; value: string };

const MARKER = /\[\[\s*(match|news|link|tippspiel|chips)\s*(?::\s*([^\]]*?))?\s*\]\]/gi;

/** Splits BETina's reply into clean text, card markers and reply chips. */
export function parseMarkers(text: string): { text: string; markers: Marker[]; chips: string[] } {
  const markers: Marker[] = [];
  let chips: string[] = [];
  const clean = text.replace(MARKER, (_, kind: string, value = '') => {
    const k = kind.toLowerCase();
    if (k === 'chips') {
      chips = value.split('|').map((c) => c.trim()).filter((c) => c && c.length <= 40).slice(0, 3);
    } else {
      markers.push({ kind: k as Marker['kind'], value: value.trim() });
    }
    return '';
  })
    // Tidy whatever the markers left behind (trailing spaces, empty lines).
    .replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  // One card per thing.
  const seen = new Set<string>();
  const unique = markers.filter((m) => {
    const key = `${m.kind}:${m.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { text: clean, markers: unique.slice(0, MAX_CARDS), chips };
}

// deno-lint-ignore no-explicit-any
type Supabase = any;

async function matchCard(id: string): Promise<ChatCard | null> {
  if (!/^\d{1,10}$/.test(id)) return null;
  const r = await fetch(`${SPORTS_API}/v1/sports/event/${id}`, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) return null;
  const e = (await r.json()).event;
  return e ? { type: 'match', ...e } : null;
}

async function newsCard(id: string, lang: string, supabase: Supabase): Promise<ChatCard | null> {
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) return null;
  const { data } = await supabase
    .from('news_articles')
    .select('lang, kicker, headline, news_stories(image)')
    .eq('story_id', storyId)
    .in('lang', [lang, 'en']);
  // deno-lint-ignore no-explicit-any
  const row = ((data ?? []) as any[]).find((r) => r.lang === lang) ?? data?.[0];
  if (!row) return null;
  const story = Array.isArray(row.news_stories) ? row.news_stories[0] : row.news_stories;
  return { type: 'news', id: storyId, kicker: row.kicker ?? '', headline: row.headline, image: story?.image ?? null };
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ').trim();

function meta(html: string, prop: string): string | null {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  const b = a ?? new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i').exec(html);
  return b ? decode(b[1]) : null;
}

/** Only public https pages — no IPs, no local hosts. */
function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    const h = u.hostname;
    if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || /(^|\.)(local|localhost|internal)$/i.test(h)) return null;
    return u;
  } catch {
    return null;
  }
}

async function linkCard(raw: string): Promise<ChatCard | null> {
  const u = safeUrl(raw);
  if (!u) return null;
  const site = u.hostname.replace(/^www\./, '');
  try {
    const r = await fetch(u, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; BETinaBot/1.0; +https://betina.geniusbet.com)', accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('html') || !r.body) throw new Error('no page');
    // The preview tags live in <head> — read at most ~400 KB.
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < 400_000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
      if (new TextDecoder().decode(value).includes('</head>')) break;
    }
    reader.cancel().catch(() => {});
    const buf = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) { buf.set(c, at); at += c.length; }
    const html = new TextDecoder().decode(buf);
    const title = meta(html, 'og:title') ?? meta(html, 'twitter:title') ?? decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '');
    const image = meta(html, 'og:image') ?? meta(html, 'twitter:image');
    const imageUrl = image ? safeUrl(new URL(image, u).href)?.href ?? null : null;
    return { type: 'link', url: u.href, title: (title || site).slice(0, 140), site: meta(html, 'og:site_name') ?? site, image: imageUrl };
  } catch {
    // The page didn't answer in time — still worth a plain link card.
    return { type: 'link', url: u.href, title: site, site, image: null };
  }
}

async function tippspielCard(supabase: Supabase, userId: string): Promise<ChatCard | null> {
  const now = new Date();
  const soon = new Date(now.getTime() + 4 * 86_400_000);
  const { data: comps } = await supabase.from('tip_user_competitions').select('competition').eq('user_id', userId);
  // deno-lint-ignore no-explicit-any
  const mine = ((comps ?? []) as any[]).map((c) => c.competition);
  let q = supabase.from('tip_matches').select('id, home_name, away_name, kickoff')
    .in('status', ['SCHEDULED', 'TIMED'])
    .gt('kickoff', now.toISOString()).lt('kickoff', soon.toISOString())
    .order('kickoff').limit(80);
  if (mine.length) q = q.in('competition', mine);
  const { data: matches } = await q;
  // deno-lint-ignore no-explicit-any
  const list = (matches ?? []) as any[];
  const { data: tips } = list.length
    ? await supabase.from('tips').select('match_id').eq('user_id', userId).in('match_id', list.map((m) => m.id))
    : { data: [] };
  // deno-lint-ignore no-explicit-any
  const tipped = new Set(((tips ?? []) as any[]).map((t) => t.match_id));
  const open = list.filter((m) => !tipped.has(m.id));
  const next = open[0];
  return { type: 'tippspiel', open: open.length, next: next ? `${next.home_name} – ${next.away_name}` : null, nextKickoff: next?.kickoff ?? null };
}

/** Resolves the markers into cards (in order; failed lookups are dropped). */
export async function buildCards(markers: Marker[], opts: { supabase: Supabase; userId: string; lang: string; tippspiel: boolean }): Promise<ChatCard[]> {
  const cards = await Promise.all(markers.map(async (m) => {
    try {
      if (m.kind === 'match') return await matchCard(m.value);
      if (m.kind === 'news') return await newsCard(m.value, opts.lang, opts.supabase);
      if (m.kind === 'link') return await linkCard(m.value);
      if (m.kind === 'tippspiel' && opts.tippspiel) return await tippspielCard(opts.supabase, opts.userId);
    } catch (err) {
      console.error('card', m.kind, (err as Error).message);
    }
    return null;
  }));
  return cards.filter((c): c is ChatCard => c != null);
}
