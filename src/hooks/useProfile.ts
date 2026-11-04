import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

export type Profile = {
  name: string;
  vip_tier: string;
  xp_points: number;
  streak_days: number;
  favourite_team: string | null;
  favourite_sport: string | null;
  favourite_sports: string | null;
  favourite_team_id: string | null;
  favourite_team_sport: string | null;
  favourite_team_league: string | null;
  country: string | null;
  created_at: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setPhone(user.phone ? '+' + user.phone : null);
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from('profiles')
        .select('name, vip_tier, xp_points, streak_days, favourite_team, favourite_sport, favourite_sports, favourite_team_id, favourite_team_sport, favourite_team_league, country, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the screen regains focus so XP/streak earned elsewhere
  // (chat, daily login) show up without a manual refresh.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Optimistically nudge the local XP total for an instant UI response. */
  const bumpXp = useCallback((delta: number) => {
    setProfile((p) => (p ? { ...p, xp_points: (p.xp_points ?? 0) + delta } : p));
  }, []);

  return { profile, phone, email, loading, reload: load, bumpXp };
}
