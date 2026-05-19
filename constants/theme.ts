import { Platform } from 'react-native';

export const COLORS = {
  primary: '#1D9E75',
  primaryDark: '#0F6E56',
  primaryLight: '#E1F5EE',
  night: '#111C17',
  sale: '#1D9E75',
  purchase: '#378ADD',
  expense: '#E24B4A',
  debt: '#EF9F27',
  info: '#378ADD',
  lightBg: '#F5F5F0',
  lightSurface: '#FFFFFF',
  lightSurface2: '#F0F4F2',
  lightBorder: 'rgba(0,0,0,0.08)',
  darkBg: '#0E1512',
  darkSurface: '#1A2620',
  darkSurface2: '#243028',
  darkBorder: 'rgba(255,255,255,0.08)',
  textLight: '#F7FAF8',
  textDark: '#102018',
  textMuted: '#66756D',
  textMutedDark: '#A8B8AF',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  green600: '#1D9E75',
  green500: '#1D9E75',
  green400: '#7AD9BC',
  green100: '#E1F5EE',
  green50:  '#F0FBF7',
  navy900: '#111C17',
  navy800: '#0F6E56',
  navy700: '#0F6E56',
  red500: '#E24B4A',
  red100: '#FDECEC',
  amber500: '#EF9F27',
  amber100: '#FFF4DF',
  blue400: '#378ADD',
  blue100: '#E8F2FD',
  gray50:  '#F5F5F0',
  gray100: '#F0F4F2',
  gray200: 'rgba(0,0,0,0.08)',
  gray300: '#C6D0CA',
  gray400: '#8A9891',
  gray500: '#66756D',
  gray600: '#526159',
  gray700: '#34443C',
  gray800: '#203028',
  gray900: '#102018',
};

export const Colors = {
  light: {
    text: COLORS.textDark,
    muted: COLORS.textMuted,
    background: COLORS.lightBg,
    surface: COLORS.lightSurface,
    surface2: COLORS.lightSurface2,
    border: COLORS.lightBorder,
    tint: COLORS.primary,
    icon: COLORS.textMuted,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.textLight,
    muted: COLORS.textMutedDark,
    background: COLORS.darkBg,
    surface: COLORS.darkSurface,
    surface2: COLORS.darkSurface2,
    border: COLORS.darkBorder,
    tint: COLORS.green400,
    icon: COLORS.textMutedDark,
    tabIconDefault: COLORS.textMutedDark,
    tabIconSelected: COLORS.green400,
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS  = { sm: 6, md: 10, lg: 14, xl: 20, hero: 20, full: 9999 };
export const FONT_SIZE = { xs: 12, sm: 14, md: 15, lg: 16, xl: 18, xxl: 24, hero: 40, xxxl: 30 };
export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const SHADOW = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 5 },
  green: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  hero: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
});
