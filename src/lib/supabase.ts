import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://djnmrvhdklpclbrhxxqs.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_YOv1ukkxjnHUN5LWYoJ--g_DJDtbCIY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web Google login returns with the session in the URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type Profile = {
  id: string;
  phone: string | null;
  name: string | null;
  country: string | null;
  language: string;
  favourite_sport: string | null;
  favourite_team: string | null;
  vip_tier: string;
  xp_points: number;
  streak_days: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
