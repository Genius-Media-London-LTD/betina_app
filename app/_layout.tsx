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
import { COLUMN_MAX, useDesktop } from '../src/lib/layout';
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
  // Beside the centred desktop column the page itself shows: keep it black.
  document.documentElement.style.backgroundColor = Colors.background;
  document.body.style.backgroundColor = Colors.background;
  // Dark scrollbars for mouse users (desktop pages scroll with a visible bar).
  if (!document.getElementById('betina-scrollbars')) {
    const bars = document.createElement('style');
    bars.id = 'betina-scrollbars';
    bars.textContent = `* { scrollbar-width: thin; scrollbar-color: ${Colors.borderStrong} ${Colors.background}; }
      ::-webkit-scrollbar { width: 8px; height: 8px; background: ${Colors.background}; }
      ::-webkit-scrollbar-thumb { background: ${Colors.borderStrong}; }
      ::-webkit-scrollbar-thumb:hover { background: ${Colors.primary}; }`;
    document.head.appendChild(bars);
  }
}

export default function RootLayout() {
  // Desktop browser: screens outside the main frame sit in a centred column.
  const desktop = useDesktop();
  const column = desktop
    ? { width: '100%' as const, maxWidth: COLUMN_MAX, alignSelf: 'center' as const, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.line }
    : null;

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
          contentStyle: { backgroundColor: Colors.background, ...column },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'none', contentStyle: { backgroundColor: Colors.background } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: Colors.background } }} />
        <Stack.Screen name="celebration" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="voice" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="article" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </I18nProvider>
  );
}
