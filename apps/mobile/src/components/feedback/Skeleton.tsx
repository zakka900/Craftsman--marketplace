import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { radius } from '../../theme';

/** Skeleton loading con pulsazione (al posto di spinner generici). */
export default function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ backgroundColor: '#E5E5EA', borderRadius: radius.sm, height: 16, opacity }, style]}
    />
  );
}
