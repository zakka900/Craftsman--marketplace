import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../theme';
import { hapticTap } from '../../utils/haptics';

/** Bottone flottante "+" per creare una nuova richiesta. */
export default function FAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={() => { hapticTap(); onPress(); }} accessibilityRole="button"
      style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}>
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 24, end: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow,
    shadowOpacity: 0.25, elevation: 6
  }
});
