import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppNotification, NotificationType } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import EmptyState from '../../components/feedback/EmptyState';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius } from '../../theme';
import { timeAgo } from '../../utils/format';

// [icon, color, soft background] — semantic tokens, Dark Mode compatible
const ICON: Record<NotificationType, [string, string, string]> = {
  quote: ['pricetag', colors.primary, colors.primarySoft],
  info_request: ['help-circle', colors.info, colors.infoSoft],
  chat: ['chatbubble-ellipses', colors.success, colors.successSoft],
  job: ['hammer', colors.warning, colors.warningSoft],
  bank: ['shield-checkmark', colors.success, colors.successSoft],
  promo: ['gift', colors.primary, colors.primarySoft]
};

/** Notifiche: tap → segna letta e naviga al contenuto collegato. */
export default function Notifications() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  useLive();

  const items = getNotifications();

  const open = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.conversationId) {
      nav.navigate('ChatRoom', { conversationId: n.conversationId });
    } else if (n.requestId) {
      nav.navigate('RequestDetail', { requestId: n.requestId });
    } else if (n.type === 'bank') {
      nav.navigate('BankVerification', { fromProfile: true });
    }
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('notifications.title')}</Text>
        <Pressable onPress={markAllNotificationsRead} hitSlop={10}>
          <Ionicons name="checkmark-done" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title={t('notifications.empty')}
          subtitle={t('notifications.emptySub')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {items.map((n) => {
            const [icon, color, soft] = ICON[n.type];
            return (
              <Pressable key={n.id} style={[styles.item, !n.read && styles.unread]} onPress={() => open(n)}>
                <View style={[styles.icon, { backgroundColor: soft }]}>
                  <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[g.body, { fontWeight: n.read ? '500' : '700' }]}>{n.title}</Text>
                  <Text style={g.small} numberOfLines={2}>{n.body}</Text>
                  <Text style={[g.small, { marginTop: 4, fontSize: 11 }]}>{timeAgo(n.date)}</Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 14, marginBottom: 10
  },
  unread: { borderWidth: 1.5, borderColor: colors.primarySoft, backgroundColor: colors.infoSoft },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }
});
