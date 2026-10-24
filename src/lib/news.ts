// BETina News: articles BETina's news desk writes (supabase/functions/news-desk),
// read straight from Supabase. The feed is per app language.
import { supabase } from './supabase';

export type NewsCard = {
  id: number;
  published_at: string;
  image: string | null;
  sport: string | null;
  competition: string | null;
  teams: string[];
  importance: number | null;
  region: string | null;
  kicker: string;
  headline: string;
  teaser: string;
};

export type NewsArticle = {
  id: number;
  kicker: string;
  headline: string;
  teaser: string;
  body: string[];
  take: string | null;
  image: string | null;
  published_at: string;
  sport: string | null;
  source_name: string;
  source_url: string;
};

export const PAGE_SIZE = 30;

export async function fetchNewsFeed(opts: {
  lang: string;
  sport?: string | null;
  team?: string | null;
  after?: NewsCard | null; // last card of the previous page
  limit?: number;
}): Promise<NewsCard[]> {
  const { data, error } = await supabase.rpc('news_feed', {
    p_lang: opts.lang,
    p_sport: opts.sport && opts.sport !== 'sport' ? opts.sport : null,
    p_team: opts.team ?? null,
    p_before: opts.after?.published_at ?? null,
    p_before_id: opts.after?.id ?? null,
    p_limit: opts.limit ?? PAGE_SIZE,
  });
  if (error) throw error;
  return (data ?? []) as NewsCard[];
}

/** One article in the app language (English when that language isn't written yet). */
export async function fetchNewsArticle(id: number, lang: string): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('lang, kicker, headline, teaser, body, take, news_stories(image, published_at, sport, source_name, source_url)')
    .eq('story_id', id)
    .in('lang', [lang, 'en']);
  if (error) throw error;
  const row = (data ?? []).find((r) => r.lang === lang) ?? (data ?? [])[0];
  if (!row) return null;
  // supabase-js types an embedded many-to-one relation as an array or object depending on version.
  const story = (Array.isArray(row.news_stories) ? row.news_stories[0] : row.news_stories) as {
    image: string | null; published_at: string; sport: string | null; source_name: string; source_url: string;
  } | null;
  return {
    id,
    kicker: row.kicker,
    headline: row.headline,
    teaser: row.teaser,
    body: row.body ?? [],
    take: row.take,
    image: story?.image ?? null,
    published_at: story?.published_at ?? '',
    sport: story?.sport ?? null,
    source_name: story?.source_name ?? '',
    source_url: story?.source_url ?? '',
  };
}

export function timeAgo(iso: string, t: { liveJustNow: string; liveAgoHours: string; liveAgoDays: string }) {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return t.liveJustNow;
  if (hours < 24) return t.liveAgoHours.replace('{n}', String(Math.floor(hours)));
  return t.liveAgoDays.replace('{n}', String(Math.floor(hours / 24)));
}

export function readingMinutes(body: string[]) {
  const words = body.join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
