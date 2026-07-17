import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SocialButtons from './SocialButtons';
import { login } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, g } from '../../theme';

export default function Login() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const setUser = useAuthStore((s) => s.setUser);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(identifier, password);
      setUser(user);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') setError(t('auth.errNotFound'));
      else if (err.message === 'WRONG_PASSWORD') setError(t('auth.errWrongPassword'));
      else if (err.message === 'NOT_VERIFIED') {
        // Account non verificato → redirect diretto alla verifica OTP mancante
        setError(t('auth.errNotVerified'));
        setTimeout(() => nav.navigate('Otp', {
          userId: err.userId, channel: err.channel, target: identifier,
          nextChannel: err.channel === 'phone' ? { channel: 'email', target: identifier } : undefined
        }), 900);
      } else setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[g.title, { marginTop: 40 }]}>{t('auth.loginTitle')}</Text>
      <View style={{ marginTop: 24 }}>
        <SocialButtons />
        <Text style={styles.or}>{t('common.or')}</Text>
        <Input label={t('auth.email') + ' / ' + t('auth.phone')} value={identifier}
          onChangeText={setIdentifier} keyboardType="email-address" />
        <Input label={t('auth.password')} value={password} onChangeText={setPassword} isPassword />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 18 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('auth.forgot')}</Text>
        </Pressable>
        <Button title={t('auth.login')} onPress={submit} loading={loading} />
        <Pressable onPress={() => nav.navigate('Register')} style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('auth.noAccount')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  or: { textAlign: 'center', color: colors.sub, marginVertical: 16 },
  error: { color: colors.danger, marginBottom: 10, fontWeight: '600' }
});
