-- news-desk is a public endpoint (pg_cron calls it without a key). A run first
-- claims the desk: at most one run per p_min_seconds, so overlapping or
-- repeated calls can't write the same stories twice or run up Claude costs.

create table if not exists public.news_desk_state (
  id       int primary key default 1 check (id = 1),
  last_run timestamptz not null default 'epoch'
);
insert into public.news_desk_state (id) values (1) on conflict do nothing;
alter table public.news_desk_state enable row level security; -- service role only

create or replace function public.news_desk_claim(p_min_seconds int default 120)
returns boolean
language sql volatile security definer set search_path = public
as $$
  with claimed as (
    update news_desk_state set last_run = now()
    where id = 1 and last_run < now() - make_interval(secs => p_min_seconds)
    returning 1
  )
  select exists (select 1 from claimed);
$$;

revoke all on function public.news_desk_claim(int) from public, anon, authenticated;
grant execute on function public.news_desk_claim(int) to service_role;

-- Live stories that still miss some languages (a write failed): the desk
-- retries them, up to 3 attempts.
create or replace function public.news_partial_stories(p_langs text[], p_limit int)
returns setof public.news_stories
language sql stable security definer set search_path = public
as $$
  select s.* from news_stories s
  where s.status = 'ready' and s.attempts < 3
    and (select count(*) from news_articles a where a.story_id = s.id and a.lang = any (p_langs)) < cardinality(p_langs)
  order by s.published_at desc
  limit p_limit;
$$;

revoke all on function public.news_partial_stories(text[], int) from public, anon, authenticated;
grant execute on function public.news_partial_stories(text[], int) to service_role;

-- Scheduled once by hand (needs pg_cron + pg_net, like tippspiel-sync):
--   select cron.schedule('news-desk', '*/2 * * * *',
--     $$ select net.http_post(
--          url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/news-desk',
--          headers := '{"Content-Type":"application/json"}'::jsonb,
--          body := '{}'::jsonb,
--          timeout_milliseconds := 150000) $$);
