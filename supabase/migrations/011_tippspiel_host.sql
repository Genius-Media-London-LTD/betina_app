-- BETina App — Tippspiel host messages
--
-- Queries behind BETina's Tippspiel messages, called by the tippspiel-sync
-- Edge Function (service role). They return push tokens, so they are NOT
-- callable by players (execute revoked from anon/authenticated below).
--
-- A player counts as "playing" a competition once they have tipped at least
-- one match of its current season — no separate opt-in needed. Cooldowns use
-- trigger_log (006_proactive_triggers.sql).

-- Players with untipped matches kicking off in 40–80 minutes (one reminder
-- per player per 12 hours at most).
create or replace function public.tippspiel_reminder_targets()
returns table (
  user_id uuid, name text, language text, push_token text, notify_betina boolean,
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
  players as (
    select distinct t.user_id, m.competition
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
  select o.user_id, pr.name, pr.language, pr.push_token, coalesce(pr.notify_betina, true),
         o.open_count, o.first_kickoff
  from open_tips o
  join public.profiles pr on pr.id = o.user_id
  where not exists (
    select 1 from public.trigger_log l
    where l.user_id = o.user_id and l.trigger_key = 'tip_reminder' and l.sent_at > now() - interval '12 hours'
  );
$$;

-- Day recap: players whose tips of a (UTC) day are all scored, not yet recapped.
create or replace function public.tippspiel_recap_targets()
returns table (
  user_id uuid, name text, language text, push_token text, notify_betina boolean,
  day date, points bigint, scored bigint, exact bigint, best text
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
           m.status,
           coalesce(m.home_short, m.home_name) || ' ' || m.home_score || ':' || m.away_score || ' ' || coalesce(m.away_short, m.away_name) as result
    from public.tips t
    join public.tip_matches m on m.id = t.match_id
    where m.kickoff >= date_trunc('day', now() at time zone 'utc') - interval '1 day'
      and m.kickoff < now()
  ),
  per_day as (
    select d.user_id, d.day,
           sum(coalesce(d.points, 0))::bigint as points,
           count(*) filter (where d.points is not null) as scored,
           count(*) filter (where d.points = 3) as exact,
           (array_agg(d.result order by d.points desc nulls last))[1] as best
    from day_tips d
    group by d.user_id, d.day
    having count(*) filter (where d.points is null and d.status not in ('CANCELLED', 'POSTPONED', 'SUSPENDED', 'AWARDED')) = 0
       and count(*) filter (where d.points is not null) > 0
  )
  select p.user_id, pr.name, pr.language, pr.push_token, coalesce(pr.notify_betina, true),
         p.day, p.points, p.scored, p.exact, p.best
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
