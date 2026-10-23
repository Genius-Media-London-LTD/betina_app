import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Tracks whether the current visitor has a Supabase session.
 *
 * Return value:
 *   undefined → still checking (show a loader, avoid a gate flash)
 *   null      → guest (no session) — gate account-only features
 *   Session   → signed in
 *
 * Re-checks on focus so it flips the moment a guest signs in and comes back.
 */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      supabase.auth.getSession().then(({ data }) => {
        if (active) setSession(data.session ?? null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return session;
}
