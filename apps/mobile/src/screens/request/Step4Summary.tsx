import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import { createRequest } from '../../services/api';
import { useAuthStore, useDraftStore } from '../../store';
import { colors, g, radius, shadow } from '../../theme';

const URGENCY_LABEL: Record<string, string> = { now: 'urgencyNow', week: 'urgencyWeek', flexible: 'urgencyFlexible' };
const PROPERTY_LABEL: Record<string, string> = {
  house: 'propertyHouse', apartment: 'propertyApartment', office: 'propertyOffice', site: 'propertySite'
};

/** Step 4: riepilogo con "Modifica" per sezione → invio → conferma → Home. */
export default function Step4Summary({ onEdit }: { onEdit: (step: number) => void }) {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { draft } = useDraftStore();
  const user = useAuthStore((s) => s.user)!;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    await createRequest(draft, user);
    setLoading(false);
    setSent(true);
    // Redirect automatico alla Home: la richiesta appare in "I tuoi lavori attivi"
    setTimeout(() => nav.navigate('MainTabs', { screen: 'HomeTab' }), 1800);
  };

  if (sent) {
    return (
      <View style={styles.sent}>
        <View style={styles.sentIcon}>
          <Ionicons name="checkmark" size={54} color="#fff" />
        </View>
        <Text style={g.title}>{t('wizard.sentTitle')}</Text>
        <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8 }]}>{t('wizard.sentSub')}</Text>
      </View>
    );
  }

  const Section = ({ title, step, children }: any) => (
    <View style={styles.section}>
      <View style={[g.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <Text style={g.h2}>{title}</Text>
        <Pressable onPress={() => onEdit(step)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{t('common.edit')}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={g.title}>{t('wizard.s4Title')}</Text>

        <Section title={t('wizard.category')} step={1}>
          <Text style={g.body}>
            {t(`categories.${draft.categoryId}`)} · {t(`subs.${draft.categoryId}.${draft.subcategory}`)}
          </Text>
        </Section>

        <Section title={t('wizard.description')} step={2}>
          <Text style={g.body}>{draft.description}</Text>
          {draft.photos.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {draft.photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 64, height: 64, borderRadius: radius.sm }} />
              ))}
            </View>
          )}
        </Section>

        <Section title={t('wizard.details')} step={3}>
          <Text style={g.body}>{draft.city}{draft.zone ? ` · ${draft.zone}` : ''}</Text>
          <Text style={[g.body, { marginTop: 4 }]}>
            {t(`wizard.${PROPERTY_LABEL[draft.propertyType || 'house']}`)} · {t(`wizard.${URGENCY_LABEL[draft.urgency || 'flexible']}`)}
          </Text>
          {draft.budgetOn && (
            <Text style={[g.body, { marginTop: 4 }]}>
              {t('wizard.budget')}: {draft.budgetMin} – {draft.budgetMax}
            </Text>
          )}
        </Section>
      </ScrollView>
      <View style={{ padding: 20, backgroundColor: colors.bg }}>
        <Button title={t('wizard.submit')} onPress={submit} loading={loading} icon="paper-plane" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginTop: 16, ...shadow
  },
  sent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  sentIcon: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24
  }
});
