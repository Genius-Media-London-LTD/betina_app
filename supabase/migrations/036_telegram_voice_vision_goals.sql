-- BETina on Telegram, more than text (asked by Dejan 2026-11-15):
--   voice notes   she sends a short voice message now and then (send_voice).
--                 The audio is made on betina-server (/v1/tts, where the
--                 OpenAI key lives). The function hands the server a one-time
--                 ticket so nobody else can use that endpoint.
--   photos in     she looks at photos people send her (not stored anywhere).
--   goal alerts   she texts the goals and the final score of the club they
--                 love (follow_team; sent by live-alerts).

alter table public.telegram_chats
  add column if not exists team        text,                    -- the club she alerts them about, as the live feed names it
  add column if not exists team_id     int,                     -- its id in the live feed (API-Football)
  add column if not exists voice_day   date,
  add column if not exists voice_count int not null default 0,  -- voice notes she sent that day
  add column if not exists seen_day    date,
  add column if not exists seen_count  int not null default 0;  -- photos of theirs she looked at that day

create index if not exists telegram_chats_team_id on public.telegram_chats (team_id) where team_id is not null;

create table if not exists public.tts_tickets (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.tts_tickets enable row level security; -- service role only

-- betina-server redeems a ticket (once, within two minutes) before it speaks.
create or replace function public.claim_tts_ticket(p_ticket uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  delete from public.tts_tickets where created_at < now() - interval '10 minutes';
  delete from public.tts_tickets
   where id = p_ticket and created_at > now() - interval '2 minutes'
  returning true into ok;
  return coalesce(ok, false);
end;
$$;
revoke all on function public.claim_tts_ticket(uuid) from public;
grant execute on function public.claim_tts_ticket(uuid) to anon, authenticated, service_role;
