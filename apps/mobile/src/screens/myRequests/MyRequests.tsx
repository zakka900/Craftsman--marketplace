import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { JobRequest } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Header from '../../components/domain/Header';
import RequestCard from '../../components/domain/RequestCard';
import EmptyState from '../../components/feedback/EmptyState';
import FAB from '../../components/ui/FAB';
import { getRequests } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius } from '../../theme';

type TabKey = 'active' | 'completed' | 'cancelled' | 'disputed';
const TABS: TabKey[] = ['active', 'completed', 'cancelled', 'disputed'];

/** Le mie richieste: 4 tab (attive, completate, annullate, dispute) con stati vuoti. */
function belongsTo(r: JobRequest, tab: TabKey): boolean {
  if (tab === 'completed') return r.status === 'completed';
  if (tab === 'cancelled') return r.status === 'cancelled';
  if (tab === 'disputed') return r.status === 'disputed';
  return !['completed', 'cancelled', 'disputed'].includes(r.status);
}

export default function MyRequests() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  useLive();
  const [tab, setTab] = useState<TabKey>('active');

  const items = getRequests().filter((r) => belongsTo(r, tab));

  return (
    <Screen pad={false}>
      <Header />
      <Text style={[g.title, { paddingHorizontal: 20, marginTop: 4 }]}>{t('requests.title')}</Text>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabSel]}>
            <Text style={[styles.tabText, tab === k && styles.tabTextSel]}>{t(`requests.tabs.${k}`)}</Text>
          </Pressable>
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState icon="file-tray-outline" title={t('requests.empty')} subtitle={t('requests.emptySub')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {items.map((r) => (
            <RequestCard key={r.id} request={r} wide
              onPress={() => {
                // Le richieste in lavorazione aprono il tracking, le altre il dettaglio preventivi
                if (r.status === 'in_progress' || (r.status === 'completed' && r.stage)) {
                  nav.navigate('JobTracking', { requestId: r.id });
                } else {
                  nav.navigate('RequestDetail', { requestId: r.id });
                }
              }} />
          ))}
        </ScrollView>
      )}

      <FAB onPress={() => nav.navigate('CreateRequest', {})} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: 14, marginBottom: 6
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border
  },
  tabSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.sub },
  tabTextSel: { color: '#fff' }
});
