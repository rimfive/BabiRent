// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Splash Screen
// ──────────────────────────────────────────────────────────────────────────────
// Premier écran affiché au lancement.
// Durée : 2 secondes avec animation du logo.
// Vérifie ensuite :
//   1. L'utilisateur est déjà connecté → redirige vers /(tabs)
//   2. C'est sa première visite → redirige vers onboarding
//   3. Sinon → redirige vers welcome (connexion/inscription)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { useAuthStore } from '../../src/store/useAuthStore';

const { width } = Dimensions.get('window');

// Clé AsyncStorage pour savoir si l'onboarding a été vu
const CLE_ONBOARDING = '@babirent_onboarding_vu';

export default function SplashScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  // ── Valeurs d'animation ──────────────────────────────────────────────────
  const opaciteLogo   = useRef(new Animated.Value(0)).current; // logo part invisible
  const echelleLogo   = useRef(new Animated.Value(0.6)).current; // logo part petit
  const opaciteTexte  = useRef(new Animated.Value(0)).current; // texte part invisible
  const opaciteSlogan = useRef(new Animated.Value(0)).current; // slogan part invisible
  const opacitePage   = useRef(new Animated.Value(1)).current; // pour le fondu de sortie

  useEffect(() => {
    // ── Séquence d'animation d'entrée ──────────────────────────────────────
    Animated.sequence([
      // 1. Logo apparaît avec zoom
      Animated.parallel([
        Animated.spring(echelleLogo, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
        Animated.timing(opaciteLogo, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 2. Texte "Babi Rent" apparaît
      Animated.timing(opaciteTexte, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Slogan apparaît
      Animated.timing(opaciteSlogan, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Après 2.5s → fondu de sortie puis redirection ───────────────────────
    const timer = setTimeout(async () => {
      // Fondu de sortie
      Animated.timing(opacitePage, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(async () => {
        // Redirection selon l'état
        try {
          if (utilisateur) {
            // Déjà connecté → directement sur les tabs
            router.replace('/(tabs)');
          } else {
            const onboardingVu = await AsyncStorage.getItem(CLE_ONBOARDING);
            if (onboardingVu === null) {
              // Première visite → onboarding
              router.replace('/(auth)/onboarding');
            } else {
              // Déjà vu l'onboarding → écran de connexion
              router.replace('/(auth)/welcome');
            }
          }
        } catch {
          router.replace('/(auth)/welcome');
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.page, { opacity: opacitePage }]}>

      {/* ── Cercles décoratifs en arrière-plan ── */}
      <View style={[styles.cercle, styles.cercleHautDroite]} />
      <View style={[styles.cercle, styles.cercleBasDroite]} />

      {/* ── Logo animé ── */}
      <View style={styles.centre}>

        {/* Icône maison dans cercle orange */}
        <Animated.View
          style={[
            styles.logoIcone,
            { opacity: opaciteLogo, transform: [{ scale: echelleLogo }] },
          ]}
        >
          <Ionicons name="home" size={48} color={Colors.white} />
        </Animated.View>

        {/* Texte "Babi Rent" */}
        <Animated.Text style={[styles.logoTexte, { opacity: opaciteTexte }]}>
          <Text style={styles.logoBabi}>Babi</Text>
          <Text style={styles.logoRent}> Rent</Text>
        </Animated.Text>

        {/* Slogan */}
        <Animated.Text style={[styles.slogan, { opacity: opaciteSlogan }]}>
          Location facile en Afrique
        </Animated.Text>
      </View>

      {/* ── Bas de page ── */}
      <View style={styles.bas}>
        <Text style={styles.version}>v1.0</Text>
        <Text style={styles.pays}>🇨🇮 Côte d'Ivoire</Text>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Page principale — fond dark navy
  page: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cercles décoratifs (effet subtil)
  cercle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(232,119,34,0.07)', // orange très transparent
  },
  cercleHautDroite: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
  },
  cercleBasDroite: {
    width: 200,
    height: 200,
    bottom: 60,
    left: -60,
    backgroundColor: 'rgba(27,53,112,0.5)',
  },

  // Zone centrale
  centre: {
    alignItems: 'center',
    gap: 12,
  },

  // Icône dans cercle orange
  logoIcone: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // Ombre orange
    shadowColor: Colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },

  // Texte du logo
  logoTexte: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoBabi: {
    color: Colors.white,
  },
  logoRent: {
    color: Colors.accent,
    fontStyle: 'italic',
  },

  // Slogan sous le logo
  slogan: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Bas de page
  bas: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    gap: 4,
  },
  version: {
    fontSize: 12,
    color: Colors.textLight,
  },
  pays: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
