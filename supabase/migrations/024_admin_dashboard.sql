-- BETina admin dashboard: numbers, sign-ups and chats for the team.
-- Only accounts listed in public.admins can call these functions; everyone
-- else gets an error. Nothing here is readable through the tables directly.

create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz default now()
);
alter table public.admins enable row level security;
-- No policies: the table is only read by the security-definer functions below.

-- Dejan (owner).
insert into public.admins (user_id) values ('aa5ea30d-9ef6-4597-9453-44b9b09997d2')
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to authenticated;

-- "+436641234567" → "+43 ••• 4567"
create or replace function public.admin_mask_phone(p text)
returns text language sql immutable
as $$
  select case when p is null or length(p) < 6 then p
    else left(p, 3) || ' ••• ' || right(p, 4) end;
$$;

-- Everything the overview shows, in one call. Days are Vienna days.
create or replace function public.admin_overview(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  tz constant text := 'Europe/Vienna';
  today date := (now() at time zone tz)::date;
  since date := today - (greatest(p_days, 1) - 1);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  with
  users as (select * from public.profiles),
  msgs as (
    select m.user_id, m.role, (m.created_at at time zone tz)::date as d, m.created_at
    from public.chat_messages m
  ),
  days as (select generate_series(since, today, interval '1 day')::date as d)
  select jsonb_build_object(
    'generated_at', now(),
    'days', p_days,
    'totals', jsonb_build_object(
      'users',            (select count(*) from users),
      'registered',       (select count(*) from users where coalesce(trim(name), '') <> ''),
      'crm_matched',      (select count(*) from users where crm_player_id is not null),
      'push',             (select count(*) from users where push_token is not null),
      'signups_today',    (select count(*) from users where (created_at at time zone tz)::date = today),
      'signups_7d',       (select count(*) from users where (created_at at time zone tz)::date > today - 7),
      'active_today',     (select count(distinct user_id) from msgs where d = today and role = 'user'),
      'active_7d',        (select count(distinct user_id) from msgs where d > today - 7 and role = 'user'),
      'opened_today',     (select count(*) from users where last_login_date = today),
      'opened_7d',        (select count(*) from users where last_login_date > today - 7),
      'messages',         (select count(*) from msgs where role = 'user'),
      'messages_today',   (select count(*) from msgs where role = 'user' and d = today),
      'chatters',         (select count(distinct user_id) from msgs where role = 'user'),
      'tips',             (select count(*) from public.tips),
      'tippers',          (select count(distinct user_id) from public.tips),
      'tip_groups',       (select count(*) from public.tip_groups),
      'follows',          (select count(*) from public.live_follows),
      'memories',         (select count(*) from public.betina_memories),
      'reminders_open',   (select count(*) from public.reminders where not sent),
      'news_today',       (select count(*) from public.news_articles where (created_at at time zone tz)::date = today),
      'xp_total',         (select coalesce(sum(xp_points), 0) from users)
    ),
    'series', (
      select jsonb_agg(jsonb_build_object(
        'd', days.d,
        'signups',  (select count(*) from users where (created_at at time zone tz)::date = days.d),
        'messages', (select count(*) from msgs where role = 'user' and msgs.d = days.d),
        'chatters', (select count(distinct user_id) from msgs where role = 'user' and msgs.d = days.d),
        'opened',   (select count(*) from users where last_login_date = days.d)
      ) order by days.d)
      from days
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(nullif(country, ''), '—') as k, count(*) as n from users group by 1 order by 2 desc limit 15) x
    ),
    'languages', (
      select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(nullif(language, ''), '—') as k, count(*) as n from users group by 1) x
    ),
    'tiers', (
      select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(vip_tier, 'INITIATE') as k, count(*) as n from users group by 1) x
    ),
    'teams', (
      select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]'::jsonb)
      from (select favourite_team as k, count(*) as n from users where coalesce(favourite_team, '') <> '' group by 1 order by 2 desc limit 10) x
    ),
    'top_chatters', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select p.id, coalesce(nullif(trim(p.name), ''), admin_mask_phone(p.phone)) as name, count(*) as n
        from msgs join users p on p.id = msgs.user_id
        where msgs.role = 'user' and msgs.d > today - 7
        group by 1, 2 order by 3 desc limit 10
      ) x
    )
  ) into result;
  return result;
end;
$$;
grant execute on function public.admin_overview(int) to authenticated;

-- Players, newest first, with their activity.
create or replace function public.admin_users(p_limit int default 100, p_search text default null)
returns table (
  id uuid, name text, phone text, country text, language text, vip_tier text, xp int,
  favourite_team text, crm boolean, push boolean, created_at timestamptz, last_login_date date,
  messages bigint, last_message_at timestamptz, tips bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
  select p.id, p.name, admin_mask_phone(p.phone), p.country, p.language, p.vip_tier, p.xp_points,
    p.favourite_team, p.crm_player_id is not null, p.push_token is not null, p.created_at, p.last_login_date,
    (select count(*) from chat_messages m where m.user_id = p.id and m.role = 'user'),
    (select max(m.created_at) from chat_messages m where m.user_id = p.id),
    (select count(*) from tips t where t.user_id = p.id)
  from profiles p
  where p_search is null or p_search = ''
     or p.name ilike '%' || p_search || '%'
     or p.phone like '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
     or p.favourite_team ilike '%' || p_search || '%'
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 500);
end;
$$;
grant execute on function public.admin_users(int, text) to authenticated;

-- The chat feed: latest messages across all players (p_user null), or one
-- player's whole conversation, both sides, newest first.
create or replace function public.admin_messages(p_user uuid default null, p_limit int default 100, p_before timestamptz default null)
returns table (id uuid, user_id uuid, name text, role text, content text, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
  select m.id, m.user_id, coalesce(nullif(trim(p.name), ''), admin_mask_phone(p.phone)), m.role, m.content, m.created_at
  from chat_messages m
  left join profiles p on p.id = m.user_id
  where (p_user is null and m.role = 'user' or m.user_id = p_user)
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit least(greatest(p_limit, 1), 300);
end;
$$;
grant execute on function public.admin_messages(uuid, int, timestamptz) to authenticated;

revoke execute on function public.admin_overview(int) from anon;
revoke execute on function public.admin_users(int, text) from anon;
revoke execute on function public.admin_messages(uuid, int, timestamptz) from anon;
