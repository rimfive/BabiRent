// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Publier une annonce véhicule
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Switch, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { creerVehicule } from '../../src/services/vehicule.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VILLES, MARQUES_VEHICULE, TYPES_VEHICULE } from '../../src/config/constantes';

// ── Champ texte dark ──────────────────────────────────────────────────────────
function Champ({ label, icone, ...props }: any) {
  return (
    <View style={f.groupe}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <View style={f.champ}>
        {icone && <Ionicons name={icone} size={16} color={Colors.textSecondary} />}
        <TextInput
          style={f.input}
          placeholderTextColor={Colors.textLight}
          {...props}
        />
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  groupe: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 7 },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Colors.glass,
  },
  input: { flex: 1, fontSize: 14, color: Colors.white },
});

// ── Options du menu header ────────────────────────────────────────────────────
const MENU_OPTIONS = [
  { icone: 'eye-outline' as const,        label: 'Aperçu de l\'annonce' },
  { icone: 'save-outline' as const,       label: 'Enregistrer comme brouillon' },
  { icone: 'help-circle-outline' as const, label: 'Aide & Conseils' },
  { icone: 'trash-outline' as const,      label: 'Tout effacer', danger: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function PublierVehiculeScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [form, setForm] = useState({
    marque: 'Toyota', modele: '',
    annee: new Date().getFullYear().toString(),
    type: 'Berline', prixJour: '', caution: '',
    ville: 'Abidjan', adresse: '',
    transmission: 'manuelle' as 'manuelle' | 'automatique',
    carburant: 'essence' as 'essence' | 'diesel' | 'electrique' | 'hybride',
    nombrePlaces: '5',
    climatisation: true, chauffeurDisponible: false,
    description: '',
  });

  const maj = (champ: string) => (val: string) => setForm(p => ({ ...p, [champ]: val }));

  // ── Ajouter des photos depuis la galerie ─────────────────────────────────
  const ajouterPhoto = async () => {
    if (photos.length >= 8) {
      Alert.alert('Maximum atteint', 'Tu peux ajouter au maximum 8 photos.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Active l\'accès à la galerie dans les paramètres.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!r.canceled) {
      setPhotos(p => [...p, ...r.assets.map(a => a.uri)].slice(0, 8));
    }
  };

  // ── Supprimer une photo ──────────────────────────────────────────────────
  const supprimerPhoto = (index: number) => {
    setPhotos(p => p.filter((_, j) => j !== index));
  };

  // ── Effacer tout le formulaire ───────────────────────────────────────────
  const toutEffacer = () => {
    setPhotos([]);
    setForm({
      marque: 'Toyota', modele: '', annee: new Date().getFullYear().toString(),
      type: 'Berline', prixJour: '', caution: '',
      ville: 'Abidjan', adresse: '',
      transmission: 'manuelle', carburant: 'essence',
      nombrePlaces: '5', climatisation: true, chauffeurDisponible: false, description: '',
    });
  };

  // ── Publier l'annonce ────────────────────────────────────────────────────
  const publier = async () => {
    setErreur(null);

    if (!utilisateur) {
      setErreur('Tu dois être connecté pour publier une annonce.');
      return;
    }
    if (!form.modele.trim()) {
      setErreur('Le modèle du véhicule est obligatoire.');
      return;
    }
    if (!form.prixJour || parseFloat(form.prixJour) <= 0) {
      setErreur('Indique un prix par jour valide (ex: 25000).');
      return;
    }

    setLoading(true);
    try {
      const id = await creerVehicule({
        proprietaireId: utilisateur.id,
        marque: form.marque,
        modele: form.modele.trim(),
        annee: parseInt(form.annee) || new Date().getFullYear(),
        type: form.type,
        photos: photos.length > 0
          ? photos
          : ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],
        prixJour: parseFloat(form.prixJour),
        caution: parseFloat(form.caution) || 0,
        ville: form.ville,
        pays: "Côte d'Ivoire",
        adresse: form.adresse,
        disponible: true,
        transmission: form.transmission,
        carburant: form.carburant,
        nombrePlaces: parseInt(form.nombrePlaces) || 5,
        climatisation: form.climatisation,
        chauffeurDisponible: form.chauffeurDisponible,
        description: form.description.trim(),
      });
      console.log('✅ Véhicule publié avec ID:', id);
      setErreur(null);
      // Succès → aller directement à mes véhicules pour confirmer
      router.replace('/mes-vehicules');
    } catch (e) {
      console.error('❌ Erreur publication:', e);
      const msg = e instanceof Error ? e.message : String(e);
      setErreur(`Erreur : ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Action menu ──────────────────────────────────────────────────────────
  const actionMenu = (label: string) => {
    setMenuVisible(false);
    if (label === 'Tout effacer') {
      toutEffacer();
    } else if (label === 'Aperçu de l\'annonce') {
      Alert.alert('Aperçu', 'Fonctionnalité disponible prochainement.');
    } else if (label === 'Enregistrer comme brouillon') {
      Alert.alert('Brouillon', 'Fonctionnalité disponible prochainement.');
    } else if (label === 'Aide & Conseils') {
      Alert.alert(
        'Conseils de publication',
        '• Ajoute au moins 3 photos claires\n• Prix moyen à Abidjan : 15 000 – 50 000 FCFA/jour\n• Une bonne description augmente les réservations de 40%',
      );
    }
  };

  // ── Retour vers les tabs ──────────────────────────────────────────────────
  const retour = () => {
    try { router.back(); } catch (_) { router.replace('/(tabs)'); }
  };

  return (
    <SafeAreaView style={styles.page}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={retour} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Publier un véhicule</Text>
        <Pressable style={styles.headerBtn} onPress={() => setMenuVisible(v => !v)} hitSlop={16}>
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* ── Menu dropdown (View absolu — plus fiable que Modal sur web) ── */}
      {menuVisible && (
        <>
          {/* Fond transparent pour fermer le menu en cliquant ailleurs */}
          <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuDropdown}>
            {MENU_OPTIONS.map((opt) => (
              <Pressable key={opt.label} style={styles.menuItem} onPress={() => actionMenu(opt.label)}>
                <Ionicons name={opt.icone} size={18} color={opt.danger ? Colors.error : Colors.textPrimary} />
                <Text style={[styles.menuItemTxt, opt.danger && { color: Colors.error }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ══ SECTION 1 — Photos ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>1</Text></View>
              <Text style={styles.sectionTitre}>Photos du véhicule</Text>
              <Text style={styles.sectionSous}>{photos.length}/8</Text>
            </View>
            <Text style={styles.conseil}>
              💡 La 1ère photo sera la photo de couverture de ton annonce
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Vignettes des photos sélectionnées */}
              {photos.map((uri, i) => (
                <Pressable key={i} style={styles.photoThumb} onPress={() => supprimerPhoto(i)}>
                  {/* ✅ FIX : Image affichée dans la vignette */}
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  {/* Badge de suppression */}
                  <View style={styles.photoClose}>
                    <Ionicons name="close" size={12} color={Colors.white} />
                  </View>
                  {/* Badge "Couverture" sur la 1ère photo */}
                  {i === 0 && (
                    <View style={styles.photoCouverture}>
                      <Text style={styles.photoCouvertureTxt}>Couv.</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              {/* Bouton ajouter photo */}
              {photos.length < 8 && (
                <Pressable style={styles.addPhoto} onPress={ajouterPhoto}>
                  <Ionicons name="camera-outline" size={28} color={Colors.accent} />
                  <Text style={styles.addPhotoTxt}>Ajouter</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* ══ SECTION 2 — Informations ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>2</Text></View>
              <Text style={styles.sectionTitre}>Informations</Text>
            </View>

            <Text style={styles.labelSelect}>Marque</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {MARQUES_VEHICULE.slice(0, 10).map(m => (
                <Pressable key={m} style={[styles.pill, form.marque === m && styles.pillActif]} onPress={() => maj('marque')(m)}>
                  <Text style={[styles.pillTxt, form.marque === m && styles.pillTxtActif]}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.rangee}>
              <View style={{ flex: 2 }}>
                <Champ label="Modèle *" value={form.modele} onChangeText={maj('modele')} placeholder="ex: Corolla" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Année" value={form.annee} onChangeText={maj('annee')} keyboardType="numeric" placeholder="2020" />
              </View>
            </View>

            <Text style={styles.labelSelect}>Type de véhicule</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TYPES_VEHICULE.map(t => (
                <Pressable key={t} style={[styles.pill, form.type === t && styles.pillActif]} onPress={() => maj('type')(t)}>
                  <Text style={[styles.pillTxt, form.type === t && styles.pillTxtActif]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ══ SECTION 3 — Prix & Localisation ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>3</Text></View>
              <Text style={styles.sectionTitre}>Prix & Localisation</Text>
            </View>
            <View style={styles.rangee}>
              <View style={{ flex: 1 }}>
                <Champ label="Prix/jour (FCFA) *" value={form.prixJour} onChangeText={maj('prixJour')} keyboardType="numeric" placeholder="25 000" icone="cash-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Caution (FCFA)" value={form.caution} onChangeText={maj('caution')} keyboardType="numeric" placeholder="0" icone="shield-outline" />
              </View>
            </View>

            <Text style={styles.labelSelect}>Ville</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {VILLES.slice(0, 8).map(v => (
                <Pressable key={v} style={[styles.pill, form.ville === v && styles.pillActif]} onPress={() => maj('ville')(v)}>
                  <Text style={[styles.pillTxt, form.ville === v && styles.pillTxtActif]}>{v}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Champ label="Adresse (optionnel)" value={form.adresse} onChangeText={maj('adresse')} placeholder="Quartier, rue..." icone="location-outline" />
          </View>

          {/* ══ SECTION 4 — Options ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>4</Text></View>
              <Text style={styles.sectionTitre}>Options</Text>
            </View>

            <Text style={styles.labelSelect}>Transmission</Text>
            <View style={styles.toggleRow}>
              {(['manuelle', 'automatique'] as const).map(t => (
                <Pressable key={t} style={[styles.toggleBtn, form.transmission === t && styles.toggleActif]} onPress={() => setForm(p => ({ ...p, transmission: t }))}>
                  <Text style={[styles.toggleTxt, form.transmission === t && styles.toggleTxtActif]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.labelSelect}>Carburant</Text>
            <View style={styles.toggleRow}>
              {(['essence', 'diesel', 'electrique', 'hybride'] as const).map(c => (
                <Pressable key={c} style={[styles.toggleBtn, form.carburant === c && styles.toggleActif]} onPress={() => setForm(p => ({ ...p, carburant: c }))}>
                  <Text style={[styles.toggleTxt, form.carburant === c && styles.toggleTxtActif]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Champ label="Nombre de places" value={form.nombrePlaces} onChangeText={maj('nombrePlaces')} keyboardType="numeric" placeholder="5" icone="people-outline" />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Climatisation</Text>
                <Text style={styles.switchSous}>Véhicule climatisé</Text>
              </View>
              <Switch
                value={form.climatisation}
                onValueChange={v => setForm(p => ({ ...p, climatisation: v }))}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.switchLabel}>Chauffeur disponible</Text>
                <Text style={styles.switchSous}>Option avec chauffeur</Text>
              </View>
              <Switch
                value={form.chauffeurDisponible}
                onValueChange={v => setForm(p => ({ ...p, chauffeurDisponible: v }))}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* ══ SECTION 5 — Description ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>5</Text></View>
              <Text style={styles.sectionTitre}>Description</Text>
            </View>
            <View style={[f.champ, { alignItems: 'flex-start', minHeight: 100 }]}>
              <TextInput
                style={[f.input, { textAlignVertical: 'top', paddingTop: 4 }]}
                placeholder="État du véhicule, options incluses, conditions de location..."
                placeholderTextColor={Colors.textLight}
                value={form.description}
                onChangeText={maj('description')}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* ══ BANDEAU ERREUR (visible dans l'UI, pas seulement Alert) ══ */}
          {erreur && (
            <View style={styles.bandeauErreur}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.bandeauErreurTxt}>{erreur}</Text>
            </View>
          )}

          {/* ══ BOUTON PUBLIER ══ */}
          <Pressable
            style={[styles.btnPublier, loading && { opacity: 0.6 }]}
            onPress={publier}
            disabled={loading}
          >
            <Ionicons name={loading ? 'time-outline' : 'rocket-outline'} size={20} color={Colors.white} />
            <Text style={styles.btnPublierTxt}>
              {loading ? 'Publication en cours...' : "Publier l'annonce"}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitre: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '800', color: Colors.white,
  },

  // ── Menu dropdown (View absolu) ──
  menuOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
  menuDropdown: {
    position: 'absolute', top: 58, right: 12,
    zIndex: 100,
    backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 6, minWidth: 240,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  menuItemTxt: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ── Sections ──
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: 16, marginBottom: 12, marginTop: 12,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  num: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  numTxt: { fontSize: 12, fontWeight: '800', color: Colors.white },
  sectionTitre: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.white },
  sectionSous: { fontSize: 13, color: Colors.textSecondary },
  conseil: {
    fontSize: 12, color: Colors.textSecondary,
    backgroundColor: 'rgba(232,119,34,0.10)',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  labelSelect: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },

  // ── Pills ──
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, marginRight: 8,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  pillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  pillTxtActif: { color: Colors.white, fontWeight: '700' },

  rangee: { flexDirection: 'row', gap: 10 },

  // ── Toggles ──
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  toggleBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  toggleActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  toggleTxtActif: { color: Colors.white, fontWeight: '700' },

  // ── Switch rows ──
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderColor: Colors.border,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  switchSous: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // ── Photos ──
  photoThumb: {
    width: 90, height: 90, borderRadius: 12, marginRight: 10,
    backgroundColor: Colors.glass, overflow: 'hidden',
  },
  photoClose: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoCouverture: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: Colors.accent,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  photoCouvertureTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },
  addPhoto: {
    width: 90, height: 90, borderRadius: 12, marginRight: 10,
    borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(232,119,34,0.06)',
  },
  addPhotoTxt: { fontSize: 11, color: Colors.accent, fontWeight: '700' },

  // ── Bandeau erreur ──
  bandeauErreur: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.errorLight,
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: 12, padding: 14,
  },
  bandeauErreurTxt: { flex: 1, color: Colors.error, fontSize: 14, fontWeight: '600' },

  // ── Bouton publier ──
  btnPublier: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, marginHorizontal: 16,
    borderRadius: 14, paddingVertical: 17, marginTop: 8,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnPublierTxt: { fontSize: 17, fontWeight: '800', color: Colors.white, letterSpacing: 0.3 },
});
