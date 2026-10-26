import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MomentModal, { Moment } from '../src/components/Moments';
import PhotoMomentModal, { HitToast } from '../src/components/PhotoMoments';
import ScreenBg from '../src/components/ScreenBg';
import { useProfile } from '../src/hooks/useProfile';
import type { HitMoment, PhotoMoment } from '../src/lib/moments';

/**
 * Deep-linkable special moments (e.g. from a push, or to preview them):
 *   /celebration?type=tierup&from=THINKER&to=ANALYST
 *   /celebration?type=birthday
 *   /celebration?type=ko&me=7&betina=4&md=9&comp=PL   (also: revanche)
 *   /celebration?type=fire&n=5
 *   /celebration?type=lead&group=Office%20Cup
 *   /celebration?type=streak&n=30
 *   /celebration?type=matchday&home=Arsenal&away=Chelsea&team=Arsenal
 *   /celebration?type=hit&points=5&n=3
 * No "Big Win" variant by design — win/loss messaging stays off this app.
 */
export default function Celebration() {
  const router = useRouter();
  const { profile } = useProfile();
  const p = useLocalSearchParams<Record<string, string>>();
  const name = (profile?.name ?? '').split(' ')[0];
  const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);
  const [hitOpen, setHitOpen] = useState(true);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  let special: Moment | null = null;
  let photo: PhotoMoment | null = null;
  let hit: HitMoment | null = null;
  switch (p.type) {
    case 'birthday':
      special = { kind: 'birthday' };
      break;
    case 'ko':
    case 'revanche':
      photo = { kind: p.type, competition: p.comp ?? 'PL', matchday: num(p.md, 9), me: num(p.me, p.type === 'ko' ? 7 : 3), betina: num(p.betina, p.type === 'ko' ? 4 : 6) };
      break;
    case 'fire':
      photo = { kind: 'fire', streak: num(p.n, 5) };
      break;
    case 'lead':
      photo = { kind: 'lead', group: p.group ?? 'Office Cup', members: num(p.members, 6) };
      break;
    case 'streak':
      photo = { kind: 'streak', days: num(p.n, 30) };
      break;
    case 'matchday':
      photo = {
        kind: 'matchday', team: p.team ?? profile?.favourite_team ?? 'Arsenal', home: p.home ?? 'Arsenal', away: p.away ?? 'Chelsea',
        kickoff: new Date(Date.now() + 3 * 3_600_000).toISOString(),
      };
      break;
    case 'hit':
      hit = { points: num(p.points, 5), matches: num(p.n, 3), home_name: p.home ?? 'Bayern', away_name: p.away ?? 'Dortmund', home: 2, away: 1 };
      break;
    default:
      special = { kind: 'tierup', from: p.from ?? 'INITIATE', to: p.to ?? profile?.vip_tier ?? 'THINKER' };
  }

  return (
    <ScreenBg>
      {special && <MomentModal moment={special} name={name} onClose={dismiss} />}
      {photo && <PhotoMomentModal moment={photo} name={name} onClose={dismiss} />}
      {hit && <HitToast hit={hitOpen ? hit : null} name={name} onClose={() => { setHitOpen(false); dismiss(); }} />}
    </ScreenBg>
  );
}
