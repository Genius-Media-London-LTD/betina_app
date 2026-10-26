-- BETina Live: what a player follows (teams, single matches, leagues — ids
-- from API-Football) and where the goal-push sweep (live-alerts) left off.

create table if not exists public.live_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('team', 'match', 'league')),
  ref        bigint not null,
  label      text,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
create index if not exists live_follows_ref on public.live_follows (kind, ref);

alter table public.live_follows enable row level security;
drop policy if exists "own live follows" on public.live_follows;
create policy "own live follows" on public.live_follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Single row: the last incident sequence number live-alerts has handled.
create table if not exists public.live_alert_state (
  id         int primary key default 1 check (id = 1),
  seq        bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.live_alert_state (id, seq) values (1, 0) on conflict do nothing;
alter table public.live_alert_state enable row level security; -- service role only

-- Goal pushes (live-alerts) run every 30 seconds — scheduled separately once
-- Dejan gives the go (they reach real players):
--   select cron.schedule('live-alerts', '30 seconds',
--     $$ select net.http_post(
--          url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/live-alerts',
--          headers := '{"Content-Type":"application/json"}'::jsonb,
--          body := '{}'::jsonb,
--          timeout_milliseconds := 25000) $$);
