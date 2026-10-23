-- BETina App — Tippspiel: show that BETina has tipped, without the score
--
-- betina_tips rows are readable only from kickoff (014_tippspiel_v2.sql), so
-- before kickoff the app couldn't tell whether BETina had tipped at all and
-- players assumed she hadn't. This returns just the match ids she has tipped,
-- never her scores, so cards can say "BETina has tipped · revealed at kickoff".

create or replace function public.betina_tipped(p_matches bigint[])
returns setof bigint
language sql
stable
security definer
set search_path = public
as $$
  select b.match_id from public.betina_tips b where b.match_id = any(p_matches);
$$;

grant execute on function public.betina_tipped(bigint[]) to authenticated;
revoke execute on function public.betina_tipped(bigint[]) from public, anon;
