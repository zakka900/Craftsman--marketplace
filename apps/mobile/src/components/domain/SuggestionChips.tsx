import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

interface Props {
  title: string;
  hints: string[];
  onPick?: (hint: string) => void;
  tone?: 'ai' | 'warning';
}

/** Chip/banner AI non bloccanti: tap per aggiungere il suggerimento. */
export default function SuggestionChips({ title, hints, onPick, tone = 'ai' }: Props) {
  if (!hints.length) return null;
  const bg = tone === 'ai' ? colors.infoSoft : colors.warningSoft;
  const fg = tone === 'ai' ? colors.info : colors.warning;
  return (
    <View style={[styles.box, { backgroundColor: bg }]}>
      <View style={styles.titleRow}>
        <Ionicons name={tone === 'ai' ? 'sparkles' : 'alert-circle'} size={15} color={fg} />
        <Text style={[styles.title, { color: fg }]}>{title}</Text>
      </View>
      {hints.map((h) => (
        <Pressable key={h} onPress={() => onPick?.(h)} style={styles.chip}>
          <Text style={styles.chipText}>{h}</Text>
          {onPick && <Ionicons name="add-circle" size={18} color={fg} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: 14, marginTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { fontSize: 12, fontWeight: '700' },
  chip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, marginTop: 8
  },
  chipText: { fontSize: 13, color: colors.text, flex: 1, marginEnd: 8 }
});
