import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Inject Archivo font into the HTML head for reliable web loading. Served from
// Google's CDN (always available, independent of the static export's asset
// hashing) under the exact family names react-native-web references.
const FONT_CSS = `
  @font-face {
    font-family: 'Archivo_400Regular';
    font-style: normal; font-weight: 400; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_500Medium';
    font-style: normal; font-weight: 500; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTBjNp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_600SemiBold';
    font-style: normal; font-weight: 600; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT6jRp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_700Bold';
    font-style: normal; font-weight: 700; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT0zRp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_800ExtraBold';
    font-style: normal; font-weight: 800; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTtDRp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_900Black';
    font-style: normal; font-weight: 900; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTnTRp8A.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Archivo_900Black_Italic';
    font-style: italic; font-weight: 900; font-display: swap;
    src: url('https://fonts.gstatic.com/s/archivo/v25/k3k8o8UDI-1M0wlSfdzyIEkpwTM29hr-8mTYIRyOSVz60_PG_HAotBds.ttf') format('truetype');
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <title>BETina</title>
        <ScrollViewStyleReset />
        {/* Inline font faces so Archivo loads before first paint */}
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
