-- 008: Add the profile columns the app writes during onboarding.
--
-- The register + interests screens upsert `birthday`, `favourite_sports`,
-- `favourite_team_id`, `favourite_team_sport` and `favourite_team_league`,
-- but these columns were never created. A Postgres upsert that references a
-- non-existent column fails as a whole, so the client's profile write was
-- silently rejected — leaving new users with no name, 0 XP and no favourite
-- team (the auto-created row keeps its defaults). Adding the columns lets the
-- existing app persist onboarding data correctly, no new build required.

alter table public.profiles
  add column if not exists birthday date,
  add column if not exists favourite_sports text,
  add column if not exists favourite_team_id text,
  add column if not exists favourite_team_sport text,
  add column if not exists favourite_team_league text;
