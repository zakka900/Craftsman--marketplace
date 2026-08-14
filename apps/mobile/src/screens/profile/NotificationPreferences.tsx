import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import { colors, g, radius, shadow, spacing } from '../../theme';
import { hapticSelect } from '../../utils/haptics';

const STORAGE_KEY = 'artisan.notifPrefs';

type Prefs = { quotes: boolean; chat: boolean; jobUpdates: boolean; promotions: boolean };
const DEFAULT_PREFS: Prefs = { quotes: true, chat: true, jobUpdates: true, promotions: false };

/**
 * Notification preferences — local only (no dedicated model on the backend):
 * saved to AsyncStorage, no network connection required. The notification type
 * (QUOTE/CHAT/JOB/PROMO) is already distinguished in Prisma (NotificationType enum),
 * ready for a future server-side filter if that's ever needed.
 */
export default function NotificationPreferences() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); })
      .finally(() => setLoaded(true));
  }, []);

  const toggle = (key: keyof Prefs) => {
    hapticSelect();
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  if (!loaded) return null;

  const rows: { key: keyof Prefs; icon: string; label: string; sub: string }[] = [
    { key: 'quotes', icon: 'pricetag', label: t('notifPrefs.quotes'), sub: t('notifPrefs.quotesSub') },
    { key: 'chat', icon: 'chatbubble', label: t('notifPrefs.chat'), sub: t('notifPrefs.chatSub') },
    { key: 'jobUpdates', icon: 'hammer', label: t('notifPrefs.jobUpdates'), sub: t('notifPrefs.jobUpdatesSub') },
    { key: 'promotions', icon: 'megaphone', label: t('notifPrefs.promotions'), sub: t('notifPrefs.promotionsSub') }
  ];

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.notifications')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={styles.section}>
          {rows.map((r, i) => (
            <View key={r.key} style={[styles.row, i < rows.length - 1 && styles.rowSep]}>
              <View style={styles.rowIcon}>
                <Ionicons name={r.icon as any} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={g.small}>{r.sub}</Text>
              </View>
              <Switch value={prefs[r.key]} onValueChange={() => toggle(r.key)} trackColor={{ true: colors.primary }} />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing(4) },
  rowSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  rowLabel: { fontSize: 16, color: colors.text, letterSpacing: -0.32, marginBottom: 2 }
});
