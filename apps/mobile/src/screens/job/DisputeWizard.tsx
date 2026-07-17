import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Button from '../../components/ui/Button';
import { openDispute } from '../../services/api';
import { colors, g, radius } from '../../theme';

/** Wizard disputa: motivo → descrizione → prove foto. Preventivo e chat allegati in automatico. */
export default function DisputeWizard() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const reasons = t('dispute.reasons', { returnObjects: true }) as string[];

  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.7 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)]);
  };

  const submit = async () => {
    setLoading(true);
    await openDispute(params.requestId, reason!, description, photos);
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="shield-half" size={64} color={colors.primary} />
          <Text style={[g.h2, { textAlign: 'center', marginTop: 16 }]}>{t('dispute.sent')}</Text>
          <Button title={t('common.done')} style={{ alignSelf: 'stretch', marginTop: 24 }}
            onPress={() => nav.navigate('MainTabs', { screen: 'RequestsTab' })} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('dispute.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={[g.h2, { marginBottom: 10 }]}>{t('dispute.reason')}</Text>
        {reasons.map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} style={[styles.reason, reason === r && styles.reasonSel]}>
            <Ionicons name={reason === r ? 'radio-button-on' : 'radio-button-off'} size={20}
              color={reason === r ? colors.primary : colors.border} />
            <Text style={[g.body, { fontWeight: '600' }]}>{r}</Text>
          </Pressable>
        ))}

        <Text style={[g.h2, { marginTop: 16, marginBottom: 8 }]}>{t('dispute.describe')}</Text>
        <TextInput style={styles.textarea} multiline value={description} onChangeText={setDescription}
          placeholderTextColor="#A8A29E" placeholder={t('dispute.describe')} />

        <Text style={[g.h2, { marginTop: 16, marginBottom: 8 }]}>{t('dispute.evidence')}</Text>
        <Pressable style={styles.attach} onPress={pick}>
          <Ionicons name="camera" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('wizard.addPhotos')}</Text>
        </Pressable>
        {photos.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: radius.sm }} />
            ))}
          </View>
        )}

        <View style={styles.note}>
          <Ionicons name="information-circle" size={18} color={colors.info} />
          <Text style={[g.small, { flex: 1, color: colors.info }]}>{t('dispute.note')}</Text>
        </View>

        <Button title={t('dispute.submit')} variant="danger" onPress={submit} loading={loading}
          disabled={!reason || description.trim().length < 10} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 14, marginBottom: 8
  },
  reasonSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  textarea: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    minHeight: 100, padding: 14, fontSize: 15, color: colors.text, textAlignVertical: 'top'
  },
  attach: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 14
  },
  note: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.infoSoft,
    borderRadius: radius.md, padding: 12, marginTop: 16
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
