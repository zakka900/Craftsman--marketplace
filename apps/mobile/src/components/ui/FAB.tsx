import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStrong } from '../../theme';
import { hapticTap } from '../../utils/haptics';

/** Floating "+" button to create a new request. */
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
    position: 'absolute', bottom: 104, end: 20, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadowStrong
  }
});
