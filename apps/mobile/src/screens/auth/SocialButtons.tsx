import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { socialLogin } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, radius } from '../../theme';

/**
 * Bottoni Google/Apple Sign-In.
 * PROVIDER REALE: Expo AuthSession (Google) + expo-apple-authentication.
 */
export default function SocialButtons() {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState<string | null>(null);

  const go = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    try {
      const user = await socialLogin(provider);
      setUser(user);
    } catch {
      Alert.alert('', t('common.error'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable style={styles.btn} onPress={() => go('google')} disabled={!!loading}>
        <Ionicons name="logo-google" size={20} color="#DB4437" />
        <Text style={styles.text}>{loading === 'google' ? t('common.loading') : t('auth.google')}</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: '#000', borderColor: '#000' }]} onPress={() => go('apple')} disabled={!!loading}>
        <Ionicons name="logo-apple" size={22} color="#fff" />
        <Text style={[styles.text, { color: '#fff' }]}>{loading === 'apple' ? t('common.loading') : t('auth.apple')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10
  },
  text: { fontSize: 15, fontWeight: '600', color: colors.text }
});
