import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Meta, Sticker } from '../../src/components/Urban';
import { useI18n } from '../../src/lib/i18n';
import { Colors, Fonts } from '../../src/theme';

export default function Welcome() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, team } = useLocalSearchParams<{ name: string; team?: string }>();
  const displayName = (name?.trim() || 'friend').split(/\s+/)[0];
  const teamParam = team?.trim() || null;
  const nameSize = displayName.length > 9 ? 56 : 76;

  return (
    <ScreenBg>
      <Animated.View entering={FadeIn.duration(900)} style={StyleSheet.absoluteFill}>
        <Image source={require('../../assets/urban/betina-wink.jpg')} style={styles.photo} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', Colors.black]}
          locations={[0.35, 0.78]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.tag}>
          <Meta color={Colors.primary}>{`BETINA · ${t.welcomeTier} INITIATE`}</Meta>
        </View>
        <View style={{ flex: 1 }} />

        <Animated.View entering={ZoomIn.delay(700).springify()} style={styles.bonus}>
          <Sticker text={`+100 XP\n${t.welcomeBonus}`} rotate={-5} size={30} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
          <Text style={styles.hi}>{t.welcomeHi.toUpperCase()}</Text>
          <Text style={[styles.hi, styles.name, { fontSize: nameSize, lineHeight: Math.round(nameSize * 0.95) }]} numberOfLines={1} adjustsFontSizeToFit>
            {displayName.toUpperCase()}.
          </Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={styles.quote}>
          “{t.welcomeSubtitle}”
        </Animated.Text>

        {teamParam && (
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.chips}>
            <View style={styles.chip}><Text style={styles.chipText}>{teamParam.toUpperCase()}</Text></View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(750).duration(800)} style={{ marginTop: 18 }}>
          <GlowButton label={t.registerBtn} onPress={() => router.replace('/(tabs)')} />
        </Animated.View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '78%' },
  content: { flex: 1, paddingHorizontal: 16, gap: 10 },
  tag: { alignSelf: 'flex-start', backgroundColor: Colors.black, paddingHorizontal: 8, paddingVertical: 4 },
  bonus: { alignSelf: 'flex-start', marginBottom: 10 },
  hi: { color: Colors.white, fontSize: 76, lineHeight: 72, fontFamily: Fonts.display },
  name: { color: Colors.primary },
  quote: { color: Colors.white, fontSize: 17, lineHeight: 24, fontFamily: Fonts.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1.5, borderColor: Colors.white, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.5 },
});
