import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import Avatar from '../ui/Avatar';
import { colors, radius, shadow } from '../../theme';

/** Header ricorrente: avatar + "Ciao, [Nome]" a sinistra, campanella con badge a destra. */
export default function Header() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { user, unread, bankStatus } = useAuthStore();
  if (!user) return null;
  return (
    <View style={styles.row}>
      <Pressable style={styles.left} onPress={() => nav.navigate('MainTabs', { screen: 'ProfileTab' })}>
        <Avatar name={`${user.firstName} ${user.lastName}`} size={44} />
        <View style={{ marginStart: 10 }}>
          <Text style={styles.hello}>{t('home.hello', { name: user.firstName })}</Text>
          {bankStatus !== 'verified' && !user.bankVerified && (
            <Text style={styles.badge}>{t('bank.badgeUnverified')}</Text>
          )}
        </View>
      </Pressable>
      <Pressable onPress={() => nav.navigate('Notifications')} hitSlop={8} style={styles.bell}>
        <Ionicons name="notifications-outline" size={26} color={colors.text} />
        {unread > 0 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hello: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: 0.1 },
  badge: { fontSize: 11, color: colors.warning, fontWeight: '600' },
  bell: {
    width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow
  },
  counter: {
    position: 'absolute', top: 6, end: 6, backgroundColor: colors.danger, borderRadius: 9,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3
  },
  counterText: { color: '#fff', fontSize: 10, fontWeight: '700' }
});
