import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store';
import { colors, g } from '../../theme';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const slides = [
    { icon: 'megaphone' as const, title: t('onboarding.s1t'), sub: t('onboarding.s1s') },
    { icon: 'documents' as const, title: t('onboarding.s2t'), sub: t('onboarding.s2s') },
    { icon: 'shield-checkmark' as const, title: t('onboarding.s3t'), sub: t('onboarding.s3s') }
  ];
  const last = index === slides.length - 1;

  // Navigate before updating state: Login/Register are registered
  // in the same navigator branch, so the transition is immediate
  // and free of race conditions when 'Onboarding' gets removed from the stack.
  const finish = (to: 'Register' | 'Login') => {
    nav.navigate(to);
    setOnboarded();
  };

  return (
    <Screen pad={false}>
      <View style={styles.skipRow}>
        {!last && (
          <Pressable onPress={() => listRef.current?.scrollToIndex({ index: slides.length - 1 })}>
            <Text style={styles.skip}>{t('common.skip')}</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index: i }) => (
          <View style={{ width, alignItems: 'center', paddingHorizontal: 36, justifyContent: 'center' }}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={64} color={colors.primary} />
            </View>
            <Text style={styles.stepNum}>{i + 1}/3</Text>
            <Text style={[g.title, { textAlign: 'center' }]}>{item.title}</Text>
            <Text style={[g.subtitle, { textAlign: 'center', marginTop: 10, lineHeight: 22 }]}>{item.sub}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={{ padding: 24, gap: 12 }}>
        {last ? (
          <>
            <Button title={t('onboarding.register')} onPress={() => finish('Register')} />
            <Button title={t('onboarding.haveAccount')} variant="ghost" onPress={() => finish('Login')} />
          </>
        ) : (
          <Button
            title={t('common.next')}
            onPress={() => listRef.current?.scrollToIndex({ index: index + 1 })}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 8, height: 40 },
  skip: { color: colors.sub, fontSize: 15, fontWeight: '600' },
  iconWrap: {
    width: 140, height: 140, borderRadius: 46, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24
  },
  stepNum: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 }
});
