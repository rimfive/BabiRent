// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — OTP Screen (Vérification SMS)
// ──────────────────────────────────────────────────────────────────────────────
// Reçoit en paramètre le numéro de téléphone.
// Affiche 6 cases pour saisir le code OTP reçu par SMS.
// Minuterie de 60s puis bouton "Renvoyer le code".
// ══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';

// ── Durée de la minuterie en secondes ────────────────────────────────────────
const DUREE_MINUTERIE = 60;

export default function OTPScreen() {
  const router = useRouter();
  // Récupère le numéro de téléphone passé en paramètre d'URL
  const { telephone } = useLocalSearchParams<{ telephone: string }>();

  // ── 6 cases OTP ─────────────────────────────────────────────────────────
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);

  // ── Minuterie ────────────────────────────────────────────────────────────
  const [secondes, setSecondes] = useState(DUREE_MINUTERIE);
  const [peutRenvoyer, setPeutRenvoyer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation de secousse en cas d'erreur
  const secoussAnim = useRef(new Animated.Value(0)).current;

  // ── Démarre la minuterie au montage ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondes(s => {
        if (s <= 1) {
          clearInterval(interval);
          setPeutRenvoyer(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Redémarre la minuterie ────────────────────────────────────────────────
  const renvoyerCode = () => {
    if (!peutRenvoyer) return;
    setSecondes(DUREE_MINUTERIE);
    setPeutRenvoyer(false);
    setCode(['', '', '', '', '', '']);
    refs.current[0]?.focus();

    // Ici on appellerait Firebase Phone Auth pour renvoyer le SMS
    Alert.alert('SMS envoyé', `Un nouveau code a été envoyé au ${telephone}`);

    // Relance la minuterie
    const interval = setInterval(() => {
      setSecondes(s => {
        if (s <= 1) { clearInterval(interval); setPeutRenvoyer(true); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  // ── Saisie dans une case ──────────────────────────────────────────────────
  const saisir = (valeur: string, index: number) => {
    // Accepte seulement les chiffres
    if (!/^\d*$/.test(valeur)) return;

    const nouveauCode = [...code];

    if (valeur.length > 1) {
      // Collage de tout le code d'un coup (ex: depuis les notifications)
      const chiffres = valeur.replace(/\D/g, '').split('').slice(0, 6);
      chiffres.forEach((c, i) => { nouveauCode[i] = c; });
      setCode(nouveauCode);
      refs.current[5]?.focus();
      if (chiffres.length === 6) verifier(chiffres.join(''));
      return;
    }

    nouveauCode[index] = valeur;
    setCode(nouveauCode);

    // Passe à la case suivante automatiquement
    if (valeur && index < 5) {
      refs.current[index + 1]?.focus();
    }

    // Si toutes les cases sont remplies → vérification auto
    if (nouveauCode.every(c => c !== '') && valeur) {
      verifier(nouveauCode.join(''));
    }
  };

  // ── Touche Retour → revient à la case précédente ─────────────────────────
  const surRetour = (index: number) => {
    if (!code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // ── Animation de secousse (erreur) ───────────────────────────────────────
  const secouer = () => {
    Animated.sequence([
      Animated.timing(secoussAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(secoussAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(secoussAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(secoussAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Vérification du code ──────────────────────────────────────────────────
  const verifier = async (codeComplet?: string) => {
    const codeAVerifier = codeComplet || code.join('');
    if (codeAVerifier.length < 6) {
      Alert.alert('Code incomplet', 'Entre les 6 chiffres du code SMS.');
      return;
    }

    setLoading(true);
    try {
      // TODO : utiliser confirmationResult.confirm(codeAVerifier)
      // depuis Firebase Phone Auth une fois le flux téléphone intégré.
      // Pour l'instant → simulation
      await new Promise(r => setTimeout(r, 1200));

      if (codeAVerifier === '123456') {
        // ✅ Code correct → redirige vers l'app
        router.replace('/(tabs)');
      } else {
        // ❌ Code incorrect
        secouer();
        setCode(['', '', '', '', '', '']);
        refs.current[0]?.focus();
        Alert.alert('Code incorrect', 'Vérifie le SMS et réessaie.');
      }
    } catch {
      secouer();
      Alert.alert('Erreur', 'Impossible de vérifier le code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Formatage du numéro affiché (masque le milieu) ───────────────────────
  const numeroMasque = telephone
    ? telephone.replace(/(\+?\d{3})\d+(\d{2})/, '$1 ••••• $2')
    : '••••••••••';

  // ── Format minuterie "0:59" ───────────────────────────────────────────────
  const minuterie = `0:${secondes.toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Bouton retour ── */}
      <Pressable style={styles.retour} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.white} />
      </Pressable>

      <View style={styles.conteneur}>

        {/* ── Icône SMS ── */}
        <View style={styles.iconeZone}>
          <Ionicons name="chatbubble-ellipses" size={36} color={Colors.accent} />
        </View>

        {/* ── Titre ── */}
        <Text style={styles.titre}>Vérification SMS</Text>
        <Text style={styles.sousTitre}>
          Code envoyé au{'\n'}
          <Text style={styles.numero}>{numeroMasque}</Text>
        </Text>

        {/* ── 6 cases OTP ── */}
        <Animated.View
          style={[styles.casesRow, { transform: [{ translateX: secoussAnim }] }]}
        >
          {code.map((chiffre, i) => (
            <TextInput
              key={i}
              ref={el => { refs.current[i] = el; }}
              style={[
                styles.case,
                chiffre ? styles.caseRemplie : null,
              ]}
              value={chiffre}
              onChangeText={val => saisir(val, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') surRetour(i);
              }}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              placeholderTextColor={Colors.textLight}
              caretHidden
            />
          ))}
        </Animated.View>

        {/* ── Minuterie / Renvoyer ── */}
        <View style={styles.minuterieZone}>
          {peutRenvoyer ? (
            <Pressable onPress={renvoyerCode}>
              <Text style={styles.btnRenvoyer}>Renvoyer le code</Text>
            </Pressable>
          ) : (
            <Text style={styles.minuterieTxt}>
              Renvoyer dans{' '}
              <Text style={styles.minuterieCompteur}>{minuterie}</Text>
            </Text>
          )}
        </View>

        {/* ── Bouton Confirmer ── */}
        <Pressable
          style={[
            styles.btnConfirmer,
            (loading || code.some(c => !c)) && styles.btnDesactive,
          ]}
          onPress={() => verifier()}
          disabled={loading || code.some(c => !c)}
        >
          {loading ? (
            <Text style={styles.btnConfirmerTxt}>Vérification...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.btnConfirmerTxt}>Confirmer</Text>
            </>
          )}
        </Pressable>

        {/* ── Aide ── */}
        <Text style={styles.aide}>
          Tu n'as pas reçu de SMS ? Vérifie que ton numéro est correct ou utilise la connexion par email.
        </Text>

      </View>
    </KeyboardAvoidingView>
  );
}

const CASE_SIZE = 52;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Bouton retour
  retour: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  // Icône ronde
  iconeZone: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(232,119,34,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,119,34,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  titre: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
  },
  sousTitre: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  numero: {
    color: Colors.accent,
    fontWeight: '700',
  },

  // Rangée des 6 cases
  casesRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
  },
  case: {
    width: CASE_SIZE,
    height: CASE_SIZE,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  caseRemplie: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(232,119,34,0.12)',
  },

  // Minuterie
  minuterieZone: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuterieTxt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  minuterieCompteur: {
    color: Colors.accent,
    fontWeight: '700',
  },
  btnRenvoyer: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Bouton confirmer
  btnConfirmer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    marginTop: 8,
    shadowColor: Colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  btnDesactive: {
    opacity: 0.4,
  },
  btnConfirmerTxt: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Texte d'aide
  aide: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 8,
  },
});
