import { DynamicColorIOS, Platform, StyleSheet, useColorScheme } from 'react-native';

/**
 * DESIGN SYSTEM — iOS Human Interface Guidelines.
 *
 * Palette SEMANTICA (non esadecimale rigida): ogni token è un colore dinamico
 * nativo (DynamicColorIOS) che si adatta automaticamente a Light/Dark Mode
 * con transizione di sistema, senza re-render JavaScript.
 * Su Android viene usato il valore light (fallback; Material You in roadmap).
 *
 * Griglia spaziature: base 4pt → usare multipli pari per la griglia 8pt.
 * Tipografia: SF Pro (font di sistema iOS) con scala HIG.
 */

const dyn = (light: string, dark: string): any =>
  Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;

export const colors = {
  // Brand / tinta interattiva (iOS system blue)
  primary: dyn('#007AFF', '#0A84FF'),
  primaryDark: dyn('#0062CC', '#409CFF'),
  primarySoft: dyn('#EBF4FF', '#0E2A47'),
  // Superfici (grouped background di iOS)
  bg: dyn('#F2F2F7', '#000000'),
  card: dyn('#FFFFFF', '#1C1C1E'),
  // Testo (label / secondaryLabel)
  text: dyn('#000000', '#FFFFFF'),
  sub: dyn('#8E8E93', '#98989E'),
  // Separatori
  border: dyn('#E5E5EA', '#38383A'),
  // Semantici di stato
  success: dyn('#34C759', '#30D158'),
  successSoft: dyn('#EBFAEF', '#0D2818'),
  danger: dyn('#FF3B30', '#FF453A'),
  dangerSoft: dyn('#FFEDEC', '#331110'),
  warning: dyn('#FF9500', '#FF9F0A'),
  warningSoft: dyn('#FFF4E5', '#2E2005'),
  info: dyn('#007AFF', '#0A84FF'),
  infoSoft: dyn('#EBF4FF', '#0E2A47')
};

// Tinte soft di sistema per icone categorie / avatar (light, dark)
const PASTEL_PAIRS: [string, string][] = [
  ['#EBF4FF', '#0E2A47'], ['#EBFAEF', '#0D2818'], ['#FFF4E5', '#2E2005'],
  ['#FFEDEC', '#331110'], ['#F4EBFF', '#26143B'], ['#E8F7F9', '#0A2A2E'],
  ['#FFF8E1', '#2E2608'], ['#EFEFF4', '#2C2C2E'], ['#E9F6FF', '#0B2536'],
  ['#FFEFF4', '#33101C']
];
const PASTEL_TEXT_PAIRS: [string, string][] = [
  ['#007AFF', '#0A84FF'], ['#34C759', '#30D158'], ['#FF9500', '#FF9F0A'],
  ['#FF3B30', '#FF453A'], ['#AF52DE', '#BF5AF2'], ['#30B0C7', '#40C8E0'],
  ['#B08700', '#FFD60A'], ['#636366', '#98989E'], ['#0A84FF', '#409CFF'],
  ['#FF2D55', '#FF375F']
];
export const pastel = PASTEL_PAIRS.map(([l, d]) => dyn(l, d));
export const pastelText = PASTEL_TEXT_PAIRS.map(([l, d]) => dyn(l, d));

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };

/** Griglia 4pt: spacing(2)=8, spacing(4)=16, spacing(6)=24 … */
export const spacing = (n: number) => n * 4;

// Ombra quasi impercettibile: iOS separa le superfici con lo sfondo, non con le ombre
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1
};

/** Scala tipografica iOS HIG (SF Pro, font di sistema). */
export const type = StyleSheet.create({
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.37, color: colors.text },
  title1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36, color: colors.text },
  title2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.35, color: colors.text },
  title3: { fontSize: 20, fontWeight: '600', letterSpacing: 0.38, color: colors.text },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41, color: colors.text },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.41, color: colors.text, lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32, color: colors.text, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.24, color: colors.sub, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08, color: colors.sub, lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400', color: colors.sub },
  caption2: { fontSize: 11, fontWeight: '400', color: colors.sub }
});

/** Hook tema: scheme corrente + palette semantica. */
export function useTheme() {
  const scheme = useColorScheme();
  return { dark: scheme === 'dark', colors, type, radius, spacing, shadow };
}

/** Stili globali retrocompatibili (mappati sulla scala HIG). */
export const g = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.36 },
  subtitle: { fontSize: 15, color: colors.sub, lineHeight: 20, letterSpacing: -0.24 },
  h2: { fontSize: 17, fontWeight: '600', color: colors.text, letterSpacing: -0.41 },
  body: { fontSize: 15, color: colors.text, lineHeight: 20, letterSpacing: -0.24 },
  small: { fontSize: 13, color: colors.sub, letterSpacing: -0.08 }
});
