import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { JobStage } from '@artisan/shared';
import { colors } from '../../theme';

const STAGES: JobStage[] = ['confirmed', 'started', 'working', 'completed', 'client_confirmed'];

/** Timeline verticale del lavoro. */
export default function Timeline({ stage }: { stage?: JobStage }) {
  const { t } = useTranslation();
  const currentIdx = stage ? STAGES.indexOf(stage) : -1;
  return (
    <View>
      {STAGES.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <View key={s} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {i < STAGES.length - 1 && (
                <View style={[styles.line, i < currentIdx && { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={[
              styles.label,
              done && { color: colors.text, fontWeight: isCurrent ? '700' : '600' }
            ]}>
              {t(`job.stage_${s}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rail: { alignItems: 'center', width: 28 },
  dot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
  },
  line: { width: 2, height: 26, backgroundColor: colors.border },
  label: { fontSize: 14, color: colors.sub, marginStart: 10, marginTop: 2 }
});
