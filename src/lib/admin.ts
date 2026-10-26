// Team dashboard data (migration 024). Every call is checked on the server:
// only accounts in public.admins get anything back.
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Count = { k: string; n: number };
export type DayRow = { d: string; signups: number; messages: number; chatters: number; opened: number };
export type Overview = {
  generated_at: string;
  days: number;
  totals: Record<
    'users' | 'registered' | 'crm_matched' | 'push' | 'signups_today' | 'signups_7d' | 'active_today' | 'active_7d'
    | 'opened_today' | 'opened_7d' | 'messages' | 'messages_today' | 'chatters' | 'tips' | 'tippers' | 'tip_groups'
    | 'follows' | 'memories' | 'reminders_open' | 'news_today' | 'xp_total',
    number
  >;
  series: DayRow[];
  countries: Count[];
  languages: Count[];
  tiers: Count[];
  teams: Count[];
  top_chatters: { id: string; name: string; n: number }[];
};
export type AdminUser = {
  id: string; name: string | null; phone: string | null; country: string | null; language: string | null;
  vip_tier: string | null; xp: number | null; favourite_team: string | null; crm: boolean; push: boolean;
  created_at: string; last_login_date: string | null; messages: number; last_message_at: string | null; tips: number;
};
export type AdminMessage = { id: string; user_id: string; name: string | null; role: 'user' | 'assistant'; content: string; created_at: string };

export async function fetchOverview(days: number): Promise<Overview> {
  const { data, error } = await supabase.rpc('admin_overview', { p_days: days });
  if (error) throw error;
  return data as Overview;
}

export async function fetchAdminUsers(search: string): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_users', { p_limit: 300, p_search: search.trim() || null });
  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

/** Latest player messages across everyone, or one player's whole chat. */
export async function fetchAdminMessages(userId: string | null, before?: string): Promise<AdminMessage[]> {
  const { data, error } = await supabase.rpc('admin_messages', { p_user: userId, p_limit: 100, p_before: before ?? null });
  if (error) throw error;
  return (data ?? []) as AdminMessage[];
}

/** undefined while checking; false for guests, players and before migration 024. */
export function useIsAdmin(): boolean | undefined {
  const [admin, setAdmin] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (alive) setAdmin(!error && data === true);
    });
    return () => { alive = false; };
  }, []);
  return admin;
}
