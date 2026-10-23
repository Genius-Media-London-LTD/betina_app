// BETina's XP economy — thin client over the server-side award RPCs
// (see supabase/migrations/005_xp_system.sql and 013_lock_down_xp.sql). Every
// award is atomic and scoped to the signed-in user server-side, and the amounts
// are fixed there; these helpers just call the RPC and hand back the new total
// so the UI can update instantly. Tippspiel XP is booked by the server alone.

import { supabase } from './supabase';

export const XP_REWARDS = {
  chatMessage: 1,
  dailyLogin: 5,
  profileCompleted: 20,
} as const;

/**
 * +1 XP for sending a chat message (the server caps this at 50 per day).
 * Returns the new XP total, or null if it failed / logged out.
 */
export async function awardChatXp(): Promise<number | null> {
  const { data, error } = await supabase.rpc('award_chat_xp');
  if (error) {
    console.warn('awardChatXp failed:', error.message);
    return null;
  }
  return typeof data === 'number' ? data : null;
}

/**
 * Daily first-open reward: +5 plus +1 per streak day. Safe to call on every app
 * open — the server grants it at most once per calendar day. `awarded` is 0 when
 * today was already claimed.
 */
export async function claimDailyLogin(): Promise<{ awarded: number; xp: number; streak: number } | null> {
  const { data, error } = await supabase.rpc('claim_daily_login');
  if (error) {
    console.warn('claimDailyLogin failed:', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { awarded: row.awarded ?? 0, xp: row.xp ?? 0, streak: row.streak ?? 0 };
}

/** One-time +20 XP for completing the profile. `awarded` is 0 if already granted. */
export async function claimProfileCompleted(): Promise<{ awarded: number; xp: number } | null> {
  const { data, error } = await supabase.rpc('claim_profile_completed');
  if (error) {
    console.warn('claimProfileCompleted failed:', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { awarded: row.awarded ?? 0, xp: row.xp ?? 0 };
}
