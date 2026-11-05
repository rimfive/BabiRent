import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { ROBOTO } from '../../config/typographie';

/**
 * Composant Text avec Roboto automatique.
 * Mappe fontWeight → fontFamily Roboto correct.
 * Utilise-le à la place de <Text> de react-native.
 */
export function Texte({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const poids = String(flat.fontWeight ?? '400');
  const fontFamily = ROBOTO[poids] ?? 'Roboto_400Regular';
  return <Text style={[{ fontFamily }, style]} {...props} />;
}

export default Texte;
