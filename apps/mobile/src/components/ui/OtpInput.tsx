import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OTP_LENGTH } from '@artisan/shared';
import { colors, radius } from '../../theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}

/** Campo OTP a caselle singole (input nascosto + rendering box). */
export default function OtpInput({ value, onChange, error }: Props) {
  const ref = useRef<TextInput>(null);
  const digits = value.padEnd(OTP_LENGTH).split('').slice(0, OTP_LENGTH);
  return (
    <Pressable onPress={() => ref.current?.focus()}>
      <View style={styles.row}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[
              styles.box,
              value.length === i && styles.active,
              error && { borderColor: colors.danger }
            ]}
          >
            <Text style={styles.digit}>{d.trim()}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        style={styles.hidden}
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 48, height: 58, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center'
  },
  active: { borderColor: colors.primary },
  digit: { fontSize: 24, fontWeight: '700', color: colors.text },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 }
});
