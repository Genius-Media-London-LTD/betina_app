// BETina Design System
// SINGLE SOURCE OF TRUTH — import everything from here, never hardcode values

export const Colors = {
  // Backgrounds — deep purple-tinted black (matches the BETina landing page)
  background: '#0D0B11',
  surface: '#14111A',
  card: '#16121D',
  cardElevated: '#1F1A29',

  // Brand
  primary: '#B8E926',      // Lime — CTAs, Live, aktive Elemente
  primaryDim: '#9BC21E',   // Gedämpftes Grün für Hover/Pressed
  accent: '#8B5CF6',       // Violett — Akzente, Glows
  accentLight: '#A78BFA',  // Helleres Violett
  gold: '#FFD700',         // VIP, Premium
  goldDim: '#B8A000',      // Gedämpftes Gold
  silver: '#C9CED8',       // Podest Platz 2 (Tippspiel)
  bronze: '#D08A52',       // Podest Platz 3 (Tippspiel)

  // Text — light lavender-greys
  textPrimary: '#F2F0F5',
  textSecondary: '#A29AAF',
  textMuted: '#6F6780',

  // Status
  success: '#00FF88',
  danger: '#FF7A7A',
  warning: '#FFAA00',
  info: '#00AAFF',

  // Overlays
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
  glowGreen: 'rgba(184,233,38,0.15)',
  glowPurple: 'rgba(139,92,246,0.2)',
  glowGold: 'rgba(255,215,0,0.2)',

  // Glassmorphism
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.08)',
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
  purple: {
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
