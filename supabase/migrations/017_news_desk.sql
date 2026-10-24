-- BETina News: BETina's own newsroom.
--
-- The news-desk function (supabase/functions/news-desk) pulls every outlet's
-- current items from betina-server (/v1/pool, all languages), drops stories it
-- already has (also across languages), and has Claude write an original
-- article per story in every app language. The app reads the feed via
-- news_feed() and a single article straight from news_articles.
--
-- Story lifecycle: new -> pending (unique, to be written) | duplicate
--                  pending -> ready | skipped (betting, quiz, no substance) | failed

create table if not exists public.news_stories (
  id           bigint generated always as identity primary key,
  source_url   text not null unique,
  source_name  text not null,
  source_lang  text not null,
  source_title text not null,
  source_teaser text,
  image        text,
  published_at timestamptz not null,
  status       text not null default 'new'
               check (status in ('new', 'pending', 'duplicate', 'ready', 'skipped', 'failed')),
  duplicate_of bigint references public.news_stories (id) on delete set null,
  attempts     smallint not null default 0,
  -- Filled in when the story is written:
  sport        text,
  competition  text,
  teams        text[] not null default '{}',
  region       text,        -- ISO country the story is mostly about, or 'INT'
  importance   smallint,    -- 1 local … 5 world news
  created_at   timestamptz not null default now()
);

create index if not exists news_stories_status_idx on public.news_stories (status, published_at desc);
create index if not exists news_stories_feed_idx on public.news_stories (published_at desc, id desc) where status = 'ready';

create table if not exists public.news_articles (
  story_id   bigint not null references public.news_stories (id) on delete cascade,
  lang       text not null,
  kicker     text not null,
  headline   text not null,
  teaser     text not null,
  body       text[] not null,
  take       text,
  created_at timestamptz not null default now(),
  primary key (story_id, lang)
);

alter table public.news_stories enable row level security;
alter table public.news_articles enable row level security;

drop policy if exists "news stories are public" on public.news_stories;
create policy "news stories are public" on public.news_stories
  for select to anon, authenticated using (status = 'ready');

drop policy if exists "news articles are public" on public.news_articles;
create policy "news articles are public" on public.news_articles
  for select to anon, authenticated using (
    exists (select 1 from public.news_stories s where s.id = story_id and s.status = 'ready')
  );

-- Feed for one app language. A story shows up when it was reported in that
-- language, concerns that language's markets, or is big international news.
-- English readers get everything. Keyset pagination: pass the last row's
-- (published_at, id) as p_before / p_before_id.
create or replace function public.news_feed(
  p_lang text,
  p_sport text default null,
  p_team text default null,
  p_before timestamptz default null,
  p_before_id bigint default null,
  p_limit int default 30
)
returns table (
  id bigint, published_at timestamptz, image text, sport text, competition text, teams text[],
  kicker text, headline text, teaser text, source_name text
)
language sql stable security invoker set search_path = public
as $$
  with markets as (
    select case lower(p_lang)
      when 'de' then array['DE', 'AT', 'CH']
      when 'es' then array['ES', 'AR', 'MX', 'CO', 'CL', 'PE', 'UY']
      when 'fr' then array['FR', 'BE', 'CH', 'MC']
      when 'pt' then array['PT', 'BR']
      when 'it' then array['IT']
      when 'ro' then array['RO', 'MD']
      when 'tr' then array['TR']
      when 'hr' then array['HR', 'BA', 'RS', 'SI']
      else null
    end as countries
  )
  select s.id, s.published_at, s.image, s.sport, s.competition, s.teams,
         a.kicker, a.headline, a.teaser, s.source_name
  from news_stories s
  join news_articles a on a.story_id = s.id and a.lang = lower(p_lang)
  cross join markets m
  where s.status = 'ready'
    and (p_sport is null or p_sport in ('', 'sport', 'all') or s.sport = p_sport)
    and (p_team is null or exists (
          select 1 from unnest(s.teams) t
          where t ilike '%' || p_team || '%' or p_team ilike '%' || t || '%'))
    and (m.countries is null
         or s.source_lang = lower(p_lang)
         or s.region = any (m.countries)
         or coalesce(s.importance, 0) >= 4
         or (s.region = 'INT' and coalesce(s.importance, 0) >= 3))
    and (p_before is null or (s.published_at, s.id) < (p_before, coalesce(p_before_id, 9223372036854775807)))
  order by s.published_at desc, s.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 60);
$$;

grant execute on function public.news_feed(text, text, text, timestamptz, bigint, int) to anon, authenticated;
