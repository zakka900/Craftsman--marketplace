import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { submitReview } from '../../services/api';
import { colors, g, radius } from '../../theme';

/** Recensione: stelle generali + sotto-valutazioni + testo + foto + "lo riassumeresti?". */
function Stars({ value, onChange, size = 34 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size}
            color={n <= value ? colors.warning : colors.border} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Review() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();

  const [rating, setRating] = useState(0);
  const [subs, setSubs] = useState({ quality: 0, punctuality: 0, cleanliness: 0, communication: 0 });
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.7 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)]);
  };

  const submit = async () => {
    setLoading(true);
    await submitReview(params.requestId, {
      rating, ...subs, text, photos, recommend: recommend === true
    });
    setLoading(false);
    setDone(true);
    setTimeout(() => nav.navigate('MainTabs', { screen: 'RequestsTab' }), 1400);
  };

  if (done) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="heart-circle" size={72} color={colors.primary} />
          <Text style={[g.h2, { marginTop: 14 }]}>{t('review.thanks')}</Text>
        </View>
      </Screen>
    );
  }

  const SUB_KEYS = ['quality', 'punctuality', 'cleanliness', 'communication'] as const;

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.navigate('MainTabs', { screen: 'RequestsTab' })} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('review.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Valutazione generale */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <Text style={[g.h2, { marginBottom: 12 }]}>{t('review.overall')}</Text>
          <Stars value={rating} onChange={setRating} />
        </View>

        {/* Sotto-valutazioni */}
        <View style={[styles.card, { marginTop: 14 }]}>
          {SUB_KEYS.map((k) => (
            <View key={k} style={[g.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
              <Text style={[g.body, { fontWeight: '600' }]}>{t(`review.${k}`)}</Text>
              <Stars value={subs[k]} onChange={(v) => setSubs((s) => ({ ...s, [k]: v }))} size={22} />
            </View>
          ))}
        </View>

        {/* Testo */}
        <Text style={[g.h2, { marginTop: 18, marginBottom: 8 }]}>{t('review.textPlaceholder')}</Text>
        <TextInput style={styles.textarea} multiline value={text} onChangeText={setText}
          placeholder={t('review.textPlaceholder')} placeholderTextColor="#A8A29E" />

        {/* Foto risultato */}
        <Pressable style={styles.attach} onPress={pick}>
          <Ionicons name="images" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('review.addPhotos')}</Text>
        </Pressable>
        {photos.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: radius.sm }} />
            ))}
          </View>
        )}

        {/* Lo riassumeresti? */}
        <Text style={[g.h2, { marginTop: 18, marginBottom: 8 }]}>{t('review.recommend')}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[true, false].map((v) => (
            <Pressable key={String(v)} onPress={() => setRecommend(v)}
              style={[styles.recBtn, recommend === v && styles.recSel]}>
              <Ionicons name={v ? 'thumbs-up' : 'thumbs-down'} size={20}
                color={recommend === v ? colors.primary : colors.sub} />
              <Text style={[g.body, { fontWeight: '700', color: recommend === v ? colors.primary : colors.sub }]}>
                {v ? t('common.yes') : t('common.no')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title={t('review.submit')} onPress={submit} loading={loading}
          disabled={rating === 0 || recommend === null} style={{ marginTop: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 },
  textarea: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    minHeight: 100, padding: 14, fontSize: 15, color: colors.text, textAlignVertical: 'top'
  },
  attach: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 14
  },
  recBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 14
  },
  recSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
