import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ImageBackground, Dimensions,
} from 'react-native';
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

  return (
    <Pressable
      style={styles.carte}
      onPress={() => router.push(`/logement/${logement.id}` as any)}
    >
      <ImageBackground
        source={{ uri: logement.photos[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600' }}
        style={styles.photo}
        imageStyle={styles.photoImage}
      >
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
      </ImageBackground>

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
  photo: { width: '100%', height: 165 },
  photoImage: { borderRadius: 16 },
  overlay: {
    flex: 1,
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
