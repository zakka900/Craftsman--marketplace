import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Avatar from '../../components/ui/Avatar';
import { getRequests } from '../../services/api';
import { useAuthStore } from '../../store';
import { setLanguage } from '../../i18n';
import { colors, g, radius, shadow, spacing } from '../../theme';
import { hapticSelect, hapticTap, hapticWarning } from '../../utils/haptics';

/**
 * Profilo cliente — pattern "iOS Settings": liste inset grouped,
 * icone in tessere colorate, separatori hairline, chevron, haptics.
 */
export default function Profile() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<any>();
  const { user, bankStatus, logout } = useAuthStore();

  if (!user) return null;

  const requests = getRequests();
  const completed = requests.filter((r) => r.status === 'completed').length;
  const verified = user.bankVerified || bankStatus === 'verified';

  const toggleLanguage = () => {
    hapticSelect();
    // Il cambio EN↔AR attiva/disattiva RTL: richiede il riavvio dell'app (nota in i18n/index.ts)
    setLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const confirmDelete = () => {
    hapticWarning();
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteConfirm'), [
      { text: t('common.back'), style: 'cancel' },
      { text: t('profile.deleteAccount'), style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <Screen pad={false}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(16) }}
        showsVerticalScrollIndicator={false}>
        {/* Intestazione */}
        <View style={styles.headerCard}>
          <Avatar name={`${user.firstName} ${user.lastName}`} size={80} round />
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={g.small}>{user.email}</Text>
          {!verified && (
            <Pressable style={styles.unverified}
              onPress={() => { hapticTap(); nav.navigate('BankVerification', { fromProfile: true }); }}>
              <Ionicons name="alert-circle" size={13} color={colors.warning} />
              <Text style={styles.unverifiedText}>{t('profile.notVerified')}</Text>
            </Pressable>
          )}
        </View>

        {/* Statistiche */}
        <View style={styles.stats}>
          <Stat value={String(requests.length)} label={t('profile.statRequests')} />
          <View style={styles.statSep} />
          <Stat value={String(completed)} label={t('profile.statCompleted')} />
          <View style={styles.statSep} />
          <Stat value="—" label={t('profile.statWallet')} />
        </View>

        {/* Account */}
        <Section>
          <Row icon="person" tint={colors.primary} soft={colors.primarySoft} label={t('profile.personalData')} />
          <Row icon="card" tint={colors.success} soft={colors.successSoft} label={t('profile.paymentMethods')} />
          <Row icon="notifications" tint={colors.warning} soft={colors.warningSoft} label={t('profile.notifications')} />
          <Row icon="globe" tint={colors.info} soft={colors.infoSoft} label={t('profile.language')}
            value={i18n.language === 'ar' ? 'العربية' : 'English'} onPress={toggleLanguage} />
          <Row icon="shield-checkmark" tint={verified ? colors.success : colors.warning}
            soft={verified ? colors.successSoft : colors.warningSoft} label={t('profile.bankStatus')}
            value={verified ? t('profile.verified') : t('profile.notVerified')}
            onPress={() => nav.navigate('BankVerification', { fromProfile: true })} last />
        </Section>

        {/* Supporto */}
        <Section>
          <Row icon="help-buoy" tint={colors.info} soft={colors.infoSoft} label={t('profile.support')} />
          <Row icon="lock-closed" tint={colors.sub} soft={colors.bg} label={t('profile.privacy')} />
          <Row icon="gift" tint={colors.danger} soft={colors.dangerSoft} label={t('profile.referral')} />
          <Row icon="settings" tint={colors.sub} soft={colors.bg} label={t('profile.settings')} last />
        </Section>

        {/* Nota conformità privacy (PDPL) */}
        <Text style={[g.small, styles.privacyNote]}>{t('profile.privacyNote')}</Text>

        {/* Azioni distruttive */}
        <Section>
          <Row icon="log-out" tint={colors.danger} soft={colors.dangerSoft} label={t('profile.logout')}
            danger onPress={() => { hapticTap(); logout(); }} />
          <Row icon="trash" tint={colors.danger} soft={colors.dangerSoft} label={t('profile.deleteAccount')}
            danger onPress={confirmDelete} last />
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={[g.small, { marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function Row({ icon, tint, soft, label, value, danger, last, onPress }: {
  icon: string; tint: string; soft: string; label: string;
  value?: string; danger?: boolean; last?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress ? () => { hapticTap(); onPress(); } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && onPress ? { backgroundColor: colors.bg } : null]}
    >
      <View style={[styles.rowIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon as any} size={17} color={tint} />
      </View>
      <View style={[styles.rowInner, !last && styles.rowSep]}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]} numberOfLines={1}>{label}</Text>
        {value && <Text style={[g.small, { marginEnd: 6 }]}>{value}</Text>}
        {!danger && <Ionicons name="chevron-forward" size={17} color={colors.border} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center', paddingVertical: spacing(6) },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing(3), letterSpacing: 0.35 },
  unverified: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.warningSoft,
    borderRadius: radius.full, paddingHorizontal: spacing(3), paddingVertical: spacing(1), marginTop: spacing(2)
  },
  unverifiedText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  stats: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, paddingVertical: spacing(4), marginBottom: spacing(4), ...shadow
  },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.text },
  statSep: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.border },
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing(4),
    overflow: 'hidden', ...shadow
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingStart: spacing(4), minHeight: 48 },
  rowIcon: {
    width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
    marginEnd: spacing(3)
  },
  rowInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingEnd: spacing(3)
  },
  rowSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text, letterSpacing: -0.32 },
  privacyNote: { textAlign: 'center', marginBottom: spacing(4), paddingHorizontal: spacing(3) }
});
