import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  pad?: boolean;
  style?: ViewStyle;
}

export default function Screen({ children, scroll, pad = true, style }: Props) {
  const inner = { flex: 1, paddingHorizontal: pad ? spacing(5) : 0, ...style } as ViewStyle;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: pad ? spacing(5) : 0, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={inner}>{children}</View>
      )}
    </SafeAreaView>
  );
}
