// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Onboarding Screen
// ──────────────────────────────────────────────────────────────────────────────
// Affiché UNIQUEMENT à la première ouverture de l'app.
// 3 slides défilables avec swipe ou bouton Suivant.
// À la fin → sauvegarde dans AsyncStorage + redirige vers welcome.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Dimensions, FlatList, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';

const { width, height } = Dimensions.get('window');

// Clé AsyncStorage — doit être la même que dans splash.tsx
const CLE_ONBOARDING = '@babirent_onboarding_vu';

// ── Données des 3 slides ──────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    icone: 'car-sport' as const,
    couleurIcone: Colors.accent,
    titre: 'Loue une voiture',
    sousTitre: 'en quelques clics',
    description:
      'Des centaines de véhicules disponibles près de chez toi. Berlines, SUV, pick-ups… à partir de 10 000 FCFA/jour.',
    couleurFond: '#0E1A2E',
    couleurCercle: 'rgba(232,119,34,0.15)',
  },
  {
    id: '2',
    icone: 'cash' as const,
    couleurIcone: '#10B981',
    titre: 'Gagne de l\'argent',
    sousTitre: 'avec tes biens',
    description:
      'Publie ton véhicule ou ton logement gratuitement. Reçois les paiements directement sur ton Orange Money, Wave ou MTN MoMo.',
    couleurFond: '#0A1F18',
    couleurCercle: 'rgba(16,185,129,0.15)',
  },
  {
    id: '3',
    icone: 'shield-checkmark' as const,
    couleurIcone: '#3B82F6',
    titre: '100% sécurisé',
    sousTitre: 'loue en confiance',
    description:
      'Paiements protégés, profils vérifiés, assistance 24h/24. Babi Rent garantit chaque transaction.',
    couleurFond: '#0A1220',
    couleurCercle: 'rgba(59,130,246,0.15)',
  },
];

// ── Composant point de pagination ─────────────────────────────────────────────
function Point({ actif, couleur }: { actif: boolean; couleur: string }) {
  return (
    <View
      style={[
        styles.point,
        actif
          ? { width: 24, backgroundColor: couleur }
          : { width: 8, backgroundColor: 'rgba(255,255,255,0.25)' },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [indexActuel, setIndexActuel] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slide = SLIDES[indexActuel];

  // ── Marque l'onboarding comme vu et redirige ─────────────────────────────
  const terminer = async () => {
    try {
      await AsyncStorage.setItem(CLE_ONBOARDING, 'vu');
    } catch {}
    router.replace('/(auth)/welcome');
  };

  // ── Passer au slide suivant ───────────────────────────────────────────────
  const suivant = () => {
    if (indexActuel < SLIDES.length - 1) {
      const prochain = indexActuel + 1;
      flatListRef.current?.scrollToIndex({ index: prochain, animated: true });
      setIndexActuel(prochain);
    } else {
      terminer();
    }
  };

  // ── Détecter le slide visible lors du scroll ──────────────────────────────
  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== indexActuel) setIndexActuel(index);
  };

  const estDernier = indexActuel === SLIDES.length - 1;

  return (
    <View style={[styles.page, { backgroundColor: slide.couleurFond }]}>

      {/* ── Bouton Passer (coin haut droit) ── */}
      <Pressable style={styles.btnPasser} onPress={terminer}>
        <Text style={styles.btnPasserTxt}>Passer</Text>
      </Pressable>

      {/* ── FlatList horizontale des slides ── */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>

            {/* Illustration : grand cercle avec icône */}
            <View style={[styles.illustrationZone, { backgroundColor: item.couleurCercle }]}>
              <View style={[styles.cercleExterne, { borderColor: item.couleurIcone + '30' }]}>
                <View style={[styles.cercleInterne, { backgroundColor: item.couleurIcone + '20' }]}>
                  <Ionicons name={item.icone} size={80} color={item.couleurIcone} />
                </View>
              </View>

              {/* Petits éléments décoratifs */}
              <View style={[styles.deco1, { backgroundColor: item.couleurIcone + '25' }]} />
              <View style={[styles.deco2, { backgroundColor: item.couleurIcone + '15' }]} />
            </View>

            {/* Texte du slide */}
            <View style={styles.texteZone}>
              <Text style={styles.titrePrincipal}>{item.titre}</Text>
              <Text style={[styles.titreSous, { color: item.couleurIcone }]}>{item.sousTitre}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>

          </View>
        )}
      />

      {/* ── Bas de page : points + bouton ── */}
      <View style={styles.bas}>

        {/* Points de pagination */}
        <View style={styles.points}>
          {SLIDES.map((s, i) => (
            <Point key={s.id} actif={i === indexActuel} couleur={slide.couleurIcone} />
          ))}
        </View>

        {/* Bouton Suivant / Commencer */}
        <Pressable
          style={[styles.btnSuivant, { backgroundColor: slide.couleurIcone }]}
          onPress={suivant}
        >
          <Text style={styles.btnSuivantTxt}>
            {estDernier ? 'Commencer' : 'Suivant'}
          </Text>
          <Ionicons
            name={estDernier ? 'rocket-outline' : 'arrow-forward'}
            size={18}
            color={Colors.white}
          />
        </Pressable>

        {/* Lien connexion pour ceux qui ont déjà un compte */}
        <Pressable style={styles.lienConnexion} onPress={terminer}>
          <Text style={styles.lienConnexionTxt}>
            J'ai déjà un compte →
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  // Bouton "Passer" en haut à droite
  btnPasser: {
    position: 'absolute',
    top: 54,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnPasserTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Chaque slide occupe toute la largeur
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Zone illustration (haut du slide)
  illustrationZone: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  cercleExterne: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cercleInterne: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Éléments décoratifs flottants
  deco1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  deco2: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    width: 28,
    height: 28,
    borderRadius: 8,
  },

  // Zone texte
  texteZone: {
    alignItems: 'center',
    gap: 8,
  },
  titrePrincipal: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titreSous: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 8,
  },

  // Bas de page
  bas: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 16,
  },

  // Points de pagination
  points: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  point: {
    height: 8,
    borderRadius: 4,
  },

  // Bouton Suivant / Commencer
  btnSuivant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 17,
    borderRadius: 16,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  btnSuivantTxt: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Lien "déjà un compte"
  lienConnexion: {
    paddingVertical: 8,
  },
  lienConnexionTxt: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});
