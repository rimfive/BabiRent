// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Modifier une annonce véhicule
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
import { getVehicule, mettreAJourVehicule } from '../../src/services/vehicule.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VILLES, MARQUES_VEHICULE, TYPES_VEHICULE } from '../../src/config/constantes';

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
export default function ModifierVehiculeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { utilisateur } = useAuthStore();

  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

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
    disponible: true,
  });

  const maj = (champ: string) => (val: string) => setForm(p => ({ ...p, [champ]: val }));

  // ── Charger les données existantes du véhicule ──────────────────────────
  useEffect(() => {
    if (!id) return;
    chargerVehicule();
  }, [id]);

  const chargerVehicule = async () => {
    setChargement(true);
    try {
      const v = await getVehicule(id as string);
      if (!v) { setErreur('Véhicule introuvable.'); return; }
      setPhotos(v.photos ?? []);
      setForm({
        marque: v.marque,
        modele: v.modele,
        annee: String(v.annee),
        type: v.type,
        prixJour: String(v.prixJour),
        caution: String(v.caution ?? ''),
        ville: v.ville,
        adresse: v.adresse ?? '',
        transmission: v.transmission,
        carburant: v.carburant,
        nombrePlaces: String(v.nombrePlaces),
        climatisation: v.climatisation,
        chauffeurDisponible: v.chauffeurDisponible,
        description: v.description ?? '',
        disponible: v.disponible,
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
    if (!form.modele.trim()) { setErreur('Le modèle est obligatoire.'); return; }
    if (!form.prixJour || parseFloat(form.prixJour) <= 0) { setErreur('Prix par jour invalide.'); return; }

    setSaving(true);
    try {
      await mettreAJourVehicule(id as string, {
        marque: form.marque,
        modele: form.modele.trim(),
        annee: parseInt(form.annee) || new Date().getFullYear(),
        type: form.type,
        photos: photos.length > 0 ? photos : undefined,
        prixJour: parseFloat(form.prixJour),
        caution: parseFloat(form.caution) || 0,
        ville: form.ville,
        adresse: form.adresse,
        disponible: form.disponible,
        transmission: form.transmission,
        carburant: form.carburant,
        nombrePlaces: parseInt(form.nombrePlaces) || 5,
        climatisation: form.climatisation,
        chauffeurDisponible: form.chauffeurDisponible,
        description: form.description.trim(),
      });
      setSucces(true);
      setTimeout(() => router.replace('/mes-vehicules'), 1200);
    } catch (e) {
      console.error('Erreur modification:', e);
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const retour = () => { try { router.back(); } catch { router.replace('/mes-vehicules'); } };

  // ── Écran de chargement ──────────────────────────────────────────────────
  if (chargement) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={retour} hitSlop={16}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitre}>Modifier le véhicule</Text>
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
        <Text style={styles.headerTitre}>Modifier le véhicule</Text>
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
                <Champ label="Année" value={form.annee} onChangeText={maj('annee')} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.labelSelect}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TYPES_VEHICULE.map(t => (
                <Pressable key={t} style={[styles.pill, form.type === t && styles.pillActif]} onPress={() => maj('type')(t)}>
                  <Text style={[styles.pillTxt, form.type === t && styles.pillTxtActif]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ══ SECTION — Prix & Localisation ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>3</Text></View>
              <Text style={styles.sectionTitre}>Prix & Localisation</Text>
            </View>
            <View style={styles.rangee}>
              <View style={{ flex: 1 }}>
                <Champ label="Prix/jour (FCFA) *" value={form.prixJour} onChangeText={maj('prixJour')} keyboardType="numeric" icone="cash-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Champ label="Caution (FCFA)" value={form.caution} onChangeText={maj('caution')} keyboardType="numeric" icone="shield-outline" />
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
            <Champ label="Adresse" value={form.adresse} onChangeText={maj('adresse')} icone="location-outline" />
          </View>

          {/* ══ SECTION — Options ══ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.num}><Text style={styles.numTxt}>4</Text></View>
              <Text style={styles.sectionTitre}>Options</Text>
            </View>

            <Text style={styles.labelSelect}>Transmission</Text>
            <View style={styles.toggleRow}>
              {(['manuelle', 'automatique'] as const).map(t => (
                <Pressable key={t} style={[styles.toggleBtn, form.transmission === t && styles.toggleActif]} onPress={() => setForm(p => ({ ...p, transmission: t }))}>
                  <Text style={[styles.toggleTxt, form.transmission === t && styles.toggleTxtActif]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.labelSelect}>Carburant</Text>
            <View style={styles.toggleRow}>
              {(['essence', 'diesel', 'electrique', 'hybride'] as const).map(c => (
                <Pressable key={c} style={[styles.toggleBtn, form.carburant === c && styles.toggleActif]} onPress={() => setForm(p => ({ ...p, carburant: c }))}>
                  <Text style={[styles.toggleTxt, form.carburant === c && styles.toggleTxtActif]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                </Pressable>
              ))}
            </View>

            <Champ label="Nombre de places" value={form.nombrePlaces} onChangeText={maj('nombrePlaces')} keyboardType="numeric" icone="people-outline" />

            <View style={styles.switchRow}>
              <View><Text style={styles.switchLabel}>Climatisation</Text></View>
              <Switch value={form.climatisation} onValueChange={v => setForm(p => ({ ...p, climatisation: v }))} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor={Colors.white} />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View><Text style={styles.switchLabel}>Chauffeur disponible</Text></View>
              <Switch value={form.chauffeurDisponible} onValueChange={v => setForm(p => ({ ...p, chauffeurDisponible: v }))} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor={Colors.white} />
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
                placeholder="Description du véhicule..."
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

  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border },
  toggleActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  toggleTxtActif: { color: Colors.white, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: Colors.border },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  switchSous: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

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
