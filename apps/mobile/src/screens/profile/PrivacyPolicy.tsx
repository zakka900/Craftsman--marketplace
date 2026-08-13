import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import { colors, g, radius, shadow, spacing } from '../../theme';

/** Contenuto statico — nessuna chiamata di rete. Sezioni coerenti con la nota PDPL già mostrata in Profilo. */
export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();

  const sections = ['dataWeCollect', 'howWeUseIt', 'yourRights', 'retention', 'contact'] as const;

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.privacy')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={[g.small, { marginBottom: 16 }]}>{t('profile.privacyNote')}</Text>
        {sections.map((key) => (
          <View key={key} style={styles.card}>
            <Text style={styles.sectionTitle}>{t(`privacyPolicy.${key}Title`)}</Text>
            <Text style={[g.body, { marginTop: 6 }]}>{t(`privacyPolicy.${key}Body`)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(4), marginBottom: 12, ...shadow },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text }
});
