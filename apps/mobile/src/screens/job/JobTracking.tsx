import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import Timeline from '../../components/domain/Timeline';
import Avatar from '../../components/ui/Avatar';
import { confirmCompletion, getArtisan, getRequest, openConversation } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius, shadow } from '../../theme';
import { timeAgo } from '../../utils/format';

/** Tracking lavoro: timeline stati + aggiornamenti foto in tempo reale. */
export default function JobTracking() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  useLive();

  const request = getRequest(params.requestId);
  if (!request) return null;
  const artisan = request.artisanId ? getArtisan(request.artisanId) : null;
  const jobDone = request.stage === 'completed';
  const confirmed = request.stage === 'client_confirmed';

  const confirm = async () => {
    await confirmCompletion(request.id);
    nav.replace('Review', { requestId: request.id });
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('job.title')}</Text>
        <Pressable hitSlop={10} onPress={async () => {
          if (!artisan) return;
          const conv = await openConversation(artisan.id, request.id);
          nav.navigate('ChatRoom', { conversationId: conv.id });
        }}>
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Artigiano */}
        {artisan && (
          <View style={[styles.card, g.row, { gap: 12 }]}>
            <Avatar name={artisan.name} color={artisan.color} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={g.h2}>{artisan.name}</Text>
              <Text style={g.small}>{t(`categories.${artisan.categoryId}`)}</Text>
            </View>
          </View>
        )}

        {/* Timeline verticale */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Timeline stage={request.stage} />
        </View>

        {/* Notifica completamento → conferma o disputa */}
        {jobDone && !confirmed && (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-done-circle" size={28} color={colors.success} />
            <Text style={[g.h2, { textAlign: 'center', marginTop: 6 }]}>{t('job.completedTitle')}</Text>
            <Button title={t('job.confirmJob')} onPress={confirm} icon="lock-open" style={{ marginTop: 14, alignSelf: 'stretch' }} />
            <Button title={t('job.openDispute')} variant="ghost" style={{ alignSelf: 'stretch', marginTop: 6 }}
              onPress={() => nav.navigate('Dispute', { requestId: request.id })} />
          </View>
        )}

        {/* Aggiornamenti dell'artigiano */}
        <Text style={[g.h2, { marginTop: 20, marginBottom: 10 }]}>{t('job.updates')}</Text>
        {[...request.jobUpdates].reverse().map((u) => (
          <View key={u.id} style={styles.update}>
            <Text style={g.body}>{u.text}</Text>
            {u.photos.map((p) => (
              <Image key={p} source={{ uri: p }} style={styles.updateImg} />
            ))}
            <Text style={[g.small, { marginTop: 6 }]}>{timeAgo(u.date)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* "Segnala problema" sempre visibile */}
      {!confirmed && request.status !== 'disputed' && (
        <Pressable style={styles.report} onPress={() => nav.navigate('Dispute', { requestId: request.id })}>
          <Ionicons name="flag" size={16} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 13 }}>{t('job.reportProblem')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  doneBox: {
    backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: 18,
    alignItems: 'center', marginTop: 16
  },
  update: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow },
  updateImg: { width: '100%', height: 160, borderRadius: radius.sm, marginTop: 10 },
  report: {
    position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: colors.dangerSoft, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10
  }
});
