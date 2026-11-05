import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../config/colors';
import { Article } from '../../types';
import { formatPrix } from '../../utils/formatters';
import { useFavorisStore } from '../../store/useFavorisStore';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1601335679963-10013d4578c9?w=600';
const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 12) / 2;

function uriValide(u?: string): string {
  return u && (u.startsWith('http://') || u.startsWith('https://')) ? u : PLACEHOLDER;
}

const ETAT_LABEL: Record<string, string> = {
  neuf: 'Neuf',
  bon_etat: 'Bon état',
  use: 'Usagé',
};

const ETAT_COULEUR: Record<string, string> = {
  neuf:     Colors.success,
  bon_etat: Colors.accent,
  use:      Colors.textSecondary,
};

type Props = { article: Article; premier?: boolean };

export default function CarteArticle({ article, premier = false }: Props) {
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState(uriValide(article.photos?.[0]));
  const { estFavori, toggle } = useFavorisStore();
  const estVente = article.typeTransaction === 'vente';

  return (
    <Pressable
      style={styles.carte}
      onPress={() => router.push(`/article/${article.id}` as any)}
    >
      <View style={styles.photo}>
        <Image
          source={{ uri: photoUri }}
          style={[StyleSheet.absoluteFill, styles.photoImage]}
          resizeMode="cover"
          onError={() => setPhotoUri(PLACEHOLDER)}
        />
        <View style={styles.gradientOverlay} />
        <View style={styles.overlay}>
          <View style={styles.hautRow}>
            <View style={[styles.badgeType, { backgroundColor: estVente ? 'rgba(16,185,129,0.85)' : 'rgba(232,119,34,0.85)' }]}>
              <Text style={styles.badgeTypeTxt}>{estVente ? 'Vente' : 'Location'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.btnCoeur, estFavori(article.id) && styles.btnCoeurActif]}
              onPress={e => { e.stopPropagation?.(); toggle(article.id); }}
              hitSlop={8}
            >
              <Ionicons
                name={estFavori(article.id) ? 'heart' : 'heart-outline'}
                size={14}
                color={estFavori(article.id) ? Colors.error : Colors.white}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.bas}>
            <Text style={styles.prix}>{formatPrix(article.prix)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infos}>
        <Text style={styles.titre} numberOfLines={2}>{article.titre}</Text>
        <View style={styles.piedRow}>
          <View style={[styles.etatBadge, { borderColor: ETAT_COULEUR[article.etat] }]}>
            <Text style={[styles.etatTxt, { color: ETAT_COULEUR[article.etat] }]}>
              {ETAT_LABEL[article.etat] ?? article.etat}
            </Text>
          </View>
          <View style={styles.villeRow}>
            <Ionicons name="location-outline" size={11} color={Colors.textLight} />
            <Text style={styles.villeTxt} numberOfLines={1}>{article.ville}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    width: CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  photo: { width: '100%', height: 160, overflow: 'hidden', borderRadius: 16 },
  photoImage: { borderRadius: 16 },
  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 10, justifyContent: 'space-between',
  },
  hautRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeType: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50,
  },
  badgeTypeTxt: { fontSize: 10, color: Colors.white, fontWeight: '800' },
  btnCoeur: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(14,26,46,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCoeurActif: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: Colors.error },
  bas: {},
  prix: { fontSize: 16, fontWeight: '900', color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 6 },

  infos: { padding: 10 },
  titre: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, lineHeight: 16 },
  piedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etatBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 50, borderWidth: 1,
  },
  etatTxt: { fontSize: 10, fontWeight: '700' },
  villeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  villeTxt: { fontSize: 10, color: Colors.textLight },
});
