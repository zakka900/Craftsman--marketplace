import { DynamicColorIOS, Platform, StyleSheet, useColorScheme } from 'react-native';

/**
 * DESIGN SYSTEM — iOS Human Interface Guidelines.
 *
 * SEMANTIC palette (not rigid hex values): each token is a native
 * dynamic color (DynamicColorIOS) that automatically adapts to Light/Dark
 * Mode with a system transition, with no JavaScript re-render.
 * On Android the light value is used (fallback; Material You is on the roadmap).
 *
 * Spacing grid: base 4pt → use even multiples for the 8pt grid.
 * Typography: SF Pro (iOS system font) with the HIG scale.
 */

const dyn = (light: string, dark: string): any =>
  Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;

export const colors = {
  // Brand / interactive tint — soft blue (reference design)
  primary: dyn('#4F80E1', '#5B8DEF'),
  primaryDark: dyn('#3A6BD0', '#6E9DF5'),
  primarySoft: dyn('#E8F0FE', '#16294A'),
  // Surfaces — soft lavender background, white cards
  bg: dyn('#EDF0F8', '#0B0E14'),
  card: dyn('#FFFFFF', '#171A21'),
  // Text — deep navy (softer than pure black)
  text: dyn('#1A2138', '#F5F7FA'),
  sub: dyn('#8A93A6', '#97A0B2'),
  // Separators
  border: dyn('#E6E9F2', '#262B36'),
  // State semantics
  success: dyn('#2FBF71', '#34D17E'),
  successSoft: dyn('#E7F8EF', '#0D2818'),
  danger: dyn('#F0524B', '#FF6259'),
  dangerSoft: dyn('#FDECEB', '#331110'),
  warning: dyn('#F5A623', '#FFB13D'),
  warningSoft: dyn('#FEF3E2', '#2E2005'),
  info: dyn('#4F80E1', '#5B8DEF'),
  infoSoft: dyn('#E8F0FE', '#16294A')
};

/** Pairs for gradients (for LinearGradient if available, or overlay). */
export const gradient = {
  primary: ['#5B8DEF', '#4F80E1'] as [string, string],
  primaryDeep: ['#4F80E1', '#3A6BD0'] as [string, string]
};

// Soft system tints for category icons / avatars (light, dark)
const PASTEL_PAIRS: [string, string][] = [
  ['#E8F0FE', '#16294A'], ['#E7F8EF', '#0D2818'], ['#FEF3E2', '#2E2005'],
  ['#FDECEB', '#331110'], ['#F0EAFE', '#26143B'], ['#E4F5F8', '#0A2A2E'],
  ['#FEF7E0', '#2E2608'], ['#EEF1F8', '#22262F'], ['#E7F1FF', '#0B2536'],
  ['#FDECF2', '#33101C']
];
const PASTEL_TEXT_PAIRS: [string, string][] = [
  ['#4F80E1', '#5B8DEF'], ['#2FBF71', '#34D17E'], ['#F5A623', '#FFB13D'],
  ['#F0524B', '#FF6259'], ['#9A6BE8', '#B58BF5'], ['#2FA9BF', '#40C8E0'],
  ['#C79200', '#FFD60A'], ['#6B7386', '#97A0B2'], ['#4F80E1', '#6E9DF5'],
  ['#E8477E', '#FF6BA0']
];
export const pastel = PASTEL_PAIRS.map(([l, d]) => dyn(l, d));
export const pastelText = PASTEL_TEXT_PAIRS.map(([l, d]) => dyn(l, d));

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 };

/** 4pt grid: spacing(2)=8, spacing(4)=16, spacing(6)=24 … */
export const spacing = (n: number) => n * 4;

// Soft, diffused shadow with a blue tint (depth from the reference design)
export const shadow = {
  shadowColor: '#3A5A9B',
  shadowOpacity: 0.10,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3
};

// Stronger shadow for floating elements (primary buttons, FAB, tab bar)
export const shadowStrong = {
  shadowColor: '#2F4E8F',
  shadowOpacity: 0.28,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8
};

/** iOS HIG typography scale (SF Pro, system font). */
export const type = StyleSheet.create({
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.2, color: colors.text },
  title1: { fontSize: 28, fontWeight: '800', letterSpacing: 0.1, color: colors.text },
  title2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2, color: colors.text },
  title3: { fontSize: 20, fontWeight: '700', letterSpacing: 0.2, color: colors.text },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41, color: colors.text },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.41, color: colors.text, lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32, color: colors.text, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.24, color: colors.sub, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08, color: colors.sub, lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400', color: colors.sub },
  caption2: { fontSize: 11, fontWeight: '400', color: colors.sub }
});

/** Theme hook: current scheme + semantic palette. */
export function useTheme() {
  const scheme = useColorScheme();
  return { dark: scheme === 'dark', colors, type, radius, spacing, shadow };
}

/** Backward-compatible global styles (mapped onto the HIG scale). */
export const g = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(5),
    ...shadow
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: 0.1 },
  subtitle: { fontSize: 15, color: colors.sub, lineHeight: 20, letterSpacing: -0.24 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  body: { fontSize: 15, color: colors.text, lineHeight: 20, letterSpacing: -0.24 },
  small: { fontSize: 13, color: colors.sub, letterSpacing: -0.08 }
});
