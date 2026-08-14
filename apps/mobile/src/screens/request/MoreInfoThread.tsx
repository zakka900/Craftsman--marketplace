import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { getArtisan, getInfoRequest, replyInfoRequest } from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius, shadow } from '../../theme';

/**
 * "Request more information" thread: the customer sees the artisan's question
 * and replies with text/photos without restarting the request. Saved to history.
 */
export default function MoreInfoThread() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  useLive();

  const info = getInfoRequest(params.infoId);
  const artisan = info ? getArtisan(info.artisanId) : null;
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  if (!info || !artisan) return null;

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.7 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)]);
  };

  const send = async () => {
    setLoading(true);
    await replyInfoRequest(info.id, text, photos);
    setLoading(false);
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('moreInfo.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Artisan's question */}
        <View style={styles.question}>
          <View style={[g.row, { gap: 10 }]}>
            <Avatar name={artisan.name} color={artisan.color} size={40} />
            <Text style={[g.h2, { flex: 1 }]}>{t('moreInfo.asks', { name: artisan.name })}</Text>
          </View>
          <Text style={[g.body, { marginTop: 10 }]}>{info.message}</Text>
          {info.photoHints.length > 0 && (
            <>
              <Text style={[g.small, { marginTop: 10, fontWeight: '700' }]}>{t('moreInfo.photoWanted')}</Text>
              {info.photoHints.map((h) => (
                <View key={h} style={[g.row, { gap: 6, marginTop: 4 }]}>
                  <Ionicons name="camera-outline" size={15} color={colors.sub} />
                  <Text style={g.small}>{h}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Customer's reply */}
        {info.reply ? (
          <View style={styles.reply}>
            <View style={[g.row, { gap: 6 }]}>
              <Ionicons name="checkmark-done" size={16} color={colors.success} />
              <Text style={[g.small, { color: colors.success, fontWeight: '700' }]}>{t('moreInfo.replied')}</Text>
            </View>
            <Text style={[g.body, { marginTop: 8 }]}>{info.reply.text}</Text>
            {info.reply.photos.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {info.reply.photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: radius.sm }} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            <TextInput
              style={styles.textarea}
              multiline
              placeholder={t('moreInfo.replyPlaceholder')}
              placeholderTextColor="#A8A29E"
              value={text}
              onChangeText={setText}
            />
            <Pressable style={styles.attach} onPress={pick}>
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('moreInfo.attachPhotos')}</Text>
            </Pressable>
            {photos.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: radius.sm }} />
                ))}
              </View>
            )}
            <Button title={t('moreInfo.reply')} onPress={send} loading={loading}
              disabled={text.trim().length < 3 && photos.length === 0} style={{ marginTop: 16 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  question: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  reply: { backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: 16, marginTop: 16 },
  textarea: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    minHeight: 110, padding: 14, fontSize: 15, color: colors.text, textAlignVertical: 'top', marginTop: 16
  },
  attach: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }
});
