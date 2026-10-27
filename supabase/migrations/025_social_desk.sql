-- BETina on X — the social desk. The function social-desk (every minute,
-- pg_cron) writes BETina's posts from our own data — live scores, the
-- newsroom, history — into social_posts. social_settings.mode decides:
--   off     nothing is written or posted (the kill switch)
--   drafts  everything waits in the team dashboard; approved posts go out
--   auto    the safe kinds (auto_kinds) go out on their own; replies and
--           anything the filter flagged still wait for approval
-- Nothing reaches X until the X keys are set as Supabase secrets.

create table if not exists public.social_posts (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('matchday', 'poll', 'goal', 'result', 'news', 'history', 'reply')),
  status       text not null default 'draft'
               check (status in ('draft', 'approved', 'posting', 'posted', 'rejected', 'skipped', 'failed')),
  text         text not null,
  poll         text[],                         -- 2–4 options for a poll post
  context      text,                           -- what the post is based on, for the reviewer
  dedupe_key   text not null unique,           -- one post per goal, story, day, mention, …
  flags        text[] not null default '{}',   -- why the filter held it back
  reply_to     text,                           -- id of the X post we answer
  reply_author text,
  reply_text   text,
  expires_at   timestamptz,                    -- live posts go stale
  x_id         text,
  error        text,
  decided_by   uuid,
  decided_at   timestamptz,
  posted_at    timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists social_posts_status_idx on public.social_posts (status, created_at desc);
alter table public.social_posts enable row level security; -- service role + admin RPCs only

create table if not exists public.social_settings (
  id             int primary key default 1 check (id = 1),
  mode           text not null default 'drafts' check (mode in ('off', 'drafts', 'auto')),
  auto_kinds     text[] not null default '{matchday,poll,goal,result,news,history}',
  daily_limit    int not null default 20,
  lang           text not null default 'en',
  featured       jsonb not null default '{}'::jsonb, -- {"date": "YYYY-MM-DD", "ids": [fixture ids]}
  x_ready        boolean not null default false,     -- the function found the X keys
  x_user_id      text,
  mentions_since text,
  last_run       timestamptz not null default 'epoch',
  last_mentions  timestamptz not null default 'epoch',
  updated_at     timestamptz not null default now()
);
insert into public.social_settings (id) values (1) on conflict do nothing;
alter table public.social_settings enable row level security;

-- Legendary moments for BETina's time-travel posts: checked facts, so she
-- never has to remember them herself. The team can add more rows.
create table if not exists public.social_moments (
  id          bigint generated always as identity primary key,
  happened_on date not null,
  sport       text not null default 'football',
  title       text not null unique,
  facts       text not null,
  tags        text[] not null default '{}',
  last_used   date
);
alter table public.social_moments enable row level security;

-- One run at a time (the endpoint is public, like news-desk).
create or replace function public.social_desk_claim(p_min_seconds int default 50)
returns boolean
language sql volatile security definer set search_path = public
as $$
  with claimed as (
    update social_settings set last_run = now()
    where id = 1 and last_run < now() - make_interval(secs => p_min_seconds)
    returning 1
  )
  select exists (select 1 from claimed);
$$;
revoke all on function public.social_desk_claim(int) from public, anon, authenticated;
grant execute on function public.social_desk_claim(int) to service_role;

-- ── Team dashboard (admins only, see 024) ────────────────────────────────────
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
                           x_id, error, decided_at, posted_at, created_at
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

-- Approve (optionally with edited text) or reject a post.
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
  if p_text is not null and (length(trim(p_text)) = 0 or length(p_text) > 280) then
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
grant execute on function public.admin_social_decide(bigint, text, text) to authenticated;

create or replace function public.admin_social_mode(p_mode text)
returns void
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update social_settings set mode = p_mode, updated_at = now() where id = 1;
end;
$$;
grant execute on function public.admin_social_mode(text) to authenticated;

revoke execute on function public.admin_social(text, int) from anon;
revoke execute on function public.admin_social_decide(bigint, text, text) from anon;
revoke execute on function public.admin_social_mode(text) from anon;

-- ── Legendary moments (checked) ──────────────────────────────────────────────
insert into public.social_moments (happened_on, sport, title, facts, tags) values
  ('1930-07-30', 'football', 'First World Cup final', 'The first World Cup final, in Montevideo: hosts Uruguay beat Argentina 4–2.', '{Uruguay,Argentina}'),
  ('1950-07-16', 'football', 'Maracanazo', 'Decisive final-round match of the World Cup at the Maracanã, Rio de Janeiro: Uruguay 2–1 Brazil in front of roughly 200,000 people. Alcides Ghiggia scored the winner and Uruguay became world champions.', '{Uruguay,Brazil}'),
  ('1954-07-04', 'football', 'Miracle of Bern', 'World Cup final in Bern (Wankdorf Stadium): West Germany 3–2 Hungary. The favourites Hungary led 2–0 after eight minutes; Helmut Rahn scored the German winner in the 84th minute.', '{Germany,Hungary}'),
  ('1958-06-29', 'football', 'Pelé at 17', 'World Cup final in Solna, Sweden: Brazil 5–2 Sweden. 17-year-old Pelé scored twice; it was Brazil’s first World Cup title.', '{Brazil,Sweden}'),
  ('1966-07-30', 'football', 'Wembley 1966', 'World Cup final at Wembley: England 4–2 West Germany after extra time. Geoff Hurst scored a hat-trick; his second goal bounced down off the crossbar and is still debated as the “Wembley goal”.', '{England,Germany}'),
  ('1970-06-21', 'football', 'Brazil 1970', 'World Cup final at the Estadio Azteca, Mexico City: Brazil 4–1 Italy. Pelé won his third World Cup, and Carlos Alberto finished a famous team move for the fourth goal.', '{Brazil,Italy}'),
  ('1974-07-07', 'football', 'Munich 1974', 'World Cup final in Munich: West Germany 2–1 Netherlands. The Dutch scored a penalty in the second minute before a German player had touched the ball; Gerd Müller scored the German winner.', '{Germany,Netherlands}'),
  ('1974-10-30', 'boxing', 'Rumble in the Jungle', 'In Kinshasa, Zaire (today DR Congo), Muhammad Ali knocked out George Foreman in the eighth round to win back the world heavyweight title, with his “rope-a-dope” tactic.', '{"DR Congo",USA}'),
  ('1976-06-20', 'football', 'The Panenka', 'EURO final in Belgrade: Czechoslovakia and West Germany drew 2–2, Czechoslovakia won 5–3 on penalties. Antonín Panenka decided it with a softly chipped penalty down the middle — the “Panenka” was born.', '{Czechoslovakia,Germany}'),
  ('1976-07-18', 'gymnastics', 'Nadia’s perfect 10', 'Olympic Games in Montreal: 14-year-old Romanian gymnast Nadia Comăneci scored the first perfect 10 in Olympic gymnastics history. The scoreboard could only show it as 1.00.', '{Romania}'),
  ('1977-05-25', 'football', 'Liverpool’s first European Cup', 'European Cup final in Rome: Liverpool 3–1 Borussia Mönchengladbach — Liverpool’s first European Cup.', '{England,Germany}'),
  ('1978-06-21', 'football', 'Córdoba', 'World Cup in Argentina, in Córdoba: Austria 3–2 West Germany, Hans Krankl scored twice including the winner. The Austrian radio call “I wer’ narrisch!” became legendary.', '{Austria,Germany}'),
  ('1980-02-22', 'ice hockey', 'Miracle on Ice', 'Olympic ice hockey in Lake Placid: a team of US college players beat the Soviet Union 4–3 — the “Miracle on Ice”.', '{USA}'),
  ('1982-07-08', 'football', 'Seville 1982', 'World Cup semi-final in Seville: West Germany and France drew 3–3 after extra time, West Germany won 5–4 on penalties — the first World Cup match ever decided by a penalty shoot-out.', '{Germany,France}'),
  ('1986-05-07', 'football', 'Duckadam’s night', 'European Cup final in Seville: Steaua Bucharest and Barcelona drew 0–0 after extra time, Steaua won 2–0 on penalties. Goalkeeper Helmuth Duckadam saved all four Barcelona penalties.', '{Romania,Spain}'),
  ('1986-06-22', 'football', 'Hand of God', 'World Cup quarter-final at the Estadio Azteca, Mexico City: Argentina 2–1 England. Diego Maradona scored with his hand in the 51st minute (“the hand of God”), and four minutes later dribbled past half the England team for the “Goal of the Century”.', '{Argentina,England}'),
  ('1990-06-08', 'football', 'Cameroon stun Argentina', 'Opening match of the World Cup in Milan: Cameroon 1–0 reigning champions Argentina. François Omam-Biyik scored with a header, and Cameroon held on despite finishing with nine men.', '{Cameroon,Argentina}'),
  ('1990-07-08', 'football', 'Rome 1990', 'World Cup final in Rome: West Germany 1–0 Argentina, Andreas Brehme scored a penalty in the 85th minute. Franz Beckenbauer became world champion as a player and as a coach.', '{Germany,Argentina}'),
  ('1992-06-26', 'football', 'Danish dynamite', 'EURO final in Gothenburg: Denmark 2–0 Germany. Denmark had only joined the tournament shortly before it began, replacing Yugoslavia.', '{Denmark,Germany}'),
  ('1993-09-05', 'football', 'Argentina 0–5 Colombia', 'World Cup qualifier in Buenos Aires: Argentina 0–5 Colombia. Freddy Rincón and Faustino Asprilla scored twice each.', '{Colombia,Argentina}'),
  ('1996-06-30', 'football', 'Golden goal', 'EURO final at Wembley: Germany 2–1 Czech Republic. Oliver Bierhoff scored both German goals — the winner was the first golden goal to decide a major tournament final.', '{Germany,"Czech Republic"}'),
  ('1998-07-12', 'football', 'France 1998', 'World Cup final at the Stade de France, Saint-Denis: France 3–0 Brazil. Zinedine Zidane scored two headers; France won its first World Cup, at home.', '{France,Brazil}'),
  ('1999-05-26', 'football', 'Camp Nou 1999', 'Champions League final at Camp Nou, Barcelona: Manchester United 2–1 Bayern Munich. Bayern led until stoppage time, then Teddy Sheringham and Ole Gunnar Solskjær scored within about two minutes.', '{England,Germany}'),
  ('2001-05-19', 'football', 'Champions of hearts', 'Last day of the Bundesliga season: Schalke beat Unterhaching 5–3 and celebrated the title for a few minutes — until Bayern equalised in Hamburg in stoppage time with a Patrik Andersson free kick and became champions. Schalke were the “Meister der Herzen”.', '{Germany}'),
  ('2002-05-31', 'football', 'Senegal stun France', 'Opening match of the World Cup in Seoul: Senegal 1–0 reigning champions France. Papa Bouba Diop scored in Senegal’s first ever World Cup match.', '{Senegal,France}'),
  ('2002-06-29', 'football', '11 seconds', 'World Cup third-place match in Daegu: Hakan Şükür scored for Turkey after 11 seconds against South Korea, the fastest goal in World Cup history. Turkey won 3–2.', '{Turkey,"South Korea"}'),
  ('2002-06-30', 'football', 'Ronaldo’s final', 'World Cup final in Yokohama: Brazil 2–0 Germany. Ronaldo scored both goals and finished as top scorer with eight; it was Brazil’s fifth World Cup.', '{Brazil,Germany}'),
  ('2004-07-04', 'football', 'Greece 2004', 'EURO final in Lisbon: Greece 1–0 hosts Portugal, Angelos Charisteas scored with a header. Greece had started the tournament as huge outsiders.', '{Greece,Portugal}'),
  ('2005-05-25', 'football', 'Istanbul 2005', 'Champions League final in Istanbul (Atatürk Olympic Stadium): Liverpool were 3–0 down to AC Milan at half time, scored three goals in six minutes, drew 3–3 and won 3–2 on penalties. Jerzy Dudek saved Andriy Shevchenko’s decisive penalty.', '{England,Italy}'),
  ('2006-07-09', 'football', 'Berlin 2006', 'World Cup final in Berlin: Italy and France drew 1–1 after extra time, Italy won 5–3 on penalties. Zinedine Zidane, in his last match, was sent off in extra time for a headbutt on Marco Materazzi.', '{Italy,France}'),
  ('2008-06-29', 'football', 'Vienna 2008', 'EURO final in Vienna: Spain 1–0 Germany, Fernando Torres scored. Spain’s first major title since 1964.', '{Spain,Germany,Austria}'),
  ('2008-07-06', 'tennis', 'Wimbledon 2008', 'Wimbledon final: Rafael Nadal beat Roger Federer 6–4, 6–4, 6–7, 6–7, 9–7 in a match of almost five hours, often called the greatest tennis match ever played.', '{Spain,Switzerland}'),
  ('2009-08-16', 'athletics', 'Bolt 9.58', '100 metres final at the World Championships in Berlin: Usain Bolt ran 9.58 seconds, a world record.', '{Jamaica,Germany}'),
  ('2010-07-02', 'football', 'Suárez on the line', 'World Cup quarter-final in Johannesburg: Uruguay and Ghana drew 1–1. In the last minute of extra time Luis Suárez stopped a goal-bound header with his hands on the line, Asamoah Gyan’s penalty hit the bar, and Uruguay won the shoot-out 4–2.', '{Uruguay,Ghana}'),
  ('2010-07-11', 'football', 'Iniesta 116', 'World Cup final in Johannesburg: Spain 1–0 Netherlands after extra time, Andrés Iniesta scored in the 116th minute. Spain’s first World Cup title.', '{Spain,Netherlands}'),
  ('2012-05-13', 'football', 'Agüerooo', 'Last day of the Premier League season: Manchester City 3–2 QPR. City were 2–1 down in stoppage time, scored twice — Sergio Agüero’s winner came at 93:20 — and won their first league title in 44 years, on goal difference ahead of Manchester United.', '{England}'),
  ('2013-05-25', 'football', 'Wembley 2013', 'Champions League final at Wembley, the first all-German final: Bayern Munich 2–1 Borussia Dortmund, Arjen Robben scored the winner in the 89th minute.', '{Germany}'),
  ('2014-07-08', 'football', 'The 7:1', 'World Cup semi-final in Belo Horizonte: Germany 7–1 hosts Brazil. Germany led 5–0 after 29 minutes, and Miroslav Klose became the World Cup’s all-time top scorer with his 16th goal.', '{Germany,Brazil}'),
  ('2014-07-13', 'football', 'Götze 113', 'World Cup final at the Maracanã, Rio de Janeiro: Germany 1–0 Argentina after extra time. Substitute Mario Götze scored in the 113th minute.', '{Germany,Argentina}'),
  ('2016-05-02', 'football', 'Leicester champions', 'Leicester City became Premier League champions when Tottenham drew 2–2 at Chelsea. The season before, Leicester had only just escaped relegation.', '{England}'),
  ('2016-06-19', 'basketball', 'Cavs comeback', 'Game 7 of the NBA Finals: the Cleveland Cavaliers beat the Golden State Warriors 93–89 and became the first team to come back from 3–1 down in the Finals.', '{USA}'),
  ('2016-07-10', 'football', 'Éder 109', 'EURO final at the Stade de France: Portugal 1–0 hosts France after extra time. Cristiano Ronaldo had to come off early and cheered from the sideline; substitute Éder scored the winner in the 109th minute.', '{Portugal,France}'),
  ('2017-03-08', 'football', 'La Remontada', 'Champions League round of 16, second leg at Camp Nou: Barcelona 6–1 Paris Saint-Germain after losing the first leg 4–0. Sergi Roberto scored the decisive sixth goal in the 95th minute.', '{Spain,France}'),
  ('2018-07-11', 'football', 'Croatia into the final', 'World Cup semi-final in Moscow: Croatia 2–1 England after extra time, Mario Mandžukić scored the winner in the 109th minute. Croatia reached its first World Cup final.', '{Croatia,England}'),
  ('2018-07-15', 'football', 'Moscow 2018', 'World Cup final in Moscow: France 4–2 Croatia. Croatia, a country of about four million people, had reached its first final; Luka Modrić was named the tournament’s best player.', '{France,Croatia}'),
  ('2019-05-07', 'football', 'Corner taken quickly', 'Champions League semi-final second leg at Anfield: Liverpool 4–0 Barcelona after losing the first leg 3–0. The fourth goal came from a quickly taken corner by Trent Alexander-Arnold, finished by Divock Origi.', '{England,Spain}'),
  ('2019-10-12', 'athletics', 'Sub-two in Vienna', 'In Vienna, Eliud Kipchoge ran a marathon in 1:59:40, the first person to cover the distance in under two hours (in a specially organised, unofficial race).', '{Kenya,Austria}'),
  ('2021-07-11', 'football', 'Wembley 2021', 'EURO 2020 final at Wembley, played in 2021: Italy and England drew 1–1 after extra time, Italy won 3–2 on penalties. Gianluigi Donnarumma saved two penalties.', '{Italy,England}'),
  ('2022-12-10', 'football', 'Morocco’s semi-final', 'World Cup quarter-final in Qatar: Morocco 1–0 Portugal, Youssef En-Nesyri scored with a header. Morocco became the first African team ever to reach a World Cup semi-final.', '{Morocco,Portugal}'),
  ('2022-12-18', 'football', 'Lusail 2022', 'World Cup final in Lusail, Qatar: Argentina and France drew 3–3 after extra time, Argentina won 4–2 on penalties. Lionel Messi scored twice, Kylian Mbappé scored a hat-trick.', '{Argentina,France}')
on conflict (title) do nothing;

-- Every minute; the function itself decides what is due (claim: one run at a time).
select cron.unschedule('social-desk') where exists (select 1 from cron.job where jobname = 'social-desk');
select cron.schedule('social-desk', '* * * * *',
  $$ select net.http_post(
       url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/social-desk',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 55000) $$);
