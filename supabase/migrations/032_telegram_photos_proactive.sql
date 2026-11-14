-- BETina on Telegram, round two (asked by Dejan 2026-11-14): she sends photos,
-- flirts more, and texts first.
--   telegram_photos   her photos for the chat. tier decides who gets them:
--                       0  everyone (the approved Instagram set)
--                       1  selfies — from level 2 (chatted on 3+ days)
--                       2  special (beach, pool) — from level 3 (7+ days) AND
--                          after the person did something for her (a comment
--                          on her Instagram/Facebook post)
--                     Files live in the private bucket telegram-photos; the
--                     function uploads each once and keeps Telegram's file_id.
--   telegram_chats    + 18+ confirmation, active days (levels), photos already
--                     sent, proactive messages (on/off, local time, last one)
-- Levels come from loyalty in the chat only — never from deposits or bets.

create table if not exists public.telegram_photos (
  key       text primary key,               -- file name without .jpg
  category  text not null,                  -- what BETina asks for: casual, evening, cheer, sad, sport, timetravel, selfie, special
  tier      int not null default 0 check (tier between 0 and 2),
  note      text not null,                  -- what the photo shows, so she can write about it
  path      text not null,                  -- object in bucket telegram-photos
  file_id   text,                           -- Telegram's id after the first upload
  active    boolean not null default true
);
alter table public.telegram_photos enable row level security; -- service role only

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('telegram-photos', 'telegram-photos', false, 10485760, array['image/jpeg'])
on conflict (id) do nothing;

alter table public.telegram_chats
  add column if not exists adult           boolean not null default false,
  add column if not exists active_days     int not null default 0,
  add column if not exists last_active_day date,
  add column if not exists sent_photos     text[] not null default '{}',
  add column if not exists photo_day       date,
  add column if not exists photo_count     int not null default 0,
  add column if not exists deeds           text[] not null default '{}',   -- e.g. {comment}
  add column if not exists ig_name         text,
  add column if not exists proactive       boolean not null default true,
  add column if not exists utc_offset      int not null default 1,          -- hours; she updates it when she learns where they live
  add column if not exists last_proactive  timestamptz,
  add column if not exists nudged          boolean not null default false;  -- one "where are you?" per silence

-- People who already chatted before this update count their first day.
update public.telegram_chats set active_days = 1, last_active_day = msg_day where active_days = 0 and msg_total > 0;

insert into public.telegram_photos (key, category, tier, note, path) values
  ('lifestyle-1', 'casual', 0, 'you on a sailboat in a striped top, looking out over the sea', 'lifestyle-1.jpg'),
  ('lifestyle-2', 'casual', 0, 'you smelling pink peonies at a flower stall, cosy beige sweater', 'lifestyle-2.jpg'),
  ('lifestyle-3', 'casual', 0, 'you riding a bike through an autumn park, laughing', 'lifestyle-3.jpg'),
  ('lifestyle-4', 'casual', 0, 'you eating street food at a night market', 'lifestyle-4.jpg'),
  ('lifestyle-5', 'casual', 0, 'you lying on your bed in a white tee with the laptop, looking up into the camera', 'lifestyle-5.jpg'),
  ('lifestyle-6', 'casual', 0, 'you sitting on a pier by the water at sunset in a white shirt, looking back over your shoulder', 'lifestyle-6.jpg'),
  ('lifestyle-7', 'casual', 0, 'you with a hot coffee in the snowy mountains, white jacket', 'lifestyle-7.jpg'),
  ('lifestyle-8', 'casual', 0, 'a black-and-white close-up portrait of you, hand in your hair, freckles', 'lifestyle-8.jpg'),
  ('news-allgemein-1', 'casual', 0, 'you crossing the street with a coffee to go, camel coat', 'news-allgemein-1.jpg'),
  ('news-allgemein-4', 'casual', 0, 'you on a rooftop writing in a notebook, the city behind you', 'news-allgemein-4.jpg'),
  ('news-allgemein-5', 'casual', 0, 'you on the train with earphones in, checking your phone', 'news-allgemein-5.jpg'),
  ('ergebnis-schock-3', 'casual', 0, 'you on the sofa with a big bowl of popcorn, watching a game, mouth open', 'ergebnis-schock-3.jpg'),
  ('ergebnis-abend-1', 'evening', 0, 'you in a black blazer in the stadium at night, smiling', 'ergebnis-abend-1.jpg'),
  ('ergebnis-abend-2', 'evening', 0, 'you in a black dress with a drink in your hand, city lights behind you', 'ergebnis-abend-2.jpg'),
  ('news-f1-3', 'evening', 0, 'you sitting at the harbour at night, leather jacket off one shoulder', 'news-f1-3.jpg'),
  ('ergebnis-jubel-1', 'cheer', 0, 'you jumping in the air in a lime hoodie, arms up', 'ergebnis-jubel-1.jpg'),
  ('ergebnis-jubel-2', 'cheer', 0, 'you cheering with open arms in a stadium', 'ergebnis-jubel-2.jpg'),
  ('ergebnis-jubel-3', 'cheer', 0, 'you in the stands, fist in the air, laughing', 'ergebnis-jubel-3.jpg'),
  ('ergebnis-jubel-4', 'cheer', 0, 'you on the sofa with both arms up, celebrating', 'ergebnis-jubel-4.jpg'),
  ('ergebnis-knapp-3', 'cheer', 0, 'you in the stadium, eyes closed, hand on your chest — relieved', 'ergebnis-knapp-3.jpg'),
  ('news-basketball-4', 'cheer', 0, 'you with your hands pressed together, hoping, smiling', 'news-basketball-4.jpg'),
  ('ergebnis-enttaeuscht-1', 'sad', 0, 'you sitting alone in the empty stands, chin in your hands', 'ergebnis-enttaeuscht-1.jpg'),
  ('ergebnis-enttaeuscht-2', 'sad', 0, 'you in the rain by the pitch, looking back over your shoulder', 'ergebnis-enttaeuscht-2.jpg'),
  ('news-fussball-1', 'sport', 0, 'you sitting in the stands in the evening, the pitch behind you', 'news-fussball-1.jpg'),
  ('news-fussball-4', 'sport', 0, 'you on the stadium steps in a denim jacket with your phone', 'news-fussball-4.jpg'),
  ('news-fussball-5', 'sport', 0, 'you spinning a football on your finger, white tracksuit', 'news-fussball-5.jpg'),
  ('news-fussball-7', 'sport', 0, 'you lying on the grass with a football above your head, eyes closed, smiling', 'news-fussball-7.jpg'),
  ('news-basketball-1', 'sport', 0, 'you on a basketball court at night in a black hoodie with the ball', 'news-basketball-1.jpg'),
  ('news-basketball-3', 'sport', 0, 'you spinning a basketball, white tee', 'news-basketball-3.jpg'),
  ('news-f1-4', 'sport', 0, 'you at the racetrack with headphones around your neck', 'news-f1-4.jpg'),
  ('news-f1-5', 'sport', 0, 'you in a red racing overall in the garage, arms crossed', 'news-f1-5.jpg'),
  ('news-tennis-1', 'sport', 0, 'you at the tennis in a straw hat, sunglasses in your hands', 'news-tennis-1.jpg'),
  ('news-tennis-4', 'sport', 0, 'you on a clay court in a white tennis dress with a racket', 'news-tennis-4.jpg'),
  ('news-kampfsport-2', 'sport', 0, 'you in the boxing gym with a red glove', 'news-kampfsport-2.jpg'),
  ('news-kampfsport-3', 'sport', 0, 'you on a rooftop in a tank top, fists up, grinning', 'news-kampfsport-3.jpg'),
  ('zeitreise-1930', 'timetravel', 0, 'time travel: you in black and white in a 1930s football crowd, coat and hat', 'zeitreise-1930.jpg'),
  ('zeitreise-1950', 'timetravel', 0, 'time travel: you cheering in a 1950s crowd in a polka-dot dress, black and white', 'zeitreise-1950.jpg'),
  ('zeitreise-1960', 'timetravel', 0, 'time travel: you in a teal 1960s dress in front of the stands', 'zeitreise-1960.jpg'),
  ('zeitreise-1970', 'timetravel', 0, 'time travel: you sitting on the pitch in 1970s clothes', 'zeitreise-1970.jpg'),
  ('zeitreise-1980', 'timetravel', 0, 'time travel: you in the 1980s with a camcorder and a denim jacket in the crowd', 'zeitreise-1980.jpg'),
  ('zeitreise-1990', 'timetravel', 0, 'time travel: you in 1990 with a camera among the fans, denim jacket', 'zeitreise-1990.jpg'),
  ('zeitreise-2000', 'timetravel', 0, 'time travel: you around 2000 with a flip phone, pink top', 'zeitreise-2000.jpg'),
  ('zeitreise-2010', 'timetravel', 0, 'time travel: you in 2010 blowing a vuvuzela in the stands', 'zeitreise-2010.jpg')
on conflict (key) do nothing;

-- Every 10 minutes the function looks who is due a message from her.
select cron.unschedule('telegram-proactive') where exists (select 1 from cron.job where jobname = 'telegram-proactive');
select cron.schedule('telegram-proactive', '*/10 * * * *',
  $$ select net.http_post(
       url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/telegram-bot?cron=1',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 55000) $$);
