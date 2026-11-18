-- BETina on Telegram: the prediction duel in the chat, kick-off messages and
-- the GeniusBet market of a person.
--
-- telegram_tips   one prediction per person and match (tip_matches of the app's
--                 prediction game). Points follow the app's rule (3 / 2 / 1)
--                 and are booked by the bot after the final whistle. A game for
--                 points only: no stake, no prize.
-- telegram_chats  tip_points / tip_settled: their total and how many
--                 predictions were scored; kickoff_ping: the day she last
--                 texted them before a kick-off (one a day); country: the
--                 GeniusBet market they said they live in (gn, cd, sl, ng, sv).

create table if not exists public.telegram_tips (
  chat_id    bigint not null references public.telegram_chats(chat_id) on delete cascade,
  match_id   bigint not null references public.tip_matches(id) on delete cascade,
  home       smallint not null check (home between 0 and 20),
  away       smallint not null check (away between 0 and 20),
  points     smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz,
  primary key (chat_id, match_id)
);

create index if not exists telegram_tips_open on public.telegram_tips (match_id) where points is null;

-- Only the bot (service role) reads and writes it.
alter table public.telegram_tips enable row level security;

alter table public.telegram_chats
  add column if not exists tip_points   integer not null default 0,
  add column if not exists tip_settled  integer not null default 0,
  add column if not exists kickoff_ping date,
  add column if not exists country      text;
