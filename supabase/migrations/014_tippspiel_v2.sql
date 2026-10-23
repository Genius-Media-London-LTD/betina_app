-- BETina App — Tippspiel v2
--
--   • "Beat BETina": BETina tips every match herself (betina_tips, written by
--     tippspiel-sync). Her tips become visible at kickoff only — before that
--     they would read like tip recommendations — and she appears in every
--     ranking and every Tipprunde as a fixed rival.
--   • Favourite competitions (tip_user_competitions): the player picks what
--     they tip; reminders follow that choice.
--   • Ranking trend arrows (prev_rank = table before the latest round) and
--     personal stats (tip_my_stats).
--   • Own on/off switch for Tippspiel pushes (profiles.notify_tippspiel).

alter table public.profiles
  add column if not exists notify_tippspiel boolean default true;

-- ── Favourite competitions ───────────────────────────────────────────────────
create table if not exists public.tip_user_competitions (
  user_id     uuid references auth.users(id) on delete cascade not null,
  competition text references public.tip_competitions(code) not null,
  created_at  timestamptz default now(),
  primary key (user_id, competition)
);

alter table public.tip_user_competitions enable row level security;
drop policy if exists "Users can view own competitions" on public.tip_user_competitions;
create policy "Users can view own competitions" on public.tip_user_competitions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can add own competitions" on public.tip_user_competitions;
create policy "Users can add own competitions" on public.tip_user_competitions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can remove own competitions" on public.tip_user_competitions;
create policy "Users can remove own competitions" on public.tip_user_competitions
  for delete using (auth.uid() = user_id);

-- ── BETina's own tips ────────────────────────────────────────────────────────
create table if not exists public.betina_tips (
  match_id   bigint primary key references public.tip_matches(id) on delete cascade,
  home       smallint not null check (home between 0 and 20),
  away       smallint not null check (away between 0 and 20),
  points     smallint,
  created_at timestamptz default now()
);

alter table public.betina_tips enable row level security;
drop policy if exists "BETina's tips are visible from kickoff" on public.betina_tips;
create policy "BETina's tips are visible from kickoff" on public.betina_tips
  for select using (exists (select 1 from public.tip_matches m where m.id = match_id and m.kickoff <= now()));

-- Scoring: players (with XP, see 010) and BETina (no XP).
create or replace function public.score_match_tips()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_final boolean := new.status = 'FINISHED' and new.home_score is not null and new.away_score is not null;
begin
  with prev as (
    select user_id, coalesce(points, 0) as old_points
    from public.tips
    where match_id = new.id
  ),
  upd as (
    update public.tips t
       set points = case when v_final then public.tip_points(t.home, t.away, new.home_score, new.away_score) end,
           updated_at = now()
     where t.match_id = new.id
       and t.points is distinct from case when v_final then public.tip_points(t.home, t.away, new.home_score, new.away_score) end
    returning t.user_id, coalesce(t.points, 0) as new_points
  )
  update public.profiles p
     set xp_points = greatest(coalesce(p.xp_points, 0) + (upd.new_points - prev.old_points) * 5, 0),
         updated_at = now()
    from upd
    join prev using (user_id)
   where p.id = upd.user_id
     and upd.new_points <> prev.old_points;

  update public.betina_tips b
     set points = case when v_final then public.tip_points(b.home, b.away, new.home_score, new.away_score) end
   where b.match_id = new.id;
  return new;
end;
$$;

-- ── Ranking v2: BETina row, trend arrows ─────────────────────────────────────
drop function if exists public.tip_leaderboard(text, integer, uuid, integer);
create function public.tip_leaderboard(
  p_competition text default null,
  p_matchday    integer default null,
  p_group       uuid default null,
  p_limit       integer default 100
)
returns table (
  rank bigint, prev_rank bigint, user_id uuid, display_name text,
  points bigint, hits bigint, exact bigint, diffs bigint, tips bigint,
  is_me boolean, is_betina boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  -- BETina's fixed id in rankings (not an account).
  v_betina constant uuid := '0000be71-0a00-4000-8000-000000000001';
  v_cutoff timestamptz;
begin
  if p_group is not null and not public.is_tip_group_member(p_group) then
    raise exception 'not_a_member';
  end if;

  -- Trend arrows compare with the table before the latest round: for one
  -- competition its last matchday with a result, across all competitions the
  -- last 7 days. No arrows on a single-matchday table.
  if p_matchday is null then
    if p_competition is not null then
      select min(m.kickoff) into v_cutoff
      from public.tip_matches m
      join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
      where m.competition = p_competition
        and m.matchday = (
          select max(x.matchday)
          from public.tip_matches x
          join public.tip_competitions cx on cx.code = x.competition and x.season = cx.current_season
          where x.competition = p_competition and x.status = 'FINISHED'
        );
    else
      v_cutoff := now() - interval '7 days';
    end if;
  end if;

  return query
  with scored as (
    select t.user_id,
           coalesce(t.points, 0) as pts, (t.points > 0)::int as hit, (t.points = 3)::int as ex, (t.points = 2)::int as df,
           1 as n, m.kickoff as ko
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where (p_competition is null or m.competition = p_competition)
      and (p_matchday is null or m.matchday = p_matchday)
    union all
    -- BETina counts from kickoff, when her tip becomes visible.
    select v_betina,
           coalesce(b.points, 0), (b.points > 0)::int, (b.points = 3)::int, (b.points = 2)::int,
           1, m.kickoff
    from public.betina_tips b
    join public.tip_matches m on m.id = b.match_id
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where m.kickoff <= now()
      and (p_competition is null or m.competition = p_competition)
      and (p_matchday is null or m.matchday = p_matchday)
    union all
    select a.user_id, coalesce(a.points, 0), 0, 0, 0, 0, null::timestamptz
    from public.tip_bonus_answers a
    join public.tip_bonus_questions q on q.id = a.question_id
    join public.tip_competitions c on c.code = q.competition and q.season = c.current_season
    where p_matchday is null
      and (p_competition is null or q.competition = p_competition)
    union all
    -- In a Tipprunde every member is listed, also before their first tip.
    select gm.user_id, 0, 0, 0, 0, 0, null::timestamptz
    from public.tip_group_members gm
    where gm.group_id = p_group
  ),
  totals as (
    select s.user_id,
           sum(s.pts)::bigint as points, sum(s.hit)::bigint as hits,
           sum(s.ex)::bigint as exact, sum(s.df)::bigint as diffs, sum(s.n)::bigint as tips,
           sum(case when s.ko is null or s.ko < v_cutoff then s.pts else 0 end)::bigint as p_points,
           sum(case when s.ko is null or s.ko < v_cutoff then s.hit else 0 end)::bigint as p_hits,
           sum(case when s.ko is null or s.ko < v_cutoff then s.ex else 0 end)::bigint as p_exact,
           sum(case when s.ko is null or s.ko < v_cutoff then s.df else 0 end)::bigint as p_diffs,
           sum(case when s.ko < v_cutoff then s.n else 0 end)::bigint as p_tips
    from scored s
    where p_group is null
       or s.user_id = v_betina
       or s.user_id in (select gm.user_id from public.tip_group_members gm where gm.group_id = p_group)
    group by s.user_id
  ),
  ranked as (
    select rank() over (order by tt.points desc, tt.hits desc, tt.exact desc, tt.diffs desc) as rk,
           rank() over (order by tt.p_points desc, tt.p_hits desc, tt.p_exact desc, tt.p_diffs desc) as prk,
           row_number() over (order by tt.points desc, tt.hits desc, tt.exact desc, tt.diffs desc, tt.user_id) as rn,
           tt.*
    from totals tt
  )
  select r.rk,
         case when v_cutoff is not null and r.p_tips > 0 then r.prk end,
         r.user_id,
         case when r.user_id = v_betina then 'BETina' else public.tip_display_name(p.name) end,
         r.points, r.hits, r.exact, r.diffs, r.tips,
         r.user_id = auth.uid(),
         r.user_id = v_betina
  from ranked r
  left join public.profiles p on p.id = r.user_id
  where r.rn <= p_limit or r.user_id = auth.uid() or r.user_id = v_betina
  order by r.rn;
end;
$$;

grant execute on function public.tip_leaderboard(text, integer, uuid, integer) to authenticated;
revoke execute on function public.tip_leaderboard(text, integer, uuid, integer) from public, anon;

-- ── Personal stats ───────────────────────────────────────────────────────────
-- Totals, hit rate inputs, best round, scoring streak (rounds in a row with
-- points), the last 12 rounds for the chart, and the duel against BETina on
-- the matches both tipped.
create or replace function public.tip_my_stats(p_competition text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then
    return null;
  end if;

  with mine as (
    select t.match_id, t.points, m.competition, m.matchday, m.kickoff, m.status
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where t.user_id = v_uid
      and (p_competition is null or m.competition = p_competition)
  ),
  rounds as (
    select competition, matchday, min(kickoff) as ko, sum(coalesce(points, 0))::int as pts, count(*)::int as n
    from mine
    where matchday is not null
    group by competition, matchday
    having bool_and(points is not null or status in ('CANCELLED', 'POSTPONED', 'SUSPENDED', 'AWARDED'))
       and count(*) filter (where points is not null) > 0
  ),
  ordered as (
    select r.*, row_number() over (order by r.ko desc) as rn
    from rounds r
  ),
  duel as (
    select sum(coalesce(mi.points, 0))::int as me, sum(coalesce(b.points, 0))::int as betina, count(*)::int as matches
    from mine mi
    join public.betina_tips b on b.match_id = mi.match_id
    where mi.points is not null and b.points is not null
  )
  select jsonb_build_object(
    'tips',     (select count(*) from mine),
    'scored',   (select count(*) from mine where points is not null),
    'points',   (select coalesce(sum(points), 0) from mine),
    'exact',    (select count(*) from mine where points = 3),
    'diffs',    (select count(*) from mine where points = 2),
    'tendency', (select count(*) from mine where points = 1),
    'misses',   (select count(*) from mine where points = 0),
    'best_round', (
      select jsonb_build_object('competition', competition, 'matchday', matchday, 'points', pts)
      from rounds order by pts desc, ko desc limit 1
    ),
    'streak', coalesce(
      (select min(rn) - 1 from ordered where pts = 0),
      (select count(*) from ordered)
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('competition', competition, 'matchday', matchday, 'points', pts) order by ko), '[]'::jsonb)
      from ordered where rn <= 12
    ),
    'duel', (select jsonb_build_object('me', coalesce(me, 0), 'betina', coalesce(betina, 0), 'matches', matches) from duel)
  ) into v_out;
  return v_out;
end;
$$;

grant execute on function public.tip_my_stats(text) to authenticated;
revoke execute on function public.tip_my_stats(text) from public, anon;

-- ── Host messages v2: favourite competitions + Tippspiel push switch ────────
drop function if exists public.tippspiel_reminder_targets();
create function public.tippspiel_reminder_targets()
returns table (
  user_id uuid, name text, language text, push_token text, notify_push boolean,
  open_count bigint, first_kickoff timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with soon as (
    select m.id, m.competition, m.kickoff
    from public.tip_matches m
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where m.status in ('SCHEDULED', 'TIMED')
      and m.kickoff >  now() + interval '40 minutes'
      and m.kickoff <= now() + interval '80 minutes'
  ),
  -- Playing = picked the competition, or tipped one of its matches this season.
  players as (
    select uc.user_id, uc.competition from public.tip_user_competitions uc
    union
    select t.user_id, m.competition
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
  ),
  open_tips as (
    select p.user_id, count(*) as open_count, min(s.kickoff) as first_kickoff
    from players p
    join soon s on s.competition = p.competition
    where not exists (select 1 from public.tips t where t.user_id = p.user_id and t.match_id = s.id)
    group by p.user_id
  )
  select o.user_id, pr.name, pr.language, pr.push_token, coalesce(pr.notify_tippspiel, true),
         o.open_count, o.first_kickoff
  from open_tips o
  join public.profiles pr on pr.id = o.user_id
  where not exists (
    select 1 from public.trigger_log l
    where l.user_id = o.user_id and l.trigger_key = 'tip_reminder' and l.sent_at > now() - interval '12 hours'
  );
$$;

drop function if exists public.tippspiel_recap_targets();
create function public.tippspiel_recap_targets()
returns table (
  user_id uuid, name text, language text, push_token text, notify_push boolean,
  day date, points bigint, scored bigint, exact bigint, best text, betina_points bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with day_tips as (
    select t.user_id,
           (m.kickoff at time zone 'utc')::date as day,
           t.points,
           b.points as betina_points,
           m.status,
           coalesce(m.home_short, m.home_name) || ' ' || m.home_score || ':' || m.away_score || ' ' || coalesce(m.away_short, m.away_name) as result
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    left join public.betina_tips b on b.match_id = t.match_id
    where m.kickoff >= date_trunc('day', now() at time zone 'utc') - interval '1 day'
      and m.kickoff < now()
  ),
  per_day as (
    select d.user_id, d.day,
           sum(coalesce(d.points, 0))::bigint as points,
           count(*) filter (where d.points is not null) as scored,
           count(*) filter (where d.points = 3) as exact,
           (array_agg(d.result order by d.points desc nulls last))[1] as best,
           sum(coalesce(d.betina_points, 0))::bigint as betina_points
    from day_tips d
    group by d.user_id, d.day
    having count(*) filter (where d.points is null and d.status not in ('CANCELLED', 'POSTPONED', 'SUSPENDED', 'AWARDED')) = 0
       and count(*) filter (where d.points is not null) > 0
  )
  select p.user_id, pr.name, pr.language, pr.push_token, coalesce(pr.notify_tippspiel, true),
         p.day, p.points, p.scored, p.exact, p.best, p.betina_points
  from per_day p
  join public.profiles pr on pr.id = p.user_id
  where not exists (
    select 1 from public.trigger_log l
    where l.user_id = p.user_id and l.trigger_key = 'tip_recap:' || p.day::text
  );
$$;

revoke execute on function public.tippspiel_reminder_targets() from public, anon, authenticated;
revoke execute on function public.tippspiel_recap_targets() from public, anon, authenticated;
grant execute on function public.tippspiel_reminder_targets() to service_role;
grant execute on function public.tippspiel_recap_targets() to service_role;
