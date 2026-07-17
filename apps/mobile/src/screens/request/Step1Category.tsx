import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '@artisan/shared';
import CategoryGrid from '../../components/domain/CategoryGrid';
import Button from '../../components/ui/Button';
import { useDraftStore } from '../../store';
import { colors, g, radius } from '../../theme';

export default function Step1Category({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const { draft, patch } = useDraftStore();
  const category = CATEGORIES.find((c) => c.id === draft.categoryId);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={g.title}>{t('wizard.s1Title')}</Text>
        <Text style={[g.subtitle, { marginTop: 4, marginBottom: 20 }]}>{t('wizard.s1Sub')}</Text>
        <CategoryGrid
          selected={draft.categoryId}
          onSelect={(categoryId) => patch({ categoryId, subcategory: undefined })}
        />
        {category && (
          <>
            <Text style={[g.h2, { marginTop: 10, marginBottom: 12 }]}>{t(`categories.${category.id}`)}</Text>
            <View style={styles.subWrap}>
              {category.subs.map((s) => (
                <Pressable key={s} onPress={() => patch({ subcategory: s })}
                  style={[styles.sub, draft.subcategory === s && styles.subSel]}>
                  <Text style={[styles.subText, draft.subcategory === s && { color: '#fff' }]}>
                    {t(`subs.${category.id}.${s}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={t('common.continue')} onPress={onNext} disabled={!draft.categoryId || !draft.subcategory} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sub: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border
  },
  subSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  subText: { fontSize: 14, fontWeight: '600', color: colors.text },
  footer: { padding: 20, backgroundColor: colors.bg }
});
