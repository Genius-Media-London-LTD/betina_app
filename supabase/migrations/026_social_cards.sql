-- BETina on X, round 2 (agreed with Dejan 2026-11-07 after the first week):
-- fewer, better posts, each with an image card.
--   * social_posts.card: what the post's image card shows (goal, result, poll,
--     history, news). betina-server renders it as a PNG
--     (GET /v1/social/card/<id>.png) and the social desk attaches it on X.
--   * social_card(): the only way to read a card from outside — public,
--     because the server renders with the publishable key. Cards hold match
--     facts and headlines only, nothing personal.
--   * daily limit 20 -> 8; the morning "matchday" list is retired (the poll
--     is the morning post now).

alter table public.social_posts add column if not exists card jsonb;

create or replace function public.social_card(p_id bigint)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select card from social_posts where id = p_id and status not in ('rejected', 'skipped');
$$;
revoke all on function public.social_card(bigint) from public;
grant execute on function public.social_card(bigint) to anon, authenticated, service_role;

update public.social_settings
set daily_limit = 8,
    auto_kinds = array_remove(auto_kinds, 'matchday'),
    updated_at = now()
where id = 1;

-- Dashboard: also return the card, so the team sees the image before approving.
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
                   'lang', lang, 'x_ready', x_ready, 'last_run', last_run) from social_settings where id = 1),
    'posted_24h', (select count(*) from social_posts where status = 'posted' and posted_at > now() - interval '24 hours'),
    'counts', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
               from (select status, count(*) as n from social_posts group by 1) c),
    'posts', (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc), '[]'::jsonb)
              from (select id, kind, status, text, poll, context, flags, reply_author, reply_text, expires_at,
                           x_id, error, decided_at, posted_at, created_at, card is not null as has_card
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
