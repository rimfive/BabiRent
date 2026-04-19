import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ImageBackground, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../config/colors';
import { Vehicule } from '../../types';
import { formatPrix, formatNote } from '../../utils/formatters';

const { width } = Dimensions.get('window');

type Props = { vehicule: Vehicule };

const CarteVehicule = ({ vehicule }: Props) => {
  const router = useRouter();

  return (
    <Pressable
      style={styles.carte}
      onPress={() => router.push(`/vehicule/${vehicule.id}` as any)}
    >
      <ImageBackground
        source={{ uri: vehicule.photos[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800' }}
        style={styles.photo}
        imageStyle={styles.photoImage}
      >
        {/* Gradient overlay sombre */}
        <View style={styles.overlay}>
          {/* Haut : badge hôte certifié */}
          <View style={styles.haut}>
            <View style={styles.badgeCertifie}>
              <Ionicons name="shield-checkmark" size={13} color={Colors.accent} />
              <Text style={styles.txtBadge}>Hôte Certifié</Text>
            </View>
            {!vehicule.disponible && (
              <View style={styles.badgeIndispo}>
                <Text style={styles.txtIndispo}>Indisponible</Text>
              </View>
            )}
          </View>

          {/* Bas : prix + étoiles */}
          <View style={styles.bas}>
            <View>
              <Text style={styles.prix}>
                {formatPrix(vehicule.prixJour)}
                <Text style={styles.prixSuffix}>/jour</Text>
              </Text>
            </View>
            <View style={styles.noteRow}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.noteTxt}>{formatNote(vehicule.note)}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Infos sous la carte */}
      <View style={styles.infos}>
        <View style={styles.rangeeInfo}>
          <Text style={styles.titre} numberOfLines={1}>
            {vehicule.marque} {vehicule.modele} {vehicule.annee}
          </Text>
          {vehicule.chauffeurDisponible && (
            <View style={styles.chipChauffeur}>
              <Ionicons name="person" size={11} color={Colors.accent} />
              <Text style={styles.txtChauffeur}>Chauffeur</Text>
            </View>
          )}
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={13} color={Colors.gray400} />
          <Text style={styles.detail}>{vehicule.ville}</Text>
          <View style={styles.dot} />
          <Ionicons name="settings-outline" size={12} color={Colors.gray400} />
          <Text style={styles.detail}>{vehicule.transmission}</Text>
          <View style={styles.dot} />
          <Ionicons name="people-outline" size={12} color={Colors.gray400} />
          <Text style={styles.detail}>{vehicule.nombrePlaces} places</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  carte: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  photo: { width: '100%', height: 220 },
  photoImage: { borderRadius: 20 },
  overlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  haut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeCertifie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(14,26,46,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(232,119,34,0.4)',
  },
  txtBadge: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  badgeIndispo: {
    backgroundColor: 'rgba(239,68,68,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  txtIndispo: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  bas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prix: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  prixSuffix: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.75)' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  noteTxt: { fontSize: 13, color: Colors.white, fontWeight: '700', marginLeft: 4 },
  infos: { padding: 14 },
  rangeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titre: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  chipChauffeur: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50,
  },
  txtChauffeur: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detail: { fontSize: 12, color: Colors.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.gray300 },
});

export default CarteVehicule;
