-- BETina App — Tippspiel: Tipprunde as a team against BETina
--
-- Per finished round (competition + matchday of the current season) the
-- group's average points — over the members who tipped in that round — take
-- on BETina's points on the same round. More points wins the round; the team
-- card counts rounds won : lost. Members who skip a round don't pull the
-- average down, members who tip only part of it simply score less.
-- Only rounds in which BETina tipped count (she started on 2026-10-23).

-- Internal: one row per decided round of a group. No membership check here,
-- so it is not callable by players (see revoke below).
create or replace function public.tip_group_rounds(p_group uuid)
returns table (
  competition text, matchday integer, first_kickoff timestamptz, last_kickoff timestamptz,
  team_avg numeric, players bigint, betina bigint, result text
)
language sql
stable
security definer
set search_path = public
as $$
  with members as (
    select gm.user_id from public.tip_group_members gm where gm.group_id = p_group
  ),
  rounds as (
    select m.competition, m.matchday, min(m.kickoff) as first_kickoff, max(m.kickoff) as last_kickoff
    from public.tip_matches m
    join public.tip_competitions c on c.code = m.competition and m.season = c.current_season
    where m.matchday is not null
    group by m.competition, m.matchday
    having bool_and(m.status in ('FINISHED', 'CANCELLED', 'AWARDED', 'POSTPONED', 'SUSPENDED'))
       and bool_or(m.status = 'FINISHED')
  ),
  member_round as (
    select m.competition, m.matchday, t.user_id, sum(coalesce(t.points, 0)) as pts
    from public.tips t
    join members mb on mb.user_id = t.user_id
    join public.tip_matches m on m.id = t.match_id
    join rounds r on r.competition = m.competition and r.matchday = m.matchday
    group by m.competition, m.matchday, t.user_id
  ),
  team as (
    select mr.competition, mr.matchday, round(avg(mr.pts), 1) as team_avg, count(*) as players
    from member_round mr
    group by mr.competition, mr.matchday
  ),
  bet as (
    select m.competition, m.matchday, sum(coalesce(b.points, 0)) as betina
    from public.betina_tips b
    join public.tip_matches m on m.id = b.match_id
    join rounds r on r.competition = m.competition and r.matchday = m.matchday
    group by m.competition, m.matchday
  )
  select r.competition, r.matchday, r.first_kickoff, r.last_kickoff,
         t.team_avg, t.players, b.betina::bigint,
         case when t.team_avg > b.betina then 'W' when t.team_avg < b.betina then 'L' else 'D' end
  from rounds r
  join team t on t.competition = r.competition and t.matchday = r.matchday
  join bet b on b.competition = r.competition and b.matchday = r.matchday;
$$;

revoke execute on function public.tip_group_rounds(uuid) from public, anon, authenticated;

-- The team card: rounds won/lost/drawn, point totals and the last 8 rounds.
create or replace function public.tip_group_duel(p_group uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_out jsonb;
begin
  if not public.is_tip_group_member(p_group) then
    raise exception 'not_a_member';
  end if;
  select jsonb_build_object(
    'won',    count(*) filter (where d.result = 'W'),
    'lost',   count(*) filter (where d.result = 'L'),
    'drawn',  count(*) filter (where d.result = 'D'),
    'team_points',   coalesce(sum(d.team_avg), 0),
    'betina_points', coalesce(sum(d.betina), 0),
    'rounds', coalesce((
      select jsonb_agg(jsonb_build_object(
               'competition', x.competition, 'matchday', x.matchday, 'team', x.team_avg,
               'betina', x.betina, 'players', x.players, 'result', x.result) order by x.first_kickoff desc)
      from (select * from public.tip_group_rounds(p_group) order by first_kickoff desc limit 8) x
    ), '[]'::jsonb)
  ) into v_out
  from public.tip_group_rounds(p_group) d;
  return v_out;
end;
$$;

grant execute on function public.tip_group_duel(uuid) to authenticated;
revoke execute on function public.tip_group_duel(uuid) from public, anon;

-- Host message: rounds decided in the last 2 days, per member, not yet sent
-- (trigger_log key team_duel:<group>:<competition>:<matchday>).
create or replace function public.tippspiel_team_results()
returns table (
  user_id uuid, name text, language text, push_token text, notify_push boolean,
  group_id uuid, group_name text, competition text, matchday integer,
  team_avg numeric, betina bigint, result text, log_key text
)
language sql
stable
security definer
set search_path = public
as $$
  select gm.user_id, pr.name, pr.language, pr.push_token, coalesce(pr.notify_tippspiel, true),
         g.id, g.name, r.competition, r.matchday, r.team_avg, r.betina, r.result,
         'team_duel:' || g.id || ':' || r.competition || ':' || r.matchday
  from public.tip_groups g
  cross join lateral public.tip_group_rounds(g.id) r
  join public.tip_group_members gm on gm.group_id = g.id
  join public.profiles pr on pr.id = gm.user_id
  where r.last_kickoff > now() - interval '2 days'
    and not exists (
      select 1 from public.trigger_log l
      where l.user_id = gm.user_id
        and l.trigger_key = 'team_duel:' || g.id || ':' || r.competition || ':' || r.matchday
    );
$$;

revoke execute on function public.tippspiel_team_results() from public, anon, authenticated;
grant execute on function public.tippspiel_team_results() to service_role;
