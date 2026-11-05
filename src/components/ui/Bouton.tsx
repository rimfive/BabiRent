import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '../../config/colors';

type Variante = 'principal' | 'secondaire' | 'contour' | 'fantome';

type Props = {
  titre: string;
  onPress: () => void;
  variante?: Variante;
  loading?: boolean;
  desactive?: boolean;
  style?: ViewStyle;
  icone?: React.ReactNode;
};

const Bouton = ({
  titre, onPress, variante = 'principal',
  loading = false, desactive = false, style, icone,
}: Props) => {
  const styleBouton = [
    styles.base,
    variante === 'principal' && styles.principal,
    variante === 'secondaire' && styles.secondaire,
    variante === 'contour' && styles.contour,
    variante === 'fantome' && styles.fantome,
    (desactive || loading) && styles.desactive,
    style,
  ];

  const styleTexte = [
    styles.texteBase,
    variante === 'contour' && styles.texteContour,
    variante === 'fantome' && styles.texteFantome,
  ];

  return (
    <Pressable style={styleBouton} onPress={onPress} disabled={desactive || loading}>
      {loading ? (
        <ActivityIndicator
          color={variante === 'contour' || variante === 'fantome' ? Colors.accent : Colors.white}
          size="small"
        />
      ) : (
        <>
          {icone}
          <Text style={styleTexte}>{titre}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  principal: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
  },
  secondaire: {
    backgroundColor: Colors.primaryMid,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  contour: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  fantome: { backgroundColor: 'transparent' },
  desactive: { opacity: 0.45 },
  texteBase: { color: Colors.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  texteContour: { color: Colors.accent },
  texteFantome: { color: Colors.accent },
});

export default Bouton;
