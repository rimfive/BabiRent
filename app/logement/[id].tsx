// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Détail Logement
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Dimensions, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { getLogement } from '../../src/services/logement.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Logement } from '../../src/types';
import { formatPrix, formatNote } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

// ── Icônes par équipement ─────────────────────────────────────────────────────
const ICONES_EQUIPEMENTS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'WiFi':               'wifi-outline',
  'Climatisation':      'snow-outline',
  'Parking':            'car-outline',
  'Piscine':            'water-outline',
  'Cuisine':            'restaurant-outline',
  'TV':                 'tv-outline',
  'Sécurité':          'shield-checkmark-outline',
  'Eau chaude':         'thermometer-outline',
  'Groupe électrogène': 'flash-outline',
  'Terrasse':           'sunny-outline',
  'Jardin':             'leaf-outline',
  'Gardien':            'person-outline',
};

// ── Stat rapide ───────────────────────────────────────────────────────────────
function StatRapide({
  icone, valeur, label,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  valeur: string;
  label: string;
}) {
  return (
    <View style={stat.conteneur}>
      <View style={stat.iconeZone}>
        <Ionicons name={icone} size={22} color={Colors.accent} />
      </View>
      <Text style={stat.valeur}>{valeur}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}
const stat = StyleSheet.create({
  conteneur: { flex: 1, alignItems: 'center', gap: 5 },
  iconeZone: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(232,119,34,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,119,34,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  valeur: { fontSize: 17, fontWeight: '900', color: Colors.white },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function DetailLogementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [logement, setLogement]       = useState<Logement | null>(null);
  const [chargement, setChargement]   = useState(true);
  const [photoIndex, setPhotoIndex]   = useState(0);
  const [descEtendue, setDescEtendue] = useState(false);

  useEffect(() => {
    if (!id) return;
    getLogement(id)
      .then(setLogement)
      .catch(() => Alert.alert('Erreur', 'Logement introuvable.'))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!logement) {
    return (
      <View style={styles.loader}>
        <Ionicons name="home-outline" size={48} color={Colors.textLight} />
        <Text style={styles.loaderTxt}>Logement introuvable</Text>
        <Pressable onPress={() => router.back()} style={styles.btnRetourErreur}>
          <Text style={styles.btnRetourErreurTxt}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const isProprietaire = utilisateur?.id === logement.proprietaireId;

  const reserver = () => {
    if (!utilisateur) {
      Alert.alert('Connexion requise', 'Connecte-toi pour réserver.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/welcome') },
      ]);
      return;
    }
    router.push(`/reservation/${logement.id}?type=logement` as any);
  };

  const contacter = () => {
    if (!utilisateur) {
      Alert.alert('Connexion requise', 'Connecte-toi pour envoyer un message.');
      return;
    }
    router.push('/(tabs)/chat');
  };

  const DESC_MAX = 150;
  const descLongue = (logement.description || '').length > DESC_MAX;
  const descAffichee = descLongue && !descEtendue
    ? logement.description.slice(0, DESC_MAX) + '…'
    : logement.description || 'Aucune description fournie.';

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ══ GALERIE ══ */}
        <View style={styles.galerieConteneur}>
          <FlatList
            data={logement.photos}
            keyExtractor={(_, i) => String(i)}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            )}
          />
          <Pressable style={styles.btnRetour} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.compteurPhotos}>
            <Ionicons name="camera-outline" size={13} color={Colors.white} />
            <Text style={styles.compteurTxt}>{photoIndex + 1}/{logement.photos.length}</Text>
          </View>
          <View style={styles.badgeType}>
            <Ionicons name="home-outline" size={12} color={Colors.white} />
            <Text style={styles.badgeTypeTxt}>{logement.type}</Text>
          </View>
          {logement.photos.length > 1 && (
            <View style={styles.points}>
              {logement.photos.map((_, i) => (
                <View key={i} style={[styles.point, i === photoIndex && styles.pointActif]} />
              ))}
            </View>
          )}
        </View>

        {/* ══ CONTENU ══ */}
        <View style={styles.contenu}>

          {/* En-tête */}
          <View style={styles.enteteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{logement.titre}</Text>
              <Text style={styles.soustitre}>{logement.adresse}</Text>
            </View>
            <View style={[styles.badge, logement.disponible ? styles.badgeVert : styles.badgeRouge]}>
              <View style={[styles.badgeDot, { backgroundColor: logement.disponible ? Colors.success : Colors.error }]} />
              <Text style={[styles.badgeTxt, { color: logement.disponible ? Colors.success : Colors.error }]}>
                {logement.disponible ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.note}>{formatNote(logement.note)}</Text>
            <Text style={styles.nbAvis}>({logement.nombreAvis} avis)</Text>
            <View style={styles.separateur} />
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.ville}>{logement.ville}</Text>
            {logement.meuble && (
              <>
                <View style={styles.separateur} />
                <Text style={styles.meubleBadge}>Meublé</Text>
              </>
            )}
          </View>

          {/* Stats rapides */}
          <View style={styles.statsRow}>
            <StatRapide icone="bed-outline"    valeur={String(logement.nombreChambres)}     label="Chambres" />
            <View style={styles.statDivider} />
            <StatRapide icone="water-outline"  valeur={String(logement.nombreSDB)}          label="Salles de bain" />
            <View style={styles.statDivider} />
            <StatRapide icone="people-outline" valeur={String(logement.capacitePersonnes)}  label="Personnes" />
            <View style={styles.statDivider} />
            <StatRapide icone="expand-outline" valeur={`${logement.superficie}m²`}          label="Superficie" />
          </View>

          {/* Prix */}
          <View style={styles.prixZone}>
            <View style={styles.cartePrix}>
              <Text style={styles.prixLabel}>Prix / nuit</Text>
              <Text style={styles.prixValeur}>{formatPrix(logement.prixJour)}</Text>
            </View>
            {logement.prixMois && logement.prixMois > 0 ? (
              <View style={[styles.cartePrix, styles.carteMois]}>
                <Text style={[styles.prixLabel, { color: Colors.info }]}>Prix / mois</Text>
                <Text style={[styles.prixValeur, { color: Colors.info }]}>{formatPrix(logement.prixMois)}</Text>
              </View>
            ) : null}
            {logement.caution > 0 ? (
              <View style={[styles.cartePrix, styles.carteCaution]}>
                <Text style={[styles.prixLabel, { color: '#FBBF24' }]}>Caution</Text>
                <Text style={[styles.prixValeur, { color: '#FBBF24' }]}>{formatPrix(logement.caution)}</Text>
              </View>
            ) : null}
          </View>

          {/* Équipements */}
          {logement.equipements && logement.equipements.length > 0 && (
            <>
              <Text style={styles.sectionTitre}>Équipements</Text>
              <View style={styles.section}>
                <View style={styles.equipGrid}>
                  {logement.equipements.map((eq, i) => (
                    <View key={i} style={styles.equipPill}>
                      <Ionicons
                        name={ICONES_EQUIPEMENTS[eq] || 'checkmark-circle-outline'}
                        size={15} color={Colors.accent}
                      />
                      <Text style={styles.equipTxt}>{eq}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Description */}
          <Text style={styles.sectionTitre}>Description</Text>
          <View style={styles.section}>
            <Text style={styles.descTxt}>{descAffichee}</Text>
            {descLongue && (
              <Pressable onPress={() => setDescEtendue(v => !v)}>
                <Text style={styles.voirPlus}>{descEtendue ? 'Voir moins ↑' : 'Voir plus ↓'}</Text>
              </Pressable>
            )}
          </View>

          {/* Propriétaire */}
          <Text style={styles.sectionTitre}>Propriétaire</Text>
          <View style={[styles.section, styles.propRow]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={26} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.propNom}>
                {logement.proprietaire
                  ? `${logement.proprietaire.prenom} ${logement.proprietaire.nom}`
                  : 'Propriétaire'}
              </Text>
              <View style={styles.propMeta}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.propNote}>4.9</Text>
                <Text style={styles.propVille}>· {logement.proprietaire?.ville || logement.ville}</Text>
              </View>
            </View>
            {!isProprietaire && (
              <Pressable style={styles.btnContacter} onPress={contacter}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.accent} />
                <Text style={styles.btnContacterTxt}>Contacter</Text>
              </Pressable>
            )}
          </View>

        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══ BARRE FIXE BAS ══ */}
      {!isProprietaire && (
        <View style={styles.barre}>
          <View>
            <Text style={styles.barrePrix}>{formatPrix(logement.prixJour)}</Text>
            <Text style={styles.barreLabel}>par nuit</Text>
          </View>
          <Pressable
            style={[styles.btnReserver, !logement.disponible && styles.btnReserverDesactive]}
            onPress={reserver}
            disabled={!logement.disponible}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
            <Text style={styles.btnReserverTxt}>
              {logement.disponible ? 'Réserver' : 'Indisponible'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderTxt: { color: Colors.textSecondary, fontSize: 15 },
  btnRetourErreur: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border },
  btnRetourErreurTxt: { color: Colors.white, fontWeight: '600' },

  galerieConteneur: { height: 300, position: 'relative' },
  photo: { width, height: 300 },
  btnRetour: { position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  compteurPhotos: { position: 'absolute', top: 52, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  compteurTxt: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  badgeType: { position: 'absolute', bottom: 50, left: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeTypeTxt: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  points: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  pointActif: { width: 20, backgroundColor: Colors.white },

  contenu: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 24 },
  enteteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  titre: { fontSize: 21, fontWeight: '900', color: Colors.white, marginBottom: 3 },
  soustitre: { fontSize: 13, color: Colors.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  badgeVert: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeRouge: { backgroundColor: 'rgba(239,68,68,0.15)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  note: { fontSize: 14, fontWeight: '800', color: Colors.white },
  nbAvis: { fontSize: 13, color: Colors.textSecondary },
  separateur: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginHorizontal: 2 },
  ville: { fontSize: 13, color: Colors.textSecondary },
  meubleBadge: { fontSize: 12, color: Colors.accent, fontWeight: '700' },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border, marginHorizontal: 4 },

  prixZone: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  cartePrix: { flex: 1, backgroundColor: 'rgba(232,119,34,0.12)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,119,34,0.25)' },
  carteMois: { backgroundColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.25)' },
  carteCaution: { backgroundColor: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.25)' },
  prixLabel: { fontSize: 11, color: Colors.accent, fontWeight: '600', marginBottom: 3 },
  prixValeur: { fontSize: 15, fontWeight: '800', color: Colors.accent },

  sectionTitre: { fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 10, marginTop: 4 },
  section: { backgroundColor: Colors.card, borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14 },
  equipPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(232,119,34,0.10)', borderWidth: 1, borderColor: 'rgba(232,119,34,0.2)' },
  equipTxt: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  descTxt: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, paddingVertical: 14 },
  voirPlus: { color: Colors.accent, fontWeight: '700', fontSize: 13, paddingBottom: 14 },

  propRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(232,119,34,0.15)', borderWidth: 1.5, borderColor: 'rgba(232,119,34,0.3)', alignItems: 'center', justifyContent: 'center' },
  propNom: { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 3 },
  propMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  propNote: { fontSize: 13, fontWeight: '700', color: '#FBBF24' },
  propVille: { fontSize: 13, color: Colors.textSecondary },
  btnContacter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(232,119,34,0.12)', borderWidth: 1, borderColor: 'rgba(232,119,34,0.3)' },
  btnContacterTxt: { color: Colors.accent, fontSize: 13, fontWeight: '700' },

  barre: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.border },
  barrePrix: { fontSize: 22, fontWeight: '900', color: Colors.white },
  barreLabel: { fontSize: 13, color: Colors.textSecondary },
  btnReserver: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnReserverDesactive: { backgroundColor: Colors.textLight },
  btnReserverTxt: { color: Colors.white, fontSize: 16, fontWeight: '800' },
});
