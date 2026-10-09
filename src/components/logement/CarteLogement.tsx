import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions,
} from 'react-native';

const PLACEHOLDER_L = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600';

function uriValide(u?: string): string {
  if (u && (u.startsWith('http://') || u.startsWith('https://'))) return u;
  return PLACEHOLDER_L;
}
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../config/colors';
import { Logement } from '../../types';
import { formatPrix, formatNote } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 12) / 2; // 2 colonnes avec gaps

type Props = { logement: Logement };

const CarteLogement = ({ logement }: Props) => {
  const router = useRouter();
  const superHote = logement.note >= 4.8;
  const [photoUri, setPhotoUri] = useState(uriValide(logement.photos?.[0]));

  return (
    <Pressable
      style={styles.carte}
      onPress={() => router.push(`/logement/${logement.id}` as any)}
    >
      <View style={styles.photo}>
        <Image
          source={{ uri: photoUri }}
          style={[StyleSheet.absoluteFill, styles.photoImage]}
          resizeMode="cover"
          onError={() => setPhotoUri(PLACEHOLDER_L)}
        />
        {/* Gradient sombre bas */}
        <View style={styles.gradientOverlay} />
        <View style={styles.overlay}>
          {/* Haut : badge super hôte si éligible */}
          {superHote && (
            <View style={styles.badgeSuperHote}>
              <Ionicons name="trophy" size={11} color={Colors.accent} />
              <Text style={styles.txtSuperHote}>Super Hôte</Text>
            </View>
          )}

          {/* Milieu : chambres / SDB */}
          <View style={styles.milieu}>
            <Text style={styles.txChambres}>
              {logement.nombreChambres} ch • {logement.nombreSDB} sdb
            </Text>
          </View>

          {/* Bas : prix */}
          <View style={styles.bas}>
            <Text style={styles.prix} numberOfLines={1}>
              {formatPrix(logement.prixJour)}
              <Text style={styles.prixSuffix}>
                {logement.prixMois ? '/mois' : '/nuit'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Note */}
      <View style={styles.piedCarte}>
        <Text style={styles.titre} numberOfLines={1}>{logement.titre}</Text>
        <View style={styles.noteRow}>
          <Ionicons name="star" size={12} color={Colors.accent} />
          <Text style={styles.noteTxt}>{formatNote(logement.note)}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  carte: {
    width: CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  photo: { width: '100%', height: 165, overflow: 'hidden', borderRadius: 16 },
  photoImage: { borderRadius: 16 },
  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 10,
    justifyContent: 'space-between',
  },
  badgeSuperHote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14,26,46,0.82)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(232,119,34,0.35)',
  },
  txtSuperHote: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  milieu: { flex: 1, justifyContent: 'flex-end', marginBottom: 4 },
  txChambres: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  bas: {},
  prix: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 6,
  },
  prixSuffix: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
  piedCarte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titre: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, flex: 1, marginRight: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  noteTxt: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
});

export default CarteLogement;
