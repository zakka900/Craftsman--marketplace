import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import SuggestionChips from '../../components/domain/SuggestionChips';
import { aiAnalyzePhotos, aiAnalyzeText } from '../../services/api';
import { useDraftStore } from '../../store';
import { colors, g, radius } from '../../theme';

/** Step 2: description + AI text/photo assistant (non-blocking suggestions). */
export default function Step2Description({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const { draft, patch } = useDraftStore();
  const [textHints, setTextHints] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [photoHints, setPhotoHints] = useState<string[]>([]);
  const debounce = useRef<any>(null);

  // AI text analysis while the user types (1.2s debounce)
  useEffect(() => {
    clearTimeout(debounce.current);
    if (draft.description.trim().length < 3) { setTextHints([]); setAiLoading(false); return; }
    debounce.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const hints = await aiAnalyzeText(draft.categoryId || 'default', draft.description);
        setTextHints(hints);
      } finally {
        setAiLoading(false);
      }
    }, 1200);
    return () => clearTimeout(debounce.current);
  }, [draft.description]);

  // AI photo analysis after every upload
  useEffect(() => {
    if (!draft.photos.length) { setPhotoHints([]); return; }
    aiAnalyzePhotos(draft.categoryId || 'default', draft.photos).then((hints) =>
      setPhotoHints(hints.map((h) => (h === '__BLURRY__' ? t('ai.photoQuality') : h)))
    );
  }, [draft.photos.length]);

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7
    });
    if (!res.canceled) {
      patch({ photos: [...draft.photos, ...res.assets.map((a) => a.uri)] });
    }
  };

  const removePhoto = (uri: string) => patch({ photos: draft.photos.filter((p) => p !== uri) });
  const addHint = (hint: string) =>
    patch({ description: draft.description.trimEnd() + (draft.description ? '\n' : '') + `- ${hint}: ` });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={g.title}>{t('wizard.s2Title')}</Text>
        <TextInput
          style={styles.textarea}
          multiline
          placeholder={t('wizard.s2Placeholder')}
          placeholderTextColor="#A8A29E"
          value={draft.description}
          onChangeText={(description) => patch({ description })}
        />
        {aiLoading && (
          <View style={styles.aiLoadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[g.small, { color: colors.primary }]}>{t('wizard.aiAnalyzing')}</Text>
          </View>
        )}
        <SuggestionChips title={t('wizard.aiHints')} hints={textHints} onPick={addHint} />

        {/* Upload foto/video multiplo con anteprima a griglia */}
        <Pressable style={styles.upload} onPress={pickPhotos}>
          <Ionicons name="camera" size={22} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('wizard.addPhotos')}</Text>
        </Pressable>
        {draft.photos.length > 0 && (
          <View style={styles.photoGrid}>
            {draft.photos.map((uri) => (
              <View key={uri} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable style={styles.remove} onPress={() => removePhoto(uri)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <SuggestionChips title={t('wizard.photoHints')} hints={photoHints} tone="warning" />
      </ScrollView>
      <View style={{ padding: 20, backgroundColor: colors.bg }}>
        <Button title={t('common.continue')} onPress={onNext} disabled={draft.description.trim().length < 10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textarea: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    minHeight: 140, padding: 14, fontSize: 15, color: colors.text, textAlignVertical: 'top', marginTop: 16
  },
  upload: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radius.md,
    paddingVertical: 16, marginTop: 16
  },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  photoWrap: { position: 'relative' },
  photo: { width: 92, height: 92, borderRadius: radius.sm },
  remove: {
    position: 'absolute', top: -6, end: -6, backgroundColor: colors.danger, width: 22, height: 22,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center'
  }
});
