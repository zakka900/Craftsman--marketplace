import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Bank } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { getBanks, pollBankVerification, startBankVerification } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, g, radius, shadow } from '../../theme';
import { hapticError, hapticSelect, hapticSuccess } from '../../utils/haptics';

type Step = 'intro' | 'pending' | 'success' | 'failed';

/**
 * Verifica bancaria Open Banking (mock).
 * Flusso reale: selezione banca → deep-link app bancaria → il cliente approva
 * nella SUA app (push della banca) → polling stato → verificato/fallito.
 * PROVIDER REALE: Lean Technologies / Tarabut Gateway via backend.
 */
export default function BankVerification() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const fromProfile = route.params?.fromProfile;
  const { user, setBankStatus, setUser } = useAuthStore();
  const [step, setStep] = useState<Step>('intro');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<any>(null);

  const banks = getBanks(user?.country || 'SA');

  useEffect(() => () => clearInterval(pollRef.current), []);

  const start = async () => {
    if (!selectedBank) return;
    setLoading(true);
    // In produzione: Linking.openURL(deepLink) verso l'app della banca
    const { verificationId } = await startBankVerification(selectedBank.id);
    setLoading(false);
    setStep('pending');
    pollRef.current = setInterval(async () => {
      const status = await pollBankVerification(verificationId);
      if (status === 'verified') {
        clearInterval(pollRef.current);
        hapticSuccess();
        setStep('success');
      } else if (status === 'failed') {
        clearInterval(pollRef.current);
        hapticError();
        setStep('failed');
      }
    }, 2000);
  };

  const finish = (status: 'verified' | 'skipped') => {
    if (status === 'verified' && user) setUser({ ...user, bankVerified: true });
    setBankStatus(status);
    if (fromProfile) nav.goBack();
  };

  return (
    <Screen scroll>
      <Text style={[g.title, { marginTop: 24 }]}>{t('bank.title')}</Text>

      {step === 'intro' && (
        <>
          {/* Box di trust: perché chiediamo la verifica */}
          <View style={styles.trustBox}>
            <View style={[g.row, { gap: 8 }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={[g.h2, { color: colors.success }]}>{t('bank.why')}</Text>
            </View>
            <Text style={[g.body, { marginTop: 8, lineHeight: 21 }]}>{t('bank.whyText')}</Text>
          </View>

          <Text style={[g.h2, { marginTop: 24, marginBottom: 12 }]}>{t('bank.selectBank')}</Text>
          <View style={styles.bankGrid}>
            {banks.map((b) => (
              <Pressable key={b.id} onPress={() => { hapticSelect(); setSelectedBank(b); }}
                style={[styles.bank, selectedBank?.id === b.id && styles.bankSel]}>
                <View style={[styles.bankLogo, { backgroundColor: b.color }]}>
                  <Text style={styles.bankInitial}>{b.name[0]}</Text>
                </View>
                <Text style={styles.bankName} numberOfLines={2}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[g.small, { marginTop: 8, marginBottom: 16 }]}>{t('bank.goToBank')}</Text>
          <Button title={t('common.continue')} onPress={start} disabled={!selectedBank} loading={loading} />
          {!fromProfile && (
            <>
              <Button title={t('bank.skip')} variant="ghost" onPress={() => finish('skipped')} style={{ marginTop: 8 }} />
              <Text style={[g.small, { textAlign: 'center', marginTop: 4 }]}>{t('bank.skipNote')}</Text>
            </>
          )}
        </>
      )}

      {step === 'pending' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[g.h2, { marginTop: 20 }]}>{t('bank.pending')}</Text>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8 }]}>{t('bank.pendingSub')}</Text>
        </View>
      )}

      {step === 'success' && (
        <View style={styles.center}>
          <View style={[styles.resultIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={g.title}>{t('bank.success')}</Text>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>{t('bank.successSub')}</Text>
          <Button title={t('bank.goHome')} onPress={() => finish('verified')} style={{ alignSelf: 'stretch' }} />
        </View>
      )}

      {step === 'failed' && (
        <View style={styles.center}>
          <View style={[styles.resultIcon, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons name="close-circle" size={64} color={colors.danger} />
          </View>
          <Text style={g.title}>{t('bank.failed')}</Text>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>{t('bank.failedSub')}</Text>
          <Button title={t('common.retry')} onPress={() => setStep('intro')} style={{ alignSelf: 'stretch' }} />
          <Button title={t('bank.skip')} variant="ghost" onPress={() => finish('skipped')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  trustBox: { backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: 16, marginTop: 20 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bank: {
    width: '30.5%', backgroundColor: colors.card, borderRadius: radius.md, padding: 12,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, ...shadow
  },
  bankSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  bankLogo: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  bankInitial: { color: '#fff', fontWeight: '800', fontSize: 18 },
  bankName: { fontSize: 11, textAlign: 'center', color: colors.text, fontWeight: '600' },
  center: { alignItems: 'center', marginTop: 60, paddingHorizontal: 12 },
  resultIcon: { width: 110, height: 110, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }
});
