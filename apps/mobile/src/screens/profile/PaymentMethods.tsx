import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import { colors, g } from '../../theme';

/**
 * No saved cards on the backend: payments go through the Stripe sheet
 * (PaymentIntent) at deposit time — there's no "saved method" model.
 * Honest empty state instead of faking data that doesn't exist.
 */
export default function PaymentMethods() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.paymentMethods')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={styles.iconWrap}>
          <Ionicons name="card" size={34} color={colors.sub} />
        </View>
        <Text style={[g.h2, { textAlign: 'center', marginTop: 16 }]}>{t('paymentMethods.emptyTitle')}</Text>
        <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8 }]}>{t('paymentMethods.emptySub')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  iconWrap: {
    width: 76, height: 76, borderRadius: 26, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center'
  }
});
