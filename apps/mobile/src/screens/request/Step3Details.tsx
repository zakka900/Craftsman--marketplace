import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CITIES, COUNTRIES } from '@artisan/shared';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore, useDraftStore } from '../../store';
import { colors, g, radius } from '../../theme';

const PROPERTY: { id: 'house' | 'apartment' | 'office' | 'site'; icon: string }[] = [
  { id: 'house', icon: 'home' },
  { id: 'apartment', icon: 'business' },
  { id: 'office', icon: 'briefcase' },
  { id: 'site', icon: 'construct' }
];
const URGENCY: ('now' | 'week' | 'flexible')[] = ['now', 'week', 'flexible'];
const PROPERTY_LABEL: Record<string, string> = {
  house: 'propertyHouse', apartment: 'propertyApartment', office: 'propertyOffice', site: 'propertySite'
};
const URGENCY_LABEL: Record<string, string> = { now: 'urgencyNow', week: 'urgencyWeek', flexible: 'urgencyFlexible' };

/** Step 3: city (autocomplete), zone, property type, urgency, optional budget. */
export default function Step3Details({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const { draft, patch } = useDraftStore();
  const user = useAuthStore((s) => s.user);
  const [cityQuery, setCityQuery] = useState(draft.city || '');
  const currency = COUNTRIES.find((c) => c.code === user?.country)?.currency || 'SAR';

  // City autocomplete across the 4 target countries (user's country first)
  const allCities = useMemo(() => {
    const own = CITIES[user?.country || 'SA'];
    const rest = Object.entries(CITIES).filter(([k]) => k !== user?.country).flatMap(([, v]) => v);
    return [...own, ...rest];
  }, [user?.country]);
  const citySuggestions = cityQuery.trim() && cityQuery !== draft.city
    ? allCities.filter((c) => c.toLowerCase().includes(cityQuery.toLowerCase())).slice(0, 5)
    : [];

  const valid = draft.city && draft.propertyType && draft.urgency;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={g.title}>{t('wizard.s3Title')}</Text>

        <Text style={styles.label}>{t('wizard.city')}</Text>
        <TextInput
          style={styles.input}
          value={cityQuery}
          onChangeText={(v) => { setCityQuery(v); if (v !== draft.city) patch({ city: undefined }); }}
          placeholder="Riyadh, Dubai, Doha..."
          placeholderTextColor="#A8A29E"
        />
        {citySuggestions.map((c) => (
          <Pressable key={c} style={styles.suggestion}
            onPress={() => { patch({ city: c }); setCityQuery(c); }}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={g.body}>{c}</Text>
          </Pressable>
        ))}

        <Input label={t('wizard.zone')} value={draft.zone} onChangeText={(zone) => patch({ zone })}
          placeholder={t('wizard.zonePlaceholder')} />

        {/* Property type — card selector */}
        <Text style={styles.label}>{t('wizard.property')}</Text>
        <View style={styles.cardRow}>
          {PROPERTY.map((p) => (
            <Pressable key={p.id} onPress={() => patch({ propertyType: p.id })}
              style={[styles.propCard, draft.propertyType === p.id && styles.selCard]}>
              <Ionicons name={p.icon as any} size={24}
                color={draft.propertyType === p.id ? colors.primary : colors.sub} />
              <Text style={[styles.propText, draft.propertyType === p.id && { color: colors.primary, fontWeight: '700' }]}>
                {t(`wizard.${PROPERTY_LABEL[p.id]}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Urgency — 3 options */}
        <Text style={styles.label}>{t('wizard.urgency')}</Text>
        <View style={styles.cardRow}>
          {URGENCY.map((u) => (
            <Pressable key={u} onPress={() => patch({ urgency: u })}
              style={[styles.urgCard, draft.urgency === u && styles.selCard]}>
              <Text style={[styles.propText, draft.urgency === u && { color: colors.primary, fontWeight: '700' }]}>
                {t(`wizard.${URGENCY_LABEL[u]}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Optional budget with toggle and min-max range */}
        <View style={[g.row, { justifyContent: 'space-between', marginTop: 20 }]}>
          <Text style={styles.label}>{t('wizard.budget')} ({t('common.optional')})</Text>
          <Switch value={draft.budgetOn} onValueChange={(budgetOn) => patch({ budgetOn })}
            trackColor={{ true: colors.primary }} />
        </View>
        {draft.budgetOn && (
          <View style={[g.row, { gap: 12, marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={g.small}>Min ({currency})</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(draft.budgetMin)}
                onChangeText={(v) => patch({ budgetMin: Number(v.replace(/[^0-9]/g, '')) || 0 })} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={g.small}>Max ({currency})</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(draft.budgetMax)}
                onChangeText={(v) => patch({ budgetMax: Number(v.replace(/[^0-9]/g, '')) || 0 })} />
            </View>
          </View>
        )}
      </ScrollView>
      <View style={{ padding: 20, backgroundColor: colors.bg }}>
        <Button title={t('common.continue')} onPress={onNext} disabled={!valid} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    height: 50, paddingHorizontal: 14, fontSize: 15, color: colors.text
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.card,
    borderRadius: radius.sm, marginTop: 4
  },
  cardRow: { flexDirection: 'row', gap: 10 },
  propCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', paddingVertical: 14, gap: 6
  },
  urgCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', paddingVertical: 14
  },
  selCard: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  propText: { fontSize: 12, color: colors.sub, textAlign: 'center' }
});
