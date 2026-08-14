import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
 * Customer profile — "iOS Settings" pattern: inset grouped lists,
 * icons in colored tiles, hairline separators, chevrons, haptics.
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
    // Switching EN↔AR toggles RTL: requires an app restart (see note in i18n/index.ts)
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
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(28) }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Avatar name={`${user.firstName} ${user.lastName}`} size={80} round />
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={g.small}>{user.email}</Text>
          {!verified && (
            <Pressable style={styles.unverified}
              onPress={() => { hapticTap(); nav.navigate('BankVerification', { fromProfile: true }); }}>
              <MaterialCommunityIcons name="alert-circle" size={13} color={colors.warning} />
              <Text style={styles.unverifiedText}>{t('profile.notVerified')}</Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat value={String(requests.length)} label={t('profile.statRequests')} />
          <View style={styles.statSep} />
          <Stat value={String(completed)} label={t('profile.statCompleted')} />
          <View style={styles.statSep} />
          <Stat value="—" label={t('profile.statWallet')} />
        </View>

        {/* Account */}
        <Section>
          <Row icon="account" label={t('profile.personalData')} onPress={() => nav.navigate('PersonalData')} />
          <Row icon="credit-card" label={t('profile.paymentMethods')} onPress={() => nav.navigate('PaymentMethods')} />
          <Row icon="bell" label={t('profile.notifications')} onPress={() => nav.navigate('NotificationPreferences')} />
          <Row icon="translate" label={t('profile.language')}
            value={i18n.language === 'ar' ? 'العربية' : 'English'} onPress={toggleLanguage} />
          <Row icon="shield-check" label={t('profile.bankStatus')}
            value={verified ? t('profile.verified') : t('profile.notVerified')}
            onPress={() => nav.navigate('BankVerification', { fromProfile: true })} last />
        </Section>

        {/* Support */}
        <Section>
          <Row icon="lifebuoy" label={t('profile.support')} />
          <Row icon="lock" label={t('profile.privacy')} onPress={() => nav.navigate('PrivacyPolicy')} />
          <Row icon="gift" label={t('profile.referral')} onPress={() => nav.navigate('InviteFriend')} />
          <Row icon="cog" label={t('profile.settings')} onPress={() => nav.navigate('AccountSettings')} last />
        </Section>

        {/* Privacy compliance notice (PDPL) */}
        <Text style={[g.small, styles.privacyNote]}>{t('profile.privacyNote')}</Text>

        {/* Destructive actions */}
        <Section>
          <Row icon="logout" label={t('profile.logout')}
            danger onPress={() => { hapticTap(); logout(); }} />
          <Row icon="trash-can" label={t('profile.deleteAccount')}
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

function Row({ icon, label, value, danger, last, onPress }: {
  icon: string; label: string;
  value?: string; danger?: boolean; last?: boolean; onPress?: () => void;
}) {
  // Uniform treatment: blue icon on a light tile (matching the reference design)
  return (
    <Pressable
      onPress={onPress ? () => { hapticTap(); onPress(); } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && onPress ? { backgroundColor: colors.bg } : null]}
    >
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={[styles.rowInner, !last && styles.rowSep]}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]} numberOfLines={1}>{label}</Text>
        {value && <Text style={[g.small, { marginEnd: 6 }]}>{value}</Text>}
        {!danger && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.sub} />}
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
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    marginEnd: spacing(3), backgroundColor: colors.primarySoft
  },
  rowInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingEnd: spacing(3)
  },
  rowSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text, letterSpacing: -0.32 },
  privacyNote: { textAlign: 'center', marginBottom: spacing(4), paddingHorizontal: spacing(3) }
});
