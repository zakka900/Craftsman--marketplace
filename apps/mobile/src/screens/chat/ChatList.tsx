import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Header from '../../components/domain/Header';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/feedback/EmptyState';
import { getArtisan, getConversations } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g } from '../../theme';
import { timeAgo } from '../../utils/format';

/** Lista conversazioni con badge non letti e anteprima ultimo messaggio. */
export default function ChatList() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  useLive();

  const convs = getConversations();

  return (
    <Screen pad={false}>
      <Header />
      <Text style={[g.title, { paddingHorizontal: 20, marginTop: 4, marginBottom: 10 }]}>{t('chat.title')}</Text>

      {convs.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title={t('chat.empty')} subtitle={t('chat.emptySub')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {convs.map((c) => {
            const a = getArtisan(c.artisanId);
            if (!a) return null;
            return (
              <Pressable key={c.id} style={styles.row}
                onPress={() => nav.navigate('ChatRoom', { conversationId: c.id })}>
                <Avatar name={a.name} color={a.color} size={52} />
                <View style={{ flex: 1 }}>
                  <View style={[g.row, { justifyContent: 'space-between' }]}>
                    <Text style={[g.h2, { fontSize: 16 }]} numberOfLines={1}>{a.name}</Text>
                    <Text style={g.small}>{timeAgo(c.lastDate)}</Text>
                  </View>
                  <View style={[g.row, { justifyContent: 'space-between', marginTop: 2 }]}>
                    <Text style={[
                      g.small,
                      c.unread > 0 && { color: colors.text, fontWeight: '600' },
                      c.artisanTyping && { color: colors.primary, fontWeight: '600' }
                    ]} numberOfLines={1}>
                      {c.artisanTyping ? t('chat.typing') : c.lastMessage}
                    </Text>
                    {c.unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{c.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginStart: 8
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' }
});
