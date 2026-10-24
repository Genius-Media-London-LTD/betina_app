import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedNumber from '../components/AnimatedNumber';
import ScreenBg from '../components/ScreenBg';
import XPBar from '../components/XPBar';
import { Meta } from '../components/Urban';
import { tiers } from '../lib/demo';
import TeamCrest from '../components/TeamCrest';
import { SPORT_KEYS, useI18n } from '../lib/i18n';
import { parseSports } from '../lib/sports';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';
import SignInWall from '../components/SignInWall';
import { supabase } from '../lib/supabase';
import { useChrome } from '../components/chrome';
import { Colors, Fonts } from '../theme';

export default function Journey() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { profile } = useProfile();
  const [chatCount, setChatCount] = useState(0);

  // Real count of messages the player has sent BETina
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('role', 'user');
        if (typeof count === 'number') setChatCount(count);
      } catch {
        // offline / demo — leave at 0
      }
    })();
  }, []);
  const xp = profile?.xp_points ?? 0;
  const tierName = profile?.vip_tier ?? 'INITIATE';
  const team = profile?.favourite_team ?? null;
  const teamId = profile?.favourite_team_id ?? null;
  const streakDays = profile?.streak_days ?? 0;

  // The player's first sport (onboarding picks), else the single favourite.
  const sportId = parseSports(profile?.favourite_sports)[0] ?? profile?.favourite_sport?.toLowerCase() ?? null;
  const sportLabel = sportId ? String(SPORT_KEYS[sportId] ? t[SPORT_KEYS[sportId]] : sportId) : '—';
  const daysIn = profile?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000))
    : 1;
  const currentTierIndex = Math.max(0, tiers.findIndex((x) => x.name === tierName));
  const currentTierObj = tiers[currentTierIndex];
  const nextTierObj = tiers[currentTierIndex + 1] ?? null;
  const progress = nextTierObj
    ? (xp - currentTierObj.minXp) / (nextTierObj.minXp - currentTierObj.minXp)
    : 1;
  const insets = useSafeAreaInsets();
  const chrome = useChrome();
  const session = useSession();
  const fmt = (n: number) => n.toLocaleString(lang);

  // Guest → the journey/stats are account-based; gate behind sign-in. (Apple 5.1.1(v))
  if (session === undefined) return <ScreenBg />;
  if (session === null) return <SignInWall />;

  const [w1, ...rest] = t.journeyHeadline.toUpperCase().split(' ');

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: chrome.top + 18, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 4 }}>
          <Meta color={Colors.primary}>{`// ${t.journeyKicker.replace('{n}', String(daysIn))}`}</Meta>
          <Text style={styles.headline}>{w1}</Text>
          <Text style={[styles.headline, { color: Colors.primary }]}>{rest.join(' ')}</Text>
        </Animated.View>

        {/* Current tier */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/tiers'); }} style={styles.tierCard}>
            <View style={styles.tierTop}>
              <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>
                {`${t.journeyCurrent} · ${String(currentTierIndex + 1).padStart(2, '0')}/${String(tiers.length).padStart(2, '0')}`}
              </Meta>
              {currentTierObj.cashback !== '—' && (
                <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>{`${currentTierObj.cashback} ${t.tiersCashback}`}</Meta>
              )}
            </View>
            <Text style={styles.tierName} numberOfLines={1} adjustsFontSizeToFit>{currentTierObj.name}</Text>
            <XPBar progress={progress} height={10} onLime />
            <Text style={styles.tierLeft}>
              {nextTierObj
                ? t.journeyLeft.replace('{xp}', fmt(xp)).replace('{n}', fmt(nextTierObj.minXp - xp)).replace('{tier}', nextTierObj.name)
                : `${fmt(xp)} XP · ${t.tiersTop1}`}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.grid}>
          <Stat label={t.journeyFavSport} value={sportLabel} />
          <View style={styles.stat}>
            <Meta numberOfLines={1}>{t.journeyTopTeam}</Meta>
            <View style={styles.teamRow}>
              {team && <TeamCrest teamId={teamId} teamName={team} size={22} />}
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{(team ?? '—').toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.stat}>
            <Meta numberOfLines={1}>{t.journeyDayStreak}</Meta>
            <AnimatedNumber value={streakDays} style={styles.statValue} format={false} />
          </View>
          <View style={styles.stat}>
            <Meta numberOfLines={1}>{t.journeyChats}</Meta>
            <AnimatedNumber value={chatCount} style={styles.statValue} format={false} />
          </View>
        </Animated.View>

        {/* Timeline */}
        <Text style={styles.section}>TIMELINE</Text>
        <View>
          {tiers.map((tier, i) => {
            const done = i < currentTierIndex;
            const current = i === currentTierIndex;
            const next = i === currentTierIndex + 1;
            const last = i === tiers.length - 1;
            const locked = !done && !current && !next;
            return (
              <Animated.View key={tier.name} entering={FadeInDown.delay(200 + i * 60).duration(400)} style={styles.tlRow}>
                <View style={styles.tlRail}>
                  <View style={[styles.node, (done || current) && styles.nodeOn, next && styles.nodeNext]} />
                  {!last && <View style={[styles.line, done && styles.lineOn]} />}
                </View>
                <View style={[styles.tlBody, last && { paddingBottom: 0 }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.tlName, locked && styles.tlNameLocked]}>{tier.name}</Text>
                    <Meta>{tier.maxXp != null ? `${fmt(tier.minXp)} – ${fmt(tier.maxXp)} XP` : `${fmt(tier.minXp)}+ XP`}</Meta>
                  </View>
                  <Meta color={done || current || next ? Colors.primary : Colors.textMuted}>
                    {done ? `✓ ${t.journeyReached}` : current ? `■ ${t.journeyYouAreHere}` : next ? t.journeyXpLeft.replace('{n}', fmt(tier.minXp - xp)) : t.journeyLocked}
                  </Meta>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.push('/tiers'); }}
          style={({ pressed }) => [styles.allTiers, pressed && { backgroundColor: Colors.card }]}
        >
          <Text style={styles.allTiersText}>{t.journeyAllTiers.toUpperCase()}</Text>
          <Text style={[styles.allTiersText, { color: Colors.primary }]}>→</Text>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Meta numberOfLines={1}>{label}</Meta>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 16 },
  headline: { color: Colors.white, fontSize: 84, lineHeight: 80, fontFamily: Fonts.display },

  tierCard: { backgroundColor: Colors.primary, padding: 16, gap: 10 },
  tierTop: { flexDirection: 'row', justifyContent: 'space-between' },
  tierName: { color: Colors.black, fontSize: 64, lineHeight: 66, fontFamily: Fonts.display },
  tierLeft: { color: Colors.black, fontSize: 15, fontFamily: Fonts.label, letterSpacing: 0.3, textTransform: 'uppercase' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    width: '48.5%', gap: 6, padding: 12,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  statValue: { color: Colors.white, fontSize: 26, lineHeight: 30, fontFamily: Fonts.display, flexShrink: 1 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  section: { color: Colors.white, fontSize: 34, fontFamily: Fonts.display, marginTop: 8 },
  tlRow: { flexDirection: 'row', gap: 14 },
  tlRail: { alignItems: 'center', width: 18 },
  node: { width: 18, height: 18, borderWidth: 2, borderColor: Colors.borderStrong, backgroundColor: Colors.black },
  nodeOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  nodeNext: { borderColor: Colors.primary },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: Colors.borderStrong },
  lineOn: { backgroundColor: Colors.primary },
  tlBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingBottom: 18, marginTop: -4 },
  tlName: { color: Colors.white, fontSize: 28, lineHeight: 30, fontFamily: Fonts.display },
  tlNameLocked: { color: Colors.textMuted },

  allTiers: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 16, marginTop: 4,
  },
  allTiersText: { color: Colors.white, fontSize: 20, fontFamily: Fonts.display },
});
