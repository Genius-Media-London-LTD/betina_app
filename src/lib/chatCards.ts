// Visual cards under BETina's chat messages. Built server-side from real data
// (supabase/functions/chat/cards.ts) — keep the shapes in sync.
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

const TYPES = new Set(['match', 'news', 'link', 'tippspiel']);

/** Keeps only well-formed cards (stored history may come from older versions). */
export function cleanCards(raw: unknown): ChatCard[] {
  return Array.isArray(raw) ? raw.filter((c) => c && typeof c === 'object' && TYPES.has((c as ChatCard).type)).slice(0, 3) as ChatCard[] : [];
}
