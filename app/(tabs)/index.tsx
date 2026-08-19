import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../src/lib/i18n';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowCard from '../../src/components/GlowCard';
import ParticlesBg from '../../src/components/ParticlesBg';
import ScreenBg from '../../src/components/ScreenBg';
import SignInWall from '../../src/components/SignInWall';
import XPBar from '../../src/components/XPBar';
import { useSession } from '../../src/hooks/useSession';
import { tiers } from '../../src/lib/demo';
import { MatchEvent, fetchTeamNext, formatKickoff } from '../../src/lib/sports';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

function getGreeting(t: { homeMorning: string; homeAfternoon: string; homeEvening: string }) {
  const h = new Date().getHours();
  if (h < 12) return t.homeMorning;
  if (h < 18) return t.homeAfternoon;
  return t.homeEvening;
}

function getTierInfo(xp: number) {
  const current = [...tiers].reverse().find((t) => xp >= t.minXp) ?? tiers[0];
  const currentIdx = tiers.findIndex((t) => t.name === current.name);
  const next = tiers[currentIdx + 1] ?? null;
  const progress = next
    ? (xp - current.minXp) / (next.minXp - current.minXp)
    : 1;
  return { current, next, progress };
}

type Profile = {
  name: string;
  vip_tier: string;
  xp_points: number;
  favourite_team: string | null;
  favourite_team_id: string | null;
  favourite_sport: string | null;
  country: string | null;
};

export default function Home() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState<MatchEvent[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  // Reload on focus so XP/tier earned in chat or on daily open show up here.
  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('name, vip_tier, xp_points, favourite_team, favourite_team_id, favourite_sport, country')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const teamId = profile?.favourite_team_id ?? null;

  // Load the favourite team's real upcoming fixtures
  useEffect(() => {
    if (!teamId) { setFixtures([]); return; }
    let active = true;
    setLoadingFixtures(true);
    fetchTeamNext(teamId)
      .then((events) => { if (active) setFixtures(events); })
      .finally(() => { if (active) setLoadingFixtures(false); });
    return () => { active = false; };
  }, [teamId]);

  const xp = profile?.xp_points ?? 0;
  const name = profile?.name ?? '...';
  const tier = profile?.vip_tier ?? 'INITIATE';
  const team = profile?.favourite_team;
  const { next, progress } = getTierInfo(xp);

  const betinaSays = team
    ? t.homeBetinaTeam.replace('{name}', name).replace('{team}', team)
    : t.homeBetinaNoTeam.replace('{name}', name);

  const kickoff = (e: MatchEvent) =>
    formatKickoff(e.date, e.time, lang, { today: t.homeToday, tomorrow: t.homeTomorrow });

  // Guest (no session) → gate the personalised home behind sign-in. Non-account
  // content (news/articles) stays open on the Live tab.
  if (session === null) return <SignInWall />;

  if (loading || session === undefined) {
    return (
      <ScreenBg glowTop={0.16} glowSize={460}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenBg>
    );
  }

  return (
    <ScreenBg glowTop={0.16} glowSize={460}>
      <ParticlesBg count={8} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* greeting header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={styles.headerLeft}>
            <BETinaAvatar size={52} />
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting(t)}</Text>
              <Text style={styles.name}>{name} ⚡</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.tierPill}>
              <View style={styles.tierDot} />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
            <Pressable onPress={() => router.push('/notifications')} style={styles.bell}>
              <Text style={styles.bellEmoji}>🔔</Text>
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </Animated.View>

        {/* BETina says */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Pressable onPress={() => router.push('/(tabs)/chat')} style={styles.betinaSays}>
            <Text style={styles.betinaSaysText}>
              {betinaSays}{' '}
              <Text style={styles.betinaSaysLink}>{t.homeAskMe}</Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* XP card */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <Pressable onPress={() => router.push('/tiers')}>
            <GlowCard style={styles.xpCard}>
              <View style={styles.xpTop}>
                <View style={styles.xpValueRow}>
                  <AnimatedNumber value={xp} style={styles.xpValue} />
                  <Text style={styles.xpUnit}>XP</Text>
                </View>
                {next && (
                  <Text style={styles.xpNext}>
                    {next.minXp - xp} {t.homeXpTo}{' '}
                    <Text style={styles.xpNextTier}>{next.name}</Text>
                  </Text>
                )}
              </View>
              <XPBar progress={progress} />
              <View style={styles.xpLabels}>
                <Text style={styles.xpTierLabel}>{tier}</Text>
                {next && <Text style={styles.xpTierLabel}>{next.name}</Text>}
              </View>
            </GlowCard>
          </Pressable>
        </Animated.View>

        {/* upcoming fixtures for the favourite team */}
        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.eventsBlock}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t.homeUpcoming}</Text>
            <Pressable onPress={() => router.push('/(tabs)/live')} hitSlop={8}>
              <Text style={styles.sectionLink}>{t.homeSeeAll}</Text>
            </Pressable>
          </View>

          {!teamId ? (
            <GlowCard style={styles.eventCard}>
              <Text style={styles.emptyText}>{t.homePickTeam}</Text>
            </GlowCard>
          ) : loadingFixtures ? (
            <GlowCard style={styles.loadingCard}>
              <ActivityIndicator color={Colors.primary} />
            </GlowCard>
          ) : fixtures.length === 0 ? (
            <GlowCard style={styles.eventCard}>
              <Text style={styles.emptyText}>
                {t.homeNoFixtures.replace('{team}', team ?? '')}
              </Text>
            </GlowCard>
          ) : (
            <>
              {/* featured: next match */}
              <Pressable onPress={() => router.push('/(tabs)/live')}>
                <GlowCard variant="purple" style={styles.featuredCard}>
                  <View style={styles.featuredTop}>
                    <Text style={styles.featuredLeague} numberOfLines={1}>
                      {fixtures[0].league}
                    </Text>
                    <Text style={styles.featuredTime}>{kickoff(fixtures[0])}</Text>
                  </View>
                  <View style={styles.featuredTeams}>
                    <Text style={styles.teamName} numberOfLines={1}>{fixtures[0].home}</Text>
                    <Text style={styles.vs}>vs</Text>
                    <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>{fixtures[0].away}</Text>
                  </View>
                </GlowCard>
              </Pressable>

              {/* second upcoming match, if any */}
              {fixtures[1] && (
                <GlowCard style={styles.eventCard}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventLeague} numberOfLines={1}>
                      {fixtures[1].league}
                    </Text>
                    <Text style={styles.eventName} numberOfLines={1}>
                      {fixtures[1].home} vs {fixtures[1].away}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>{kickoff(fixtures[1])}</Text>
                </GlowCard>
              )}
            </>
          )}
        </Animated.View>

      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.lg, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greetingBlock: { gap: 2 },
  greeting: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium },
  name: { color: '#FFFFFF', fontSize: Typography.lg + 1, fontFamily: Fonts.black },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14,
  },
  tierDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  tierLabel: { color: '#FFFFFF', fontSize: Typography.xs + 1, fontFamily: Fonts.bold, letterSpacing: 0.7 },
  bell: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  bellEmoji: { fontSize: 16 },
  bellDot: {
    position: 'absolute', top: 5, right: 6,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.background,
  },
  betinaSays: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.45)',
    borderRadius: 20, borderTopLeftRadius: 6,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  betinaSaysText: { color: '#E8E8F0', fontSize: Typography.sm + 1, fontFamily: Fonts.medium, lineHeight: 21 },
  betinaSaysLink: { color: Colors.primary },
  xpCard: { padding: 18, gap: Spacing.md },
  xpTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  xpValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  xpValue: {
    color: Colors.primary,
    fontSize: Typography.xl + 4,
    fontFamily: Fonts.blackItalic,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(184,233,38,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  xpUnit: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  xpNext: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  xpNextTier: { color: '#FFFFFF', fontFamily: Fonts.bold },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  xpTierLabel: { color: '#55556A', fontSize: Typography.xs, fontFamily: Fonts.semibold, letterSpacing: 0.9 },
  eventsBlock: { gap: Spacing.sm + 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#FFFFFF', fontSize: Typography.base + 1, fontFamily: Fonts.bold },
  sectionLink: { color: Colors.primary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  featuredCard: { padding: 18, gap: Spacing.sm + 2 },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredLeague: { color: Colors.primary, fontSize: Typography.xs, fontFamily: Fonts.bold, letterSpacing: 1.1 },
  featuredTime: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  featuredTeams: { flexDirection: 'row', alignItems: 'center' },
  teamName: { flex: 1, color: '#FFFFFF', fontSize: Typography.base, fontFamily: Fonts.bold },
  teamNameRight: { textAlign: 'right' },
  vs: { color: '#55556A', fontSize: Typography.sm, fontFamily: Fonts.bold, marginHorizontal: 10 },
  eventCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 18, gap: 10 },
  eventInfo: { flex: 1, gap: 3 },
  eventLeague: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: Fonts.semibold, letterSpacing: 0.7 },
  eventName: { color: '#FFFFFF', fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  eventTime: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  emptyText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, lineHeight: 20 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
});
