import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import { useAuthStore } from '../../store';
import { colors, g, radius, shadow, spacing } from '../../theme';
import { hapticTap } from '../../utils/haptics';

/** Cambio password: riusa il flusso OTP già esistente (ForgotPassword) — nessuna duplicazione di logica. */
export default function AccountSettings() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.settings')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ padding: 20 }}>
        <Text style={[g.small, { marginBottom: 8, marginStart: 4 }]}>{t('accountSettings.security')}</Text>
        <View style={styles.section}>
          <Pressable
            onPress={() => { hapticTap(); nav.navigate('ForgotPassword'); }}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]}
          >
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="lock-reset" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t('accountSettings.changePassword')}</Text>
              <Text style={g.small}>{user.email}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.sub} />
          </Pressable>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing(4), minHeight: 56 },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  rowLabel: { fontSize: 16, color: colors.text, letterSpacing: -0.32, marginBottom: 2 }
});
