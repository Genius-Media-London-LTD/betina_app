import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import ScreenBg from '../../src/components/ScreenBg';
import XPBar from '../../src/components/XPBar';
import { Meta, OutlineNumber, Sticker, Ticker } from '../../src/components/Urban';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts } from '../../src/theme';

const LOAD_MS = 2800;

export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/(tabs)');
      else router.replace('/(auth)/login');
    }, LOAD_MS + 600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ScreenBg>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Image source={require('../../assets/urban/logo-wordmark.png')} style={styles.wordmark} resizeMode="contain" />
        <Meta color={Colors.primary}>AI COMPANION</Meta>
      </View>

      {/* Photo */}
      <Animated.View entering={FadeIn.duration(900)} style={styles.photo}>
        <Image source={require('../../assets/urban/betina-splash.jpg')} style={styles.photoImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', Colors.black]}
          locations={[0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.vertical} pointerEvents="none">
          <OutlineNumber value="BETINA" size={60} />
        </View>
        <Animated.View entering={ZoomIn.delay(900).springify()} style={styles.stickerWrap}>
          <Sticker text={'Your game.\nYour vibe.'} rotate={-6} />
        </Animated.View>
      </Animated.View>

      <Ticker label="Live" items={['BETina is live', 'BETina News', 'Beat BETina', 'XP drop']} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.delay(400).duration(800).easing(Easing.out(Easing.exp))}>
          <Meta color={Colors.primary}>// MEET YOUR</Meta>
          <Text style={styles.name}>BETINA</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(700).duration(700)} style={styles.load}>
          <View style={styles.loadHead}>
            <Meta>SYNCING YOUR TEAMS</Meta>
            <Meta color={Colors.primary}>18+</Meta>
          </View>
          <XPBar progress={1} height={8} segments={24} delay={900} />
          <View style={styles.powered}>
            <Meta size={9}>POWERED BY</Meta>
            <Image source={require('../../assets/logo-wordmark.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </Animated.View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  wordmark: { width: 120, height: 22 },
  photo: { flex: 1, overflow: 'hidden', backgroundColor: Colors.surface },
  photoImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  vertical: { position: 'absolute', right: -66, top: 130, transform: [{ rotate: '90deg' }] },
  stickerWrap: { position: 'absolute', left: 16, bottom: 26 },
  bottom: { paddingHorizontal: 16, paddingTop: 18, gap: 16 },
  name: { color: Colors.primary, fontSize: 72, lineHeight: 76, fontFamily: Fonts.wordmark, letterSpacing: -1 },
  load: { gap: 8 },
  loadHead: { flexDirection: 'row', justifyContent: 'space-between' },
  powered: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  logo: { width: 110, height: 18 },
});
