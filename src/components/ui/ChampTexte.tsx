import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../config/colors';

type Props = TextInputProps & {
  label: string;
  erreur?: string;
  iconeGauche?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  motDePasse?: boolean;
};

const ChampTexte = ({ label, erreur, iconeGauche, style, motDePasse = false, ...props }: Props) => {
  const [visible, setVisible] = useState(false);
  const [focus, setFocus] = useState(false);

  return (
    <View style={[styles.conteneur, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.champ, focus && styles.champFocus, erreur ? styles.champErreur : null]}>
        {iconeGauche && (
          <Ionicons
            name={iconeGauche}
            size={18}
            color={focus ? Colors.accent : Colors.gray400}
            style={styles.iconeGauche}
          />
        )}
        <TextInput
          style={styles.input}
          secureTextEntry={motDePasse && !visible}
          placeholderTextColor={Colors.gray400}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...props}
        />
        {motDePasse && (
          <Pressable onPress={() => setVisible(!visible)} style={styles.iconeDroite}>
            <Ionicons
              name={visible ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.gray400}
            />
          </Pressable>
        )}
      </View>
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  champFocus: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(232,119,34,0.08)',
  },
  champErreur: { borderColor: Colors.error },
  iconeGauche: { marginRight: 10 },
  iconeDroite: { padding: 4 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  erreur: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 4 },
});

export default ChampTexte;
