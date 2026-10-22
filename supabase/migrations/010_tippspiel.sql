-- BETina App — Tippspiel (match predictions)
--
-- kicker-style prediction game: players tip the exact score of a match
-- (result after 90 minutes; extra time and penalties don't count).
--   • exact result ........................ 3 points
--   • right winner + right goal difference  2 points
--   • right tendency (win / draw / loss) .. 1 point
-- Ranking ties break on: number of scoring tips, then exact results, then
-- goal differences. No money and no prizes — points, rankings and XP only.
--
-- Data flow:
--   • The tippspiel-sync Edge Function (pg_cron) upserts fixtures + results
--     from football-data.org into tip_matches with the service role.
--   • Players write tips ONLY through place_tip() / place_bonus_tip()
--     (SECURITY DEFINER), which reject anything after kickoff / the deadline.
--     There are deliberately no insert/update policies on the tip tables.
--   • When a match result becomes final, a trigger scores its tips and books
--     the XP delta on profiles (5 XP per point). A corrected or annulled
--     result books only the difference, so XP always matches the points.

-- ── Competitions ─────────────────────────────────────────────────────────────
create table if not exists public.tip_competitions (
  code             text primary key,            -- football-data.org code
  name             text not null,
  emblem           text,
  current_season   integer,                     -- start year: 2026 = 2026/27
  current_matchday integer,
  season_start     date,
  season_end       date,
  sort_order       integer not null default 0,
  synced_at        timestamptz
);

insert into public.tip_competitions (code, name, sort_order) values
  ('BL1', 'Bundesliga', 1),
  ('PL',  'Premier League', 2),
  ('PD',  'LaLiga', 3),
  ('SA',  'Serie A', 4),
  ('CL',  'Champions League', 5)
on conflict (code) do nothing;

alter table public.tip_competitions enable row level security;
drop policy if exists "Competitions are public" on public.tip_competitions;
create policy "Competitions are public" on public.tip_competitions for select using (true);

-- ── Matches ──────────────────────────────────────────────────────────────────
create table if not exists public.tip_matches (
  id           bigint primary key,              -- football-data.org match id
  competition  text not null references public.tip_competitions(code),
  season       integer not null,
  matchday     integer,
  stage        text,
  kickoff      timestamptz not null,
  status       text not null,                   -- SCHEDULED TIMED IN_PLAY PAUSED FINISHED POSTPONED SUSPENDED CANCELLED AWARDED
  home_team_id integer,
  home_name    text not null,
  home_short   text,
  home_tla     text,
  home_crest   text,
  away_team_id integer,
  away_name    text not null,
  away_short   text,
  away_tla     text,
  away_crest   text,
  home_score   integer,                         -- after 90 minutes (live score while in play)
  away_score   integer,
  updated_at   timestamptz default now()
);

create index if not exists tip_matches_comp_idx on public.tip_matches (competition, season, matchday);
create index if not exists tip_matches_kickoff_idx on public.tip_matches (kickoff);

alter table public.tip_matches enable row level security;
drop policy if exists "Matches are public" on public.tip_matches;
create policy "Matches are public" on public.tip_matches for select using (true);

-- ── Groups (Tipprunden) ──────────────────────────────────────────────────────
create table if not exists public.tip_groups (
  id         uuid default gen_random_uuid() primary key,
  name       text not null check (char_length(name) between 2 and 40),
  code       text not null unique,              -- invite code, e.g. K7M2QX
  owner_id   uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.tip_group_members (
  group_id  uuid references public.tip_groups(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create index if not exists tip_group_members_user_idx on public.tip_group_members (user_id);

create or replace function public.is_tip_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tip_group_members
    where group_id = p_group and user_id = auth.uid()
  );
$$;

alter table public.tip_groups enable row level security;
drop policy if exists "Members can view their groups" on public.tip_groups;
create policy "Members can view their groups" on public.tip_groups
  for select using (public.is_tip_group_member(id));

alter table public.tip_group_members enable row level security;
drop policy if exists "Members can view group members" on public.tip_group_members;
create policy "Members can view group members" on public.tip_group_members
  for select using (public.is_tip_group_member(group_id));

-- ── Tips ─────────────────────────────────────────────────────────────────────
create table if not exists public.tips (
  user_id    uuid references auth.users(id) on delete cascade not null,
  match_id   bigint references public.tip_matches(id) on delete cascade not null,
  home       smallint not null check (home between 0 and 20),
  away       smallint not null check (away between 0 and 20),
  points     smallint,                          -- null until the match is scored
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, match_id)
);

create index if not exists tips_match_idx on public.tips (match_id);

-- Own tips always; a fellow group member's tips only once the match has kicked
-- off (nobody can copy a tip before the deadline).
create or replace function public.shares_tip_group(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tip_group_members a
    join public.tip_group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

alter table public.tips enable row level security;
drop policy if exists "Users can view own tips" on public.tips;
create policy "Users can view own tips" on public.tips
  for select using (auth.uid() = user_id);
drop policy if exists "Group members see tips after kickoff" on public.tips;
create policy "Group members see tips after kickoff" on public.tips
  for select using (
    public.shares_tip_group(user_id)
    and exists (select 1 from public.tip_matches m where m.id = match_id and m.kickoff <= now())
  );

-- ── Bonus questions (season tips) ────────────────────────────────────────────
create table if not exists public.tip_bonus_questions (
  id             uuid default gen_random_uuid() primary key,
  competition    text not null references public.tip_competitions(code),
  season         integer not null,
  kind           text not null check (kind in ('champion', 'last_place')),
  points         smallint not null,
  closes_at      timestamptz not null,
  answer_team_id integer,                       -- set when the season is decided
  resolved_at    timestamptz,
  unique (competition, season, kind)
);

create table if not exists public.tip_bonus_answers (
  user_id     uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.tip_bonus_questions(id) on delete cascade not null,
  team_id     integer not null,
  points      smallint,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  primary key (user_id, question_id)
);

alter table public.tip_bonus_questions enable row level security;
drop policy if exists "Bonus questions are public" on public.tip_bonus_questions;
create policy "Bonus questions are public" on public.tip_bonus_questions for select using (true);

alter table public.tip_bonus_answers enable row level security;
drop policy if exists "Users can view own bonus answers" on public.tip_bonus_answers;
create policy "Users can view own bonus answers" on public.tip_bonus_answers
  for select using (auth.uid() = user_id);

-- ── Scoring ──────────────────────────────────────────────────────────────────
create or replace function public.tip_points(th integer, ta integer, rh integer, ra integer)
returns smallint
language sql
immutable
as $$
  select case
    when th = rh and ta = ra then 3
    when sign(th - ta) = sign(rh - ra) and th - ta = rh - ra then 2
    when sign(th - ta) = sign(rh - ra) then 1
    else 0
  end::smallint;
$$;

-- Score (or un-score) every tip of a match whose result / status changed, and
-- book the XP difference: 5 XP per point.
create or replace function public.score_match_tips()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with prev as (
    select user_id, coalesce(points, 0) as old_points
    from public.tips
    where match_id = new.id
  ),
  upd as (
    update public.tips t
       set points = case
             when new.status = 'FINISHED' and new.home_score is not null and new.away_score is not null
             then public.tip_points(t.home, t.away, new.home_score, new.away_score)
           end,
           updated_at = now()
     where t.match_id = new.id
       and t.points is distinct from case
             when new.status = 'FINISHED' and new.home_score is not null and new.away_score is not null
             then public.tip_points(t.home, t.away, new.home_score, new.away_score)
           end
    returning t.user_id, coalesce(t.points, 0) as new_points
  )
  update public.profiles p
     set xp_points = greatest(coalesce(p.xp_points, 0) + (upd.new_points - prev.old_points) * 5, 0),
         updated_at = now()
    from upd
    join prev using (user_id)
   where p.id = upd.user_id
     and upd.new_points <> prev.old_points;
  return new;
end;
$$;

drop trigger if exists tip_matches_score on public.tip_matches;
create trigger tip_matches_score
  after update of status, home_score, away_score on public.tip_matches
  for each row
  when (old.status is distinct from new.status
        or old.home_score is distinct from new.home_score
        or old.away_score is distinct from new.away_score)
  execute function public.score_match_tips();

-- Same for bonus questions once the answer is known.
create or replace function public.score_bonus_answers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with prev as (
    select user_id, coalesce(points, 0) as old_points
    from public.tip_bonus_answers
    where question_id = new.id
  ),
  upd as (
    update public.tip_bonus_answers a
       set points = case
             when new.answer_team_id is null then null
             when a.team_id = new.answer_team_id then new.points
             else 0
           end,
           updated_at = now()
     where a.question_id = new.id
    returning a.user_id, coalesce(a.points, 0) as new_points
  )
  update public.profiles p
     set xp_points = greatest(coalesce(p.xp_points, 0) + (upd.new_points - prev.old_points) * 5, 0),
         updated_at = now()
    from upd
    join prev using (user_id)
   where p.id = upd.user_id
     and upd.new_points <> prev.old_points;
  return new;
end;
$$;

drop trigger if exists tip_bonus_score on public.tip_bonus_questions;
create trigger tip_bonus_score
  after update of answer_team_id on public.tip_bonus_questions
  for each row
  when (old.answer_team_id is distinct from new.answer_team_id)
  execute function public.score_bonus_answers();

-- ── Player RPCs ──────────────────────────────────────────────────────────────
create or replace function public.place_tip(p_match bigint, p_home integer, p_away integer)
returns public.tips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tips;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if p_home not between 0 and 20 or p_away not between 0 and 20 then
    raise exception 'invalid_score';
  end if;
  if not exists (
    select 1 from public.tip_matches
    where id = p_match and kickoff > now() and status in ('SCHEDULED', 'TIMED')
  ) then
    raise exception 'tip_closed';
  end if;

  insert into public.tips (user_id, match_id, home, away)
  values (auth.uid(), p_match, p_home, p_away)
  on conflict (user_id, match_id)
  do update set home = excluded.home, away = excluded.away, updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.place_bonus_tip(p_question uuid, p_team integer)
returns public.tip_bonus_answers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q   public.tip_bonus_questions;
  v_row public.tip_bonus_answers;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select * into v_q from public.tip_bonus_questions where id = p_question;
  if v_q.id is null or v_q.closes_at <= now() or v_q.answer_team_id is not null then
    raise exception 'tip_closed';
  end if;
  -- The team must play in that competition season.
  if not exists (
    select 1 from public.tip_matches
    where competition = v_q.competition and season = v_q.season
      and (home_team_id = p_team or away_team_id = p_team)
  ) then
    raise exception 'invalid_team';
  end if;

  insert into public.tip_bonus_answers (user_id, question_id, team_id)
  values (auth.uid(), p_question, p_team)
  on conflict (user_id, question_id)
  do update set team_id = excluded.team_id, updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

-- Invite codes: no 0/O/1/I so they survive being read out loud.
create or replace function public.new_tip_group_code()
returns text
language plpgsql
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.tip_groups where code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function public.create_tip_group(p_name text)
returns public.tip_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.tip_groups;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if (select count(*) from public.tip_group_members where user_id = auth.uid()) >= 20 then
    raise exception 'too_many_groups';
  end if;
  insert into public.tip_groups (name, code, owner_id)
  values (trim(p_name), public.new_tip_group_code(), auth.uid())
  returning * into v_group;
  insert into public.tip_group_members (group_id, user_id) values (v_group.id, auth.uid());
  return v_group;
end;
$$;

create or replace function public.join_tip_group(p_code text)
returns public.tip_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.tip_groups;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select * into v_group from public.tip_groups where code = upper(trim(p_code));
  if v_group.id is null then
    raise exception 'group_not_found';
  end if;
  if exists (select 1 from public.tip_group_members where group_id = v_group.id and user_id = auth.uid()) then
    return v_group;
  end if;
  if (select count(*) from public.tip_group_members where user_id = auth.uid()) >= 20 then
    raise exception 'too_many_groups';
  end if;
  if (select count(*) from public.tip_group_members where group_id = v_group.id) >= 200 then
    raise exception 'group_full';
  end if;
  insert into public.tip_group_members (group_id, user_id) values (v_group.id, auth.uid());
  return v_group;
end;
$$;

create or replace function public.leave_tip_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.tip_group_members where group_id = p_group and user_id = auth.uid();
  -- The last member out closes the group.
  delete from public.tip_groups g
   where g.id = p_group
     and not exists (select 1 from public.tip_group_members m where m.group_id = g.id);
end;
$$;

-- Groups I'm in, with member counts.
create or replace function public.my_tip_groups()
returns table (id uuid, name text, code text, is_owner boolean, members bigint)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, g.code, g.owner_id = auth.uid(),
         (select count(*) from public.tip_group_members x where x.group_id = g.id)
  from public.tip_groups g
  join public.tip_group_members m on m.group_id = g.id and m.user_id = auth.uid()
  order by g.created_at;
$$;

-- "Dejan Morawietz" → "Dejan M." (rankings never show full names).
create or replace function public.tip_display_name(p_name text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(trim(p_name), '') = '' then 'Player'
    when split_part(trim(p_name), ' ', 2) = '' then split_part(trim(p_name), ' ', 1)
    else split_part(trim(p_name), ' ', 1) || ' ' || left(split_part(trim(p_name), ' ', 2), 1) || '.'
  end;
$$;

-- Ranking for the current season. Filters:
--   p_competition  null = all competitions
--   p_matchday     null = whole season (incl. bonus points), else that matchday
--   p_group        null = everyone, else members of that Tipprunde (caller must be one)
-- Returns the top p_limit rows plus the caller's own row.
create or replace function public.tip_leaderboard(
  p_competition text default null,
  p_matchday    integer default null,
  p_group       uuid default null,
  p_limit       integer default 100
)
returns table (
  rank bigint, user_id uuid, display_name text,
  points bigint, hits bigint, exact bigint, diffs bigint, tips bigint, is_me boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if p_group is not null and not public.is_tip_group_member(p_group) then
    raise exception 'not_a_member';
  end if;

  return query
  with scored as (
    select t.user_id,
           coalesce(t.points, 0) as pts,
           (t.points > 0)::int as hit,
           (t.points = 3)::int as ex,
           (t.points = 2)::int as df,
           1 as n
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where (p_competition is null or m.competition = p_competition)
      and (p_matchday is null or m.matchday = p_matchday)
    union all
    select a.user_id, coalesce(a.points, 0), 0, 0, 0, 0
    from public.tip_bonus_answers a
    join public.tip_bonus_questions q on q.id = a.question_id
    join public.tip_competitions c on c.code = q.competition and q.season = c.current_season
    where p_matchday is null
      and (p_competition is null or q.competition = p_competition)
  ),
  totals as (
    select s.user_id,
           sum(s.pts)::bigint as points, sum(s.hit)::bigint as hits,
           sum(s.ex)::bigint as exact, sum(s.df)::bigint as diffs, sum(s.n)::bigint as tips
    from scored s
    where p_group is null
       or s.user_id in (select gm.user_id from public.tip_group_members gm where gm.group_id = p_group)
    group by s.user_id
  ),
  ranked as (
    select rank() over (order by tt.points desc, tt.hits desc, tt.exact desc, tt.diffs desc) as rk,
           row_number() over (order by tt.points desc, tt.hits desc, tt.exact desc, tt.diffs desc, tt.user_id) as rn,
           tt.*
    from totals tt
  )
  select r.rk, r.user_id, public.tip_display_name(p.name),
         r.points, r.hits, r.exact, r.diffs, r.tips, r.user_id = auth.uid()
  from ranked r
  left join public.profiles p on p.id = r.user_id
  where r.rn <= p_limit or r.user_id = auth.uid()
  order by r.rn;
end;
$$;

grant execute on function public.place_tip(bigint, integer, integer) to authenticated;
grant execute on function public.place_bonus_tip(uuid, integer) to authenticated;
grant execute on function public.create_tip_group(text) to authenticated;
grant execute on function public.join_tip_group(text) to authenticated;
grant execute on function public.leave_tip_group(uuid) to authenticated;
grant execute on function public.my_tip_groups() to authenticated;
grant execute on function public.tip_leaderboard(text, integer, uuid, integer) to authenticated;
revoke execute on function public.tip_leaderboard(text, integer, uuid, integer) from anon;

-- Internal helpers are not part of the API.
revoke execute on function public.new_tip_group_code() from public, anon, authenticated;
revoke execute on function public.score_match_tips() from public, anon, authenticated;
revoke execute on function public.score_bonus_answers() from public, anon, authenticated;

-- ── Schedule ─────────────────────────────────────────────────────────────────
-- tippspiel-sync is deployed with --no-verify-jwt and rate-limits itself, so
-- the cron call needs no key:
--
--   select cron.schedule('tippspiel-sync', '*/10 * * * *',
--     $$ select net.http_post(
--          url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/tippspiel-sync',
--          headers := '{"Content-Type":"application/json"}'::jsonb,
--          body := '{}'::jsonb) $$);
