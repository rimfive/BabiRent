import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  TextInput, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/config/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { creerArticle } from '../../src/services/article.service';
import { uploaderPhotos } from '../../src/services/storage.service';
import { CATEGORIES_MARKETPLACE, VILLES } from '../../src/config/constantes';
import { TypeTransaction, EtatArticle } from '../../src/types';

const ETATS: { code: EtatArticle; label: string }[] = [
  { code: 'neuf',     label: 'Neuf' },
  { code: 'bon_etat', label: 'Bon état' },
  { code: 'use',      label: 'Usagé' },
];

export default function PublierArticleScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [titre,       setTitre]       = useState('');
  const [description, setDescription] = useState('');
  const [prix,        setPrix]        = useState('');
  const [transaction, setTransaction] = useState<TypeTransaction>('vente');
  const [categorie,   setCategorie]   = useState(CATEGORIES_MARKETPLACE[0]);
  const [ville,       setVille]       = useState(utilisateur?.ville ?? 'Abidjan');
  const [etat,        setEtat]        = useState<EtatArticle>('bon_etat');
  const [photos,      setPhotos]      = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);

  const ajouterPhoto = async () => {
    if (photos.length >= 4) { Alert.alert('Maximum 4 photos'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setPhotos(p => [...p, result.assets[0].uri]);
  };

  const publier = async () => {
    if (!titre.trim())       { Alert.alert('Titre requis'); return; }
    if (!prix || isNaN(Number(prix)) || Number(prix) <= 0) { Alert.alert('Prix invalide'); return; }
    if (photos.length === 0) { Alert.alert('Ajoute au moins une photo'); return; }
    if (!utilisateur)        { Alert.alert('Connecte-toi d\'abord'); return; }

    setLoading(true);
    try {
      const urlsPhotos = await uploaderPhotos(photos, 'marketplace', utilisateur.id);
      await creerArticle({
        proprietaireId:  utilisateur.id,
        titre:           titre.trim(),
        description:     description.trim(),
        photos:          urlsPhotos,
        prix:            Number(prix),
        typeTransaction: transaction,
        categorie,
        ville,
        pays:            "Côte d'Ivoire",
        etat,
        disponible:      true,
      });
      Alert.alert('Article publié !', 'Ton article est maintenant visible dans le Marché.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Publier un article</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Photos */}
        <Text style={styles.label}>Photos <Text style={styles.labelSub}>(max 4)</Text></Text>
        <View style={styles.photosRow}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.photoImg} />
              <Pressable
                style={styles.photoSuppr}
                onPress={() => setPhotos(p => p.filter((_, j) => j !== i))}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </Pressable>
            </View>
          ))}
          {photos.length < 4 && (
            <Pressable style={styles.photoAjouter} onPress={ajouterPhoto}>
              <Ionicons name="camera-outline" size={28} color={Colors.accent} />
              <Text style={styles.photoAjouterTxt}>Ajouter</Text>
            </Pressable>
          )}
        </View>

        {/* Type transaction */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.choixRow}>
          {(['vente', 'location'] as TypeTransaction[]).map(t => (
            <Pressable
              key={t}
              style={[styles.choixBtn, transaction === t && styles.choixBtnActif]}
              onPress={() => setTransaction(t)}
            >
              <Ionicons
                name={t === 'vente' ? 'pricetag-outline' : 'repeat-outline'}
                size={16}
                color={transaction === t ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.choixTxt, transaction === t && styles.choixTxtActif]}>
                {t === 'vente' ? 'Vente' : 'Location'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Titre */}
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex : iPhone 13 Pro, Canapé 3 places..."
          placeholderTextColor={Colors.textLight}
          maxLength={80}
        />

        {/* Prix */}
        <Text style={styles.label}>Prix (FCFA) *</Text>
        <TextInput
          style={styles.input}
          value={prix}
          onChangeText={setPrix}
          placeholder="Ex : 50000"
          placeholderTextColor={Colors.textLight}
          keyboardType="numeric"
        />

        {/* État */}
        <Text style={styles.label}>État</Text>
        <View style={styles.choixRow}>
          {ETATS.map(e => (
            <Pressable
              key={e.code}
              style={[styles.choixBtn, etat === e.code && styles.choixBtnActif]}
              onPress={() => setEtat(e.code)}
            >
              <Text style={[styles.choixTxt, etat === e.code && styles.choixTxtActif]}>
                {e.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Catégorie */}
        <Text style={styles.label}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.pillsRow}>
            {CATEGORIES_MARKETPLACE.map(c => (
              <Pressable
                key={c}
                style={[styles.pill, categorie === c && styles.pillActif]}
                onPress={() => setCategorie(c)}
              >
                <Text style={[styles.pillTxt, categorie === c && styles.pillTxtActif]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Ville */}
        <Text style={styles.label}>Ville</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.pillsRow}>
            {VILLES.slice(0, 8).map(v => (
              <Pressable
                key={v}
                style={[styles.pill, ville === v && styles.pillActif]}
                onPress={() => setVille(v)}
              >
                <Text style={[styles.pillTxt, ville === v && styles.pillTxtActif]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décris l'article, son état, ses caractéristiques..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <Pressable
          style={[styles.btnPublier, loading && { opacity: 0.6 }]}
          onPress={publier}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <>
                <Ionicons name="storefront-outline" size={20} color={Colors.white} />
                <Text style={styles.btnPublierTxt}>Publier l'article</Text>
              </>
          }
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },
  scroll: { padding: 20, paddingBottom: 60 },

  label:    { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  labelSub: { fontSize: 11, fontWeight: '400', color: Colors.textLight },

  photosRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'visible' },
  photoImg:   { width: 80, height: 80, borderRadius: 12 },
  photoSuppr: { position: 'absolute', top: -8, right: -8 },
  photoAjouter: {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAjouterTxt: { fontSize: 11, color: Colors.accent, fontWeight: '700' },

  choixRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  choixBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 12,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  choixBtnActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  choixTxt:      { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  choixTxtActif: { color: Colors.white },

  input: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.white, marginBottom: 16,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },

  pillsRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  pillActif:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillTxt:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  pillTxtActif: { color: Colors.white },

  btnPublier: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, marginTop: 8,
    shadowColor: Colors.accent, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnPublierTxt: { fontSize: 16, fontWeight: '900', color: Colors.white },
});
