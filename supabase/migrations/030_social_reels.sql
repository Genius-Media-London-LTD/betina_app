-- Reels (asked by Dejan 2026-11-13): the team uploads a finished video in the
-- dashboard, writes the caption, approves it — the social desk then posts it
-- as a Reel on Instagram and as a video on Facebook. Reels never go out on
-- their own and are not posted to X.
--   social_posts.kind = 'reel', platform = 'instagram' (Instagram + Facebook)
--   video_url     public URL of the MP4 (bucket social-reels)
--   ig_container  Instagram's upload container while the video is processed

alter table public.social_posts drop constraint if exists social_posts_kind_check;
alter table public.social_posts add constraint social_posts_kind_check
  check (kind in ('matchday', 'poll', 'goal', 'result', 'news', 'history', 'reply', 'reel'));

alter table public.social_posts
  add column if not exists video_url text,
  add column if not exists ig_container text;

-- Public bucket: Instagram and Facebook fetch the video from its URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-reels', 'social-reels', true, 104857600, array['video/mp4'])
on conflict (id) do nothing;

drop policy if exists "admins upload reels" on storage.objects;
create policy "admins upload reels" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'social-reels' and public.is_admin());

-- A new reel draft from the dashboard.
create or replace function public.admin_social_reel(p_video_url text, p_caption text)
returns bigint
language plpgsql volatile security definer set search_path = public
as $$
declare new_id bigint;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_video_url is null or p_video_url !~ '^https://[^ ]+\.mp4$' then
    raise exception 'bad_video_url';
  end if;
  if p_caption is null or length(trim(p_caption)) = 0 or length(p_caption) > 2200 then
    raise exception 'bad_text';
  end if;
  insert into social_posts (kind, platform, status, text, dedupe_key, context, video_url)
  values ('reel', 'instagram', 'draft', trim(p_caption), 'reel:' || gen_random_uuid(), 'Reel · Instagram + Facebook', p_video_url)
  returning id into new_id;
  return new_id;
end;
$$;
grant execute on function public.admin_social_reel(text, text) to authenticated;
revoke execute on function public.admin_social_reel(text, text) from anon;

-- Captions of reels may be as long as Instagram allows (2200); everything else stays at X's 280.
create or replace function public.admin_social_decide(p_id bigint, p_action text, p_text text default null)
returns void
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_action not in ('approve', 'reject') then
    raise exception 'bad_action';
  end if;
  if p_text is not null and (length(trim(p_text)) = 0
      or length(p_text) > (select case when kind = 'reel' then 2200 else 280 end from social_posts where id = p_id)) then
    raise exception 'bad_text';
  end if;
  update social_posts set
    status = case p_action when 'approve' then 'approved' else 'rejected' end,
    text = coalesce(nullif(trim(p_text), ''), text),
    error = null,
    decided_by = auth.uid(),
    decided_at = now()
  where id = p_id and status in ('draft', 'approved', 'failed');
end;
$$;

-- Dashboard: also return the video of a reel.
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
                           meta_status, ig_id, fb_id, meta_error, meta_posted_at, platform, video_url
                    from social_posts
                    where p_status is null
                       or status = p_status
                       or (p_status = 'approved' and status = 'posting')
                       or (p_status = 'rejected' and status in ('rejected', 'skipped', 'failed'))
                    order by created_at desc
                    limit least(greatest(p_limit, 1), 300)) p)
  ) into result;
  return result;
end;
$$;
grant execute on function public.admin_social(text, int) to authenticated;
revoke execute on function public.admin_social(text, int) from anon;
