// Shared sports data layer — talks to the GeniusBet intelligence API
// (BBC news + TheSportsDB fixtures). Used by both the Home and Live tabs.

export const SPORTS_API = 'https://intelligence.geniusbet.com';

export type MatchEvent = {
  id: string;
  name: string;
  home: string;
  away: string;
  homeScore: string | null;
  awayScore: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  league: string;
  status?: string;
  venue?: string;
  thumb?: string;
};

export type NewsItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  publishedMonth?: string;
  image?: string;
};

/** Upcoming fixtures for a team (TheSportsDB team id). Empty array on any error. */
export async function fetchTeamNext(teamId: string): Promise<MatchEvent[]> {
  try {
    const r = await fetch(`${SPORTS_API}/api/sports/team/${teamId}/next`);
    const d = await r.json();
    return d.events ?? [];
  } catch {
    return [];
  }
}

/** Recent results for a team. Empty array on any error. */
export async function fetchTeamLast(teamId: string): Promise<MatchEvent[]> {
  try {
    const r = await fetch(`${SPORTS_API}/api/sports/team/${teamId}/last`);
    const d = await r.json();
    return d.events ?? [];
  } catch {
    return [];
  }
}

/** Latest news for a sport (BBC feed). Empty array on any error. */
export async function fetchNews(sport: string, count = 10, lang = 'en'): Promise<NewsItem[]> {
  try {
    const r = await fetch(`${SPORTS_API}/api/sports/news?sport=${sport}&count=${count}&lang=${lang}`);
    const d = await r.json();
    return d.items ?? [];
  } catch {
    return [];
  }
}

export type TeamSearchResult = {
  id: string;
  name: string;
  sport: string;
  league: string;
  country?: string;
  badge?: string | null;
};

/** Search teams by name across every sport (TheSportsDB). Top 5, [] on error. */
export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const r = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
    );
    const d = await r.json();
    return (d.teams ?? []).slice(0, 5).map((t: any) => ({
      id: t.idTeam,
      name: t.strTeam,
      sport: t.strSport,
      league: t.strLeague,
      country: t.strCountry,
      badge: t.strBadge ?? t.strTeamBadge ?? null,
    }));
  } catch {
    return [];
  }
}

// Team crest URLs by team id — resolved once from TheSportsDB, then cached.
const badgeCache = new Map<string, string | null>();

/** Team crest URL for a TheSportsDB team id (null if none). Cached per session. */
export async function fetchTeamBadge(teamId: string): Promise<string | null> {
  if (badgeCache.has(teamId)) return badgeCache.get(teamId) ?? null;
  try {
    const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${teamId}`);
    const d = await r.json();
    const badge: string | null = d.teams?.[0]?.strBadge ?? d.teams?.[0]?.strLogo ?? null;
    badgeCache.set(teamId, badge);
    return badge;
  } catch {
    badgeCache.set(teamId, null);
    return null;
  }
}

/**
 * Split a stored comma-separated sports string into clean ids.
 * "football,tennis" → ["football", "tennis"]
 */
export function parseSports(raw?: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Does a news item mention the team (by full name or a distinctive word)? */
export function mentionsTeam(item: NewsItem, teamName?: string | null): boolean {
  if (!teamName) return false;
  const hay = `${item.title} ${item.description}`.toLowerCase();
  if (hay.includes(teamName.toLowerCase())) return true;
  // also match the most distinctive word of the name (e.g. "Barcelona", "Heat")
  const words = teamName.split(/\s+/).filter((w) => w.length >= 4);
  const key = words.sort((a, b) => b.length - a.length)[0];
  return key ? hay.includes(key.toLowerCase()) : false;
}

export type LiveContext = {
  next: MatchEvent[];
  last: MatchEvent[];
  news: NewsItem[];
};

/**
 * Bundle the real, current sports data BETina should reason over: the team's
 * upcoming fixtures + recent results, and the latest headlines (team mentions
 * surfaced first). Used to ground the chat in real data.
 */
export async function fetchLiveContext(
  teamId?: string | null,
  teamName?: string | null,
  sport?: string | null,
  lang = 'en',
): Promise<LiveContext> {
  const [next, last, rawNews] = await Promise.all([
    teamId ? fetchTeamNext(teamId) : Promise.resolve([]),
    teamId ? fetchTeamLast(teamId) : Promise.resolve([]),
    fetchNews(sport || 'sport', 12, lang),
  ]);
  const news = teamName
    ? [...rawNews].sort(
        (a, b) => Number(mentionsTeam(b, teamName)) - Number(mentionsTeam(a, teamName)),
      )
    : rawNews;
  return { next: next.slice(0, 3), last: last.slice(0, 3), news: news.slice(0, 6) };
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  soccer: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  cricket: '🏏',
  rugby: '🏉',
  athletics: '🏃',
  golf: '⛳',
  hockey: '🏒',
  esports: '🎮',
  nfl: '🏈',
  mma: '🥊',
};

export function sportEmoji(sport?: string | null): string {
  if (!sport) return '⚽';
  return SPORT_EMOJI[sport.toLowerCase()] ?? '⚽';
}

/** "Just now" / "3h ago" / "2d ago" — labels passed in for i18n. */
export function timeAgo(
  dateStr: string,
  labels: { justNow: string; hours: string; days: string },
): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diffH = (Date.now() - d.getTime()) / 3_600_000;
  if (diffH < 1) return labels.justNow;
  if (diffH < 24) return labels.hours.replace('{n}', String(Math.floor(diffH)));
  return labels.days.replace('{n}', String(Math.floor(diffH / 24)));
}

/**
 * Human-friendly kickoff label relative to now:
 * "Today · 21:00", "Tomorrow · 12:00", or "Fri, 24 Jul · 12:00".
 * `locale` (e.g. 'de', 'es') localizes weekday/month; labels are passed in.
 */
export function formatKickoff(
  dateStr: string,
  timeStr: string,
  locale: string,
  labels: { today: string; tomorrow: string },
): string {
  const iso = `${dateStr}T${timeStr || '00:00:00'}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateStr;

  const hhmm = timeStr ? timeStr.slice(0, 5) : '';
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);

  let day: string;
  if (dayDiff === 0) day = labels.today;
  else if (dayDiff === 1) day = labels.tomorrow;
  else {
    try {
      day = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }
  return hhmm ? `${day} · ${hhmm}` : day;
}
