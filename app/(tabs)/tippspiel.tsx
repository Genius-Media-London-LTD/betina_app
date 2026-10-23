import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowButton from '../../src/components/GlowButton';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import SignInWall from '../../src/components/SignInWall';
import Toggle from '../../src/components/Toggle';
import { Emblem, LOCALE, fillText as fill } from '../../src/components/TipParts';
import { useProfile } from '../../src/hooks/useProfile';
import { useSession } from '../../src/hooks/useSession';
import { useI18n } from '../../src/lib/i18n';
import {
  Competition, GroupDuel, RankRow, Stats, TipGroup,
  defaultCompetition, fetchCompetitions, fetchGroupDuel, fetchLeaderboard, fetchMyCompetitions, fetchMyGroups,
  fetchNotifyTippspiel, fetchOpenTips, fetchStats, setMyCompetitions, setNotifyTippspiel,
} from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

type Open = Record<string, { open: number; total: number; next: string | null }>;

export default function TippspielTab() {
  const session = useSession();
  const { t } = useI18n();
  if (session === undefined) return <ScreenBg glowTop={0.14} glowSize={460} />;
  if (session === null) return <SignInWall body={t.tipGuestBody} />;
  return <Hub />;
}

/** The Tippspiel home: what's open, the duel with BETina, my competitions and Tipprunden. */
function Hub() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0] || '';

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [mine, setMine] = useState<string[] | null>(null);
  const [open, setOpen] = useState<Open>({});
  const [me, setMe] = useState<RankRow | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [groups, setGroups] = useState<(TipGroup & { rank: number | null; duel: GroupDuel | null })[]>([]);
  const [notify, setNotify] = useState(true);
  const [menu, setMenu] = useState(false);
  const [rules, setRules] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [comps, myComps, myGroups, myStats, board, push] = await Promise.all([
      fetchCompetitions(), fetchMyCompetitions(), fetchMyGroups(), fetchStats(null),
      fetchLeaderboard({ limit: 1 }), fetchNotifyTippspiel(),
    ]);
    const [openTips, ranks, duels] = await Promise.all([
      fetchOpenTips(myComps),
      Promise.all(myGroups.map((g) => fetchLeaderboard({ group: g.id, limit: 1 }).then((rows) => rows.find((r) => r.is_me)?.rank ?? null))),
      Promise.all(myGroups.map((g) => fetchGroupDuel(g.id))),
    ]);
    setCompetitions(comps);
    setMine(myComps);
    setOpen(openTips);
    setStats(myStats);
    setMe(board.find((r) => r.is_me) ?? null);
    setGroups(myGroups.map((g, i) => ({ ...g, rank: ranks[i], duel: duels[i] })));
    setNotify(push);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totals = useMemo(() => {
    const list = Object.entries(open);
    const total = list.reduce((n, [, o]) => n + o.total, 0);
    const openCount = list.reduce((n, [, o]) => n + o.open, 0);
    // Start tipping where the next untipped match is.
    const first = list.filter(([, o]) => o.open > 0).sort(([, a], [, b]) => (a.next ?? '').localeCompare(b.next ?? ''))[0]?.[0] ?? null;
    return { total, open: openCount, done: total - openCount, first };
  }, [open]);

  const hostLine = totals.open > 0
    ? fill(t.tipHostOpen, { name: firstName, n: totals.open })
    : totals.total > 0 ? fill(t.tipHostDone, { name: firstName }) : t.tipNoOpen;

  const kickoffFmt = useMemo(
    () => new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    [lang],
  );

  const go = (path: '/tipps/play' | '/tipps/ranking' | '/tipps/groups' | '/tipps/bonus' | '/tipps/stats' | '/tipps/competitions', params?: Record<string, string>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenu(false);
    router.push(params ? { pathname: path, params } : path);
  };

  const myComps = competitions.filter((c) => mine?.includes(c.code));

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.title}>{t.tipTitle}</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); setMenu(true); }} style={styles.iconBtn} hitSlop={8}>
            <Text style={styles.iconBtnText}>☰</Text>
          </Pressable>
        </Animated.View>

        {mine === null ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : mine.length === 0 ? (
          <Onboarding competitions={competitions} lang={lang} onDone={load} />
        ) : (
          <>
            {/* What's open */}
            <Animated.View entering={FadeInDown.delay(60).duration(500)}>
              <GlowCard variant="green" style={styles.hero}>
                <View style={styles.heroTop}>
                  <BETinaAvatar size={56} online pulse={totals.open > 0} />
                  <Text style={styles.heroLine}>{hostLine}</Text>
                </View>
                {totals.total > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressHead}>
                      <Text style={styles.progressLabel}>
                        {totals.open === 0 ? t.tipAllDone : fill(t.tipProgress, { done: totals.done, total: totals.total })}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.round((totals.done / totals.total) * 100)}%` }]} />
                    </View>
                  </View>
                )}
                {totals.first && (
                  <GlowButton label={`🎯 ${t.tipNow}`} onPress={() => go('/tipps/play', { competition: totals.first! })} />
                )}
              </GlowCard>
            </Animated.View>

            {/* Beat BETina */}
            <Animated.View entering={FadeInDown.delay(110).duration(500)}>
              <Pressable onPress={() => go('/tipps/stats')}>
                <View style={styles.duel}>
                  <View style={[styles.duelSide, styles.duelYou]}>
                    <Text style={styles.duelWho}>{t.tipYouShort}</Text>
                    <AnimatedNumber value={stats?.duel?.me ?? 0} style={styles.duelPts} />
                  </View>
                  <View style={styles.duelMid}>
                    <Text style={styles.duelVs}>VS</Text>
                  </View>
                  <View style={[styles.duelSide, styles.duelBetina]}>
                    <AnimatedNumber value={stats?.duel?.betina ?? 0} style={styles.duelPts} />
                    <View style={styles.duelBetinaName}>
                      <BETinaAvatar size={22} />
                      <Text style={styles.duelWho}>BETina</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.duelSub}>
                  {stats?.duel?.matches ? `${t.tipDuelTitle} · ${fill(t.tipDuelSub, { n: stats.duel.matches })}` : t.tipDuelEmpty}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Season at a glance */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.tiles}>
              <Tile value={me?.points ?? 0} label={t.tipSeasonPoints} />
              <Tile text={me ? `#${me.rank}` : '–'} label={t.tipRank} />
              <Tile value={me?.exact ?? 0} label={t.tipExactShort} />
            </Animated.View>

            {/* My competitions */}
            <SectionHead title={t.tipMyCompetitions} action="✎" onAction={() => go('/tipps/competitions')} />
            {myComps.map((c, i) => {
              const o = open[c.code];
              return (
                <Animated.View key={c.code} entering={FadeInDown.delay(180 + i * 40).duration(400)}>
                  <Pressable onPress={() => go('/tipps/play', { competition: c.code })}>
                    <GlowCard style={styles.compCard}>
                      <Emblem uri={c.emblem} size={26} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.compName}>{c.name}</Text>
                        {o?.next && (
                          <Text style={styles.compMeta}>{t.tipNextKickoff}: {kickoffFmt.format(new Date(o.next))}</Text>
                        )}
                      </View>
                      {o && o.total > 0 && (
                        <View style={[styles.chip, o.open > 0 ? styles.chipOpen : styles.chipDone]}>
                          <Text style={[styles.chipText, o.open > 0 ? styles.chipTextOpen : styles.chipTextDone]}>
                            {o.open > 0 ? fill(t.tipOpenChip, { n: o.open }) : `✓ ${t.tipAllTipped}`}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.chevron}>›</Text>
                    </GlowCard>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* Tipprunden */}
            <SectionHead title={t.tipGroups} action="+" onAction={() => go('/tipps/groups')} />
            {groups.map((g) => (
              <Pressable key={g.id} onPress={() => go('/tipps/ranking', { group: g.id, groupName: g.name, code: g.code })}>
                <GlowCard variant="accent" style={styles.groupCard}>
                  <Text style={styles.groupEmoji}>👥</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.compName} numberOfLines={1}>{g.name}</Text>
                    <Text style={styles.compMeta}>{g.members} {t.tipMembers}</Text>
                  </View>
                  {g.duel && g.duel.won + g.duel.lost + g.duel.drawn > 0 && (
                    <View style={styles.teamTag}>
                      <Text style={styles.teamTagText}>{g.duel.won}:{g.duel.lost}</Text>
                      <BETinaAvatar size={14} />
                    </View>
                  )}
                  {g.rank != null && <Text style={styles.groupRank}>#{g.rank}</Text>}
                  <Text style={styles.chevron}>›</Text>
                </GlowCard>
              </Pressable>
            ))}
            {groups.length === 0 && (
              <Pressable onPress={() => go('/tipps/groups')}>
                <View style={styles.dashed}>
                  <Text style={styles.dashedText}>＋ {t.tipNewGroup}</Text>
                  <Text style={styles.compMeta}>{t.tipNoGroups}</Text>
                </View>
              </Pressable>
            )}

            {/* Shortcuts */}
            <View style={styles.shortcuts}>
              <Shortcut emoji="🏆" label={t.tipRanking} onPress={() => go('/tipps/ranking', { competition: myComps[0]?.code ?? '' })} />
              <Shortcut emoji="📊" label={t.tipStats} onPress={() => go('/tipps/stats')} />
              <Shortcut emoji="⭐" label={t.tipBonus} onPress={() => go('/tipps/bonus', { competition: myComps[0]?.code ?? defaultCompetition(lang) })} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Menu */}
      <Modal visible={menu} transparent animationType="none" onRequestClose={() => setMenu(false)}>
        <Animated.View entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} />
        </Animated.View>
        <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.sheetHandle} />
          <MenuRow emoji="📖" label={t.tipRules} onPress={() => setRules((v) => !v)} chevron={rules ? '⌃' : '⌄'} />
          {rules && <Text style={styles.rulesBody}>{t.tipRulesBody}</Text>}
          <View style={styles.menuRow}>
            <Text style={styles.menuEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t.tipNotifications}</Text>
              <Text style={styles.menuSub}>{t.tipNotificationsSub}</Text>
            </View>
            <Toggle
              value={notify}
              onValueChange={(v: boolean) => { setNotify(v); setNotifyTippspiel(v); }}
            />
          </View>
          <MenuRow emoji="🏟" label={t.tipMyCompetitions} onPress={() => go('/tipps/competitions')} />
          <MenuRow emoji="👥" label={t.tipGroups} onPress={() => go('/tipps/groups')} />
          <MenuRow emoji="⭐" label={t.tipBonusTitle} onPress={() => go('/tipps/bonus', { competition: myComps[0]?.code ?? defaultCompetition(lang) })} />
          <MenuRow emoji="📊" label={t.tipStats} onPress={() => go('/tipps/stats')} />
        </Animated.View>
      </Modal>
    </ScreenBg>
  );
}

/** First visit: pick the competitions to play (suggestion pre-selected by language). */
function Onboarding({ competitions, lang, onDone }: { competitions: Competition[]; lang: ReturnType<typeof useI18n>['lang']; onDone: () => void }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string[]>([defaultCompetition(lang), 'CL']);
  const [saving, setSaving] = useState(false);
  const toggle = (code: string) => {
    Haptics.selectionAsync();
    setPicked((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  };
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(500)}>
      <GlowCard variant="green" style={styles.hero}>
        <View style={styles.heroTop}>
          <BETinaAvatar size={56} online pulse />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.onbTitle}>{t.tipPickTitle}</Text>
            <Text style={styles.heroLine}>{t.tipPickBody}</Text>
          </View>
        </View>
        <View style={styles.onbGrid}>
          {competitions.map((c) => {
            const on = picked.includes(c.code);
            return (
              <Pressable key={c.code} onPress={() => toggle(c.code)} style={[styles.onbTile, on && styles.onbTileOn]}>
                <Emblem uri={c.emblem} size={22} />
                <Text style={[styles.onbName, on && styles.onbNameOn]} numberOfLines={1}>{c.name}</Text>
                <Text style={[styles.onbCheck, on && styles.onbCheckOn]}>{on ? '✓' : '+'}</Text>
              </Pressable>
            );
          })}
        </View>
        <GlowButton
          label={t.tipLetsGo}
          loading={saving}
          disabled={picked.length === 0}
          onPress={async () => {
            setSaving(true);
            await setMyCompetitions(picked);
            setSaving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDone();
          }}
        />
      </GlowCard>
    </Animated.View>
  );
}

function Tile({ value, text, label }: { value?: number; text?: string; label: string }) {
  return (
    <GlowCard style={styles.tile}>
      {text != null ? <Text style={styles.tileValue}>{text}</Text> : <AnimatedNumber value={value ?? 0} style={styles.tileValue} />}
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
    </GlowCard>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction} hitSlop={10} style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Shortcut({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.shortcutPressed]}>
      <Text style={styles.shortcutEmoji}>{emoji}</Text>
      <Text style={styles.shortcutLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({ emoji, label, onPress, chevron = '›' }: { emoji: string; label: string; onPress: () => void; chevron?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, { flex: 1 }]}>{label}</Text>
      <Text style={styles.chevron}>{chevron}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    color: Colors.textPrimary, fontSize: Typography.xl + 2, fontFamily: Fonts.blackItalic,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  iconBtnText: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.bold },
  hero: { padding: 18, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroLine: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.semibold, lineHeight: 21 },
  progressWrap: { gap: 6 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: Colors.primary, fontSize: Typography.xs + 1, fontFamily: Fonts.bold, letterSpacing: 0.5 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.glass, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  duel: {
    flexDirection: 'row', alignItems: 'stretch', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  duelSide: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
  duelYou: { backgroundColor: Colors.glowGreen, alignItems: 'flex-start' },
  duelBetina: { backgroundColor: Colors.glowAccent, alignItems: 'flex-end' },
  duelMid: { width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  duelVs: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.blackItalic },
  duelWho: { color: Colors.textPrimary, fontSize: Typography.xs + 1, fontFamily: Fonts.extrabold, letterSpacing: 1 },
  duelPts: { color: Colors.textPrimary, fontSize: Typography['2xl'], fontFamily: Fonts.black },
  duelBetinaName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duelSub: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, textAlign: 'center', marginTop: 6 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 2 },
  tileValue: { color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: Fonts.black },
  tileLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: Fonts.semibold },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.extrabold },
  sectionAction: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  sectionActionText: { color: Colors.primary, fontSize: Typography.base, fontFamily: Fonts.bold },
  compCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  compName: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.bold },
  compMeta: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  chipOpen: { backgroundColor: Colors.glowGold, borderColor: Colors.gold },
  chipDone: { backgroundColor: Colors.glowGreen, borderColor: Colors.primaryDim },
  chipText: { fontSize: Typography.xs, fontFamily: Fonts.extrabold },
  chipTextOpen: { color: Colors.gold },
  chipTextDone: { color: Colors.primary },
  chevron: { color: Colors.textSecondary, fontSize: Typography.xl, fontFamily: Fonts.bold, marginTop: -2 },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  groupEmoji: { fontSize: 22 },
  groupRank: { color: Colors.textPrimary, fontSize: Typography.lg, fontFamily: Fonts.black },
  teamTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  teamTagText: { color: Colors.textPrimary, fontSize: Typography.xs, fontFamily: Fonts.extrabold },
  dashed: {
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.glassBorder,
    padding: 16, alignItems: 'center', gap: 4,
  },
  dashedText: { color: Colors.primary, fontSize: Typography.base, fontFamily: Fonts.bold },
  shortcuts: { flexDirection: 'row', gap: 8, marginTop: 6 },
  shortcut: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  shortcutPressed: { backgroundColor: Colors.glowGreen, borderColor: Colors.primary },
  shortcutEmoji: { fontSize: 20 },
  shortcutLabel: { color: Colors.textPrimary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  onbTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.extrabold },
  onbGrid: { gap: 8 },
  onbTile: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  onbTileOn: { borderColor: Colors.primary, backgroundColor: Colors.glowGreen },
  onbName: { flex: 1, color: Colors.textSecondary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  onbNameOn: { color: Colors.textPrimary },
  onbCheck: { color: Colors.textMuted, fontSize: Typography.md, fontFamily: Fonts.bold },
  onbCheckOn: { color: Colors.primary },
  backdrop: { backgroundColor: Colors.overlay },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: Colors.glassBorder, paddingHorizontal: 20, paddingTop: 10, gap: 4,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.glassBorder, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderRadius: 12 },
  menuRowPressed: { backgroundColor: Colors.glass },
  menuEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  menuSub: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, marginTop: 2 },
  rulesBody: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.regular, lineHeight: 20, paddingLeft: 42, paddingBottom: 8 },
});
