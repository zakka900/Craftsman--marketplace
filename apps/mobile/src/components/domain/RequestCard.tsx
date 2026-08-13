import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { JobRequest } from '@artisan/shared';
import { getArtisan, getQuotes } from '../../services/api';
import { colors, g, radius, shadow } from '../../theme';
import { catIcon } from '../../theme/categoryIcons';
import { shortDate, money } from '../../utils/format';

const STATUS_COLOR: Record<string, string> = {
  awaiting_quotes: colors.warning,
  quotes_received: colors.info,
  artisan_selected: colors.primary,
  in_progress: colors.primary,
  completed: colors.success,
  cancelled: colors.sub,
  disputed: colors.danger
};

export default function RequestCard({ request, onPress, wide }: {
  request: JobRequest; onPress: () => void; wide?: boolean;
}) {
  const { t } = useTranslation();
  const quotes = getQuotes(request.id);
  const artisan = request.artisanId ? getArtisan(request.artisanId) : null;
  const statusText = request.status === 'quotes_received'
    ? t('status.quotes_received', { n: quotes.length })
    : t(`status.${request.status}`);
  return (
    <Pressable onPress={onPress} style={[styles.card, wide ? { width: '100%' } : { width: 260, marginEnd: 12 }]}>
      <View style={[g.row, { justifyContent: 'space-between' }]}>
        <View style={[styles.catIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name={catIcon(request.categoryId)} size={22} color={colors.primary} />
        </View>
        <Text style={g.small}>{shortDate(request.createdAt)}</Text>
      </View>
      <Text style={[g.h2, { marginTop: 10 }]} numberOfLines={1}>
        {t(`categories.${request.categoryId}`)} · {t(`subs.${request.categoryId}.${request.subcategory}`)}
      </Text>
      <Text style={[g.small, { marginTop: 2 }]} numberOfLines={1}>
        {request.city}{request.zone ? ` · ${request.zone}` : ''}
        {artisan ? ` · ${artisan.name}` : ''}
      </Text>
      <View style={[g.row, { marginTop: 10, justifyContent: 'space-between' }]}>
        <View style={[styles.status, { backgroundColor: STATUS_COLOR[request.status] + '18' }]}>
          <View style={[styles.dot, { backgroundColor: STATUS_COLOR[request.status] }]} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: STATUS_COLOR[request.status] }}>{statusText}</Text>
        </View>
        {request.quoteId && (
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            {money(quotes.find((q) => q.id === request.quoteId)?.total || 0, request.currency)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow, marginBottom: 12 },
  catIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 }
});
