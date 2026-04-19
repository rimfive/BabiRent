// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Modifier une annonce logement
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Switch, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { getLogement, mettreAJourLogement } from '../../src/services/logement.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VILLES, TYPES_LOGEMENT } from '../../src/config/constantes';

const EQUIPEMENTS_DISPOS = [
  'WiFi', 'Climatisation', 'Parking', 'Piscine', 'Cuisine',
  'TV', 'Sécurité', 'Eau chaude', 'Groupe électrogène', 'Terrasse', 'Jardin', 'Gardien',
];

// ── Champ texte dark ──────────────────────────────────────────────────────────
function Champ({ label, icone, ...props }: any) {
  return (
    <View style={f.groupe}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <View style={f.champ}>
        {icone && <Ionicons name={icone} size={16} color={Colors.textSecondary} />}
        <TextInput style={f.input} placeholderTextColor={Colors.textLight} {...props} />
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

// ═══════════════════════════════════════════════════════════════════════════════
export default function ModifierLogementScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { utilisateur } = useAuthStore();

  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [equipements, setEquipements] = useState<string[]>([]);

  const [form, setForm] = useState({
    titre: '', type: 'Appartement',
    prixJour: '', prixMois: '', caution: '',
    ville: 'Abidjan', adresse: '',
    nombreChambres: '2', nombreSDB: '1',
    superficie: '', capacitePersonnes: '4',
    meuble: true, description: '',
    disponible: true,
  });

  const maj = (champ: string) => (val: string) => setForm(p => ({ ...p, [champ]: val }));
  const toggleEquip = (eq: string) =>
    setEquipements(p => p.includes(eq) ? p.filter(e => e !== eq) : [...p, eq]);

  // ── Charger les données existantes ──────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    chargerLogement();
  }, [id]);

  const chargerLogement = async () => {
    setChargement(true);
    try {
      const l = await getLogement(id as string);
      if (!l) { setErreur('Logement introuvable.'); return; }
      setPhotos(l.photos ?? []);
      setEquipements(l.equipements ?? []);
      setForm({
        titre: l.titre,
        type: l.type,
        prixJour: String(l.prixJour),
        prixMois: l.prixMois && l.prixMois > 0 ? String(l.prixMois) : '',
        caution: l.caution && l.caution > 0 ? String(l.caution) : '',
        ville: l.ville,
        adresse: l.adresse ?? '',
        nombreChambres: String(l.nombreChambres),
        nombreSDB: String(l.nombreSDB),
        superficie: l.superficie > 0 ? String(l.superficie) : '',
        capacitePersonnes: String(l.capacitePersonnes),
        meuble: l.meuble,
        description: l.description ?? '',
        disponible: l.disponible,
      });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setChargement(false);
    }
  };

  // ── Ajouter des photos ────────────────────────────────────────────────────
  const ajouterPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true,
    });
    if (!r.canceled) setPhotos(p => [...p, ...r.assets.map(a => a.uri)].slice(0, 8));
  };

  const supprimerPhoto = (i: number) => setPhotos(p => p.filter((_, j) => j !== i));

  // ── Sauvegarder les modifications ─────────────────────────────────────────
  const sauvegarder = async () => {
    if (!utilisateur || !id) return;
    setErreur(null);
    if (!form.titre.trim()) { setErreur('Le titre est obligatoire.'); return; }
    if (!form.prixJour || parseFloat(form.prixJour) <= 0) { setErreur('Prix par nuit invalide.'); return; }
    if (!form.adresse.trim()) { setErreur("L'adresse est obligatoire."); return; }

    setSaving(true);
    try {
      await mettreAJourLogement(id as string, {
        titre: form.titre.trim(),
        type: form.type,
        photos: photos.length > 0 ? photos : undefined,
        prixJour: parseFloat(form.prixJour),
        prixMois: form.prixMois ? parseFloat(form.prixMois) : 0,
        caution: parseFloat(form.caution) || 0,
        ville: form.ville,
        adresse: form.adresse.trim(),
        nombreChambres: parseInt(form.nombreChambres) || 1,
        nombreSDB: parseInt(form.nombreSDB) || 1,
        superficie: parseFloat(form.superficie) || 0,
        capacitePersonnes: parseInt(form.capacitePersonnes) || 1,
        meuble: form.meuble,
        equipements,
        description: form.description.trim(),
        disponible: form.disponible,
      });
      setSucces(true);
      setTimeout(() => router.replace('/mes-logements'), 1200);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const retour = () => router.canGoBack() ? router.back() : router.replace('/mes-logements');

  // ── Écran de chargement ──────────────────────────────────────────────────
  if (chargement) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={retour} hitSlop={16}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitre}>Modifier le logement</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.chargementTxt}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={retour} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Modifier le logement</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* ── Bandeau succès ── */}
      {succes && (
        <View style={styles.bandeauSucces}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={styles.bandeauSuccesTxt}>Modifications sauvegardées !</Text>
        </View>
      )}

      {/* ── Bandeau erreur ── */}
      {erreur && (
        <View style={styles.bandeauErreur}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.bandeauErreurTxt}>{erreur}</Text>
          <Pressable onPress={() => setErreur(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.error} />
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ══ SECTION — Disponibilité ══ */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Annonce active</Text>
                <Text style={styles.switchSous}>
                  {form.disponible ? 'Visible par les locataires' : 'Masquée (non visible)'}
                </Text>
              </View>
              <Switch
                value={form.disponible}
                onValueChange={v => setForm(p => ({ ...p, disponible: v }))}
                trackColor={{ true: Colors.success, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* ══ SECTION — Photos ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>1</Text></View>
              <Text style={styles.sectionTitre}>Photos</Text>
              <Text style={styles.sectionSous}>{photos.length}/8</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((uri, i) => (
                <Pressable key={i} style={styles.photoThumb} onPress={() => supprimerPhoto(i)}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <View style={styles.photoClose}>
                    <Ionicons name="close" size={12} color={Colors.white} />
                  </View>
                  {i === 0 && (
                    <View style={styles.photoCouv}>
                      <Text style={styles.photoCouvTxt}>Couv.</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              {photos.length < 8 && (
                <Pressable style={styles.addPhoto} onPress={ajouterPhoto}>
                  <Ionicons name="camera-outline" size={26} color={Colors.accent} />
                  <Text style={styles.addPhotoTxt}>Ajouter</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* ══ SECTION — Informations ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>2</Text></View>
              <Text style={styles.sectionTitre}>Informations</Text>
            </View>

            <Champ label="Titre de l'annonce *" value={form.titre} onChangeText={maj('titre')} placeholder="ex: Appartement moderne au Plateau" icone="home-outline" />

            <Text style={styles.labelSelect}>Type de logement</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TYPES_LOGEMENT.map(t => (
                <Pressable key={t} style={[styles.pill, form.type === t && styles.pillActif]} onPress={() => maj('type')(t)}>
                  <Text style={[styles.pillTxt, form.type === t && styles.pillTxtActif]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.rangee}>
              <View style={{ flex: 1 }}>
                <Champ label="Chambres" value={form.nombreChambres} onChangeText={maj('nombreChambres')} keyboardType="numeric" icone="bed-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Salles de bain" value={form.nombreSDB} onChangeText={maj('nombreSDB')} keyboardType="numeric" icone="water-outline" />
              </View>
            </View>

            <View style={styles.rangee}>
              <View style={{ flex: 1 }}>
                <Champ label="Superficie (m²)" value={form.superficie} onChangeText={maj('superficie')} keyboardType="numeric" icone="expand-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Capacité (pers.)" value={form.capacitePersonnes} onChangeText={maj('capacitePersonnes')} keyboardType="numeric" icone="people-outline" />
              </View>
            </View>

            <View style={[styles.switchRow, { borderTopWidth: 0, paddingTop: 0 }]}>
              <View><Text style={styles.switchLabel}>Meublé</Text></View>
              <Switch value={form.meuble} onValueChange={v => setForm(p => ({ ...p, meuble: v }))} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor={Colors.white} />
            </View>
          </View>

          {/* ══ SECTION — Prix & Localisation ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>3</Text></View>
              <Text style={styles.sectionTitre}>Prix & Localisation</Text>
            </View>

            <View style={styles.rangee}>
              <View style={{ flex: 1 }}>
                <Champ label="Prix/nuit (FCFA) *" value={form.prixJour} onChangeText={maj('prixJour')} keyboardType="numeric" icone="cash-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Prix/mois (FCFA)" value={form.prixMois} onChangeText={maj('prixMois')} keyboardType="numeric" icone="calendar-outline" />
              </View>
            </View>

            <Champ label="Caution (FCFA)" value={form.caution} onChangeText={maj('caution')} keyboardType="numeric" icone="shield-outline" />

            <Text style={styles.labelSelect}>Ville</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {VILLES.slice(0, 8).map(v => (
                <Pressable key={v} style={[styles.pill, form.ville === v && styles.pillActif]} onPress={() => maj('ville')(v)}>
                  <Text style={[styles.pillTxt, form.ville === v && styles.pillTxtActif]}>{v}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Champ label="Adresse *" value={form.adresse} onChangeText={maj('adresse')} placeholder="Quartier, rue..." icone="location-outline" />
          </View>

          {/* ══ SECTION — Équipements ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>4</Text></View>
              <Text style={styles.sectionTitre}>Équipements</Text>
            </View>
            <View style={styles.equipGrid}>
              {EQUIPEMENTS_DISPOS.map(eq => {
                const actif = equipements.includes(eq);
                return (
                  <Pressable
                    key={eq}
                    style={[styles.equipPill, actif && styles.equipPillActif]}
                    onPress={() => toggleEquip(eq)}
                  >
                    <Text style={[styles.equipTxt, actif && styles.equipTxtActif]}>{eq}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ══ SECTION — Description ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>5</Text></View>
              <Text style={styles.sectionTitre}>Description</Text>
            </View>
            <View style={[f.champ, { alignItems: 'flex-start', minHeight: 100 }]}>
              <TextInput
                style={[f.input, { textAlignVertical: 'top', paddingTop: 4 }]}
                placeholder="Description du logement..."
                placeholderTextColor={Colors.textLight}
                value={form.description}
                onChangeText={maj('description')}
                multiline numberOfLines={4}
              />
            </View>
          </View>

          {/* ══ BOUTON SAUVEGARDER ══ */}
          <Pressable
            style={[styles.btnSauvegarder, saving && { opacity: 0.6 }]}
            onPress={sauvegarder}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.btnSauvegarderTxt}>Sauvegarder les modifications</Text>
                </>
            }
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  chargementTxt: { fontSize: 14, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },

  bandeauSucces: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successLight, borderBottomWidth: 1, borderBottomColor: Colors.success,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  bandeauSuccesTxt: { flex: 1, color: Colors.success, fontSize: 13, fontWeight: '700' },
  bandeauErreur: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderBottomWidth: 1, borderBottomColor: Colors.error,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  bandeauErreurTxt: { flex: 1, color: Colors.error, fontSize: 13 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  section: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, marginTop: 12,
    borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontSize: 12, fontWeight: '800', color: Colors.white },
  sectionTitre: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.white },
  sectionSous: { fontSize: 13, color: Colors.textSecondary },
  labelSelect: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },

  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, marginRight: 8, backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border },
  pillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  pillTxtActif: { color: Colors.white, fontWeight: '700' },

  rangee: { flexDirection: 'row', gap: 10 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: Colors.border },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  switchSous: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border },
  equipPillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  equipTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  equipTxtActif: { color: Colors.white, fontWeight: '700' },

  photoThumb: { width: 90, height: 90, borderRadius: 12, marginRight: 10, backgroundColor: Colors.glass, overflow: 'hidden' },
  photoClose: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoCouv: { position: 'absolute', bottom: 4, left: 4, backgroundColor: Colors.accent, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  photoCouvTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },
  addPhoto: { width: 90, height: 90, borderRadius: 12, marginRight: 10, borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(232,119,34,0.06)' },
  addPhotoTxt: { fontSize: 11, color: Colors.accent, fontWeight: '700' },

  btnSauvegarder: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.success, marginHorizontal: 16,
    borderRadius: 14, paddingVertical: 17, marginTop: 8, minHeight: 56,
    shadowColor: Colors.success, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnSauvegarderTxt: { fontSize: 17, fontWeight: '800', color: Colors.white },
});
