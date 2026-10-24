import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import ScreenBg from '../../src/components/ScreenBg';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme';

/**
 * Device Check Screen — Invisible splash that validates device token
 * If token is valid: auto-login and navigate to main app
 * If token is invalid/expired: delete it and go to login
 */
export default function DeviceCheck() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkDeviceToken();
  }, []);

  const checkDeviceToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('betina_device_token');
      const phone = await SecureStore.getItemAsync('betina_device_phone');

      if (!token || !phone) {
        // No token stored, go to login
        router.replace('/(auth)/login');
        return;
      }

      // Call device-login endpoint
      const res = await fetch('https://intelligence.geniusbet.com/api/sms/otp/device-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_token: token }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        // Token expired or invalid — clear and go to login
        await SecureStore.deleteItemAsync('betina_device_token');
        await SecureStore.deleteItemAsync('betina_device_phone');
        router.replace('/(auth)/login');
        return;
      }

      // Token valid — set session and navigate
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.name) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/register');
      }
    } catch (e) {
      // Network error or other issue — go to login
      await SecureStore.deleteItemAsync('betina_device_token');
      await SecureStore.deleteItemAsync('betina_device_phone');
      router.replace('/(auth)/login');
    }
  };

  return (
    <ScreenBg>
      <View
        style={[
          { flex: 1, justifyContent: 'center', alignItems: 'center' },
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <BETinaAvatar size={64} />
      </View>
    </ScreenBg>
  );
}
