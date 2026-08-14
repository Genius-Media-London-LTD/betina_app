-- 009: Safety re-apply of the onboarding profile columns.
--
-- Migration 008 was recorded as applied on the remote, but there was confusion
-- about whether its DDL actually ran (vs. being marked applied). These ADD
-- COLUMN IF NOT EXISTS statements are idempotent: a no-op if 008 already added
-- the columns, and a guaranteed fix if it did not. Keeps new-user onboarding
-- (name, XP, favourite team) working.

alter table public.profiles
  add column if not exists birthday date,
  add column if not exists favourite_sports text,
  add column if not exists favourite_team_id text,
  add column if not exists favourite_team_sport text,
  add column if not exists favourite_team_league text;
