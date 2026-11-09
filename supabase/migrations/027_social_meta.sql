-- BETina on Instagram + Facebook (agreed with Dejan 2026-11-09): fewer but
-- nicer posts than on X. The social desk takes BETina's best X posts (time
-- travel, big results, the news of the day), writes an Instagram caption and
-- posts the 4:5 card (betina-server /v1/social/card/<id>-4x5.jpg) to her
-- Instagram account and Facebook page. Same switch logic as X:
--   meta_mode  off   nothing goes to Instagram/Facebook (default until the
--                    Meta token is set and tested)
--              auto  the kinds in meta_kinds go out on their own
-- Token: Supabase secret META_PAGE_TOKEN (a Page token from a system user;
-- Dejan sets it). Page id and Instagram id are looked up with it.

alter table public.social_posts
  add column if not exists meta_text text,          -- the Instagram/Facebook caption
  add column if not exists meta_status text,        -- null | posting | posted | failed | skipped
  add column if not exists ig_id text,
  add column if not exists fb_id text,
  add column if not exists meta_error text,
  add column if not exists meta_posted_at timestamptz;

create index if not exists social_posts_meta_posted on public.social_posts (meta_posted_at) where meta_status = 'posted';

alter table public.social_settings
  add column if not exists meta_mode text not null default 'off' check (meta_mode in ('off', 'auto')),
  add column if not exists meta_kinds text[] not null default array['history', 'result', 'news'],
  add column if not exists meta_daily_limit int not null default 3,
  add column if not exists meta_ready boolean not null default false,
  add column if not exists fb_page_id text,
  add column if not exists ig_user_id text;

-- Dashboard: also return the Instagram/Facebook state of each post and the Meta settings.
create or replace function public.admin_social(p_status text default 'draft', p_limit int default 100)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'settings', (select jsonb_build_object('mode', mode, 'auto_kinds', auto_kinds, 'daily_limit', daily_limit,
                   'lang', lang, 'x_ready', x_ready, 'last_run', last_run,
                   'meta_mode', meta_mode, 'meta_ready', meta_ready) from social_settings where id = 1),
    'posted_24h', (select count(*) from social_posts where status = 'posted' and posted_at > now() - interval '24 hours'),
    'counts', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
               from (select status, count(*) as n from social_posts group by 1) c),
    'posts', (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc), '[]'::jsonb)
              from (select id, kind, status, text, poll, context, flags, reply_author, reply_text, expires_at,
                           x_id, error, decided_at, posted_at, created_at, card is not null as has_card,
                           meta_status, ig_id, fb_id, meta_error, meta_posted_at
                    from social_posts
                    where p_status is null
                       or status = p_status
                       or (p_status = 'rejected' and status in ('rejected', 'skipped', 'failed'))
                    order by created_at desc
                    limit least(greatest(p_limit, 1), 300)) p)
  ) into result;
  return result;
end;
$$;
grant execute on function public.admin_social(text, int) to authenticated;
revoke execute on function public.admin_social(text, int) from anon;
