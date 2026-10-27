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

// ── BETina on X (migration 025) ─────────────────────────────────────────────
export type SocialMode = 'off' | 'drafts' | 'auto';
export type SocialStatus = 'draft' | 'approved' | 'posting' | 'posted' | 'rejected' | 'skipped' | 'failed';
export type SocialPost = {
  id: number; kind: string; status: SocialStatus; text: string; poll: string[] | null; context: string | null;
  flags: string[]; reply_author: string | null; reply_text: string | null; expires_at: string | null;
  x_id: string | null; error: string | null; decided_at: string | null; posted_at: string | null; created_at: string;
};
export type SocialState = {
  settings: { mode: SocialMode; auto_kinds: string[]; daily_limit: number; lang: string; x_ready: boolean; last_run: string };
  posted_24h: number;
  counts: Partial<Record<SocialStatus, number>>;
  posts: SocialPost[];
};

/** Posts by status ('rejected' also shows skipped and failed ones). */
export async function fetchSocial(status: SocialStatus | null): Promise<SocialState> {
  const { data, error } = await supabase.rpc('admin_social', { p_status: status, p_limit: 100 });
  if (error) throw error;
  return data as SocialState;
}

export async function decideSocial(id: number, action: 'approve' | 'reject', text?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_social_decide', { p_id: id, p_action: action, p_text: text ?? null });
  if (error) throw error;
}

export async function setSocialMode(mode: SocialMode): Promise<void> {
  const { error } = await supabase.rpc('admin_social_mode', { p_mode: mode });
  if (error) throw error;
}
