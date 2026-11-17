-- Community trend for the public matchday pages (web/landing/api/matchday.js):
-- how the players of the prediction game predicted each match of a matchday.
--
-- Only sums leave the database, never a single player's prediction:
--   · a match appears only once it has kicked off (before that, predictions
--     are secret in the game, and a trend would give them away), and
--   · only when at least five players predicted it, so that no small group
--     can be read out of the numbers.
create or replace function public.tip_matchday_trend(p_competition text, p_season integer, p_matchday integer)
returns table (
  match_id   bigint,
  players    integer,   -- predictions counted
  home_wins  integer,   -- of them: home win predicted
  draws      integer,
  away_wins  integer,
  top_home   smallint,  -- the score predicted most often
  top_away   smallint,
  top_count  integer,
  avg_points numeric    -- average points scored, null until the match is scored
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select m.id
    from public.tip_matches m
    where m.competition = p_competition and m.season = p_season and m.matchday = p_matchday
      and m.kickoff <= now()
  ),
  sums as (
    select t.match_id,
           count(*)::integer as players,
           count(*) filter (where t.home > t.away)::integer as home_wins,
           count(*) filter (where t.home = t.away)::integer as draws,
           count(*) filter (where t.home < t.away)::integer as away_wins,
           round(avg(t.points), 2) as avg_points
    from public.tips t
    join scope s on s.id = t.match_id
    group by t.match_id
    having count(*) >= 5
  ),
  top as (
    select distinct on (t.match_id) t.match_id, t.home, t.away, count(*)::integer as n
    from public.tips t
    join sums s on s.match_id = t.match_id
    group by t.match_id, t.home, t.away
    order by t.match_id, count(*) desc, t.home desc, t.away
  )
  select s.match_id, s.players, s.home_wins, s.draws, s.away_wins, top.home, top.away, top.n, s.avg_points
  from sums s
  join top on top.match_id = s.match_id;
$$;

revoke all on function public.tip_matchday_trend(text, integer, integer) from public;
grant execute on function public.tip_matchday_trend(text, integer, integer) to anon, authenticated, service_role;
