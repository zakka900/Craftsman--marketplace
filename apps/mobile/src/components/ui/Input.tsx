import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  isPassword?: boolean;
}

export default function Input({ label, error, isPassword, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!isPassword);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrap, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#A8A29E"
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color={colors.sub} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, marginStart: 4 },
  wrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16
  },
  input: { flex: 1, height: 54, fontSize: 16, color: colors.text, textAlign: 'auto' },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 }
});
