import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Sticker } from '../../src/components/Urban';
import { useDesktop } from '../../src/lib/layout';
import { Colors, Fonts, displayType } from '../../src/theme';

export default function AuthLayout() {
  const router = useRouter();
  const desktop = useDesktop();

  // On mount, check if device token exists and route to device-check
  useEffect(() => {
    checkAndRouteToDeviceCheck();
  }, []);

  const checkAndRouteToDeviceCheck = async () => {
    try {
      const token = await SecureStore.getItemAsync('betina_device_token');
      if (token) {
        // Device token exists, navigate to device-check instead of login
        router.replace('/(auth)/device-check');
      }
    } catch (e) {
      // Ignore errors, proceed normally
    }
  };

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
  if (!desktop) return stack;

  // Desktop browser: BETina big on the left, the phone-sized flow on the right.
  return (
    <View style={styles.split}>
      <View style={styles.stage}>
        <View style={styles.frame}>
          <Image source={require('../../assets/urban/betina-splash.jpg')} style={styles.photo} resizeMode="cover" />
          <View style={styles.shade} />
        </View>
        <View style={styles.brand}>
          <Image source={require('../../assets/urban/logo-mark.png')} style={styles.logoMark} resizeMode="contain" />
          <Text style={styles.wordmark}>BET<Text style={{ color: Colors.primary }}>INA</Text></Text>
        </View>
        <View style={styles.claim}>
          <Sticker text={'Your game.\nYour vibe.'} rotate={-4} size={18} />
          <Text style={styles.headline}>BETINA</Text>
          <Text style={styles.meta}>AI SPORTS COMPANION · 18+</Text>
        </View>
      </View>
      <View style={styles.form}>{stack}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  stage: { flex: 1, overflow: 'hidden', backgroundColor: Colors.background },
  // The photos are portrait and small: shown at 4:5 on the right, not stretched.
  frame: { position: 'absolute', top: 0, bottom: 0, right: 0, aspectRatio: 0.8 },
  photo: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlayLight },
  brand: { position: 'absolute', top: 28, left: 32, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 24, height: 26 },
  wordmark: { color: Colors.white, fontSize: 24, fontFamily: Fonts.wordmark, letterSpacing: -0.2 },
  claim: { position: 'absolute', left: 32, bottom: 32, gap: 14, alignItems: 'flex-start' },
  headline: { ...displayType(140, 140), color: Colors.primary, letterSpacing: 1 },
  meta: { color: Colors.white, fontSize: 11, fontFamily: Fonts.monoBold, letterSpacing: 1.4 },
  form: { width: 520, borderLeftWidth: 1, borderLeftColor: Colors.line },
});
