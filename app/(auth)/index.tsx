import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import ScreenBg from '../../src/components/ScreenBg';
import ParticlesBg from '../../src/components/ParticlesBg';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../../src/theme';

const LOAD_MS = 2800;

export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loadProgress = useSharedValue(0);

  useEffect(() => {
    loadProgress.value = withDelay(
      1000,
      withTiming(1, { duration: LOAD_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/(tabs)');
      else router.replace('/(auth)/login');
    }, LOAD_MS + 1200);
    return () => clearTimeout(timer);
  }, [loadProgress, router]);

  const barStyle = useAnimatedStyle(() => ({ width: `${loadProgress.value * 100}%` }));

  return (
    <ScreenBg glowTop={0.42} glowSize={480}>
      <ParticlesBg count={12} />

      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(1400).easing(Easing.out(Easing.exp))}>
          <BETinaAvatar size={172} pulse />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350).duration(1400).easing(Easing.out(Easing.exp))}
          style={styles.titleWrap}
        >
          <Text style={styles.title}>
            BET<Text style={styles.titleAccent}>ina</Text>
          </Text>
          <Text style={styles.subtitle}>Your AI Companion</Text>
        </Animated.View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing['3xl'] }]}>
        <Animated.View entering={FadeInDown.delay(700).duration(1000)} style={styles.poweredBy}>
          <Text style={styles.poweredByLabel}>Powered by</Text>
          <Image
            source={require('../../assets/logo-wordmark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(900).duration(1000)} style={styles.loadTrack}>
          <Animated.View style={[styles.loadFill, barStyle]}>
            <LinearGradient
              colors={[Colors.primaryDim, Colors.primary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: Spacing['2xl'],
  },
  titleWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    color: Colors.primary,
    fontSize: 42,
    fontFamily: Fonts.blackItalic,
    letterSpacing: -1,
    textShadowColor: withAlpha(Colors.primary, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  titleAccent: {
    color: Colors.white,
    textShadowColor: 'transparent',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bottom: {
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 44,
  },
  poweredBy: {
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  poweredByLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.semibold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  logo: {
    height: 22,
    width: 160,
  },
  loadTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(Colors.white, 0.08),
    overflow: 'hidden',
  },
  loadFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
});
