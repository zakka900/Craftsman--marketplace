import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UNVERIFIED_PAYMENT_LIMIT } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { getContract, payDeposit } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, g, radius, shadow } from '../../theme';
import { money } from '../../utils/format';

type Method = 'card' | 'applePay' | 'googlePay' | 'mada';

/**
 * Pagamento/deposito con meccanismo escrow.
 * PROVIDER REALE: Tap Payments / PayTabs / Moyasar (mada, Apple Pay, carte GCC).
 */
export default function Payment() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { user, bankStatus } = useAuthStore();
  const [method, setMethod] = useState<Method>('card');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const contract = getContract(params.contractId);
  if (!contract) return null;

  // Limite per conti non verificati (verifica bancaria saltata)
  const verified = user?.bankVerified || bankStatus === 'verified';
  const limit = UNVERIFIED_PAYMENT_LIMIT[contract.currency] ?? 1000;
  const blocked = !verified && contract.price > limit;

  const methods: { id: Method; icon: string; label: string }[] = [
    { id: 'card', icon: 'card', label: t('payment.card') },
    { id: 'applePay', icon: 'logo-apple', label: t('payment.applePay') },
    { id: 'googlePay', icon: 'logo-google', label: t('payment.googlePay') },
    { id: 'mada', icon: 'wallet', label: t('payment.mada') }
  ];

  const pay = async () => {
    setLoading(true);
    try {
      const { receiptId } = await payDeposit(contract.id);
      setReceipt(receiptId);
    } catch (err: any) {
      // 'CANCELLED' = utente ha chiuso il foglio Stripe: nessun messaggio
      if (err?.message !== 'CANCELLED') Alert.alert('', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={54} color="#fff" />
          </View>
          <Text style={g.title}>{t('payment.success')}</Text>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8 }]}>{t('payment.successSub')}</Text>
          <Text style={[g.small, { marginTop: 12 }]}>{t('payment.receipt', { id: receipt })}</Text>
          <Button title={t('job.title')} style={{ alignSelf: 'stretch', marginTop: 28 }}
            onPress={() => nav.replace('JobTracking', { requestId: contract.requestId })} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('payment.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Importo */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <Text style={styles.amount}>{money(contract.price, contract.currency)}</Text>
        </View>

        {/* Spiegazione escrow */}
        <View style={styles.escrow}>
          <Ionicons name="lock-closed" size={22} color={colors.success} />
          <Text style={[g.body, { flex: 1, lineHeight: 20 }]}>{t('payment.escrow')}</Text>
        </View>

        {/* Metodi di pagamento */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 10 }]}>{t('payment.methods')}</Text>
        {methods.map((m) => (
          <Pressable key={m.id} onPress={() => setMethod(m.id)}
            style={[styles.method, method === m.id && styles.methodSel]}>
            <Ionicons name={m.icon as any} size={22} color={method === m.id ? colors.primary : colors.sub} />
            <Text style={[g.body, { flex: 1, fontWeight: '600' }]}>{m.label}</Text>
            <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={20}
              color={method === m.id ? colors.primary : colors.border} />
          </Pressable>
        ))}

        {blocked && (
          <View style={styles.blocked}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[g.small, { color: colors.danger, flex: 1 }]}>{t('payment.limitBlocked')}</Text>
          </View>
        )}
        {blocked && (
          <Button title={t('bank.title')} variant="outline" style={{ marginTop: 10 }}
            onPress={() => nav.navigate('BankVerification', { fromProfile: true })} />
        )}

        <Button title={t('payment.pay', { amount: money(contract.price, contract.currency) })}
          onPress={pay} loading={loading} disabled={blocked} icon="lock-closed" style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, ...shadow },
  amount: { fontSize: 34, fontWeight: '800', color: colors.text },
  escrow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successSoft,
    borderRadius: radius.md, padding: 14, marginTop: 16
  },
  method: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 16, marginBottom: 10
  },
  methodSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  blocked: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft,
    borderRadius: radius.md, padding: 12, marginTop: 8
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24
  }
});
