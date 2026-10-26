import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import AnimatedNumber from '../components/AnimatedNumber';
import BETinaAvatar from '../components/BETinaAvatar';
import BoomMoment from '../components/BoomMoment';
import PhotoMomentModal, { HitToast } from '../components/PhotoMoments';
import GlowButton from '../components/GlowButton';
import ScreenBg from '../components/ScreenBg';
import SignInWall from '../components/SignInWall';
import Toggle from '../components/Toggle';
import { Emblem, LOCALE, fillText as fill } from '../components/TipParts';
import { Headline, Meta } from '../components/Urban';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';
import { useI18n } from '../lib/i18n';
import {
  Competition, ExactHit, GroupDuel, RankRow, Stats, TipGroup,
  defaultCompetition, fetchCompetitions, fetchGroupDuel, fetchLeaderboard, fetchMyCompetitions, fetchMyGroups,
  fetchNotifyTippspiel, fetchOpenTips, fetchStats, setMyCompetitions, setNotifyTippspiel, takeUnseenExactHit,
} from '../lib/tippspiel';
import { HitMoment, PhotoMoment, bigMomentShown, checkMoments, claimBigMoment, takeHits, tipMoment } from '../lib/moments';
import { useChrome } from '../components/chrome';
import { Colors, Fonts, displayType } from '../theme';

type Open = Record<string, { open: number; total: number; next: string | null }>;

export default function TippspielTab() {
  const session = useSession();
  const { t } = useI18n();
  if (session === undefined) return <ScreenBg />;
  if (session === null) return <SignInWall body={t.tipGuestBody} />;
  return <Hub />;
}

/** The Tippspiel home: what's open, the duel with BETina, my competitions and Tipprunden. */
function Hub() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useChrome();
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
  const [boom, setBoom] = useState<ExactHit | null>(null);
  const [photo, setPhoto] = useState<PhotoMoment | null>(null);
  const [hits, setHits] = useState<HitMoment | null>(null);

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
    // One big moment per visit (lib/moments.ts): BOOM for a fresh exact hit,
    // else K.O./Revanche, Platz 1, On Fire; otherwise the TREFFER toast.
    await checkMoments(async () => {
      if (!bigMomentShown()) {
        const hit = await takeUnseenExactHit();
        if (hit && claimBigMoment()) { setBoom(hit); return; }
        const big = await tipMoment();
        if (big && claimBigMoment()) { setPhoto(big); return; }
      }
      const fresh = await takeHits();
      if (fresh) setHits(fresh);
    }).catch(() => {});
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
  const segments = 20;
  const doneSegs = totals.total ? Math.round((totals.done / totals.total) * segments) : 0;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: chrome.top + 18, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressViewOffset={chrome.top} />}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Headline text={`${t.tabTipps}.`} size={58} accent="last" />
          <Pressable onPress={() => { Haptics.selectionAsync(); setMenu(true); }} style={styles.iconBtn} hitSlop={8}>
            <Text style={styles.iconBtnText}>⋯</Text>
          </Pressable>
        </Animated.View>

        {mine === null ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : mine.length === 0 ? (
          <Onboarding competitions={competitions} lang={lang} onDone={load} />
        ) : (
          <>
            {/* What's open */}
            <Animated.View entering={FadeInDown.delay(60).duration(450)} style={styles.hero}>
              <View style={styles.heroTop}>
                <BETinaAvatar size={52} online pulse={totals.open > 0} />
                <Text style={styles.heroLine}>{hostLine}</Text>
              </View>
              {totals.total > 0 && (
                <View style={styles.progressWrap}>
                  <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>
                    {totals.open === 0 ? t.tipAllDone : fill(t.tipProgress, { done: totals.done, total: totals.total })}
                  </Meta>
                  <View style={styles.segs}>
                    {Array.from({ length: segments }, (_, i) => (
                      <View key={i} style={[styles.seg, i < doneSegs && styles.segOn]} />
                    ))}
                  </View>
                </View>
              )}
              {totals.first && (
                <Pressable
                  onPress={() => go('/tipps/play', { competition: totals.first! })}
                  style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.heroBtnText}>{t.tipNow.toUpperCase()}</Text>
                  <Text style={styles.heroBtnArrow}>→</Text>
                </Pressable>
              )}
            </Animated.View>

            {/* Beat BETina */}
            <Animated.View entering={FadeInDown.delay(110).duration(450)}>
              <Pressable onPress={() => go('/tipps/stats')}>
                <View style={styles.duel}>
                  <View style={[styles.duelSide, styles.duelYou]}>
                    <Text style={[styles.duelWho, { color: Colors.black }]}>{t.tipYouShort}</Text>
                    <AnimatedNumber value={stats?.duel?.me ?? 0} style={[styles.duelPts, { color: Colors.black }]} />
                  </View>
                  <View style={styles.duelMid}>
                    <Text style={styles.duelVs}>VS</Text>
                  </View>
                  <View style={[styles.duelSide, styles.duelBetina]}>
                    <View style={styles.duelBetinaName}>
                      <Text style={styles.duelWho}>BETINA</Text>
                      <BETinaAvatar size={22} />
                    </View>
                    <AnimatedNumber value={stats?.duel?.betina ?? 0} style={[styles.duelPts, { color: Colors.primary }]} />
                  </View>
                </View>
                <Meta style={styles.duelSub}>
                  {stats?.duel?.matches ? `${t.tipDuelTitle} · ${fill(t.tipDuelSub, { n: stats.duel.matches })}` : t.tipDuelEmpty}
                </Meta>
              </Pressable>
            </Animated.View>

            {/* Season at a glance */}
            <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.tiles}>
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
                  <Pressable onPress={() => go('/tipps/play', { competition: c.code })} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                    <Emblem uri={c.emblem} size={24} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.rowName}>{c.name.toUpperCase()}</Text>
                      {o?.next && <Meta>{`${t.tipNextKickoff}: ${kickoffFmt.format(new Date(o.next))}`}</Meta>}
                    </View>
                    {o && o.total > 0 && (
                      <View style={[styles.chip, o.open > 0 ? styles.chipOpen : styles.chipDone]}>
                        <Text style={[styles.chipText, o.open > 0 ? styles.chipTextOpen : styles.chipTextDone]}>
                          {(o.open > 0 ? fill(t.tipOpenChip, { n: o.open }) : `✓ ${t.tipAllTipped}`).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.chevron}>→</Text>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* Tipprunden */}
            <SectionHead title={t.tipGroups} action="+" onAction={() => go('/tipps/groups')} />
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => go('/tipps/ranking', { group: g.id, groupName: g.name, code: g.code })}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{g.name.toUpperCase()}</Text>
                  <Meta>{`${g.members} ${t.tipMembers}`}</Meta>
                </View>
                {g.duel && g.duel.won + g.duel.lost + g.duel.drawn > 0 && (
                  <View style={styles.teamTag}>
                    <Text style={styles.teamTagText}>{g.duel.won}:{g.duel.lost}</Text>
                    <BETinaAvatar size={16} />
                  </View>
                )}
                {g.rank != null && <Text style={styles.groupRank}>#{g.rank}</Text>}
                <Text style={styles.chevron}>→</Text>
              </Pressable>
            ))}
            {groups.length === 0 && (
              <Pressable onPress={() => go('/tipps/groups')} style={({ pressed }) => [styles.dashed, pressed && styles.rowPressed]}>
                <Text style={styles.dashedText}>+ {t.tipNewGroup.toUpperCase()}</Text>
                <Meta>{t.tipNoGroups}</Meta>
              </Pressable>
            )}

            {/* Shortcuts */}
            <View style={styles.shortcuts}>
              <Shortcut label={t.tipRanking} onPress={() => go('/tipps/ranking', { competition: myComps[0]?.code ?? '' })} />
              <Shortcut label={t.tipStats} onPress={() => go('/tipps/stats')} />
              <Shortcut label={t.tipBonus} onPress={() => go('/tipps/bonus', { competition: myComps[0]?.code ?? defaultCompetition(lang) })} />
            </View>
          </>
        )}
      </ScrollView>

      <BoomMoment
        hit={boom}
        name={firstName}
        onClose={() => setBoom(null)}
        onMore={() => { const c = boom?.competition; setBoom(null); if (c) go('/tipps/play', { competition: c }); }}
        onCelebrate={() => { setBoom(null); router.push('/(tabs)/chat'); }}
      />

      <PhotoMomentModal moment={photo} name={firstName} onClose={() => setPhoto(null)} />
      <HitToast hit={hits} name={firstName} onClose={() => setHits(null)} />

      {/* Menu */}
      <Modal visible={menu} transparent animationType="none" onRequestClose={() => setMenu(false)}>
        <Animated.View entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} />
        </Animated.View>
        <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <MenuRow label={t.tipRules} onPress={() => setRules((v) => !v)} chevron={rules ? '−' : '+'} />
          {rules && <Text style={styles.rulesBody}>{t.tipRulesBody}</Text>}
          <View style={styles.menuRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t.tipNotifications.toUpperCase()}</Text>
              <Meta style={{ marginTop: 4 }}>{t.tipNotificationsSub}</Meta>
            </View>
            <Toggle
              value={notify}
              onValueChange={(v: boolean) => { setNotify(v); setNotifyTippspiel(v); }}
            />
          </View>
          <MenuRow label={t.tipMyCompetitions} onPress={() => go('/tipps/competitions')} />
          <MenuRow label={t.tipGroups} onPress={() => go('/tipps/groups')} />
          <MenuRow label={t.tipBonusTitle} onPress={() => go('/tipps/bonus', { competition: myComps[0]?.code ?? defaultCompetition(lang) })} />
          <MenuRow label={t.tipStats} onPress={() => go('/tipps/stats')} />
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
    <Animated.View entering={FadeInDown.delay(60).duration(450)} style={{ gap: 14 }}>
      <View style={styles.onbHead}>
        <BETinaAvatar size={52} online pulse />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.onbTitle}>{t.tipPickTitle.toUpperCase()}</Text>
          <Text style={styles.onbBody}>{t.tipPickBody}</Text>
        </View>
      </View>
      <View style={styles.onbGrid}>
        {competitions.map((c) => {
          const on = picked.includes(c.code);
          return (
            <Pressable key={c.code} onPress={() => toggle(c.code)} style={[styles.onbTile, on && styles.onbTileOn]}>
              <Emblem uri={c.emblem} size={22} />
              <Text style={[styles.onbName, on && styles.onbNameOn]} numberOfLines={1}>{c.name.toUpperCase()}</Text>
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
    </Animated.View>
  );
}

function Tile({ value, text, label }: { value?: number; text?: string; label: string }) {
  return (
    <View style={styles.tile}>
      {text != null ? <Text style={styles.tileValue}>{text}</Text> : <AnimatedNumber value={value ?? 0} style={styles.tileValue} />}
      <Meta numberOfLines={1}>{label}</Meta>
    </View>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Headline text={title} size={30} accent="last" />
      <Pressable onPress={onAction} hitSlop={10} style={({ pressed }) => [styles.sectionAction, pressed && styles.rowPressed]}>
        <Text style={styles.sectionActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Shortcut({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.shortcutPressed]}>
      <Text style={styles.shortcutLabel} numberOfLines={1} adjustsFontSizeToFit>{label.toUpperCase()}</Text>
      <Text style={styles.shortcutArrow}>→</Text>
    </Pressable>
  );
}

function MenuRow({ label, onPress, chevron = '→' }: { label: string; onPress: () => void; chevron?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}>
      <Text style={[styles.menuLabel, { flex: 1 }]}>{label.toUpperCase()}</Text>
      <Text style={styles.chevron}>{chevron}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  iconBtn: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.borderStrong,
  },
  iconBtnText: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label },

  hero: { backgroundColor: Colors.primary, padding: 16, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroLine: { flex: 1, color: Colors.black, fontSize: 17, fontFamily: Fonts.semibold, lineHeight: 23 },
  progressWrap: { gap: 8 },
  segs: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 10, backgroundColor: Colors.primaryDim },
  segOn: { backgroundColor: Colors.black },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.black, paddingHorizontal: 16, paddingVertical: 14,
  },
  heroBtnText: { color: Colors.primary, fontSize: 22, fontFamily: Fonts.display, letterSpacing: 0.5 },
  heroBtnArrow: { color: Colors.primary, fontSize: 22, fontFamily: Fonts.display },

  duel: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1.5, borderColor: Colors.border },
  duelSide: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  duelYou: { backgroundColor: Colors.primary, alignItems: 'flex-start' },
  duelBetina: { backgroundColor: Colors.surface, alignItems: 'flex-end' },
  duelMid: { width: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black },
  duelVs: { color: Colors.textMuted, fontSize: 20, fontFamily: Fonts.display },
  duelWho: { color: Colors.white, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 1 },
  duelPts: { ...displayType(52, 54) },
  duelBetinaName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duelSub: { textAlign: 'center', marginTop: 8 },

  tiles: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 12, gap: 4,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  tileValue: { ...displayType(34, 36), color: Colors.white },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  sectionAction: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  sectionActionText: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.label },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  rowPressed: { borderColor: Colors.primary, backgroundColor: Colors.card },
  rowName: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.3 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5 },
  chipOpen: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDone: { borderColor: Colors.borderStrong },
  chipText: { fontSize: 12, fontFamily: Fonts.label, letterSpacing: 0.4 },
  chipTextOpen: { color: Colors.black },
  chipTextDone: { color: Colors.textSecondary },
  chevron: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.label },
  groupRank: { color: Colors.white, fontSize: 26, fontFamily: Fonts.display },
  teamTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1.5, borderColor: Colors.borderStrong,
  },
  teamTagText: { color: Colors.white, fontSize: 12, fontFamily: Fonts.monoBold },
  dashed: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderStrong,
    padding: 16, alignItems: 'center', gap: 6,
  },
  dashedText: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.5 },

  shortcuts: { flexDirection: 'row', gap: 8, marginTop: 14 },
  shortcut: {
    flex: 1, gap: 10, paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  shortcutPressed: { borderColor: Colors.primary },
  shortcutLabel: { color: Colors.white, fontSize: 20, fontFamily: Fonts.display },
  shortcutArrow: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.label },

  onbHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  onbTitle: { ...displayType(26, 28), color: Colors.primary },
  onbBody: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium },
  onbGrid: { gap: 8 },
  onbTile: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  onbTileOn: { borderColor: Colors.primary },
  onbName: { flex: 1, color: Colors.textSecondary, fontSize: 17, fontFamily: Fonts.label },
  onbNameOn: { color: Colors.white },
  onbCheck: { color: Colors.textMuted, fontSize: 20, fontFamily: Fonts.label },
  onbCheckOn: { color: Colors.primary },

  backdrop: { backgroundColor: Colors.overlay },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.black, borderTopWidth: 3, borderTopColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 10,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  menuLabel: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.4 },
  rulesBody: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.regular, lineHeight: 21, paddingVertical: 10 },
});
