// Sign-in without a phone number: Google, Apple (iOS) and a 6-digit email code,
// all straight through Supabase Auth. Phone login keeps going through the
// GeniusBet OTP server (login.tsx / otp.tsx) because the number links the CRM.
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// OAuth client IDs from Google Cloud — public values, not secrets. While empty,
// the Google button stays hidden.
export const GOOGLE_WEB_CLIENT_ID = '427780186132-n1hgsih2ufj7999a9to3v8h80skq596c.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '427780186132-chv9grrokf1euv9af303m8k8nu1qrp4c.apps.googleusercontent.com';

/**
 * 'ok' = signed in, 'cancelled' = the player closed the sheet, 'error' = show a
 * message, 'redirect' = web is leaving for Google and comes back signed in.
 */
export type SignInResult = 'ok' | 'cancelled' | 'error' | 'redirect';

export const googleEnabled = !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== 'ios' || !!GOOGLE_IOS_CLIENT_ID);

let googleReady = false;

export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    if (Platform.OS === 'web') {
      // Full-page redirect; supabase.ts picks the session up from the URL on return.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return error ? 'error' : 'redirect';
    }
    if (!googleReady) {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID || undefined });
      googleReady = true;
    }
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return 'cancelled';
    const idToken = res.data.idToken;
    if (!idToken) return 'error';
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    return error ? 'error' : 'ok';
  } catch (e) {
    console.warn('google sign-in failed:', e);
    return 'error';
  }
}

/** Sign in with Apple is iOS-only here (App Store rule 4.8 needs it next to Google). */
export const appleEnabled = Platform.OS === 'ios';

/** Apple's sheet; also used to get a fresh authorization code before deleting the account. */
async function appleCredential(nonce?: string) {
  return AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  });
}

const cancelled = (e: unknown) => (e as { code?: string })?.code === 'ERR_REQUEST_CANCELED';

export async function signInWithApple(): Promise<SignInResult> {
  try {
    const raw = Crypto.randomUUID();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
    const cred = await appleCredential(hashed);
    if (!cred.identityToken) return 'error';
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: raw });
    if (error) return 'error';
    // Apple shares the name only on the very first sign-in — keep it for the register form.
    const fullName = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
    if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
    return 'ok';
  } catch (e) {
    if (cancelled(e)) return 'cancelled';
    console.warn('apple sign-in failed:', e);
    return 'error';
  }
}

/**
 * Apple requires revoking its tokens when an Apple account is deleted. We ask
 * Apple for a fresh one-time code; the delete-account function trades it in.
 * Null when the player didn't sign in with Apple (or closes the sheet).
 */
export async function appleCodeForDeletion(): Promise<string | null> {
  if (!appleEnabled) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const viaApple = session?.user.identities?.some((i) => i.provider === 'apple');
  if (!viaApple) return null;
  try {
    const cred = await appleCredential();
    return cred.authorizationCode ?? null;
  } catch {
    return null;
  }
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Sends the 6-digit login code; creates the account on first use. */
export async function sendEmailCode(email: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
  if (error) console.warn('email code failed:', error.message);
  return !error;
}

export async function verifyEmailCode(email: string, token: string): Promise<boolean> {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
  return !error;
}

/** Where a freshly signed-in player goes: the register form until they have a name. */
export async function routeAfterSignIn(): Promise<'/(tabs)' | '/(auth)/register'> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return '/(auth)/register';
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).maybeSingle();
  return profile?.name ? '/(tabs)' : '/(auth)/register';
}

/** Name from Google/Apple to pre-fill the register form. */
export async function providerName(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const meta = session?.user.user_metadata ?? {};
  return String(meta.full_name ?? meta.name ?? '').trim();
}
