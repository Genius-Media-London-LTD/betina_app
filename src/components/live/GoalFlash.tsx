// TOR! — the live goal moment. Mounted once in the app shell: while the app
// is open it watches the live poll for goals in the player's matches
// (favourite team, followed teams and matches) and pops a full-screen flash
// with crest, score and scorer. Closes itself after a few seconds.
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { Crest } from './LiveParts';
import { Meta } from '../Urban';
import { useProfile } from '../../hooks/useProfile';
import { isFollowing, useFollows } from '../../lib/follows';
import { useI18n } from '../../lib/i18n';
import { Incident, onIncidents, sameTeam, useLiveNow } from '../../lib/live';
import { Colors, Fonts, displayType } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');
const SHOW_MS = 7000;

const BURST = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 4) * 0.3;
  const dist = 130 + ((i * 53) % 170);
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, size: 7 + ((i * 5) % 12), white: i % 3 === 0, delay: (i % 6) * 35 };
});

function Piece({ dx, dy, size, white, delay }: (typeof BURST)[number]) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(180 + delay, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })); }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value * 0.8,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { rotate: `${p.value * 180}deg` }],
  }));
  return <Animated.View style={[styles.piece, { width: size, height: size, backgroundColor: white ? Colors.white : Colors.primary }, style]} />;
}

export default function GoalFlash() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const follows = useFollows();
  const fav = profile?.favourite_team ?? null;
  const [goal, setGoal] = useState<Incident | null>(null);
  const queue = useRef<Incident[]>([]);
  const pop = useSharedValue(0);

  // Keep the live poll running (gently) only for players who have matches to watch.
  const watching = !!fav || follows.some((f) => f.kind === 'team' || f.kind === 'match');
  useLiveNow(watching ? 30_000 : null);

  useEffect(() => onIncidents((list) => {
    const mine = list.filter((i) => i.type === 'goal' && (
      sameTeam(fav, i.h.n) || sameTeam(fav, i.a.n) || isFollowing('team', i.h.id) || isFollowing('team', i.a.id) || isFollowing('match', i.id)));
    if (!mine.length) return;
    queue.current.push(...mine);
    setGoal((g) => g ?? queue.current.shift() ?? null);
  }), [fav]);

  useEffect(() => {
    if (!goal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pop.value = 0;
    pop.value = withDelay(80, withSpring(1, { damping: 8, stiffness: 150 }));
    const timer = setTimeout(() => setGoal(queue.current.shift() ?? null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [goal, pop]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.6),
    transform: [{ scale: 0.25 + pop.value * 0.75 }, { rotate: `${-12 + pop.value * 8}deg` }],
  }));

  if (!goal) return null;
  const team = goal.side === 1 ? goal.a : goal.h;
  const close = () => setGoal(queue.current.shift() ?? null);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]} onPress={close}>
        <View style={styles.burst} pointerEvents="none">{BURST.map((b, i) => <Piece key={`${goal.seq}-${i}`} {...b} />)}</View>
        <View style={styles.center}>
          <Animated.View entering={ZoomIn.duration(300)}>
            <Crest id={team.id} name={team.n} size={86} />
          </Animated.View>
          <Animated.View style={[styles.pop, popStyle]}>
            <Text style={styles.popText} numberOfLines={1} adjustsFontSizeToFit>{t.liveGoal}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.score}>
            <Text style={[styles.team, goal.side === 0 && { color: Colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>{goal.h.n.toUpperCase()}</Text>
            <Text style={styles.result}>{`${goal.g[0] ?? 0}:${goal.g[1] ?? 0}`}</Text>
            <Text style={[styles.team, { textAlign: 'right' }, goal.side === 1 && { color: Colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>{goal.a.n.toUpperCase()}</Text>
          </Animated.View>
          {!!goal.player && (
            <Animated.Text entering={FadeIn.delay(550).duration(400)} style={styles.scorer}>
              {`⚽ ${goal.player}${goal.min ? ` ${goal.min}'` : ''}`}
            </Animated.Text>
          )}
          <Meta color={Colors.textSecondary}>BETINA LIVE</Meta>
        </View>
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable
            onPress={() => { const id = goal.id; close(); router.push({ pathname: '/match/[id]', params: { id: String(id) } }); }}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.btnText}>{t.liveTabTicker.toUpperCase()}</Text>
            <Text style={styles.btnText}>→</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: 16, justifyContent: 'space-between' },
  burst: { position: 'absolute', left: W / 2, top: H * 0.4, width: 0, height: 0 },
  piece: { position: 'absolute' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  pop: { backgroundColor: Colors.primary, paddingHorizontal: 22, paddingTop: 6, alignSelf: 'stretch', alignItems: 'center' },
  popText: { ...displayType(120, 128), color: Colors.black },
  score: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 10,
  },
  team: { flex: 1, color: Colors.white, fontSize: 22, fontFamily: Fonts.display },
  result: { ...displayType(52, 56), color: Colors.white },
  scorer: { color: Colors.white, fontSize: 20, fontFamily: Fonts.label, letterSpacing: 0.4 },
  btn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 16 },
  btnText: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display },
});
