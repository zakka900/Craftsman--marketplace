import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '@artisan/shared';
import { colors, radius, shadow } from '../../theme';
import { catIcon } from '../../theme/categoryIcons';
import { hapticSelect } from '../../utils/haptics';

interface Props {
  onSelect: (categoryId: string) => void;
  selected?: string;
  compact?: boolean;
}

/** Griglia categorie: icone colorate su sfondo pastello. */
export default function CategoryGrid({ onSelect, selected, compact }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((c) => {
        const isSel = selected === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => { hapticSelect(); onSelect(c.id); }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, compact && { width: '22%' }, pressed && { opacity: 0.6 }]}
          >
            <View style={[
              styles.icon,
              isSel && { backgroundColor: colors.primary }
            ]}>
              <MaterialCommunityIcons name={catIcon(c.id)} size={28} color={isSel ? '#fff' : colors.primary} />
            </View>
            <Text style={[styles.label, isSel && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
              {t(`categories.${c.id}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  item: { width: '18%', alignItems: 'center', marginBottom: 18 },
  icon: {
    width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...shadow
  },
  label: { fontSize: 11, color: colors.sub, textAlign: 'center', fontWeight: '500' }
});
