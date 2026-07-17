import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Quote } from '@artisan/shared';
import { getArtisan } from '../../services/api';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { colors, g, radius, shadow } from '../../theme';
import { money } from '../../utils/format';

interface Props {
  quote: Quote;
  currency: string;
  onProfile: () => void;
  onChat: () => void;
  onChoose: () => void;
}

export default function QuoteCard({ quote, currency, onProfile, onChat, onChoose }: Props) {
  const { t } = useTranslation();
  const a = getArtisan(quote.artisanId);
  if (!a) return null;
  return (
    <View style={[styles.card, quote.recommended && styles.recommended]}>
      {quote.recommended && (
        <View style={styles.ribbon}>
          <Ionicons name="ribbon" size={13} color="#fff" />
          <Text style={styles.ribbonText}>{t('quotes.recommended')}</Text>
        </View>
      )}
      <View style={g.row}>
        <Avatar name={a.name} color={a.color} size={48} />
        <View style={{ flex: 1, marginStart: 12 }}>
          <View style={[g.row, { gap: 6 }]}>
            <Text style={g.h2} numberOfLines={1}>{a.name}</Text>
            {a.licenseVerified && <Ionicons name="shield-checkmark" size={15} color={colors.success} />}
          </View>
          <View style={[g.row, { gap: 8, marginTop: 2 }]}>
            <View style={[g.row, { gap: 3 }]}>
              <Ionicons name="star" size={13} color="#FF9500" />
              <Text style={g.small}>{a.rating} ({t('quotes.reviews', { n: a.reviewsCount })})</Text>
            </View>
            <Text style={g.small}>· {t('quotes.km', { n: a.distanceKm })}</Text>
          </View>
          {a.badges.length > 0 && (
            <View style={[g.row, { gap: 6, marginTop: 4, flexWrap: 'wrap' }]}>
              {a.badges.map((b) => (
                <View key={b} style={styles.badge}><Text style={styles.badgeText}>{b}</Text></View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={[g.row, { marginTop: 14, justifyContent: 'space-between' }]}>
        <View>
          <Text style={styles.price}>{money(quote.total, currency)}</Text>
          {quote.labor != null && (
            <Text style={g.small}>
              {t('quotes.labor')} {money(quote.labor, currency)} · {t('quotes.materials')} {money(quote.materials || 0, currency)}
            </Text>
          )}
        </View>
        <View style={[g.row, { gap: 4 }]}>
          <Ionicons name="time-outline" size={15} color={colors.sub} />
          <Text style={g.small}>{t('quotes.days', { n: quote.days })}</Text>
        </View>
      </View>
      {quote.note ? <Text style={[g.small, { marginTop: 8 }]}>{quote.note}</Text> : null}

      <View style={[g.row, { gap: 8, marginTop: 14 }]}>
        <Button title={t('quotes.viewProfile')} variant="outline" onPress={onProfile} style={{ flex: 1, height: 44 }} />
        <Button title={t('quotes.chat')} variant="outline" onPress={onChat} style={{ flex: 1, height: 44 }} />
        <Button title={t('quotes.choose')} onPress={onChoose} style={{ flex: 1.2, height: 44 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  recommended: { borderWidth: 1.5, borderColor: colors.primary },
  ribbon: {
    position: 'absolute', top: -10, start: 16, backgroundColor: colors.primary, borderRadius: 99,
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4
  },
  ribbonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badge: { backgroundColor: colors.infoSoft, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.info },
  price: { fontSize: 20, fontWeight: '800', color: colors.text }
});
