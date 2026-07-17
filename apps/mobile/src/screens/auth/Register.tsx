import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, checkPasswordRules, isValidEmail, isValidPhone } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PasswordStrengthBar from '../../components/ui/PasswordStrengthBar';
import SocialButtons from './SocialButtons';
import { register } from '../../services/api';
import { colors, g, radius } from '../../theme';

export default function Register() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', dial: '+966',
    email: '', password: '', confirm: ''
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string | null> = {};
    if (!form.firstName.trim()) e.firstName = t('auth.required');
    if (!form.lastName.trim()) e.lastName = t('auth.required');
    if (!isValidPhone(form.phone)) e.phone = t('auth.invalidPhone');
    if (!isValidEmail(form.email)) e.email = t('auth.invalidEmail');
    const failed = checkPasswordRules(form.password).filter((r) => !r.ok);
    if (failed.length) e.password = t(`auth.pwRules.${failed[0].key}`);
    if (form.password !== form.confirm) e.confirm = t('auth.passwordsMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { userId } = await register(form);
      nav.navigate('Otp', {
        userId, channel: 'phone', target: `${form.dial} ${form.phone}`,
        nextChannel: { channel: 'email', target: form.email }
      });
    } catch (err: any) {
      setErrors({ email: err.message === 'EMAIL_EXISTS' ? t('auth.errNotFound') : t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[g.title, { marginTop: 20 }]}>{t('auth.registerTitle')}</Text>
      <View style={{ marginTop: 20 }}>
        <SocialButtons />
        <Text style={styles.or}>{t('common.or')}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label={t('auth.firstName')} value={form.firstName} onChangeText={(v) => set('firstName', v)}
              error={errors.firstName} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label={t('auth.lastName')} value={form.lastName} onChangeText={(v) => set('lastName', v)}
              error={errors.lastName} autoCapitalize="words" />
          </View>
        </View>

        <Text style={styles.label}>{t('auth.phone')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 2 }}>
          {COUNTRIES.map((c) => (
            <Pressable key={c.code} onPress={() => set('dial', c.dial)}
              style={[styles.dial, form.dial === c.dial && styles.dialActive]}>
              <Text style={{ fontSize: 15 }}>{c.flag}</Text>
              <Text style={[styles.dialText, form.dial === c.dial && { color: colors.primary, fontWeight: '700' }]}>
                {c.dial}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad"
          placeholder="5X XXX XXXX" error={errors.phone} />

        <Input label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)}
          keyboardType="email-address" error={errors.email} />
        <Input label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)}
          isPassword error={errors.password} />
        <PasswordStrengthBar password={form.password} />
        <Input label={t('auth.confirmPassword')} value={form.confirm} onChangeText={(v) => set('confirm', v)}
          isPassword error={errors.confirm} />

        <Button title={t('auth.register')} onPress={submit} loading={loading} style={{ marginTop: 8 }} />
        <Pressable onPress={() => nav.navigate('Login')} style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('auth.hasAccount')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  or: { textAlign: 'center', color: colors.sub, marginVertical: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  dial: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 40,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 8
  },
  dialActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dialText: { fontSize: 13, color: colors.sub }
});
