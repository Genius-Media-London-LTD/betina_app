// @font-face rules for the web build, served from Google's CDN (always
// available, independent of the static export's asset hashing) under the exact
// family names react-native-web references. Used by app/+html.tsx (static
// export, before first paint) and app/_layout.tsx (dev server).

const FACES: [family: string, weight: number, style: 'normal' | 'italic', url: string][] = [
  ['Archivo_400Regular', 400, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8A.ttf'],
  ['Archivo_500Medium', 500, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTBjNp8A.ttf'],
  ['Archivo_600SemiBold', 600, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT6jRp8A.ttf'],
  ['Archivo_700Bold', 700, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT0zRp8A.ttf'],
  ['Archivo_800ExtraBold', 800, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTtDRp8A.ttf'],
  ['Archivo_900Black', 900, 'normal', 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTnTRp8A.ttf'],
  ['Archivo_900Black_Italic', 900, 'italic', 'https://fonts.gstatic.com/s/archivo/v25/k3k8o8UDI-1M0wlSfdzyIEkpwTM29hr-8mTYIRyOSVz60_PG_HAotBds.ttf'],
  // Urban redesign
  ['Anton_400Regular', 400, 'normal', 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf'],
  ['ArchivoBlack_400Regular', 400, 'normal', 'https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf'],
  ['ArchivoNarrow_400Regular', 400, 'normal', 'https://fonts.gstatic.com/s/archivonarrow/v35/tss5ApVBdCYD5Q7hcxTE1ArZ0Zz8oY2KRmwvKhhvLFGKpA.ttf'],
  ['ArchivoNarrow_600SemiBold', 600, 'normal', 'https://fonts.gstatic.com/s/archivonarrow/v35/tss5ApVBdCYD5Q7hcxTE1ArZ0Zz8oY2KRmwvKhhv8laKpA.ttf'],
  ['ArchivoNarrow_700Bold', 700, 'normal', 'https://fonts.gstatic.com/s/archivonarrow/v35/tss5ApVBdCYD5Q7hcxTE1ArZ0Zz8oY2KRmwvKhhvy1aKpA.ttf'],
  ['SpaceMono_400Regular', 400, 'normal', 'https://fonts.gstatic.com/s/spacemono/v17/i7dPIFZifjKcF5UAWdDRUEY.ttf'],
  ['SpaceMono_700Bold', 700, 'normal', 'https://fonts.gstatic.com/s/spacemono/v17/i7dMIFZifjKcF5UAWdDRaPpZYFI.ttf'],
];

export const WEB_FONT_CSS = FACES.map(([family, weight, style, url]) =>
  `@font-face { font-family: '${family}'; font-style: ${style}; font-weight: ${weight}; font-display: swap; src: url('${url}') format('truetype'); }`,
).join('\n');
