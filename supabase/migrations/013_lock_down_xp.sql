-- BETina App — lock down XP awards
--
-- Security fix. 005 exposed award_xp(p_amount) as a SECURITY DEFINER RPC to every
-- signed-in user, so a player could call it with any amount and mint unlimited XP
-- (which drives the VIP tiers and the Journey screen). On top of that the profiles
-- RLS update policy let a player write xp_points directly.
--
--   1. award_xp(integer) is dropped. Chat XP now goes through award_chat_xp(), which
--      adds exactly +1 and at most 50 per user per day (database time zone, UTC,
--      same as claim_daily_login).
--      Prediction XP is booked server-side by the Tippspiel scoring triggers (010).
--   2. A BEFORE INSERT/UPDATE trigger on profiles keeps the XP / tier / streak
--      columns out of reach of the anon and authenticated roles. SECURITY DEFINER
--      functions (award_chat_xp, claim_*, Tippspiel scoring, handle_new_user) run as
--      their owner and the edge functions run as service_role, so they are unaffected.
--      Client writes to those columns are silently ignored rather than rejected, so
--      app builds that still send xp_points/vip_tier/streak_days in the register
--      upsert keep working.
--
-- Builds already in the stores still call award_xp(1) per chat message; that call
-- now fails (xp.ts swallows the error), so those builds stop earning chat XP until
-- they update.

-- ── 1. Fixed-purpose chat XP with a daily cap ───────────────────────────────

drop function if exists public.award_xp(integer);

-- One row per user per day. No RLS policies and no grants: only award_chat_xp()
-- (SECURITY DEFINER) touches it.
create table if not exists public.chat_xp_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  awarded integer not null default 0,
  primary key (user_id, day)
);

alter table public.chat_xp_daily enable row level security;
revoke all on table public.chat_xp_daily from public, anon, authenticated;

-- +1 XP for a chat message, capped at 50 per user per day. Returns the new XP
-- total (unchanged once the cap is reached), or null when logged out.
create or replace function public.award_chat_xp()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_count integer;
  v_xp    integer;
begin
  if v_uid is null then
    return null;
  end if;

  -- Atomic count-and-check: the conflict branch only fires below the cap, so
  -- concurrent calls can never push a user past it.
  insert into public.chat_xp_daily as d (user_id, day, awarded)
  values (v_uid, current_date, 1)
  on conflict (user_id, day) do update
     set awarded = d.awarded + 1
   where d.awarded < 50
  returning d.awarded into v_count;

  if v_count is null then
    select xp_points into v_xp from public.profiles where id = v_uid;
    return v_xp;
  end if;

  -- First award of the day → drop the user's older counter rows.
  if v_count = 1 then
    delete from public.chat_xp_daily where user_id = v_uid and day < current_date;
  end if;

  update public.profiles
     set xp_points  = coalesce(xp_points, 0) + 1,
         updated_at = now()
   where id = v_uid
   returning xp_points into v_xp;
  return v_xp;
end;
$$;

revoke execute on function public.award_chat_xp() from public, anon;
grant  execute on function public.award_chat_xp() to authenticated;

-- ── 2. Clients can't write XP / tier / streak columns ───────────────────────

-- Deliberately NOT security definer: current_user must be the calling role.
create or replace function public.protect_profile_progress()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    -- Same starting values as handle_new_user().
    NEW.xp_points         := 100;
    NEW.vip_tier          := 'INITIATE';
    NEW.streak_days       := 0;
    NEW.last_login_date   := null;
    NEW.profile_completed := false;
  else
    NEW.xp_points         := OLD.xp_points;
    NEW.vip_tier          := OLD.vip_tier;
    NEW.streak_days       := OLD.streak_days;
    NEW.last_login_date   := OLD.last_login_date;
    NEW.profile_completed := OLD.profile_completed;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_profile_progress on public.profiles;
create trigger protect_profile_progress
  before insert or update on public.profiles
  for each row execute function public.protect_profile_progress();
