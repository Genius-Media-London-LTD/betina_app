-- BETina on Telegram: games (asked by Dejan 2026-11-15). She offers small games
-- in the chat; every won game is one heart, and hearts pay for a photo of a
-- tier the person has not unlocked yet (selfie 2, special 5 — set in the
-- function). The function is the referee: it keeps the solution, counts the
-- guesses and hands out the hearts, so nobody can talk her into a win.
--   hearts                  what they hold
--   heart_day / heart_count hearts won today (cap in the function)
--   game                    the running game {type, secret, tries, at}, or
--                           {last} once it is over
--   game_day / game_count   games started today (cap in the function)
-- Hearts come from playing only — never from deposits or bets.

--
-- And the comment task: she gives the person a codeword, they leave a comment
-- with it under one of her posts (Instagram, Facebook, X), and the function
-- looks for that comment in social_posts before she rewards it.
--   task_code / task_at     the open codeword and when it was given
--   task_day                the day of the last rewarded task (one per day)
--   comments                verified codeword comments
--   ticket                  an open reward photo: 1 selfie, 2 special
-- Special photos are never for hearts — only for a verified comment (from the
-- second one on) or the loyalty path of migration 032.

alter table public.telegram_chats
  add column if not exists task_code   text,
  add column if not exists task_at     timestamptz,
  add column if not exists task_day    date,
  add column if not exists comments    int not null default 0,
  add column if not exists ticket      int not null default 0,
  add column if not exists hearts      int not null default 0,
  add column if not exists heart_day   date,
  add column if not exists heart_count int not null default 0,
  add column if not exists game        jsonb,
  add column if not exists game_day    date,
  add column if not exists game_count  int not null default 0;
