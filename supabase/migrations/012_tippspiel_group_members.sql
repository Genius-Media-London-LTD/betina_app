-- BETina App — Tippspiel: list every Tipprunde member in its ranking
--
-- tip_leaderboard() built the table from tips only, so a friend who just
-- joined a group was invisible until their first tip. In group mode every
-- member now gets a zero row (tips count stays 0, so global rankings are
-- unchanged).

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
    union all
    -- In a Tipprunde every member is listed, also before their first tip.
    select gm.user_id, 0, 0, 0, 0, 0
    from public.tip_group_members gm
    where gm.group_id = p_group
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

