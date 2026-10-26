// What the player follows in BETina Live (star on a team, match or league).
// Followed teams and matches get goal pushes (supabase/functions/live-alerts)
// and the TOR moment in the app; all three fill the "Mine" filter.
import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';

export type FollowKind = 'team' | 'match' | 'league';
export type Follow = { kind: FollowKind; ref: number; label: string | null };

let follows: Follow[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

async function load() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { follows = []; loaded = true; emit(); return; }
  const { data } = await supabase.from('live_follows').select('kind, ref, label');
  follows = ((data ?? []) as Follow[]).map((f) => ({ ...f, ref: Number(f.ref) }));
  loaded = true;
  emit();
}

export function reloadFollows() {
  loading = load().catch(() => {}).finally(() => { loading = null; });
  return loading;
}

export const isFollowing = (kind: FollowKind, ref: number) => follows.some((f) => f.kind === kind && f.ref === ref);

/** Star / unstar; updates the UI at once and rolls back if saving fails. */
export async function toggleFollow(kind: FollowKind, ref: number, label: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const on = !isFollowing(kind, ref);
  const before = follows;
  follows = on ? [...follows, { kind, ref, label }] : follows.filter((f) => !(f.kind === kind && f.ref === ref));
  emit();
  const { error } = on
    ? await supabase.from('live_follows').insert({ user_id: session.user.id, kind, ref, label })
    : await supabase.from('live_follows').delete().eq('kind', kind).eq('ref', ref);
  if (error) { follows = before; emit(); return !on; }
  return on;
}

/** The player's follows (loaded once, shared by all screens). */
export function useFollows(): Follow[] {
  useEffect(() => { if (!loaded && !loading) reloadFollows(); }, []);
  return useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, () => follows, () => follows);
}
