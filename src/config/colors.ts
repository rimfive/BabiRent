// Palette BABI RENT — dark navy + orange
export const Colors = {
  // Navy principal (fond)
  primary: '#1B3570',
  primaryDark: '#0D1B3E',
  primaryMid: '#1E4080',
  primaryLight: 'rgba(27,53,112,0.7)',

  // Orange accent
  accent: '#E87722',
  accentLight: '#FF9A4D',
  accentDark: '#C56010',

  // Fonds
  background: '#0E1A2E',
  backgroundMid: '#162440',
  surface: 'rgba(255,255,255,0.07)',
  surfaceLight: 'rgba(255,255,255,0.12)',
  surfaceDark: '#0D1729',
  card: '#162440',

  // Textes
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textLight: 'rgba(255,255,255,0.4)',
  textWhite: '#FFFFFF',
  textDark: '#0D1B3E',

  // Blancs et noirs
  white: '#FFFFFF',
  black: '#000000',

  // Gris adaptés au fond sombre
  gray50: 'rgba(255,255,255,0.03)',
  gray100: 'rgba(255,255,255,0.06)',
  gray200: 'rgba(255,255,255,0.10)',
  gray300: 'rgba(255,255,255,0.18)',
  gray400: 'rgba(255,255,255,0.45)',
  gray500: 'rgba(255,255,255,0.60)',
  gray600: 'rgba(255,255,255,0.75)',
  gray700: 'rgba(255,255,255,0.85)',
  gray900: '#FFFFFF',

  // Statuts
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.2)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.2)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.2)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.2)',

  // Bordures glass
  border: 'rgba(255,255,255,0.14)',
  borderLight: 'rgba(255,255,255,0.07)',

  // Overlay
  overlay: 'rgba(0,0,0,0.55)',
  overlayLight: 'rgba(0,0,0,0.3)',

  // Glass morphism
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.20)',
  glassDark: 'rgba(14,26,46,0.85)',
} as const;

export type ColorKey = keyof typeof Colors;
