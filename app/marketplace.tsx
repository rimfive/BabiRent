import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/config/colors';
import { getArticles } from '../src/services/article.service';
import CarteArticle from '../src/components/marketplace/CarteArticle';
import { Article } from '../src/types';
import { CATEGORIES_MARKETPLACE } from '../src/config/constantes';

const { width } = Dimensions.get('window');

const ICONES_CATEGORIES: Record<string, any> = {
  'Électronique':       'phone-portrait-outline',
  'Meubles':            'bed-outline',
  'Électroménager':     'flash-outline',
  'Vêtements':          'shirt-outline',
  'Outils & Bricolage': 'hammer-outline',
  'Sport & Loisirs':    'bicycle-outline',
  'Cuisine':            'restaurant-outline',
  'Vélos & Trottinettes':'bicycle-outline',
  'Décoration':         'color-palette-outline',
  'Livres & Médias':    'book-outline',
  'Autre':              'grid-outline',
};

export default function MarketplaceScreen() {
  const router = useRouter();

  const [articles,        setArticles]        = useState<Article[]>([]);
  const [chargement,      setChargement]      = useState(true);
  const [rafraichissement,setRafraichissement]= useState(false);
  const [recherche,       setRecherche]       = useState('');
  const [categorieActive, setCategorieActive] = useState('Tout');
  const [typeActif,       setTypeActif]       = useState<'tous' | 'vente' | 'location'>('tous');

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    try {
      const data = await getArticles();
      setArticles(data);
    } catch {}
    finally { setChargement(false); setRafraichissement(false); }
  }, []);

  useEffect(() => { charger(); }, []);

  const articlesFiltres = articles.filter(a => {
    const matchRecherche = !recherche ||
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.categorie.toLowerCase().includes(recherche.toLowerCase()) ||
      a.ville.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie = categorieActive === 'Tout' || a.categorie === categorieActive;
    const matchType      = typeActif === 'tous' || a.typeTransaction === typeActif;
    return matchRecherche && matchCategorie && matchType;
  });

  const enVente     = articles.filter(a => a.typeTransaction === 'vente').length;
  const enLocation  = articles.filter(a => a.typeTransaction === 'location').length;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCentre}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcone}>
              <Ionicons name="storefront" size={16} color={Colors.white} />
            </View>
            <Text style={styles.logoTxt}>
              <Text style={styles.logoBabi}>Babi</Text>
              <Text style={styles.logoMarche}> Marché</Text>
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.btnPublier}
          onPress={() => router.push('/article/publier' as any)}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.btnPublierTxt}>Vendre</Text>
        </Pressable>
      </View>

      {/* ── Barre recherche ── */}
      <View style={styles.rechercheWrap}>
        <View style={styles.rechercheBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.rechercheInput}
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Chercher un article..."
            placeholderTextColor={Colors.textLight}
          />
          {recherche ? (
            <Pressable onPress={() => setRecherche('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── Stats rapides ── */}
      <View style={styles.statsRow}>
        <Pressable style={[styles.statPill, typeActif === 'tous' && styles.statPillActif]} onPress={() => setTypeActif('tous')}>
          <Text style={[styles.statTxt, typeActif === 'tous' && styles.statTxtActif]}>{articles.length} articles</Text>
        </Pressable>
        <Pressable style={[styles.statPill, typeActif === 'vente' && styles.statPillActif]} onPress={() => setTypeActif('vente')}>
          <Ionicons name="pricetag-outline" size={13} color={typeActif === 'vente' ? Colors.white : Colors.success} />
          <Text style={[styles.statTxt, typeActif === 'vente' && styles.statTxtActif]}>{enVente} vente</Text>
        </Pressable>
        <Pressable style={[styles.statPill, typeActif === 'location' && styles.statPillActif]} onPress={() => setTypeActif('location')}>
          <Ionicons name="repeat-outline" size={13} color={typeActif === 'location' ? Colors.white : Colors.accent} />
          <Text style={[styles.statTxt, typeActif === 'location' && styles.statTxtActif]}>{enLocation} location</Text>
        </Pressable>
      </View>

      {/* ── Catégories ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesListe}>
        {['Tout', ...CATEGORIES_MARKETPLACE].map(cat => (
          <Pressable
            key={cat}
            style={[styles.categorieBtn, categorieActive === cat && styles.categorieBtnActif]}
            onPress={() => setCategorieActive(cat)}
          >
            {cat !== 'Tout' && (
              <Ionicons
                name={ICONES_CATEGORIES[cat] ?? 'grid-outline'}
                size={15}
                color={categorieActive === cat ? Colors.white : Colors.accent}
              />
            )}
            <Text style={[styles.categorieTxt, categorieActive === cat && styles.categorieTxtActif]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Liste ── */}
      {chargement ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={articlesFiltres}
          keyExtractor={a => a.id}
          renderItem={({ item, index }) => <CarteArticle article={item} premier={index === 0} />}
          numColumns={2}
          columnWrapperStyle={styles.grille}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={() => { setRafraichissement(true); charger(true); }} tintColor={Colors.accent} />
          }
          ListHeaderComponent={
            articlesFiltres.length > 0 ? (
              <View style={styles.listeHeader}>
                <Text style={styles.listeHeaderTitre}>
                  {categorieActive === 'Tout' ? 'Tous les articles' : categorieActive}
                </Text>
                <Text style={styles.listeHeaderCount}>{articlesFiltres.length} résultat{articlesFiltres.length > 1 ? 's' : ''}</Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="storefront-outline" size={64} color={Colors.textLight} />
              <Text style={styles.videT}>Aucun article trouvé</Text>
              <Text style={styles.videS}>Sois le premier à publier dans cette catégorie !</Text>
              <Pressable style={styles.videBtn} onPress={() => router.push('/article/publier' as any)}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.videBtnTxt}>Publier un article</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCentre: { flex: 1 },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcone: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
  },
  logoTxt:    { fontSize: 20, fontWeight: '900' },
  logoBabi:   { color: Colors.white },
  logoMarche: { color: Colors.success, fontStyle: 'italic' },
  btnPublier: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnPublierTxt: { fontSize: 13, fontWeight: '800', color: Colors.white },

  rechercheWrap: { paddingHorizontal: 16, marginBottom: 10 },
  rechercheBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 50,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  rechercheInput: { flex: 1, fontSize: 14, color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  statPillActif: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statTxt:       { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  statTxtActif:  { color: Colors.white },

  categoriesScroll: { maxHeight: 52, marginBottom: 8 },
  categoriesListe:  { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  categorieBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  categorieBtnActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categorieTxt:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  categorieTxtActif: { color: Colors.white },

  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liste:     { paddingBottom: 100 },
  grille:    { paddingHorizontal: 16, gap: 12 },

  listeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  listeHeaderTitre: { fontSize: 16, fontWeight: '800', color: Colors.white },
  listeHeaderCount: { fontSize: 13, color: Colors.textLight },

  vide:    { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  videT:   { fontSize: 18, fontWeight: '800', color: Colors.white },
  videS:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  videBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  videBtnTxt: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
