import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import QuoteCard from '../../components/domain/QuoteCard';
import EmptyState from '../../components/feedback/EmptyState';
import Skeleton from '../../components/feedback/Skeleton';
import { getArtisan, getInfoRequests, getQuotes, getRequest, openConversation, translateText } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius, shadow } from '../../theme';
import { shortDate, timeAgo } from '../../utils/format';

type Sort = 'rating' | 'price' | 'time';

/** Dettaglio richiesta: preventivi ricevuti + richieste info + cronologia. */
export default function RequestDetail() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  useLive();
  const [sort, setSort] = useState<Sort>('rating');
  const [descTranslation, setDescTranslation] = useState<{ text: string; sourceLang: string } | 'loading' | null>(null);

  const request = getRequest(params.requestId);
  if (!request) return null;
  const infoRequests = getInfoRequests(request.id);

  const toggleDescTranslate = async () => {
    if (descTranslation) { setDescTranslation(null); return; }
    setDescTranslation('loading');
    try {
      const targetLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
      const res = await translateText(request.description, targetLang);
      setDescTranslation({ text: res.translatedText, sourceLang: res.sourceLang });
    } catch {
      setDescTranslation(null);
    }
  };

  const quotes = [...getQuotes(request.id)].sort((a, b) => {
    if (sort === 'price') return a.total - b.total;
    if (sort === 'time') return a.days - b.days;
    return (getArtisan(b.artisanId)?.rating || 0) - (getArtisan(a.artisanId)?.rating || 0);
  });

  const inJob = ['artisan_selected', 'in_progress', 'completed', 'disputed'].includes(request.status);

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('quotes.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Riepilogo richiesta originale */}
        <View style={styles.summary}>
          <Text style={g.h2}>
            {t(`categories.${request.categoryId}`)} · {t(`subs.${request.categoryId}.${request.subcategory}`)}
          </Text>
          <Text style={[g.small, { marginTop: 4 }]}>
            {request.city}{request.zone ? ` · ${request.zone}` : ''} · {shortDate(request.createdAt)}
          </Text>
          <Text style={[g.body, { marginTop: 8 }]} numberOfLines={3}>
            {descTranslation && descTranslation !== 'loading' ? descTranslation.text : request.description}
          </Text>
          <Pressable onPress={toggleDescTranslate} hitSlop={6}>
            <Text style={[g.small, { color: colors.primary, marginTop: 4 }]}>
              {descTranslation === 'loading'
                ? '…'
                : descTranslation
                ? `${t('chat.translated', { lang: descTranslation.sourceLang })} · ${t('chat.viewOriginal')}`
                : t('chat.viewTranslation')}
            </Text>
          </Pressable>
        </View>

        {/* Se il lavoro è già in corso → vai al tracking */}
        {inJob && (
          <Button title={t('job.title')} icon="pulse" style={{ marginTop: 16 }}
            onPress={() => nav.navigate('JobTracking', { requestId: request.id })} />
        )}

        {/* Richieste "più informazioni" dagli artigiani */}
        {infoRequests.length > 0 && (
          <>
            <Text style={[g.h2, { marginTop: 20, marginBottom: 8 }]}>{t('quotes.infoRequests')}</Text>
            {infoRequests.map((info) => {
              const a = getArtisan(info.artisanId);
              return (
                <Pressable key={info.id} style={styles.infoCard}
                  onPress={() => nav.navigate('MoreInfo', { infoId: info.id })}>
                  <Ionicons name={info.reply ? 'checkmark-done-circle' : 'help-circle'} size={24}
                    color={info.reply ? colors.success : colors.warning} />
                  <View style={{ flex: 1, marginStart: 10 }}>
                    <Text style={[g.body, { fontWeight: '600' }]}>{t('moreInfo.notif', { name: a?.name })}</Text>
                    <Text style={g.small} numberOfLines={1}>{info.message}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.sub} />
                </Pressable>
              );
            })}
          </>
        )}

        {/* Ordinamento preventivi */}
        {!inJob && quotes.length > 0 && (
          <View style={[g.row, { gap: 8, marginTop: 20, marginBottom: 4 }]}>
            {(['rating', 'price', 'time'] as Sort[]).map((s) => (
              <Pressable key={s} onPress={() => setSort(s)}
                style={[styles.sortChip, sort === s && styles.sortSel]}>
                <Text style={[g.small, sort === s && { color: '#fff', fontWeight: '700' }]}>
                  {t(`quotes.sort${s[0].toUpperCase() + s.slice(1)}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Lista preventivi */}
        {!inJob && (quotes.length === 0 ? (
          <View>
            <EmptyState icon="documents-outline" title={t('quotes.empty')} subtitle={t('quotes.emptySub')} />
            <View style={{ gap: 10 }}>
              <Skeleton style={{ height: 120, borderRadius: radius.lg }} />
              <Skeleton style={{ height: 120, borderRadius: radius.lg, opacity: 0.5 }} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} currency={request.currency}
                onProfile={() => nav.navigate('ArtisanProfile', { artisanId: q.artisanId })}
                onChat={async () => {
                  const conv = await openConversation(q.artisanId, request.id);
                  nav.navigate('ChatRoom', { conversationId: conv.id });
                }}
                onChoose={() => nav.navigate('Contract', { requestId: request.id, quoteId: q.id })}
              />
            ))}
          </View>
        ))}

        {/* Cronologia richiesta (utile anche per dispute) */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 8 }]}>{t('quotes.history')}</Text>
        <View style={styles.history}>
          {[...request.history].reverse().map((h) => (
            <View key={h.id} style={[g.row, { paddingVertical: 6, alignItems: 'flex-start' }]}>
              <View style={styles.histDot} />
              <View style={{ flex: 1, marginStart: 10 }}>
                <Text style={g.body}>{h.text}</Text>
                <Text style={g.small}>{timeAgo(h.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  summary: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningSoft,
    borderRadius: radius.md, padding: 14, marginBottom: 8
  },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border
  },
  sortSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  history: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  histDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }
});
