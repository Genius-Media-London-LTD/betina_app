// Live on Home: the player's own live matches (favourite / followed) as cards
// and a bar into the Live-Center with the number of matches live right now.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Blink } from '../Urban';
import { LiveCard } from './LiveParts';
import { isFollowing, useFollows } from '../../lib/follows';
import { useI18n } from '../../lib/i18n';
import { sameTeam, useLiveNow } from '../../lib/live';
import { Colors, Fonts, displayType } from '../../theme';

export default function HomeLive({ favourite, active }: { favourite: string | null | undefined; active: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  useFollows();
  const now = useLiveNow(active ? 30_000 : null);
  if (!now || !now.matches.length) return null;

  const mine = now.matches.filter((r) => sameTeam(favourite, r.h.n) || sameTeam(favourite, r.a.n)
    || isFollowing('team', r.h.id) || isFollowing('team', r.a.id) || isFollowing('match', r.id) || isFollowing('league', r.lg));
  const open = (path: Parameters<typeof router.push>[0]) => { Haptics.selectionAsync(); router.push(path); };

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
      {mine.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {mine.slice(0, 6).map((r) => (
            <LiveCard key={r.id} r={r} league={now.leagues[r.lg]?.name ?? ''} serverNow={now.serverNow}
              onPress={() => open({ pathname: '/match/[id]', params: { id: String(r.id) } })} />
          ))}
        </ScrollView>
      )}
      <Pressable onPress={() => open('/(tabs)/scores')} style={({ pressed }) => [styles.bar, pressed && { opacity: 0.85 }]}>
        <Blink size={8} />
        <Text style={styles.barCount}>{now.matches.length}</Text>
        <Text style={styles.barText} numberOfLines={1}>{t.liveNowCount.replace('{n}', '').trim().toUpperCase()}</Text>
        <Text style={styles.barCta} numberOfLines={1}>{`${t.liveOpenCenter.toUpperCase()} →`}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  cards: { gap: 8 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.live, paddingHorizontal: 12, paddingVertical: 10 },
  barCount: { ...displayType(24, 26), color: Colors.white },
  barText: { color: Colors.live, fontSize: 13, fontFamily: Fonts.monoBold, letterSpacing: 1 },
  barCta: { flex: 1, textAlign: 'right', color: Colors.white, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },
});
