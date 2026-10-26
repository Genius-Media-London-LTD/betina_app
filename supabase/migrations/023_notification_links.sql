-- Inbox entries open something: where a notification leads in the app
-- (e.g. '/tippspiel', '/chat', '/scores', '/match/123'). Older rows have none;
-- the app then decides by type.
alter table public.notifications add column if not exists url text;

-- The inbox lists the newest first per player.
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
