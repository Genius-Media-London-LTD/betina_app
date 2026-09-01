import { useI18n } from '../../src/lib/i18n';
import React, { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { registerForPush } from '../../src/lib/push';
import { claimDailyLogin } from '../../src/lib/xp';
import { Colors, Fonts } from '../../src/theme';

type TabMeta = { emoji: string; labelKey: keyof any };

const TAB_CONFIG: Record<string, { emoji: string; labelKey: string }> = {
  index: { emoji: '🏠', labelKey: 'tabHome' },
  chat: { emoji: '💬', labelKey: 'tabChat' },
  journey: { emoji: '🚀', labelKey: 'tabJourney' },
  live: { emoji: '⚽', labelKey: 'tabLive' },
  settings: { emoji: '⚙️', labelKey: 'tabSettings' },
};

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) + 12 }]}>
      {state.routes.map((route, index) => {
        const cfg = TAB_CONFIG[route.name];
        if (!cfg) return null;
        const focused = state.index === index;
        const label = (t as any)[cfg.labelKey] || cfg.labelKey;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={[
              styles.tab,
              focused && styles.tabFocused,
            ]}
          >
            <Text style={styles.tabEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
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
    return () => sub.remove();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="live" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="journey" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const glassWrapStyle: ViewStyle & { backdropFilter: string } = {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'rgba(15,15,31,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
};

const styles = StyleSheet.create({
  wrap: glassWrapStyle,
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 16,
    gap: 2,
  },
  tabFocused: {
    backgroundColor: 'rgba(184,233,38,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.25)',
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: { color: '#888899', fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
  tabLabelFocused: { color: Colors.primary },
});
