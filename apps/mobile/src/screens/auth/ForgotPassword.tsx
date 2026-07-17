import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { OTP_LENGTH, checkPasswordRules } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/ui/OtpInput';
import PasswordStrengthBar from '../../components/ui/PasswordStrengthBar';
import { requestPasswordReset, resetPassword } from '../../services/api';
import { colors, g } from '../../theme';

/** Flusso password dimenticata: identificativo → OTP → nuova password. */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const [step, setStep] = useState<'id' | 'otp' | 'password' | 'done'>('id');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!identifier.trim()) { setError(t('auth.required')); return; }
    setLoading(true);
    await requestPasswordReset(identifier);
    setLoading(false);
    setError(null);
    setStep('otp');
  };

  const setNew = async () => {
    const failed = checkPasswordRules(password).filter((r) => !r.ok);
    if (failed.length) { setError(t(`auth.pwRules.${failed[0].key}`)); return; }
    if (password !== confirm) { setError(t('auth.passwordsMismatch')); return; }
    setLoading(true);
    try {
      await resetPassword(identifier, code, password);
      setStep('done');
    } catch {
      setError(t('otp.wrongCode'));
      setStep('otp');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[g.title, { marginTop: 40 }]}>{t('forgot.title')}</Text>
      <Text style={[g.subtitle, { marginTop: 8, marginBottom: 24 }]}>{t('forgot.sub')}</Text>

      {step === 'id' && (
        <>
          <Input label={t('forgot.emailOrPhone')} value={identifier} onChangeText={setIdentifier} error={error} />
          <Button title={t('forgot.sendCode')} onPress={sendCode} loading={loading} />
        </>
      )}

      {step === 'otp' && (
        <>
          <OtpInput value={code} onChange={setCode} error={!!error} />
          {error && <Text style={{ color: colors.danger, textAlign: 'center', marginTop: 10 }}>{error}</Text>}
          <Text style={{ textAlign: 'center', color: colors.sub, fontSize: 12, marginTop: 10 }}>{t('otp.demoHint')}</Text>
          <Button title={t('common.continue')} disabled={code.length < OTP_LENGTH}
            onPress={() => { setError(null); setStep('password'); }} style={{ marginTop: 24 }} />
        </>
      )}

      {step === 'password' && (
        <>
          <Input label={t('forgot.newPassword')} value={password} onChangeText={setPassword} isPassword error={error} />
          <PasswordStrengthBar password={password} />
          <Input label={t('auth.confirmPassword')} value={confirm} onChangeText={setConfirm} isPassword />
          <Button title={t('forgot.setPassword')} onPress={setNew} loading={loading} />
        </>
      )}

      {step === 'done' && (
        <View style={{ alignItems: 'center', gap: 20, marginTop: 20 }}>
          <Text style={[g.h2, { color: colors.success, textAlign: 'center' }]}>{t('forgot.success')}</Text>
          <Button title={t('auth.login')} onPress={() => nav.navigate('Login')} style={{ alignSelf: 'stretch' }} />
        </View>
      )}
    </Screen>
  );
}
