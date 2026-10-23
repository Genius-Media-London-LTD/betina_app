import React, { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import AppShell from '../../src/components/AppShell';
import { onNotificationTap, registerForPush } from '../../src/lib/push';
import { claimDailyLogin } from '../../src/lib/xp';
import { Colors } from '../../src/theme';

/**
 * Main area: the swipe pager with the shared header and side menu
 * (src/components/AppShell). The (tabs) child routes render nothing — they
 * only tell the pager which page to show, so links like '/(tabs)/chat' and
 * push targets like '/tippspiel' keep working.
 */
export default function TabsLayout() {
  const router = useRouter();
  // Register this device for push, and grant the daily open reward (server
  // enforces once-per-day), once the player enters the app. Re-run push
  // registration whenever the app returns to the foreground so a token gets
  // saved even if the first attempt failed (e.g. permission granted later).
  useEffect(() => {
    registerForPush();
    claimDailyLogin();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerForPush();
    });
    // Pushes with a deep link (e.g. Tippspiel reminders) open their screen.
    const offTap = onNotificationTap((url) => router.push(url as never));
    return () => {
      sub.remove();
      offTap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  return (
    <View style={styles.root}>
      <AppShell />
      <View style={styles.routes} pointerEvents="none">
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  routes: { position: 'absolute', width: 0, height: 0, overflow: 'hidden' },
});
