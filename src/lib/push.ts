// Push notifications — client side.
//
// This registers the device for Expo push and stores the token on the
// player's profile. The actual "your team just won!" messages are SENT by a
// server job (see supabase/functions/match-alerts) — the app only receives
// them. Requires a `push_token` column on `profiles` and an EAS projectId.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Show notifications while the app is foregrounded, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Ask for permission, get the Expo push token, and save it to the profile.
 * Safe to call on every launch — it's a no-op on web / simulators / when the
 * player declines, and never throws.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return null;

    // Android needs a channel for notifications to appear.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BETina',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#B8E926',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] no EAS projectId — run `eas init` to enable push tokens');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
      if (error) console.warn('[push] could not save token:', error.message);
    }
    return token;
  } catch (e) {
    console.warn('[push] registration skipped:', e);
    return null;
  }
}

/**
 * Call `open(url)` when the player taps a push that carries `data.url` (e.g.
 * the Tippspiel reminders open "/tippspiel"), including the tap that launched
 * the app. Returns an unsubscribe function. No-op on web.
 */
export function onNotificationTap(open: (url: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const handle = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) open(url);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
