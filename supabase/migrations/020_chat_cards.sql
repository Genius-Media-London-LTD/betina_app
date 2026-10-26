-- Chat cards: BETina's messages can carry visual cards (match, news, link,
-- Tippspiel) — stored with the message so the history shows them again.
alter table public.chat_messages add column if not exists cards jsonb;
