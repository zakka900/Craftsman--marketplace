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
  // Brand / tinta interattiva — azzurro morbido (design di riferimento)
  primary: dyn('#4F80E1', '#5B8DEF'),
  primaryDark: dyn('#3A6BD0', '#6E9DF5'),
  primarySoft: dyn('#E8F0FE', '#16294A'),
  // Superfici — sfondo lavanda tenue, card bianche
  bg: dyn('#EDF0F8', '#0B0E14'),
  card: dyn('#FFFFFF', '#171A21'),
  // Testo — navy profondo (più morbido del nero puro)
  text: dyn('#1A2138', '#F5F7FA'),
  sub: dyn('#8A93A6', '#97A0B2'),
  // Separatori
  border: dyn('#E6E9F2', '#262B36'),
  // Semantici di stato
  success: dyn('#2FBF71', '#34D17E'),
  successSoft: dyn('#E7F8EF', '#0D2818'),
  danger: dyn('#F0524B', '#FF6259'),
  dangerSoft: dyn('#FDECEB', '#331110'),
  warning: dyn('#F5A623', '#FFB13D'),
  warningSoft: dyn('#FEF3E2', '#2E2005'),
  info: dyn('#4F80E1', '#5B8DEF'),
  infoSoft: dyn('#E8F0FE', '#16294A')
};

/** Coppie per gradiente (per LinearGradient se disponibile, o overlay). */
export const gradient = {
  primary: ['#5B8DEF', '#4F80E1'] as [string, string],
  primaryDeep: ['#4F80E1', '#3A6BD0'] as [string, string]
};

// Tinte soft di sistema per icone categorie / avatar (light, dark)
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

/** Griglia 4pt: spacing(2)=8, spacing(4)=16, spacing(6)=24 … */
export const spacing = (n: number) => n * 4;

// Ombra morbida e diffusa, con tinta blu (profondità del design di riferimento)
export const shadow = {
  shadowColor: '#3A5A9B',
  shadowOpacity: 0.10,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3
};

// Ombra più marcata per elementi flottanti (bottoni primari, FAB, tab bar)
export const shadowStrong = {
  shadowColor: '#2F4E8F',
  shadowOpacity: 0.28,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8
};

/** Scala tipografica iOS HIG (SF Pro, font di sistema). */
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
