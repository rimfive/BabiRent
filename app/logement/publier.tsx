import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { creerLogement } from '../../src/services/logement.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VILLES, TYPES_LOGEMENT } from '../../src/config/constantes';

const EQUIPEMENTS_DISPOS = [
  'WiFi', 'Climatisation', 'Parking', 'Piscine', 'Cuisine',
  'TV', 'Sécurité', 'Eau chaude', 'Groupe électrogène', 'Terrasse', 'Jardin', 'Gardien',
];

// ── Champ texte light ────────────────────────────────────────────────────────
function Champ({ label, ...props }: any) {
  return (
    <View style={f.groupe}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <View style={f.champ}>
        {props.icone && <Ionicons name={props.icone} size={16} color="#6B7280" />}
        <TextInput style={f.input} placeholderTextColor="#9CA3AF" {...props} icone={undefined} />
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  groupe: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7 },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  input: { flex: 1, fontSize: 14, color: '#111827' },
});

export default function PublierLogementScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [equipements, setEquipements] = useState<string[]>([]);

  const [form, setForm] = useState({
    titre: '', type: 'Appartement',
    prixJour: '', prixMois: '', caution: '',
    ville: 'Abidjan', adresse: '',
    nombreChambres: '2', nombreSDB: '1',
    superficie: '', capacitePersonnes: '4',
    meuble: true, description: '',
  });

  const maj = (champ: string) => (val: string) => setForm(p => ({ ...p, [champ]: val }));
  const toggle = (eq: string) => setEquipements(p => p.includes(eq) ? p.filter(e => e !== eq) : [...p, eq]);

  const ajouterPhoto = async () => {
    if (photos.length >= 8) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true });
    if (!r.canceled) setPhotos(p => [...p, ...r.assets.map(a => a.uri)].slice(0, 8));
  };

  const publier = async () => {
    if (!utilisateur) return;
    if (!form.titre.trim()) { Alert.alert('Titre manquant'); return; }
    if (!form.prixJour || parseFloat(form.prixJour) <= 0) { Alert.alert('Prix invalide'); return; }
    if (!form.adresse.trim()) { Alert.alert('Adresse manquante'); return; }
    setLoading(true);
    try {
      await creerLogement({
        proprietaireId: utilisateur.id,
        titre: form.titre.trim(), type: form.type,
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
        prixJour: parseFloat(form.prixJour),
        prixMois: form.prixMois ? parseFloat(form.prixMois) : undefined,
        caution: parseFloat(form.caution) || 0,
        ville: form.ville, pays: "Côte d'Ivoire",
        adresse: form.adresse.trim(), disponible: true,
        nombreChambres: parseInt(form.nombreChambres) || 1,
        nombreSDB: parseInt(form.nombreSDB) || 1,
        superficie: parseFloat(form.superficie) || 0,
        capacitePersonnes: parseInt(form.capacitePersonnes) || 1,
        meuble: form.meuble, equipements,
        description: form.description.trim(),
      });
      Alert.alert('✅ Annonce publiée !', 'Ton logement est maintenant visible.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch { Alert.alert('Erreur', 'Impossible de publier. Réessaie.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Section : Photos ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>1</Text></View><Text style={styles.sectionTitre}>Photos du logement</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((_, i) => (
              <Pressable key={i} style={styles.photoThumb} onPress={() => setPhotos(p => p.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={22} color={Colors.error} style={{ position: 'absolute', top: 4, right: 4 }} />
              </Pressable>
            ))}
            {photos.length < 8 && (
              <Pressable style={styles.addPhoto} onPress={ajouterPhoto}>
                <Ionicons name="camera-outline" size={28} color={Colors.accent} />
                <Text style={styles.addPhotoTxt}>Ajouter</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* ── Section : Informations ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>2</Text></View><Text style={styles.sectionTitre}>Informations</Text></View>
          <Champ label="Titre de l'annonce *" value={form.titre} onChangeText={maj('titre')} placeholder="ex: Bel appartement meublé à Cocody" icone="home-outline" />

          <Text style={styles.labelSelect}>Type de logement</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {TYPES_LOGEMENT.map(t => (
              <Pressable key={t} style={[styles.pill, form.type === t && styles.pillActif]} onPress={() => maj('type')(t)}>
                <Text style={[styles.pillTxt, form.type === t && styles.pillTxtActif]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Section : Prix & Localisation ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>3</Text></View><Text style={styles.sectionTitre}>Prix & Localisation</Text></View>
          <View style={styles.rangee}>
            <View style={{ flex: 1 }}><Champ label="Prix/jour (FCFA) *" value={form.prixJour} onChangeText={maj('prixJour')} keyboardType="numeric" placeholder="20 000" icone="cash-outline" /></View>
            <View style={{ flex: 1 }}><Champ label="Prix/mois (FCFA)" value={form.prixMois} onChangeText={maj('prixMois')} keyboardType="numeric" placeholder="400 000" icone="calendar-outline" /></View>
          </View>
          <Champ label="Caution (FCFA)" value={form.caution} onChangeText={maj('caution')} keyboardType="numeric" placeholder="0" icone="shield-outline" />

          <Text style={styles.labelSelect}>Ville</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {VILLES.slice(0, 8).map(v => (
              <Pressable key={v} style={[styles.pill, form.ville === v && styles.pillActif]} onPress={() => maj('ville')(v)}>
                <Text style={[styles.pillTxt, form.ville === v && styles.pillTxtActif]}>{v}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Champ label="Adresse précise *" value={form.adresse} onChangeText={maj('adresse')} placeholder="Commune, quartier, rue..." icone="location-outline" />
        </View>

        {/* ── Section : Détails ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>4</Text></View><Text style={styles.sectionTitre}>Détails</Text></View>
          <View style={styles.rangee}>
            <View style={{ flex: 1 }}><Champ label="Chambres" value={form.nombreChambres} onChangeText={maj('nombreChambres')} keyboardType="numeric" placeholder="2" /></View>
            <View style={{ flex: 1 }}><Champ label="Salles de bain" value={form.nombreSDB} onChangeText={maj('nombreSDB')} keyboardType="numeric" placeholder="1" /></View>
            <View style={{ flex: 1 }}><Champ label="Superficie (m²)" value={form.superficie} onChangeText={maj('superficie')} keyboardType="numeric" placeholder="60" /></View>
          </View>
          <Champ label="Capacité (personnes)" value={form.capacitePersonnes} onChangeText={maj('capacitePersonnes')} keyboardType="numeric" placeholder="4" />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Logement meublé</Text>
              <Text style={styles.switchSous}>Inclut meubles et électroménager</Text>
            </View>
            <Switch value={form.meuble} onValueChange={v => setForm(p => ({ ...p, meuble: v }))} trackColor={{ true: Colors.accent, false: '#D1D5DB' }} thumbColor={Colors.white} />
          </View>
        </View>

        {/* ── Section : Équipements ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>5</Text></View><Text style={styles.sectionTitre}>Équipements disponibles</Text></View>
          <View style={styles.equipGrid}>
            {EQUIPEMENTS_DISPOS.map(eq => {
              const actif = equipements.includes(eq);
              return (
                <Pressable key={eq} style={[styles.equipPill, actif && styles.equipPillActif]} onPress={() => toggle(eq)}>
                  <Ionicons name={actif ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={actif ? Colors.white : '#9CA3AF'} />
                  <Text style={[styles.equipTxt, actif && styles.equipTxtActif]}>{eq}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Section : Description ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}><View style={styles.num}><Text style={styles.numTxt}>6</Text></View><Text style={styles.sectionTitre}>Description</Text></View>
          <View style={[f.champ, { alignItems: 'flex-start', minHeight: 100 }]}>
            <TextInput
              style={[f.input, { textAlignVertical: 'top', paddingTop: 4 }]}
              placeholder="Emplacement, état, règles de la maison..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={maj('description')}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* ── Bouton publier ── */}
        <Pressable style={[styles.btnPublier, loading && { opacity: 0.6 }]} onPress={publier} disabled={loading}>
          <Ionicons name="rocket-outline" size={20} color={Colors.white} />
          <Text style={styles.btnPublierTxt}>{loading ? 'Publication...' : "Publier l'annonce"}</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingBottom: 40 },

  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontSize: 12, fontWeight: '800', color: Colors.white },
  sectionTitre: { fontSize: 16, fontWeight: '700', color: '#111827' },

  labelSelect: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },

  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, marginRight: 8,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  pillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillTxt: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pillTxtActif: { color: Colors.white, fontWeight: '700' },

  rangee: { flexDirection: 'row', gap: 10 },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderColor: '#F3F4F6', marginTop: 4,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  switchSous: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  equipPillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  equipTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },
  equipTxtActif: { color: Colors.white, fontWeight: '700' },

  photoThumb: {
    width: 90, height: 90, borderRadius: 12, marginRight: 10,
    backgroundColor: '#E5E7EB', overflow: 'hidden',
  },
  addPhoto: {
    width: 90, height: 90, borderRadius: 12, marginRight: 10,
    borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(232,119,34,0.05)',
  },
  addPhotoTxt: { fontSize: 11, color: Colors.accent, fontWeight: '700' },

  btnPublier: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, marginHorizontal: 16,
    borderRadius: 14, paddingVertical: 17, marginTop: 8,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnPublierTxt: { fontSize: 17, fontWeight: '800', color: Colors.white, letterSpacing: 0.3 },
});
