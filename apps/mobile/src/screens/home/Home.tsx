import React, { useEffect, useState } from 'react';
import {
  FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Artisan } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Header from '../../components/domain/Header';
import CategoryGrid from '../../components/domain/CategoryGrid';
import RequestCard from '../../components/domain/RequestCard';
import FAB from '../../components/ui/FAB';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/feedback/EmptyState';
import { getRequests, getShowcase, searchArtisans } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius, shadow, shadowStrong } from '../../theme';

export default function Home() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  useLive();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Artisan[]>([]);

  // Ricerca live artigiani
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    let alive = true;
    searchArtisans(query).then((r) => alive && setResults(r));
    return () => { alive = false; };
  }, [query]);

  const active = getRequests().filter((r) =>
    !['completed', 'cancelled', 'disputed'].includes(r.status)
  );
  const showcase = getShowcase();

  return (
    <Screen pad={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20 }}>
          <Header />

          {/* Barra di ricerca artigiani con risultati live */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.sub} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={colors.sub}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.sub} />
              </Pressable>
            )}
          </View>
          {results.length > 0 && (
            <View style={styles.results}>
              {results.map((a) => (
                <Pressable key={a.id} style={styles.resultRow}
                  onPress={() => { setQuery(''); nav.navigate('ArtisanProfile', { artisanId: a.id }); }}>
                  <Avatar name={a.name} color={a.color} size={40} />
                  <View style={{ flex: 1, marginStart: 10 }}>
                    <Text style={g.body} numberOfLines={1}>{a.name}</Text>
                    <Text style={g.small}>{t(`categories.${a.categoryId}`)} · {a.city} {a.zone}</Text>
                  </View>
                  <View style={[g.row, { gap: 3 }]}>
                    <Ionicons name="star" size={13} color="#FF9500" />
                    <Text style={g.small}>{a.rating}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Box "Pubblica un lavoro" */}
          <Pressable style={styles.publishBox} onPress={() => nav.navigate('CreateRequest')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.publishTitle}>{t('home.publishTitle')}</Text>
              <Text style={styles.publishSub}>{t('home.publishSub')}</Text>
              <View style={styles.publishCta}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('home.publishCta')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </View>
            <View style={styles.publishIcon}>
              <Ionicons name="hammer" size={40} color="#fff" />
            </View>
          </Pressable>

          {/* Griglia categorie: tap → wizard step 2 con categoria precompilata */}
          <Text style={[g.h2, { marginTop: 24, marginBottom: 14 }]}>{t('home.categories')}</Text>
          <CategoryGrid onSelect={(categoryId) => nav.navigate('CreateRequest', { categoryId })} />

          {/* Lavori attivi */}
          <Text style={[g.h2, { marginTop: 8, marginBottom: 12 }]}>{t('home.activeJobs')}</Text>
        </View>

        {active.length === 0 ? (
          <EmptyState icon="briefcase-outline" title={t('home.noActive')} subtitle={t('home.noActiveSub')} />
        ) : (
          <FlatList
            data={active}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <RequestCard request={item} onPress={() => nav.navigate('RequestDetail', { requestId: item.id })} />
            )}
          />
        )}

        {/* Prima/Dopo */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 12, paddingHorizontal: 20 }]}>{t('home.beforeAfter')}</Text>
        <FlatList
          data={showcase}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <Pressable style={styles.baCard} onPress={() => nav.navigate('ArtisanProfile', { artisanId: item.artisanId })}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: item.before }} style={styles.baImg} />
                <Image source={{ uri: item.after }} style={styles.baImg} />
              </View>
              <View style={{ padding: 12 }}>
                <Text style={[g.body, { fontWeight: '600' }]} numberOfLines={1}>{item.title}</Text>
                <Text style={g.small}>{item.artisan}</Text>
              </View>
            </Pressable>
          )}
        />
      </ScrollView>
      <FAB onPress={() => nav.navigate('CreateRequest')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Campo di ricerca: pastiglia bianca morbida con ombra tenue
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderRadius: radius.full, paddingHorizontal: 18, height: 54, marginTop: 4, ...shadow
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, letterSpacing: -0.2 },
  results: { backgroundColor: colors.card, borderRadius: radius.lg, marginTop: 8, ...shadow },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  publishBox: {
    flexDirection: 'row', backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: 22, marginTop: 18, alignItems: 'center', ...shadowStrong
  },
  publishTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  publishSub: { color: 'rgba(255,255,255,0.88)', fontSize: 13, marginTop: 4 },
  publishCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff',
    alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14
  },
  publishIcon: { marginStart: 10, opacity: 0.9 },
  baCard: {
    width: 280, backgroundColor: colors.card, borderRadius: radius.lg, marginEnd: 14,
    overflow: 'hidden', ...shadow, marginBottom: 8
  },
  baImg: { width: 140, height: 100 }
});
