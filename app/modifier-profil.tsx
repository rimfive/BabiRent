import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../src/config/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import { mettreAJourProfil, getProfilUtilisateur } from '../src/services/auth.service';
import { uploaderImage } from '../src/services/storage.service';
import { VILLES } from '../src/config/constantes';
import { initiales } from '../src/utils/formatters';

export default function ModifierProfilScreen() {
  const router = useRouter();
  const { utilisateur, setUtilisateur } = useAuthStore();

  const [prenom,    setPrenom]    = useState(utilisateur?.prenom    ?? '');
  const [nom,       setNom]       = useState(utilisateur?.nom       ?? '');
  const [telephone, setTelephone] = useState(utilisateur?.telephone ?? '');
  const [ville,     setVille]     = useState(utilisateur?.ville     ?? 'Abidjan');
  const [photoUri,  setPhotoUri]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);

  const choisirPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const prendrePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission caméra refusée'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const afficherChoixPhoto = () => {
    Alert.alert('Photo de profil', 'Choisir une source', [
      { text: 'Galerie',  onPress: choisirPhoto  },
      { text: 'Caméra',   onPress: prendrePhoto   },
      { text: 'Annuler',  style: 'cancel' },
    ]);
  };

  const sauvegarder = async () => {
    if (!utilisateur) return;
    if (!prenom.trim()) { Alert.alert('Le prénom est requis'); return; }
    if (!nom.trim())    { Alert.alert('Le nom est requis');    return; }

    setLoading(true);
    try {
      let photoUrl = utilisateur.photoUrl;

      // Upload photo si changée
      if (photoUri) {
        const chemin = `${utilisateur.id}/avatar_${Date.now()}`;
        photoUrl = await uploaderImage(photoUri, chemin, 'profiles');
      }

      await mettreAJourProfil(utilisateur.id, {
        prenom:    prenom.trim(),
        nom:       nom.trim(),
        telephone: telephone.trim(),
        ville,
        photoUrl,
      });

      // Recharger le profil depuis Supabase pour avoir les données fraîches
      const profilFrais = await getProfilUtilisateur(utilisateur.id);
      if (profilFrais) setUtilisateur(profilFrais);

      Alert.alert('Profil mis à jour !', '', [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!utilisateur) return null;

  const photoSource = photoUri
    ? { uri: photoUri }
    : utilisateur.photoUrl
    ? { uri: utilisateur.photoUrl }
    : null;

  return (
    <SafeAreaView style={styles.page}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Modifier le profil</Text>
        <Pressable
          style={[styles.headerSauvegarder, loading && { opacity: 0.6 }]}
          onPress={sauvegarder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.headerSauvegarderTxt}>Sauvegarder</Text>
          }
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Photo de profil ── */}
        <View style={styles.photoSection}>
          <Pressable style={styles.photoWrapper} onPress={afficherChoixPhoto}>
            {photoSource ? (
              <Image source={photoSource} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackTxt}>
                  {initiales(utilisateur.nom, utilisateur.prenom)}
                </Text>
              </View>
            )}
            {/* Badge caméra */}
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </Pressable>
          <Text style={styles.photoHint}>Appuie pour changer ta photo</Text>
        </View>

        {/* ── Champs ── */}
        <View style={styles.groupeChamps}>

          <View style={styles.rangeeChamps}>
            <View style={styles.champWrap}>
              <Text style={styles.champLabel}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Ton prénom"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.champWrap}>
              <Text style={styles.champLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Ton nom"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.champWrapFull}>
            <Text style={styles.champLabel}>Téléphone</Text>
            <View style={styles.inputAvecIcone}>
              <Ionicons name="call-outline" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.inputIcone}
                value={telephone}
                onChangeText={setTelephone}
                placeholder="+225 07 00 00 00 00"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.champWrapFull}>
            <Text style={styles.champLabel}>Email</Text>
            <View style={[styles.inputAvecIcone, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color={Colors.textLight} />
              <Text style={styles.inputIconeDisabled}>{utilisateur.email}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.textLight} />
            </View>
            <Text style={styles.champNote}>L'email ne peut pas être modifié</Text>
          </View>
        </View>

        {/* ── Ville ── */}
        <Text style={styles.sectionTitre}>VILLE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.villesScroll} contentContainerStyle={styles.villesListe}>
          {VILLES.map(v => (
            <Pressable
              key={v}
              style={[styles.villePill, ville === v && styles.villePillActif]}
              onPress={() => setVille(v)}
            >
              {ville === v && <Ionicons name="location" size={13} color={Colors.white} />}
              <Text style={[styles.villeTxt, ville === v && styles.villeTxtActif]}>{v}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Bouton bas de page ── */}
        <Pressable
          style={[styles.btnSauvegarder, loading && { opacity: 0.6 }]}
          onPress={sauvegarder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.btnSauvegarderTxt}>Sauvegarder les modifications</Text>
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
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitre:  { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },
  headerSauvegarder: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.accent, borderRadius: 20,
    minWidth: 40, alignItems: 'center',
  },
  headerSauvegarderTxt: { fontSize: 13, fontWeight: '700', color: Colors.white },

  scroll: { padding: 20, paddingBottom: 60 },

  photoSection: { alignItems: 'center', marginBottom: 28 },
  photoWrapper: {
    width: 100, height: 100, borderRadius: 50,
    position: 'relative', marginBottom: 10,
  },
  photo: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.accent,
  },
  photoFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accentLight,
  },
  photoFallbackTxt: { fontSize: 36, fontWeight: '900', color: Colors.white },
  photoBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  photoHint: { fontSize: 13, color: Colors.textLight },

  groupeChamps: {
    backgroundColor: Colors.card, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 24, gap: 14,
  },
  rangeeChamps: { flexDirection: 'row', gap: 12 },
  champWrap:     { flex: 1 },
  champWrapFull: {},

  champLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  champNote:  { fontSize: 11, color: Colors.textLight, marginTop: 4 },

  input: {
    backgroundColor: Colors.glass, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: Colors.white,
  },
  inputAvecIcone: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.glass, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  inputIcone:         { flex: 1, fontSize: 15, color: Colors.white },
  inputDisabled:      { opacity: 0.55 },
  inputIconeDisabled: { flex: 1, fontSize: 15, color: Colors.textSecondary },

  sectionTitre: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  villesScroll: { maxHeight: 46, marginBottom: 28 },
  villesListe:  { gap: 8, alignItems: 'center' },
  villePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  villePillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  villeTxt:       { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  villeTxtActif:  { color: Colors.white },

  btnSauvegarder: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16,
    shadowColor: Colors.accent, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnSauvegarderTxt: { fontSize: 16, fontWeight: '900', color: Colors.white },
});
