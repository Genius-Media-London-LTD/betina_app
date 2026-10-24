import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

/** Sign out and forget this device's trusted-login token (settings + menu). */
export async function signOut(): Promise<void> {
  // SecureStore is unavailable on web — don't let it throw and block sign-out.
  try {
    await SecureStore.deleteItemAsync('betina_device_token');
    await SecureStore.deleteItemAsync('betina_device_phone');
  } catch {
    // no-op on web
  }
  await supabase.auth.signOut();
}
