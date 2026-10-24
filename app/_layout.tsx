import { I18nProvider } from '../src/lib/i18n';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  Archivo_900Black_Italic,
  useFonts,
} from '@expo-google-fonts/archivo';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { ArchivoNarrow_400Regular, ArchivoNarrow_600SemiBold, ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { Colors } from '../src/theme';
import { WEB_FONT_CSS } from '../src/theme/webFonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Belt-and-suspenders web font loading: app/+html.tsx injects these @font-face
// into <head> for the static export (before paint); this runtime injection
// covers the dev server (where +html.tsx isn't applied). Same Google CDN URLs,
// so the browser de-dupes. expo-font's own web injection is disabled below.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const id = 'betina-google-fonts';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = WEB_FONT_CSS;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  // On web the fonts are provided by the @font-face in app/+html.tsx (Google
  // CDN). Skip expo-font's injection there so it can't add a competing
  // @font-face pointing at export assets that 404 on the deployed site.
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          Archivo_400Regular,
          Archivo_500Medium,
          Archivo_600SemiBold,
          Archivo_700Bold,
          Archivo_800ExtraBold,
          Archivo_900Black,
          Archivo_900Black_Italic,
          Anton_400Regular,
          ArchivoBlack_400Regular,
          ArchivoNarrow_400Regular,
          ArchivoNarrow_600SemiBold,
          ArchivoNarrow_700Bold,
          SpaceMono_400Regular,
          SpaceMono_700Bold,
        },
  );

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <I18nProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="celebration" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="article" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
    </I18nProvider>
  );
}
