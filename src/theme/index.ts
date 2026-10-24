// BETina Design System
// SINGLE SOURCE OF TRUTH — import everything from here, never hardcode values

/** '#RRGGBB' + alpha → 'rgba(r,g,b,a)' — for tints of the palette colours. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Urban redesign (Claude Design handoff "BETina – Urban", 2026-10-24): pure
// black, GeniusBet lime, white type, hard edges. No glass, no gradients except
// photo fades, border radius 0 everywhere.
const PALETTE = {
  black: '#000000',
  white: '#FFFFFF',
  lime: '#C0FA32',     // matches the GeniusBet logo
  surface: '#0A0A0A',  // inputs, logo boxes
  surface2: '#111111', // cards, BETina bubbles
  surface3: '#141414', // keys, pressed rows
  line: '#1E1E1E',     // dividers, empty XP segments
  border: '#262626',   // card borders
  borderStrong: '#333333',
  liveRed: '#FF3B30',
  gold: '#FFD700',
} as const;

export const Colors = {
  black: PALETTE.black,
  white: PALETTE.white,

  // Backgrounds
  background: PALETTE.black,
  surface: PALETTE.surface,
  card: PALETTE.surface2,
  cardElevated: PALETTE.surface3,

  // Lines
  line: PALETTE.line,
  border: PALETTE.border,
  borderStrong: PALETTE.borderStrong,

  // Brand
  primary: PALETTE.lime,   // Lime — CTAs, active states, stickers
  primaryLight: '#E2FF8A', // link hover / highlights
  primaryDim: '#9FD11F',   // pressed
  accent: PALETTE.white,   // second accent is plain white in the urban look
  accentLight: '#DDDDDD',
  gold: PALETTE.gold,      // Tippspiel podium / exact hits
  goldLight: '#FFE666',
  goldDim: '#B8A000',
  silver: '#C9CED8',       // Podest Platz 2 (Tippspiel)
  bronze: '#D08A52',       // Podest Platz 3 (Tippspiel)

  // Text
  textPrimary: PALETTE.white,
  textSecondary: '#BBBBBB', // body copy on black
  textMuted: '#777777',     // meta, inactive
  textFaint: '#555555',

  // Status
  success: PALETTE.lime,
  live: PALETTE.liveRed,
  danger: PALETTE.liveRed,
  dangerDeep: '#2A0A0A',
  warning: '#FFAA00',
  info: '#00AAFF',

  // Overlays
  overlay: withAlpha(PALETTE.black, 0.75),
  overlayLight: withAlpha(PALETTE.black, 0.4),
  glowGreen: withAlpha(PALETTE.lime, 0.12),
  glowAccent: withAlpha(PALETTE.white, 0.06),
  glowGold: withAlpha(PALETTE.gold, 0.16),

  // Flat surfaces (names kept from the glass era)
  glass: PALETTE.surface,
  glassBorder: PALETTE.border,
} as const;

// Font families (loaded in app/_layout.tsx; web: src/theme/webFonts.ts).
export const Fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
  black: 'Archivo_900Black',
  blackItalic: 'Archivo_900Black_Italic',
  /** Headlines — Anton, uppercase, tight line height. */
  display: 'Anton_400Regular',
  /** Wordmark ("BETINA"). */
  wordmark: 'ArchivoBlack_400Regular',
  /** Labels, buttons, list titles — Archivo Narrow, uppercase. */
  label: 'ArchivoNarrow_700Bold',
  labelSemi: 'ArchivoNarrow_600SemiBold',
  labelRegular: 'ArchivoNarrow_400Regular',
  /** Meta / data — Space Mono, uppercase, wide tracking. */
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export const Typography = {
  // Font Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,

  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line Heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// Hard edges are core to the urban look: no rounded corners anywhere.
export const BorderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  '2xl': 0,
  full: 0,
} as const;

// No soft glows in the urban look — only the hard offset shadow stickers use.
const NONE = { shadowColor: Colors.black, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
export const Shadows = {
  green: NONE,
  accent: NONE,
  gold: NONE,
  card: NONE,
  /** Sticker shadow: 4px 4px 0 #000. */
  hard: { shadowColor: Colors.black, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
} as const;

export const Animation = {
  // Durations (ms)
  fast: 150,
  normal: 300,
  slow: 500,
  cinematic: 1200,

  // Spring configs (Reanimated)
  spring: {
    gentle: { damping: 15, stiffness: 100 },
    bouncy: { damping: 10, stiffness: 200 },
    snappy: { damping: 20, stiffness: 300 },
  },

  // Particle counts
  particles: {
    idle: 20,
    buttonPress: 8,
    celebration: 80,
  },
} as const;

// Glassmorphism card style (reusable)
export const glassCard = {
  backgroundColor: Colors.glass,
  borderWidth: 1,
  borderColor: Colors.glassBorder,
  borderRadius: BorderRadius.lg,
} as const;

// Glow button style
export const glowButton = {
  backgroundColor: Colors.primary,
  borderRadius: BorderRadius.full,
  paddingVertical: Spacing.md,
  paddingHorizontal: Spacing.xl,
  ...Shadows.green,
} as const;

export default {
  Colors,
  Fonts,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  glassCard,
  glowButton,
};
