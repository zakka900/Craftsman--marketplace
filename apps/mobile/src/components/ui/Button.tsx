import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadowStrong } from '../../theme';
import { hapticTap } from '../../utils/haptics';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/**
 * Bottone di sistema: micro-animazione di scala al tocco (spring iOS)
 * + feedback aptico leggero. Altezza 52pt = target accessibile.
 */
export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: Props) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isFilled = isPrimary || isDanger;
  const bg = disabled ? '#C3CAD9' : isPrimary ? colors.primary : isDanger ? colors.danger : 'transparent';
  const fg = isFilled ? '#fff' : colors.primary;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { hapticTap(); onPress?.(); }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: bg, opacity: pressed && !isFilled ? 0.6 : 1 },
          isFilled && !disabled && shadowStrong,
          variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary },
          variant === 'ghost' && { backgroundColor: colors.primarySoft },
          style
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginEnd: 8 }} />}
            <Text style={{ color: fg, fontWeight: '700', fontSize: 17, letterSpacing: -0.2 }}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', paddingHorizontal: 22
  }
});
