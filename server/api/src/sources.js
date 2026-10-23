// News sources per app language. Each language has a general feed plus
// optional per-sport feeds; a sport without its own feed falls back to the
// language's general feed (stay in the user's language rather than switch to
// English). Verified fresh + with images from betina-server on 2026-10-22.

const bbc = (path) => ({ url: `https://feeds.bbci.co.uk/sport/${path}rss.xml`, source: 'BBC Sport' });
const sportschau = (path) => ({ url: `https://www.sportschau.de/${path}index~rss2.xml`, source: 'Sportschau' });
const rmc = (path) => ({ url: `https://rmcsport.bfmtv.com/rss/${path}/`, source: 'RMC Sport' });

export const FEEDS = {
  en: {
    general: bbc(''),
    sports: {
      football: bbc('football/'),
      tennis: bbc('tennis/'),
      basketball: bbc('basketball/'),
      golf: bbc('golf/'),
      cricket: bbc('cricket/'),
      athletics: bbc('athletics/'),
      rugby: bbc('rugby-union/'),
      cycling: bbc('cycling/'),
      nfl: bbc('american-football/'),
      mma: bbc('boxing/'),
    },
  },
  de: {
    general: sportschau(''),
    sports: {
      football: sportschau('fussball/'),
      tennis: sportschau('tennis/'),
      basketball: sportschau('basketball/'),
      athletics: sportschau('leichtathletik/'),
      winter: sportschau('wintersport/'),
      handball: sportschau('handball/'),
      cycling: sportschau('radsport/'),
    },
  },
  es: {
    general: { url: 'https://e00-marca.uecdn.es/rss/portada.xml', source: 'Marca' },
    sports: {
      football: { url: 'https://e00-marca.uecdn.es/rss/futbol/primera-division.xml', source: 'Marca' },
      tennis: { url: 'https://e00-marca.uecdn.es/rss/tenis.xml', source: 'Marca' },
      basketball: { url: 'https://e00-marca.uecdn.es/rss/baloncesto/nba.xml', source: 'Marca' },
    },
  },
  fr: {
    general: rmc('fil-sport'),
    sports: {
      football: rmc('football'),
      tennis: rmc('tennis'),
      basketball: rmc('basket'),
      rugby: rmc('rugby'),
      athletics: rmc('athletisme'),
    },
  },
  pt: {
    general: { url: 'https://www.record.pt/rss', source: 'Record' },
    sports: {},
  },
  it: {
    // Gazzetta's classic /rss/*.xml feeds are abandoned (some since 2023).
    general: { url: 'https://www.gazzetta.it/dynamic-feed/rss/section/last.xml', source: 'La Gazzetta dello Sport' },
    sports: {
      football: { url: 'https://www.corrieredellosport.it/rss/calcio', source: 'Corriere dello Sport' },
    },
  },
  ro: {
    general: { url: 'https://www.gsp.ro/rss.xml', source: 'GSP' },
    sports: {},
  },
};

export const DEFAULT_LANG = 'en';

export function feedFor(lang, sport) {
  const l = FEEDS[String(lang ?? '').toLowerCase().slice(0, 2)] ? String(lang).toLowerCase().slice(0, 2) : DEFAULT_LANG;
  const s = String(sport ?? '').toLowerCase();
  const cfg = FEEDS[l];
  return { lang: l, feed: cfg.sports[s] ?? cfg.general };
}

// Article pages may only be fetched from these publishers (SSRF guard: the
// article endpoint takes a URL from the client).
const ARTICLE_HOSTS = {
  'bbc.co.uk': 'BBC Sport',
  'bbc.com': 'BBC Sport',
  'sportschau.de': 'Sportschau',
  'marca.com': 'Marca',
  'bfmtv.com': 'RMC Sport',
  'record.pt': 'Record',
  'gazzetta.it': 'La Gazzetta dello Sport',
  'corrieredellosport.it': 'Corriere dello Sport',
  'gsp.ro': 'GSP',
};

/** Source name for an allowed article URL, or null if the host isn't allowed. */
export function articleSource(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase();
  for (const [domain, name] of Object.entries(ARTICLE_HOSTS)) {
    if (host === domain || host.endsWith(`.${domain}`)) return name;
  }
  return null;
}

// BETina is a companion app: no betting tips / odds content, in any language.
export const BETTING_TITLE =
  /\b(odds|betting|bet tips?|tipsters?|predictions?|TBD|quoten|wett-?tipps?|cuotas|apuestas|pron[oó]sticos?|cotes|paris sportifs?|pronostics?|quote|scommess\w*|pariuri|ponturi|apostas|palpites?)\b/i;

// Live tickers / streams / match centres have no article text and look empty
// in the app's article view.
export const LIVE_TITLE =
  /^(jetzt live|live[:\s-]|livestream|liveblog|direct\b|en direct|en directo|en vivo|ao vivo|jogos em direto|diretta|live ticker)|\b(live ticker|liveticker)\b|\((?:\d\.ª parte|intervalo|half-time|halbzeit)\)/i;

// …and the same pages recognised by URL (e.g. Sportschau "/live-und-ergebnisse/"),
// plus podcast / audio / video pages (Sportschau ",audio-…" slugs, BBC "/av/",
// video.gazzetta.it).
export const LIVE_LINK =
  /\/(live-und-ergebnisse|live|livestream|liveticker|live-blog|direct|en-directo|en-vivo|jogos-em-direto|diretta)(\/|$)|\/(podcasts?|audio|video|videos|av|sounds)\/|,(audio|video|livestream)-|^https?:\/\/(video|videos|audio|podcasts?)\./i;

/** Bigger images where a publisher's feed only links small thumbnails. */
export function upgradeImage(url) {
  if (!url) return null;
  return url
    // BBC feeds link 240px thumbnails: ichef.bbci.co.uk/ace/standard/240/…
    .replace(/(ichef\.bbci\.co\.uk\/(?:ace\/(?:standard|ws)|news))\/\d+\//, '$1/976/')
    // Sportschau's image CDN only accepts certain widths (800 is NOT one).
    .replace(/(images\.sportschau\.de\/.*[?&]width=)\d+/, '$1640');
}
