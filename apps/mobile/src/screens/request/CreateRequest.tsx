import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import { useDraftStore } from '../../store';
import Step1Category from './Step1Category';
import Step2Description from './Step2Description';
import Step3Details from './Step3Details';
import Step4Summary from './Step4Summary';
import { getArtisan } from '../../services/api';
import { colors, g } from '../../theme';

/**
 * Request creation wizard (4 steps, progress bar at the top).
 * - From Home with a category → starts at step 2 with the category pre-filled.
 * - From an artisan's profile → direct request (artisan's category, fixed recipient).
 * - "Edit" from the summary → goes back to the step without losing data (shared draft store).
 */
export default function CreateRequest() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { reset, draft } = useDraftStore();
  const [step, setStep] = useState(1);

  useEffect(() => {
    const artisan = params?.artisanId ? getArtisan(params.artisanId) : null;
    const categoryId = params?.categoryId || artisan?.categoryId;
    reset({ categoryId, directToArtisanId: params?.artisanId });
    setStep(categoryId && !artisan ? 1 : 1); // step 1 still shows the subcategory to choose
  }, []);

  const directArtisan = draft.directToArtisanId ? getArtisan(draft.directToArtisanId) : null;

  return (
    <Screen pad={false}>
      {/* Wizard header with progress */}
      <View style={styles.top}>
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : nav.goBack())} hitSlop={10}>
          <Ionicons name={step > 1 ? 'arrow-back' : 'close'} size={26} color={colors.text} />
        </Pressable>
        <Text style={[g.h2]}>{t('wizard.step', { n: step })}</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>
      {directArtisan && (
        <View style={styles.directBanner}>
          <Ionicons name="person-circle" size={16} color={colors.info} />
          <Text style={{ color: colors.info, fontSize: 12, fontWeight: '600' }}>
            {t('wizard.directTo', { name: directArtisan.name })}
          </Text>
        </View>
      )}

      {step === 1 && <Step1Category onNext={() => setStep(2)} />}
      {step === 2 && <Step2Description onNext={() => setStep(3)} />}
      {step === 3 && <Step3Details onNext={() => setStep(4)} />}
      {step === 4 && <Step4Summary onEdit={setStep} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12
  },
  progressTrack: { height: 4, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  directBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.infoSoft,
    marginHorizontal: 20, marginTop: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8
  }
});
