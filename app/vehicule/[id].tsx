// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Détail Véhicule
// ──────────────────────────────────────────────────────────────────────────────
// Écran complet d'une annonce véhicule :
//   • Galerie photos swipeable avec indicateurs
//   • Infos : marque, modèle, année, note, ville
//   • Prix/jour + caution
//   • Caractéristiques (transmission, carburant, places...)
//   • Description
//   • Profil du propriétaire + bouton contacter
//   • Barre fixe en bas : prix + bouton Réserver
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Dimensions, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { getVehicule } from '../../src/services/vehicule.service';
import { getProfilUtilisateur } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Vehicule, Utilisateur } from '../../src/types';
import { formatPrix, formatNote } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

// ── Ligne caractéristique ──────────────────────────────────────────────────
function LigneCarac({
  icone, label, valeur,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  valeur: string;
}) {
  return (
    <View style={carac.ligne}>
      <View style={carac.iconeZone}>
        <Ionicons name={icone} size={18} color={Colors.accent} />
      </View>
      <Text style={carac.label}>{label}</Text>
      <Text style={carac.valeur}>{valeur}</Text>
    </View>
  );
}
const carac = StyleSheet.create({
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconeZone: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(232,119,34,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  valeur: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function DetailVehiculeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [vehicule, setVehicule]         = useState<Vehicule | null>(null);
  const [proprietaire, setProprietaire] = useState<Utilisateur | null>(null);
  const [chargement, setChargement]     = useState(true);
  const [photoIndex, setPhotoIndex]     = useState(0);
  const [descEtendue, setDescEtendue]   = useState(false);

  // ── Chargement depuis Firestore ──────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getVehicule(id)
      .then(v => { setVehicule(v); return v; })
      .then(v => getProfilUtilisateur(v.proprietaireId))
      .then(setProprietaire)
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [id]);

  // ── Chargement ───────────────────────────────────────────────────────────
  if (chargement) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!vehicule) {
    return (
      <View style={styles.loader}>
        <Ionicons name="car-outline" size={48} color={Colors.textLight} />
        <Text style={styles.loaderTxt}>Véhicule introuvable</Text>
        <Pressable onPress={() => router.back()} style={styles.btnRetourErreur}>
          <Text style={styles.btnRetourErreurTxt}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const isProprietaire = utilisateur?.id === vehicule.proprietaireId;

  // ── Actions ──────────────────────────────────────────────────────────────
  const reserver = () => {
    if (!utilisateur) {
      Alert.alert('Connexion requise', 'Connecte-toi pour réserver.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/welcome') },
      ]);
      return;
    }
    router.push(`/reservation/${vehicule.id}?type=vehicule` as any);
  };

  const contacter = () => {
    if (!utilisateur) {
      Alert.alert('Connexion requise', 'Connecte-toi pour envoyer un message.');
      return;
    }
    router.push('/(tabs)/chat');
  };

  // Description courte / longue
  const DESC_MAX = 140;
  const descLongue = (vehicule.description || '').length > DESC_MAX;
  const descAffichee = descLongue && !descEtendue
    ? vehicule.description.slice(0, DESC_MAX) + '…'
    : vehicule.description || 'Aucune description fournie.';

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ══ GALERIE PHOTOS ══ */}
        <View style={styles.galerieConteneur}>
          <FlatList
            data={vehicule.photos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            )}
          />

          {/* Bouton retour flottant */}
          <Pressable style={styles.btnRetour} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </Pressable>

          {/* Compteur photos */}
          <View style={styles.compteurPhotos}>
            <Ionicons name="camera-outline" size={13} color={Colors.white} />
            <Text style={styles.compteurTxt}>
              {photoIndex + 1}/{vehicule.photos.length}
            </Text>
          </View>

          {/* Indicateurs points */}
          {vehicule.photos.length > 1 && (
            <View style={styles.points}>
              {vehicule.photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.point, i === photoIndex && styles.pointActif]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ══ CONTENU ══ */}
        <View style={styles.contenu}>

          {/* ── En-tête : titre + disponibilité ── */}
          <View style={styles.enteteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>
                {vehicule.marque} {vehicule.modele}
              </Text>
              <Text style={styles.soustitre}>{vehicule.annee} · {vehicule.type}</Text>
            </View>
            <View style={[
              styles.badge,
              vehicule.disponible ? styles.badgeVert : styles.badgeRouge,
            ]}>
              <View style={[
                styles.badgeDot,
                { backgroundColor: vehicule.disponible ? Colors.success : Colors.error },
              ]} />
              <Text style={[
                styles.badgeTxt,
                { color: vehicule.disponible ? Colors.success : Colors.error },
              ]}>
                {vehicule.disponible ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
          </View>

          {/* ── Note + localisation ── */}
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.note}>{formatNote(vehicule.note)}</Text>
            <Text style={styles.nbAvis}>({vehicule.nombreAvis} avis)</Text>
            <View style={styles.separateur} />
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.ville}>{vehicule.ville}</Text>
          </View>

          {/* ── Prix ── */}
          <View style={styles.prixZone}>
            <View style={styles.cartePrix}>
              <Text style={styles.prixLabel}>Prix / jour</Text>
              <Text style={styles.prixValeur}>{formatPrix(vehicule.prixJour)}</Text>
            </View>
            {vehicule.caution > 0 && (
              <View style={[styles.cartePrix, styles.carteCaution]}>
                <Text style={[styles.prixLabel, { color: '#FBBF24' }]}>Caution</Text>
                <Text style={[styles.prixValeur, { color: '#FBBF24' }]}>
                  {formatPrix(vehicule.caution)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Caractéristiques ── */}
          <Text style={styles.sectionTitre}>Caractéristiques</Text>
          <View style={styles.section}>
            <LigneCarac icone="settings-outline"      label="Transmission"    valeur={vehicule.transmission} />
            <LigneCarac icone="flame-outline"          label="Carburant"       valeur={vehicule.carburant} />
            <LigneCarac icone="people-outline"         label="Nombre de places" valeur={`${vehicule.nombrePlaces} places`} />
            <LigneCarac icone="snow-outline"           label="Climatisation"   valeur={vehicule.climatisation ? 'Oui' : 'Non'} />
            <LigneCarac
              icone="person-outline"
              label="Avec chauffeur"
              valeur={vehicule.chauffeurDisponible ? 'Disponible' : 'Non inclus'}
            />
          </View>

          {/* ── Description ── */}
          <Text style={styles.sectionTitre}>Description</Text>
          <View style={styles.section}>
            <Text style={styles.descTxt}>{descAffichee}</Text>
            {descLongue && (
              <Pressable onPress={() => setDescEtendue(v => !v)}>
                <Text style={styles.voirPlus}>
                  {descEtendue ? 'Voir moins ↑' : 'Voir plus ↓'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Propriétaire ── */}
          <Text style={styles.sectionTitre}>Propriétaire</Text>
          <View style={[styles.section, styles.propRow]}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Ionicons name="person" size={26} color={Colors.accent} />
            </View>
            {/* Infos */}
            <View style={{ flex: 1 }}>
              <Text style={styles.propNom}>
                {proprietaire
                  ? `${proprietaire.prenom} ${proprietaire.nom}`
                  : 'Propriétaire'}
              </Text>
              <View style={styles.propMeta}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.propNote}>4.8</Text>
                <Text style={styles.propVille}>
                  · {proprietaire?.ville || vehicule.ville}
                </Text>
              </View>
            </View>
            {/* Bouton contacter */}
            {!isProprietaire && (
              <Pressable style={styles.btnContacter} onPress={contacter}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.accent} />
                <Text style={styles.btnContacterTxt}>Contacter</Text>
              </Pressable>
            )}
          </View>

        </View>
        {/* Espace pour la barre fixe */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══ BARRE FIXE BAS ══ */}
      {!isProprietaire && (
        <View style={styles.barre}>
          <View>
            <Text style={styles.barrePrix}>{formatPrix(vehicule.prixJour)}</Text>
            <Text style={styles.barreLabel}>par jour</Text>
          </View>
          <Pressable
            style={[styles.btnReserver, !vehicule.disponible && styles.btnReserverDesactive]}
            onPress={reserver}
            disabled={!vehicule.disponible}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
            <Text style={styles.btnReserverTxt}>
              {vehicule.disponible ? 'Réserver' : 'Indisponible'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },

  // ── Loader ──
  loader: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loaderTxt: { color: Colors.textSecondary, fontSize: 15 },
  btnRetourErreur: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnRetourErreurTxt: { color: Colors.white, fontWeight: '600' },

  // ── Galerie ──
  galerieConteneur: { height: 300, position: 'relative' },
  photo: { width, height: 300 },
  btnRetour: {
    position: 'absolute', top: 52, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  compteurPhotos: {
    position: 'absolute', top: 52, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  compteurTxt: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  points: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  pointActif: { width: 20, backgroundColor: Colors.white },

  // ── Contenu ──
  contenu: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -20, paddingHorizontal: 20, paddingTop: 24,
  },

  // En-tête
  enteteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  titre: { fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 2 },
  soustitre: { fontSize: 14, color: Colors.textSecondary },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
  },
  badgeVert: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeRouge: { backgroundColor: 'rgba(239,68,68,0.15)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },

  // Meta
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  note: { fontSize: 14, fontWeight: '800', color: Colors.white },
  nbAvis: { fontSize: 13, color: Colors.textSecondary },
  separateur: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  ville: { fontSize: 13, color: Colors.textSecondary },

  // Prix
  prixZone: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  cartePrix: {
    flex: 1, backgroundColor: 'rgba(232,119,34,0.12)',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(232,119,34,0.25)',
  },
  carteCaution: {
    backgroundColor: 'rgba(251,191,36,0.10)',
    borderColor: 'rgba(251,191,36,0.25)',
  },
  prixLabel: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginBottom: 4 },
  prixValeur: { fontSize: 17, fontWeight: '800', color: Colors.accent },

  // Sections
  sectionTitre: {
    fontSize: 16, fontWeight: '800', color: Colors.white,
    marginBottom: 10, marginTop: 4,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16, paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Description
  descTxt: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, paddingVertical: 14 },
  voirPlus: { color: Colors.accent, fontWeight: '700', fontSize: 13, paddingBottom: 14 },

  // Propriétaire
  propRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(232,119,34,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(232,119,34,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  propNom: { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 3 },
  propMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  propNote: { fontSize: 13, fontWeight: '700', color: '#FBBF24' },
  propVille: { fontSize: 13, color: Colors.textSecondary },
  btnContacter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(232,119,34,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,119,34,0.3)',
  },
  btnContacterTxt: { color: Colors.accent, fontSize: 13, fontWeight: '700' },

  // ── Barre fixe bas ──
  barre: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  barrePrix: { fontSize: 22, fontWeight: '900', color: Colors.white },
  barreLabel: { fontSize: 13, color: Colors.textSecondary },
  btnReserver: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnReserverDesactive: { backgroundColor: Colors.textLight },
  btnReserverTxt: { color: Colors.white, fontSize: 16, fontWeight: '800' },
});
