-- news_feed() also returns importance + region, so the app can pick the lead
-- story and its "Top 5" from the newest page.

drop function if exists public.news_feed(text, text, text, timestamptz, bigint, int);

create function public.news_feed(
  p_lang text,
  p_sport text default null,
  p_team text default null,
  p_before timestamptz default null,
  p_before_id bigint default null,
  p_limit int default 30
)
returns table (
  id bigint, published_at timestamptz, image text, sport text, competition text, teams text[],
  importance smallint, region text, kicker text, headline text, teaser text
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
         s.importance, s.region, a.kicker, a.headline, a.teaser
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
