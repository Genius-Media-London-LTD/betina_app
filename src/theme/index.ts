// BETina Design System
// SINGLE SOURCE OF TRUTH — import everything from here, never hardcode values

/** '#RRGGBB' + alpha → 'rgba(r,g,b,a)' — for tints of the palette colours. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Urban palette (2026-10-24): true black + graphite, neon lime as the signal
// colour, electric cyan as the second accent (replaces the old violet).
const PALETTE = {
  black: '#000000',
  white: '#FFFFFF',
  background: '#060607',
  surface: '#0D0D10',
  card: '#121216',
  cardElevated: '#1B1B21',
  lime: '#B8E926',
  cyan: '#2FE3F0',
  gold: '#FFD700',
  danger: '#FF6B6B',
} as const;

export const Colors = {
  black: PALETTE.black,
  white: PALETTE.white,

  // Backgrounds — true black + graphite
  background: PALETTE.background,
  surface: PALETTE.surface,
  card: PALETTE.card,
  cardElevated: PALETTE.cardElevated,

  // Brand
  primary: PALETTE.lime,   // Neon-Lime — CTAs, Live, aktive Elemente
  primaryLight: '#D4FF4D', // Helles Neon für Highlights
  primaryDim: '#9BC21E',   // Gedämpftes Grün für Hover/Pressed
  accent: PALETTE.cyan,    // Electric Cyan — zweiter Akzent, BETina-Glow
  accentLight: '#8CF2F8',  // Helleres Cyan
  gold: PALETTE.gold,      // VIP, Premium
  goldLight: '#FFE666',
  goldDim: '#B8A000',      // Gedämpftes Gold
  silver: '#C9CED8',       // Podest Platz 2 (Tippspiel)
  bronze: '#D08A52',       // Podest Platz 3 (Tippspiel)

  // Text — neutral greys
  textPrimary: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textMuted: '#62626C',

  // Status
  success: '#00FF88',
  danger: PALETTE.danger,
  dangerDeep: '#2A0A0A',
  warning: '#FFAA00',
  info: '#00AAFF',

  // Overlays
  overlay: withAlpha(PALETTE.black, 0.7),
  overlayLight: withAlpha(PALETTE.black, 0.4),
  glowGreen: withAlpha(PALETTE.lime, 0.14),
  glowAccent: withAlpha(PALETTE.cyan, 0.14),
  glowGold: withAlpha(PALETTE.gold, 0.18),

  // Glass
  glass: withAlpha(PALETTE.white, 0.04),
  glassBorder: withAlpha(PALETTE.white, 0.09),
} as const;

// Font families (Archivo, loaded in app/_layout.tsx). The landing-page
// signature is Archivo Black italic uppercase for big titles / the wordmark.
export const Fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
  black: 'Archivo_900Black',
  blackItalic: 'Archivo_900Black_Italic',
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

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

export const Shadows = {
  green: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
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
