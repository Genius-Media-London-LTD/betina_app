-- BETina on Telegram (asked by Dejan 2026-11-14): anyone can chat with BETina
-- in a private Telegram chat. The function telegram-bot receives Telegram's
-- webhook and answers with the same persona as the app chat — but without an
-- app account: no GeniusBet account data, no Tippspiel, no reminders.
--   telegram_chats    one row per Telegram user: the running conversation,
--                     what she remembers, and today's message count (limit)
--   telegram_updates  Telegram update ids already handled (webhook retries)
-- Both tables are for the service role only. /forget in the chat deletes the row.

create table if not exists public.telegram_chats (
  chat_id     bigint primary key,              -- Telegram chat id (= user id in a private chat)
  first_name  text,
  lang        text not null default 'en',
  history     jsonb not null default '[]'::jsonb,  -- [{role, content}], newest last, capped by the function
  memories    text[] not null default '{}',
  msg_day     date not null default current_date,
  msg_count   int not null default 0,          -- messages on msg_day (daily limit)
  msg_total   int not null default 0,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
alter table public.telegram_chats enable row level security; -- service role only

create table if not exists public.telegram_updates (
  update_id   bigint primary key,
  created_at  timestamptz not null default now()
);
create index if not exists telegram_updates_created_idx on public.telegram_updates (created_at);
alter table public.telegram_updates enable row level security; -- service role only

-- Dashboard: how many people talk to her on Telegram.
create or replace function public.admin_telegram()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return (select jsonb_build_object(
    'users', count(*),
    'active_24h', count(*) filter (where last_seen > now() - interval '24 hours'),
    'active_7d', count(*) filter (where last_seen > now() - interval '7 days'),
    'messages_today', coalesce(sum(msg_count) filter (where msg_day = current_date), 0),
    'messages_total', coalesce(sum(msg_total), 0)
  ) from telegram_chats);
end;
$$;
grant execute on function public.admin_telegram() to authenticated;
revoke execute on function public.admin_telegram() from anon;
