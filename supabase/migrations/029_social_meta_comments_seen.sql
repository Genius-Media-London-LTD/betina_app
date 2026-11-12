-- What the last look at the Instagram/Facebook comments found (migration 028
-- only stored errors): how many comments Meta returned and why some got no
-- draft. Shown in the dashboard, so "no drafts" can be told from "no comments".
alter table public.social_settings
  add column if not exists meta_comments_seen text;

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
                   'meta_mode', meta_mode, 'meta_ready', meta_ready,
                   'meta_comments_error', meta_comments_error, 'meta_comments_seen', meta_comments_seen,
                   'last_meta_comments', last_meta_comments) from social_settings where id = 1),
    'posted_24h', (select count(*) from social_posts where status = 'posted' and posted_at > now() - interval '24 hours'),
    'counts', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
               from (select status, count(*) as n from social_posts group by 1) c),
    'posts', (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc), '[]'::jsonb)
              from (select id, kind, status, text, poll, context, flags, reply_author, reply_text, expires_at,
                           x_id, error, decided_at, posted_at, created_at, card is not null as has_card,
                           meta_status, ig_id, fb_id, meta_error, meta_posted_at, platform
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
