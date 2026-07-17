import React from 'react';
import { Image, Text, View } from 'react-native';
import { initials } from '../../utils/format';
import { radius } from '../../theme';

interface Props {
  name: string;
  uri?: string;
  size?: number;
  color?: string;
  round?: boolean;
}

/** Avatar: foto oppure iniziali su sfondo colorato. */
export default function Avatar({ name, uri, size = 44, color = '#007AFF', round = false }: Props) {
  const br = round ? size / 2 : radius.sm + size / 8;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: br }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: br, backgroundColor: color,
      alignItems: 'center', justifyContent: 'center'
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}
