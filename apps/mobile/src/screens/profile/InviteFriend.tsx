import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store';
import { colors, g, radius, shadow, spacing } from '../../theme';
import { hapticTap } from '../../utils/haptics';

/**
 * Invite code derived from the user id (deterministic, no referral table
 * on the backend side — referral tracking is out of scope for this version).
 */
function referralCode(userId: string) {
  return userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
}

export default function InviteFriend() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  if (!user) return null;

  const code = referralCode(user.id);

  const share = async () => {
    hapticTap();
    try {
      await Share.share({ message: t('invite.shareMessage', { code }) });
    } catch {}
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.referral')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ padding: 20, alignItems: 'center' }}>
        <View style={styles.iconWrap}>
          <Ionicons name="gift" size={34} color={colors.primary} />
        </View>
        <Text style={[g.title, { textAlign: 'center', marginTop: 8 }]}>{t('invite.title')}</Text>
        <Text style={[g.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 28 }]}>{t('invite.sub')}</Text>

        <View style={styles.codeCard}>
          <Text style={g.small}>{t('invite.yourCode')}</Text>
          <Text style={styles.code}>{code}</Text>
        </View>

        <Button title={t('invite.share')} icon="share-social" onPress={share} style={{ marginTop: 24, alignSelf: 'stretch' }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  iconWrap: {
    width: 76, height: 76, borderRadius: 26, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginTop: 20
  },
  codeCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(5),
    alignItems: 'center', alignSelf: 'stretch', ...shadow
  },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 6, color: colors.primary, marginTop: 6 }
});
