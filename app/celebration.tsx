import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MomentModal, { Moment } from '../src/components/Moments';
import ScreenBg from '../src/components/ScreenBg';
import { useProfile } from '../src/hooks/useProfile';

/**
 * Deep-linkable special moments (e.g. from a push):
 *   /celebration?type=tierup&from=THINKER&to=ANALYST
 *   /celebration?type=birthday
 * No "Big Win" variant by design — win/loss messaging stays off this app.
 */
export default function Celebration() {
  const router = useRouter();
  const { profile } = useProfile();
  const params = useLocalSearchParams<{ type?: string; from?: string; to?: string }>();
  const name = (profile?.name ?? '').split(' ')[0];
  const moment: Moment = params.type === 'birthday'
    ? { kind: 'birthday' }
    : { kind: 'tierup', from: params.from ?? 'INITIATE', to: params.to ?? profile?.vip_tier ?? 'THINKER' };

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <ScreenBg>
      <MomentModal moment={moment} name={name} onClose={dismiss} />
    </ScreenBg>
  );
}
