import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../config/colors';

type TypeBadge = 'succes' | 'erreur' | 'avertissement' | 'info' | 'neutre' | 'violet';

type Props = {
  texte: string;
  type?: TypeBadge;
  petit?: boolean;
};

const Badge = ({ texte, type = 'neutre', petit = false }: Props) => {
  const styleConteneur = [
    styles.base,
    petit && styles.petit,
    type === 'succes' && styles.succes,
    type === 'erreur' && styles.erreur,
    type === 'avertissement' && styles.avertissement,
    type === 'info' && styles.info,
    type === 'violet' && styles.violet,
    type === 'neutre' && styles.neutre,
  ];

  const styleTexte = [
    styles.texte,
    petit && styles.textePetit,
    type === 'succes' && styles.texteSucces,
    type === 'erreur' && styles.texteErreur,
    type === 'avertissement' && styles.texteAvertissement,
    type === 'info' && styles.texteInfo,
    type === 'violet' && styles.texteViolet,
    type === 'neutre' && styles.texteNeutre,
  ];

  return (
    <View style={styleConteneur}>
      <Text style={styleTexte}>{texte}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  petit: { paddingHorizontal: 8, paddingVertical: 3 },
  succes: { backgroundColor: Colors.successLight },
  erreur: { backgroundColor: Colors.errorLight },
  avertissement: { backgroundColor: Colors.warningLight },
  info: { backgroundColor: Colors.infoLight },
  violet: { backgroundColor: Colors.primaryLight },
  neutre: { backgroundColor: Colors.gray100 },
  texte: { fontSize: 13, fontWeight: '600' },
  textePetit: { fontSize: 11 },
  texteSucces: { color: Colors.success },
  texteErreur: { color: Colors.error },
  texteAvertissement: { color: Colors.warning },
  texteInfo: { color: Colors.info },
  texteViolet: { color: Colors.primary },
  texteNeutre: { color: Colors.gray600 },
});

export default Badge;
