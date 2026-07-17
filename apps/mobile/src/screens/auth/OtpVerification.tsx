import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import OtpInput from '../../components/ui/OtpInput';
import Button from '../../components/ui/Button';
import { sendOtp, verifyOtp } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, g } from '../../theme';

/**
 * Verifica OTP — usata per telefono ed email (schermate separate in sequenza).
 * Il cliente deve verificare ENTRAMBI i canali prima di accedere.
 */
export default function OtpVerification() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { userId, channel, target, nextChannel } = params;
  const setUser = useAuthStore((s) => s.setUser);

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);

  useEffect(() => {
    setCode(''); setError(false); setCountdown(OTP_RESEND_SECONDS);
  }, [channel]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  useEffect(() => {
    if (code.length === OTP_LENGTH) submit();
  }, [code]);

  const submit = async () => {
    setLoading(true);
    setError(false);
    try {
      const user = await verifyOtp(userId, channel, code);
      if (nextChannel) {
        // Passa alla verifica email (seconda schermata OTP)
        nav.replace('Otp', { userId, channel: nextChannel.channel, target: nextChannel.target });
      } else {
        setUser(user); // entrambi verificati → login (poi verifica bancaria)
      }
    } catch {
      setError(true);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async (via: 'sms' | 'whatsapp' = 'sms') => {
    await sendOtp(userId, channel, via);
    setCountdown(OTP_RESEND_SECONDS);
  };

  return (
    <Screen>
      <View style={{ marginTop: 40 }}>
        <View style={styles.iconWrap}>
          <Ionicons name={channel === 'phone' ? 'chatbox-ellipses' : 'mail'} size={34} color={colors.primary} />
        </View>
        <Text style={[g.title, { textAlign: 'center' }]}>
          {channel === 'phone' ? t('otp.phoneTitle') : t('otp.emailTitle')}
        </Text>
        <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 28 }]}>
          {channel === 'phone' ? t('otp.phoneSub', { target }) : t('otp.emailSub', { target })}
        </Text>

        <OtpInput value={code} onChange={setCode} error={error} />
        {error && <Text style={styles.error}>{t('otp.wrongCode')}</Text>}
        <Text style={styles.demo}>{t('otp.demoHint')}</Text>

        <Button title={t('common.confirm')} onPress={submit} loading={loading}
          disabled={code.length < OTP_LENGTH} style={{ marginTop: 24 }} />

        <View style={{ alignItems: 'center', marginTop: 20, gap: 12 }}>
          {countdown > 0 ? (
            <Text style={g.subtitle}>{t('otp.resendIn', { s: countdown })}</Text>
          ) : (
            <Pressable onPress={() => resend('sms')}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('otp.resend')}</Text>
            </Pressable>
          )}
          {channel === 'phone' && countdown <= 0 && (
            <Pressable onPress={() => resend('whatsapp')} style={styles.wa}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={{ color: '#128C7E', fontWeight: '600' }}>{t('otp.viaWhatsapp')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 76, height: 76, borderRadius: 26, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18
  },
  error: { color: colors.danger, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  demo: { textAlign: 'center', color: colors.sub, fontSize: 12, marginTop: 10 },
  wa: { flexDirection: 'row', alignItems: 'center', gap: 6 }
});
