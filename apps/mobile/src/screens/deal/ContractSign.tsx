import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Contract } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Skeleton from '../../components/feedback/Skeleton';
import { createContract, getArtisan, signContract } from '../../services/api';
import { colors, g, radius, shadow } from '../../theme';
import { money } from '../../utils/format';

/** Contratto digitale semplificato: riepilogo preventivo + firma con tap. */
export default function ContractSign() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    createContract(params.requestId, params.quoteId).then(setContract);
  }, []);

  const artisan = contract ? getArtisan(contract.artisanId) : null;

  const sign = async () => {
    if (!contract) return;
    setSigning(true);
    await signContract(contract.id);
    setSigning(false);
    setSigned(true);
    setTimeout(() => nav.replace('Payment', { contractId: contract.id }), 900);
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('contract.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={g.subtitle}>{t('contract.sub')}</Text>
        {!contract ? (
          <View style={{ gap: 12, marginTop: 20 }}>
            <Skeleton style={{ height: 90, borderRadius: radius.lg }} />
            <Skeleton style={{ height: 180, borderRadius: radius.lg }} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={g.small}>{artisan?.name}</Text>
              <Text style={styles.price}>{money(contract.price, contract.currency)}</Text>
              <Text style={[g.small, { marginTop: 2 }]}>{t('contract.price')}</Text>
            </View>
            <View style={styles.card}>
              <Row label={t('contract.scope')} value={contract.scope} />
              <Row label={t('contract.timing')} value={t('quotes.days', { n: contract.days })} />
            </View>
            <View style={styles.card}>
              <Text style={[g.h2, { marginBottom: 8 }]}>{t('contract.terms')}</Text>
              {contract.terms.map((key) => (
                <View key={key} style={[g.row, { alignItems: 'flex-start', marginBottom: 8, gap: 8 }]}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[g.body, { flex: 1, lineHeight: 20 }]}>{t(`contract.${key}`)}</Text>
                </View>
              ))}
            </View>

            {/* Firma digitale con tap */}
            <Pressable onPress={sign} disabled={signing || signed}
              style={[styles.signBox, signed && { borderColor: colors.success, backgroundColor: colors.successSoft }]}>
              <Ionicons name={signed ? 'checkmark-circle' : 'create'} size={30}
                color={signed ? colors.success : colors.primary} />
              <Text style={[g.h2, { color: signed ? colors.success : colors.primary }]}>
                {signed ? t('contract.signed') : signing ? t('common.loading') : t('contract.sign')}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={g.small}>{label}</Text>
      <Text style={[g.body, { fontWeight: '600', marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginTop: 16, ...shadow },
  price: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 4 },
  signBox: {
    marginTop: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: 26, alignItems: 'center', gap: 8
  }
});
