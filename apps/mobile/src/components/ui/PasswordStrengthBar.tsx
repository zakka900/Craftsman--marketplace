import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { checkPasswordRules, passwordStrength } from '@artisan/shared';
import { colors } from '../../theme';

export default function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation();
  if (!password) return null;
  const strength = passwordStrength(password);
  const rules = checkPasswordRules(password);
  const color = strength < 0.5 ? colors.danger : strength < 0.85 ? colors.warning : colors.success;
  const label = strength < 0.5 ? t('auth.pwWeak') : strength < 0.85 ? t('auth.pwMedium') : t('auth.pwStrong');
  return (
    <View style={{ marginTop: -6, marginBottom: 12 }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(strength * 100, 8)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {rules.filter((r) => !r.ok).map((r) => (
        <View key={r.key} style={styles.ruleRow}>
          <Ionicons name="close-circle" size={14} color={colors.danger} />
          <Text style={styles.ruleText}>{t(`auth.pwRules.${r.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  ruleText: { fontSize: 12, color: colors.sub }
});
