import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { getArtisan, openConversation } from '../../services/api';
import { colors, g, radius, shadow } from '../../theme';

/** Profilo artigiano visto dal cliente. */
export default function ArtisanProfile() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const a = getArtisan(params.artisanId);
  if (!a) return null;

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Intestazione */}
        <View style={{ alignItems: 'center' }}>
          <Avatar name={a.name} color={a.color} size={88} />
          <View style={[g.row, { gap: 6, marginTop: 12 }]}>
            <Text style={g.title}>{a.name}</Text>
            {a.licenseVerified && <Ionicons name="shield-checkmark" size={20} color={colors.success} />}
          </View>
          <Text style={g.subtitle}>
            {t(`categories.${a.categoryId}`)} · {a.city}, {a.zone}
          </Text>
          <View style={[g.row, { gap: 4, marginTop: 6 }]}>
            <Ionicons name="star" size={16} color="#FF9500" />
            <Text style={[g.body, { fontWeight: '700' }]}>{a.rating}</Text>
            <Text style={g.small}>({t('quotes.reviews', { n: a.reviewsCount })})</Text>
          </View>
          <View style={[g.row, { gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }]}>
            {a.badges.map((b) => (
              <View key={b} style={styles.badge}><Text style={styles.badgeText}>{b}</Text></View>
            ))}
            {a.licenseVerified && (
              <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>{t('artisan.licenseVerified')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dati verificabili */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{a.yearsActive}</Text>
            <Text style={g.small}>{t('artisan.yearsActive', { n: a.yearsActive }).replace(String(a.yearsActive), '').trim()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{a.jobsDone}</Text>
            <Text style={g.small}>{t('artisan.jobsDone', { n: a.jobsDone }).replace(String(a.jobsDone), '').trim()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{a.distanceKm}</Text>
            <Text style={g.small}>{t('quotes.km', { n: a.distanceKm }).replace(String(a.distanceKm), '').trim()}</Text>
          </View>
        </View>

        {/* Bio */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 8 }]}>{t('artisan.about')}</Text>
        <Text style={[g.body, { lineHeight: 21 }]}>{a.bio}</Text>

        {/* Portfolio prima/dopo */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 10 }]}>{t('artisan.portfolio')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {a.portfolio.map((p) => (
            <View key={p.title} style={styles.pfCard}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: p.before }} style={styles.pfImg} />
                <Image source={{ uri: p.after }} style={styles.pfImg} />
              </View>
              <Text style={[g.small, { padding: 10, fontWeight: '600', color: colors.text }]} numberOfLines={1}>
                {p.title}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Recensioni */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 10 }]}>{t('artisan.reviews')}</Text>
        {a.reviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <View style={[g.row, { justifyContent: 'space-between' }]}>
              <Text style={[g.body, { fontWeight: '700' }]}>{r.author}</Text>
              <View style={[g.row, { gap: 3 }]}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons key={i} name={i <= r.rating ? 'star' : 'star-outline'} size={13} color="#FF9500" />
                ))}
              </View>
            </View>
            <Text style={[g.body, { marginTop: 6 }]}>{r.text}</Text>
            <Text style={[g.small, { marginTop: 4 }]}>{r.date}</Text>
          </View>
        ))}
      </ScrollView>

      {/* CTA fisse: richiesta diretta + chat */}
      <View style={styles.footer}>
        <Button title={t('artisan.chat')} variant="outline" style={{ flex: 1 }}
          onPress={() => {
            const conv = openConversation(a.id);
            nav.navigate('ChatRoom', { conversationId: conv.id });
          }} />
        <Button title={t('artisan.directRequest')} style={{ flex: 1.6 }}
          onPress={() => nav.navigate('CreateRequest', { artisanId: a.id })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingVertical: 12 },
  badge: { backgroundColor: colors.infoSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.info },
  stats: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    marginTop: 20, ...shadow
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  statDivider: { width: 1, backgroundColor: colors.border },
  pfCard: { width: 240, backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', marginEnd: 12, ...shadow },
  pfImg: { width: 120, height: 90 },
  review: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow },
  footer: {
    position: 'absolute', bottom: 0, start: 0, end: 0, flexDirection: 'row', gap: 10,
    padding: 16, paddingBottom: 28, backgroundColor: colors.bg
  }
});
