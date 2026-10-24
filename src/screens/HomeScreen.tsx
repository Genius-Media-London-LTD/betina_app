import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ScreenBg from '../components/ScreenBg';
import SignInWall from '../components/SignInWall';
import XPBar from '../components/XPBar';
import { Meta, Sticker } from '../components/Urban';
import MomentModal, { Moment, nextMoment } from '../components/Moments';
import { useSession } from '../hooks/useSession';
import { tiers } from '../lib/demo';
import { MatchEvent, fetchTeamNext, formatKickoff } from '../lib/sports';
import { supabase } from '../lib/supabase';
import { useChrome } from '../components/chrome';
import { Colors, Fonts } from '../theme';

function getTierInfo(xp: number) {
  const current = [...tiers].reverse().find((t) => xp >= t.minXp) ?? tiers[0];
  const currentIdx = tiers.findIndex((t) => t.name === current.name);
  const next = tiers[currentIdx + 1] ?? null;
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return { current, next, progress };
}

type Profile = {
  name: string;
  vip_tier: string;
  xp_points: number;
  streak_days: number | null;
  birthday: string | null;
  favourite_team: string | null;
  favourite_team_id: string | null;
};

const kickoffDate = (e: MatchEvent) => new Date(`${e.date}T${e.time || '00:00:00'}`);

/** Days / hours / minutes / seconds until kickoff, ticking every second. */
function useCountdown(target: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  return { hoursTotal: Math.floor(s / 3600), parts: [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60] };
}

export default function Home() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useChrome();
  const session = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState<MatchEvent[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [moment, setMoment] = useState<Moment | null>(null);

  // Reload on focus so XP/tier earned in chat or on daily open show up here.
  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('name, vip_tier, xp_points, streak_days, birthday, favourite_team, favourite_team_id')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        // Tier-up / birthday moments fire once (see Moments.tsx).
        nextMoment(data).then((m) => { if (m) setMoment(m); });
      }
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

  const nextMatch = fixtures.find((e) => kickoffDate(e).getTime() > Date.now()) ?? null;
  const countdown = useCountdown(nextMatch ? kickoffDate(nextMatch) : null);

  const xp = profile?.xp_points ?? 0;
  const name = profile?.name ?? '';
  const firstName = name.split(' ')[0] || name;
  const team = profile?.favourite_team;
  const streak = profile?.streak_days ?? 0;
  const { current, next, progress } = getTierInfo(xp);
  const tier = profile?.vip_tier ?? current.name;

  const betinaSays = team
    ? t.homeBetinaTeam.replace('{name}', firstName).replace('{team}', team)
    : t.homeBetinaNoTeam.replace('{name}', firstName);

  const go = (path: Parameters<typeof router.push>[0]) => {
    Haptics.selectionAsync();
    router.push(path);
  };

  const now = new Date();
  const stamp = `${now.toLocaleDateString(lang, { weekday: 'short' }).replace('.', '')} · ${now.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })} · ${now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`;
  const units = t.homeCountdownUnits.split('|');
  const nameSize = firstName.length > 9 ? 52 : firstName.length > 6 ? 64 : 76;

  const tiles = [
    { label: t.tabNews, meta: 'BETINA NEWS', path: '/(tabs)/live' as const },
    { label: t.tabTipps, meta: 'BEAT BETINA', path: '/(tabs)/tippspiel' as const },
    { label: 'Chat', meta: 'Online', path: '/(tabs)/chat' as const },
    { label: t.tabJourney, meta: tier, path: '/(tabs)/journey' as const },
  ];

  // Guest (no session) → gate the personalised home behind sign-in. Non-account
  // content (news/articles) stays open on the News tab.
  if (session === null) return <SignInWall />;

  if (loading || session === undefined) {
    return (
      <ScreenBg>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenBg>
    );
  }

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: chrome.top, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.photo}>
          <Image source={require('../../assets/urban/betina-home.jpg')} style={styles.photoImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', Colors.black]}
            locations={[0.35, 0.92]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.greeting}>
            <Meta color={Colors.primary} size={11}>{stamp}</Meta>
            <Text style={[styles.yo, { fontSize: 76, lineHeight: 70 }]}>{t.homeYo.toUpperCase()},</Text>
            <View style={styles.nameRow}>
              <Text style={[styles.yo, styles.yoName, { fontSize: nameSize, lineHeight: Math.round(nameSize * 0.92) }]} numberOfLines={1}>
                {firstName.toUpperCase()}.
              </Text>
              <Sticker text={tier} rotate={-4} style={styles.tierSticker} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.body}>
          {/* XP progress */}
          <Pressable onPress={() => go('/tiers')} style={styles.xp}>
            <View style={styles.xpTop}>
              <Meta color={Colors.white}>{next ? `${current.name} → ${next.name}` : t.homeMaxTier}</Meta>
              <Meta color={Colors.primary}>
                {next ? `${xp.toLocaleString(lang)} / ${next.minXp.toLocaleString(lang)} XP` : `${xp.toLocaleString(lang)} XP`}
              </Meta>
            </View>
            <XPBar progress={progress} />
          </Pressable>

          {/* BETina says */}
          <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.message}>
            <Meta color={Colors.primary}>{`BETINA · ${t.liveJustNow}`}</Meta>
            <Text style={styles.messageText}>{betinaSays}</Text>
            <Pressable onPress={() => go('/(tabs)/chat')} style={({ pressed }) => [styles.reply, pressed && styles.replyPressed]}>
              <Text style={styles.replyText}>{t.homeReply.toUpperCase()} →</Text>
            </Pressable>
          </Animated.View>

          {/* Your game */}
          <Animated.View entering={FadeInDown.delay(180).duration(450)}>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>{t.homeYourGame.toUpperCase()}</Text>
              {countdown && <Meta color={Colors.primary}>{t.homeInHours.replace('{n}', String(countdown.hoursTotal))}</Meta>}
            </View>
            {!teamId ? (
              <Pressable onPress={() => go('/settings')} style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.homePickTeam}</Text>
              </Pressable>
            ) : loadingFixtures ? (
              <View style={styles.emptyCard}><ActivityIndicator color={Colors.primary} /></View>
            ) : !nextMatch ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.homeNoFixtures.replace('{team}', team ?? '')}</Text>
              </View>
            ) : (
              <View style={styles.game}>
                <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>
                  {`${nextMatch.league} · ${formatKickoff(nextMatch.date, nextMatch.time, lang, { today: t.homeToday, tomorrow: t.homeTomorrow })}`}
                </Meta>
                <View style={styles.teams}>
                  <Text style={styles.team} numberOfLines={2} adjustsFontSizeToFit>{nextMatch.home.toUpperCase()}</Text>
                  <Text style={styles.vs}>VS</Text>
                  <Text style={[styles.team, { textAlign: 'right' }]} numberOfLines={2} adjustsFontSizeToFit>{nextMatch.away.toUpperCase()}</Text>
                </View>
                {countdown && (
                  <View style={styles.countdown}>
                    {countdown.parts.map((v, i) => (
                      <View key={i} style={styles.cdBox}>
                        <Text style={styles.cdValue}>{String(v).padStart(2, '0')}</Text>
                        <Text style={styles.cdUnit}>{(units[i] ?? '').toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Tiles */}
          <View style={styles.tiles}>
            {tiles.map((tile) => (
              <Pressable key={tile.path} onPress={() => go(tile.path)} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
                <Meta color={Colors.primary}>{tile.meta}</Meta>
                <Text style={styles.tileLabel} numberOfLines={1} adjustsFontSizeToFit>{tile.label.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          {/* Streak */}
          <View style={styles.streak}>
            <View style={styles.sectionRow}>
              <Text style={styles.streakTitle}>{t.homeStreakDays.replace('{n}', String(streak)).toUpperCase()}</Text>
              {streak > 0 && <Meta color={Colors.primary}>{t.homeStreakXp.replace('{n}', String(5 + streak))}</Meta>}
            </View>
            <View style={styles.streakGrid}>
              {Array.from({ length: 14 }, (_, i) => (
                <View key={i} style={[styles.streakCell, i < Math.min(streak, 14) && styles.streakOn]} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <MomentModal moment={moment} name={firstName} onClose={() => setMoment(null)} />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  photo: { height: 400, justifyContent: 'flex-end', backgroundColor: Colors.surface, overflow: 'hidden' },
  photoImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  greeting: { paddingHorizontal: 16, paddingBottom: 6, gap: 4 },
  yo: { color: Colors.white, fontFamily: Fonts.display },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  yoName: { color: Colors.primary, flexShrink: 1 },
  tierSticker: { marginBottom: 10 },

  body: { paddingHorizontal: 16, gap: 20, paddingTop: 12 },
  xp: { gap: 10 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between' },

  message: { backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, padding: 16, gap: 12 },
  messageText: { color: Colors.white, fontSize: 17, lineHeight: 25, fontFamily: Fonts.medium },
  reply: { alignSelf: 'flex-start', backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10 },
  replyPressed: { opacity: 0.85 },
  replyText: { color: Colors.black, fontSize: 15, fontFamily: Fonts.label, letterSpacing: 0.6 },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  section: { color: Colors.white, fontSize: 34, fontFamily: Fonts.display },
  emptyCard: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, padding: 18, minHeight: 80, justifyContent: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium },
  game: { backgroundColor: Colors.primary, padding: 16, gap: 12 },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { flex: 1, color: Colors.black, fontSize: 40, lineHeight: 40, fontFamily: Fonts.display },
  vs: { color: Colors.black, opacity: 0.45, fontSize: 18, fontFamily: Fonts.display },
  countdown: { flexDirection: 'row', gap: 8 },
  cdBox: { flex: 1, backgroundColor: Colors.black, paddingVertical: 8, alignItems: 'center' },
  cdValue: { color: Colors.primary, fontSize: 30, lineHeight: 32, fontFamily: Fonts.display },
  cdUnit: { color: Colors.white, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 1 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48.5%', minHeight: 96, justifyContent: 'space-between', padding: 14,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  tilePressed: { borderColor: Colors.primary },
  tileLabel: { color: Colors.white, fontSize: 34, lineHeight: 36, fontFamily: Fonts.display },

  streak: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, padding: 14 },
  streakTitle: { color: Colors.white, fontSize: 26, fontFamily: Fonts.display },
  streakGrid: { flexDirection: 'row', gap: 4 },
  streakCell: { flex: 1, height: 18, backgroundColor: Colors.line },
  streakOn: { backgroundColor: Colors.primary },
});
