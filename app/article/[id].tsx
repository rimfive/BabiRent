import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { Article } from '../../src/types';
import { getArticle } from '../../src/services/article.service';
import { getOuCreerConversation } from '../../src/services/chat.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useFavorisStore } from '../../src/store/useFavorisStore';
import { formatPrix } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

const ETAT_LABEL: Record<string, string>   = { neuf: 'Neuf', bon_etat: 'Bon état', use: 'Usagé' };
const ETAT_COULEUR: Record<string, string> = { neuf: Colors.success, bon_etat: Colors.accent, use: Colors.textSecondary };

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const { estFavori, toggle } = useFavorisStore();

  const [article, setArticle]       = useState<Article | null>(null);
  const [chargement, setChargement] = useState(true);
  const [photoIdx, setPhotoIdx]     = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    getArticle(id).then(a => { setArticle(a); setChargement(false); });
  }, [id]);

  const contacter = async () => {
    if (!utilisateur) { Alert.alert('Connecte-toi', 'Tu dois être connecté pour contacter le vendeur.'); return; }
    if (!article) return;
    if (article.proprietaireId === utilisateur.id) { Alert.alert('C\'est ton article !'); return; }
    setLoadingChat(true);
    try {
      const convId = await getOuCreerConversation(utilisateur.id, article.proprietaireId, article.id, 'logement', article.titre);
      router.push(`/chat/${convId}?titre=${encodeURIComponent(`🛍️ ${article.titre}`)}` as any);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le chat.');
    } finally {
      setLoadingChat(false);
    }
  };

  if (chargement) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.white }}>Article introuvable.</Text>
      </View>
    );
  }

  const estVente = article.typeTransaction === 'vente';

  return (
    <SafeAreaView style={styles.page} edges={['bottom']}>
      {/* ── Photos ── */}
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: article.photos[photoIdx] ?? 'https://images.unsplash.com/photo-1601335679963-10013d4578c9?w=800' }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.photoOverlay} />

        {/* Bouton retour */}
        <Pressable style={styles.retourBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/marketplace')} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>

        {/* Bouton cœur */}
        <Pressable style={[styles.coeurBtn, estFavori(article.id) && styles.coeurBtnActif]} onPress={() => toggle(article.id)} hitSlop={12}>
          <Ionicons name={estFavori(article.id) ? 'heart' : 'heart-outline'} size={20} color={estFavori(article.id) ? Colors.error : Colors.white} />
        </Pressable>

        {/* Badge type */}
        <View style={[styles.badgeType, { backgroundColor: estVente ? Colors.success : Colors.accent }]}>
          <Text style={styles.badgeTypeTxt}>{estVente ? '💰 Vente' : '🔄 Location'}</Text>
        </View>

        {/* Miniatures */}
        {article.photos.length > 1 && (
          <View style={styles.miniaturesRow}>
            {article.photos.map((uri, i) => (
              <Pressable key={i} onPress={() => setPhotoIdx(i)}>
                <Image
                  source={{ uri }}
                  style={[styles.miniature, i === photoIdx && styles.miniatureActive]}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Titre + prix */}
        <View style={styles.titrePrixRow}>
          <Text style={styles.titre}>{article.titre}</Text>
          <Text style={styles.prix}>{formatPrix(article.prix)}{estVente ? '' : '/jour'}</Text>
        </View>

        {/* Badges infos */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { borderColor: ETAT_COULEUR[article.etat] }]}>
            <Text style={[styles.badgeTxt, { color: ETAT_COULEUR[article.etat] }]}>
              {ETAT_LABEL[article.etat] ?? article.etat}
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="grid-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.badgeTxt}>{article.categorie}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.badgeTxt}>{article.ville}</Text>
          </View>
        </View>

        {/* Description */}
        {article.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>Description</Text>
            <Text style={styles.description}>{article.description}</Text>
          </View>
        ) : null}

        {/* Infos supplémentaires */}
        <View style={styles.infoCard}>
          <LigneInfo icone="pricetag-outline"  label="Type"      valeur={estVente ? 'À vendre' : 'À louer'} />
          <LigneInfo icone="construct-outline" label="État"      valeur={ETAT_LABEL[article.etat] ?? article.etat} />
          <LigneInfo icone="grid-outline"      label="Catégorie" valeur={article.categorie} />
          <LigneInfo icone="location-outline"  label="Ville"     valeur={article.ville} />
        </View>

      </ScrollView>

      {/* ── Barre action bas ── */}
      <View style={styles.barreAction}>
        <View style={styles.barrePrix}>
          <Text style={styles.barrePrixLabel}>{estVente ? 'Prix' : 'Prix/jour'}</Text>
          <Text style={styles.barrePrixVal}>{formatPrix(article.prix)}</Text>
        </View>
        {utilisateur?.id !== article.proprietaireId && (
          <Pressable
            style={[styles.btnContacter, loadingChat && { opacity: 0.6 }]}
            onPress={contacter}
            disabled={loadingChat}
          >
            {loadingChat
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.white} />
                  <Text style={styles.btnContacterTxt}>Contacter le vendeur</Text>
                </>
            }
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function LigneInfo({ icone, label, valeur }: { icone: any; label: string; valeur: string }) {
  return (
    <View style={styles.ligneInfo}>
      <View style={styles.ligneInfoGauche}>
        <Ionicons name={icone} size={16} color={Colors.accent} />
        <Text style={styles.ligneInfoLabel}>{label}</Text>
      </View>
      <Text style={styles.ligneInfoVal}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  photoWrap: { width, height: 320, position: 'relative' },
  photo:     { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(0,0,0,0.3)' },

  retourBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  coeurBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  coeurBtnActif: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: Colors.error },

  badgeType: {
    position: 'absolute', bottom: 56, left: 16,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
  },
  badgeTypeTxt: { fontSize: 13, color: Colors.white, fontWeight: '800' },

  miniaturesRow: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  miniature:       { width: 44, height: 44, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  miniatureActive: { borderColor: Colors.accent },

  scroll: { flex: 1 },

  titrePrixRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 12, gap: 12,
  },
  titre: { flex: 1, fontSize: 22, fontWeight: '900', color: Colors.white, lineHeight: 28 },
  prix:  { fontSize: 24, fontWeight: '900', color: Colors.accent },

  badgesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  badgeTxt: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  section:      { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitre: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  description:  { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

  infoCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  ligneInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ligneInfoGauche: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ligneInfoLabel:  { fontSize: 14, color: Colors.textSecondary },
  ligneInfoVal:    { fontSize: 14, fontWeight: '700', color: Colors.white },

  barreAction: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  barrePrix:      { flex: 0 },
  barrePrixLabel: { fontSize: 11, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  barrePrixVal:   { fontSize: 20, fontWeight: '900', color: Colors.accent },
  btnContacter: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
    shadowColor: Colors.accent, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  btnContacterTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
