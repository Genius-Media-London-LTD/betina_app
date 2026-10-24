import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { WEB_FONT_CSS } from '../src/theme/webFonts';


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
        {/* Inline font faces so the fonts load before first paint */}
        <style dangerouslySetInnerHTML={{ __html: WEB_FONT_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
