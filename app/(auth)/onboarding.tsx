import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Dimensions, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';

const { width, height } = Dimensions.get('window');
const CLE_ONBOARDING = '@babirent_onboarding_vu';

// ── Données des 4 slides ──────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    accentColor: Colors.accent,
    fondColor:   '#0E1A2E',
    eyebrow:     'BIENVENUE SUR',
    titre:       'Babi Rent',
    sousTitre:   'La location facile en Côte d\'Ivoire',
    description: 'Voitures, logements, objets — tout ce dont tu as besoin, près de chez toi.',
    icone:       'home' as const,
    preview: {
      type: 'welcome',
    },
  },
  {
    id: '2',
    accentColor: Colors.accent,
    fondColor:   '#0F1B2D',
    eyebrow:     'SECTION VÉHICULES',
    titre:       'Loue une voiture',
    sousTitre:   'dès 10 000 FCFA/jour',
    description: 'Des centaines de véhicules disponibles. Berlines, SUV, pick-ups, avec ou sans chauffeur.',
    icone:       'car-sport' as const,
    preview: {
      type: 'vehicule',
      items: [
        { marque: 'Toyota', modele: 'Prado', prix: '45 000', icone: 'car-sport' as const },
        { marque: 'BMW', modele: 'X5', prix: '80 000', icone: 'car-sport' as const },
      ],
    },
  },
  {
    id: '3',
    accentColor: '#3B82F6',
    fondColor:   '#0A1220',
    eyebrow:     'SECTION LOGEMENTS',
    titre:       'Trouve ton chez-toi',
    sousTitre:   'pour une nuit ou plus',
    description: 'Appartements, villas, studios. Courts et longs séjours, partout en Côte d\'Ivoire.',
    icone:       'home-outline' as const,
    preview: {
      type: 'logement',
      items: [
        { titre: 'Villa avec piscine', ville: 'Abidjan', prix: '120 000', icone: 'home' as const },
        { titre: 'Studio meublé', ville: 'Bouaké', prix: '30 000', icone: 'bed-outline' as const },
      ],
    },
  },
  {
    id: '4',
    accentColor: Colors.success,
    fondColor:   '#0A1F18',
    eyebrow:     'BABI MARCHÉ',
    titre:       'Achète, vends',
    sousTitre:   'ou loue des objets',
    description: 'Électronique, meubles, vêtements, outils… une vraie marketplace locale entre particuliers.',
    icone:       'storefront' as const,
    preview: {
      type: 'marche',
      items: [
        { titre: 'iPhone 13 Pro', prix: '350 000', badge: 'Vente', icone: 'phone-portrait-outline' as const },
        { titre: 'Canapé 3 places', prix: '85 000', badge: 'Vente', icone: 'bed-outline' as const },
      ],
    },
  },
];

// ── Mini-preview d'une carte ──────────────────────────────────────────────────
function PreviewCarteVehicule({ item, accent }: { item: any; accent: string }) {
  return (
    <View style={[prev.carte, { borderColor: accent + '30' }]}>
      <View style={[prev.carteIcone, { backgroundColor: accent + '20' }]}>
        <Ionicons name={item.icone} size={22} color={accent} />
      </View>
      <View style={prev.carteInfo}>
        <Text style={prev.carteTitre}>{item.marque} {item.modele}</Text>
        <Text style={[prev.cartePrix, { color: accent }]}>{item.prix} FCFA<Text style={prev.parJour}>/j</Text></Text>
      </View>
      <View style={[prev.carteEtoile, { backgroundColor: accent + '20' }]}>
        <Ionicons name="star" size={12} color={accent} />
        <Text style={[prev.etoileTxt, { color: accent }]}>4.8</Text>
      </View>
    </View>
  );
}

function PreviewCarteLogement({ item, accent }: { item: any; accent: string }) {
  return (
    <View style={[prev.carte, { borderColor: accent + '30' }]}>
      <View style={[prev.carteIcone, { backgroundColor: accent + '20' }]}>
        <Ionicons name={item.icone} size={22} color={accent} />
      </View>
      <View style={prev.carteInfo}>
        <Text style={prev.carteTitre} numberOfLines={1}>{item.titre}</Text>
        <Text style={prev.carteSous}>{item.ville}</Text>
        <Text style={[prev.cartePrix, { color: accent }]}>{item.prix} FCFA<Text style={prev.parJour}>/j</Text></Text>
      </View>
    </View>
  );
}

function PreviewCarteMarche({ item, accent }: { item: any; accent: string }) {
  return (
    <View style={[prev.carte, { borderColor: accent + '30' }]}>
      <View style={[prev.carteIcone, { backgroundColor: accent + '20' }]}>
        <Ionicons name={item.icone} size={22} color={accent} />
      </View>
      <View style={prev.carteInfo}>
        <Text style={prev.carteTitre} numberOfLines={1}>{item.titre}</Text>
        <View style={[prev.badge, { backgroundColor: accent + '20' }]}>
          <Text style={[prev.badgeTxt, { color: accent }]}>{item.badge}</Text>
        </View>
      </View>
      <Text style={[prev.cartePrix, { color: accent }]}>{item.prix}</Text>
    </View>
  );
}

function WelcomePreview({ accent }: { accent: string }) {
  return (
    <View style={prev.welcomeBox}>
      {[
        { icone: 'car-sport' as const,  label: 'Véhicules', couleur: Colors.accent },
        { icone: 'home' as const,        label: 'Logements', couleur: '#3B82F6' },
        { icone: 'storefront' as const,  label: 'Marché',    couleur: Colors.success },
      ].map(s => (
        <View key={s.label} style={[prev.welcomeItem, { backgroundColor: s.couleur + '15', borderColor: s.couleur + '30' }]}>
          <View style={[prev.welcomeIcone, { backgroundColor: s.couleur + '25' }]}>
            <Ionicons name={s.icone} size={24} color={s.couleur} />
          </View>
          <Text style={[prev.welcomeLabel, { color: s.couleur }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const prev = StyleSheet.create({
  carte: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    padding: 12, marginBottom: 10, borderWidth: 1,
  },
  carteIcone: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  carteInfo:  { flex: 1 },
  carteTitre: { fontSize: 13, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  carteSous:  { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  cartePrix:  { fontSize: 13, fontWeight: '900' },
  parJour:    { fontSize: 10, fontWeight: '400', color: Colors.textSecondary },
  carteEtoile:{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  etoileTxt:  { fontSize: 11, fontWeight: '700' },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50, marginTop: 3 },
  badgeTxt:   { fontSize: 10, fontWeight: '700' },

  welcomeBox:  { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  welcomeItem: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1,
  },
  welcomeIcone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  welcomeLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── Point de pagination ───────────────────────────────────────────────────────
function Point({ actif, couleur }: { actif: boolean; couleur: string }) {
  return (
    <View style={[
      pointS.base,
      actif ? { width: 24, backgroundColor: couleur } : { width: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
    ]} />
  );
}
const pointS = StyleSheet.create({ base: { height: 8, borderRadius: 4 } });

// ═══════════════════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [idx, setIdx]     = useState(0);

  const slide = SLIDES[idx];

  const terminer = async () => {
    try { await AsyncStorage.setItem(CLE_ONBOARDING, 'vu'); } catch {}
    router.replace('/(auth)/welcome');
  };

  const suivant = () => {
    if (idx < SLIDES.length - 1) {
      const n = idx + 1;
      flatListRef.current?.scrollToIndex({ index: n, animated: true });
      setIdx(n);
    } else {
      terminer();
    }
  };

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx && i >= 0 && i < SLIDES.length) setIdx(i);
  };

  const estDernier = idx === SLIDES.length - 1;

  return (
    <View style={[styles.page, { backgroundColor: slide.fondColor }]}>

      {/* Bouton Passer */}
      <Pressable style={styles.btnPasser} onPress={terminer}>
        <Text style={styles.btnPasserTxt}>Passer</Text>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flatlist}
        renderItem={({ item }) => (
          <View style={styles.slide}>

            {/* Eyebrow */}
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowLine, { backgroundColor: item.accentColor }]} />
              <Text style={[styles.eyebrow, { color: item.accentColor }]}>{item.eyebrow}</Text>
            </View>

            {/* Titre */}
            <Text style={styles.titre}>{item.titre}</Text>
            <Text style={[styles.sousTitre, { color: item.accentColor }]}>{item.sousTitre}</Text>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* Preview */}
            <View style={[styles.previewBox, { borderColor: item.accentColor + '25' }]}>
              <View style={[styles.previewHeader, { backgroundColor: item.accentColor + '12' }]}>
                <View style={[styles.previewDot, { backgroundColor: item.accentColor }]} />
                <Text style={[styles.previewHeaderTxt, { color: item.accentColor }]}>
                  {item.id === '1' ? 'Babi Rent — 3 sections' :
                   item.id === '2' ? 'Véhicules disponibles' :
                   item.id === '3' ? 'Logements disponibles' : 'Babi Marché'}
                </Text>
              </View>
              <View style={styles.previewContent}>
                {item.preview.type === 'welcome' && (
                  <WelcomePreview accent={item.accentColor} />
                )}
                {item.preview.type === 'vehicule' && item.preview.items?.map((it: any, i: number) => (
                  <PreviewCarteVehicule key={i} item={it} accent={item.accentColor} />
                ))}
                {item.preview.type === 'logement' && item.preview.items?.map((it: any, i: number) => (
                  <PreviewCarteLogement key={i} item={it} accent={item.accentColor} />
                ))}
                {item.preview.type === 'marche' && item.preview.items?.map((it: any, i: number) => (
                  <PreviewCarteMarche key={i} item={it} accent={item.accentColor} />
                ))}
              </View>
            </View>

          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Points */}
        <View style={styles.points}>
          {SLIDES.map((s, i) => (
            <Point key={s.id} actif={i === idx} couleur={slide.accentColor} />
          ))}
        </View>

        {/* Bouton principal */}
        <Pressable
          style={[styles.btnSuivant, { backgroundColor: slide.accentColor }]}
          onPress={suivant}
        >
          <Text style={styles.btnSuivantTxt}>
            {estDernier ? 'Commencer maintenant' : 'Suivant'}
          </Text>
          <Ionicons
            name={estDernier ? 'rocket-outline' : 'arrow-forward'}
            size={18}
            color={Colors.white}
          />
        </Pressable>

        {/* Lien connexion */}
        <Pressable style={styles.lienConnexion} onPress={terminer}>
          <Text style={styles.lienConnexionTxt}>J'ai déjà un compte →</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  page:     { flex: 1 },
  flatlist: { flex: 1 },

  btnPasser: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  btnPasserTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },

  slide: {
    width, paddingHorizontal: 26, paddingTop: 96, paddingBottom: 20,
    justifyContent: 'flex-start',
  },

  eyebrowRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrowLine: { width: 20, height: 2, borderRadius: 1 },
  eyebrow:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },

  titre:      { fontSize: 34, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, lineHeight: 40 },
  sousTitre:  { fontSize: 22, fontWeight: '700', fontStyle: 'italic', marginBottom: 12 },
  description:{ fontSize: 14, color: 'rgba(255,255,255,0.60)', lineHeight: 22, marginBottom: 24 },

  previewBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
    borderWidth: 1, overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  previewDot:      { width: 7, height: 7, borderRadius: 4 },
  previewHeaderTxt:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  previewContent:  { padding: 12 },

  footer: {
    paddingHorizontal: 26, paddingBottom: 44, alignItems: 'center', gap: 14,
  },
  points: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  btnSuivant: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, width: '100%', paddingVertical: 17, borderRadius: 16,
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  btnSuivantTxt: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 0.3 },

  lienConnexion:    { paddingVertical: 4 },
  lienConnexionTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '600' },
});
