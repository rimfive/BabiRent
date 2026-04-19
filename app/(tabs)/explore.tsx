// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Explorer (recherche + filtres)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { getVehicules } from '../../src/services/vehicule.service';
import { getLogements } from '../../src/services/logement.service';
import CarteVehicule from '../../src/components/vehicule/CarteVehicule';
import CarteLogement from '../../src/components/logement/CarteLogement';
import { useAppStore } from '../../src/store/useAppStore';
import { VILLES } from '../../src/config/constantes';
import { SectionType } from '../../src/types';

export default function ExploreScreen() {
  const { section, setSection } = useAppStore();
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [logements, setLogements] = useState<any[]>([]);
  const [recherche, setRecherche] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const [v, l] = await Promise.all([
          getVehicules(villeFiltre ? { ville: villeFiltre } : undefined),
          getLogements(villeFiltre ? { ville: villeFiltre } : undefined),
        ]);
        setVehicules(v);
        setLogements(l);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [villeFiltre]);

  const donnees = section === 'vehicules'
    ? vehicules.filter(v => !recherche ||
        v.marque?.toLowerCase().includes(recherche.toLowerCase()) ||
        v.ville?.toLowerCase().includes(recherche.toLowerCase()))
    : logements.filter(l => !recherche ||
        l.titre?.toLowerCase().includes(recherche.toLowerCase()) ||
        l.ville?.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <SafeAreaView style={styles.page} edges={['top']}>

      {/* ── Titre ── */}
      <Text style={styles.titre}>Explorer</Text>

      {/* ── Barre de recherche dark ── */}
      <View style={styles.barreRecherche}>
        <Ionicons name="search-outline" size={18} color={Colors.accent} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un véhicule ou logement..."
          placeholderTextColor={Colors.textLight}
          value={recherche}
          onChangeText={setRecherche}
        />
        {recherche.length > 0 && (
          <Pressable onPress={() => setRecherche('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textLight} />
          </Pressable>
        )}
      </View>

      {/* ── Toggle Véhicules / Logements ── */}
      <View style={styles.toggle}>
        {(['vehicules', 'logements'] as SectionType[]).map(s => (
          <Pressable
            key={s}
            style={[styles.toggleBtn, section === s && styles.toggleActif]}
            onPress={() => setSection(s)}
          >
            <Ionicons
              name={s === 'vehicules' ? 'car-sport-outline' : 'home-outline'}
              size={16}
              color={section === s ? Colors.white : Colors.textLight}
            />
            <Text style={[styles.toggleTexte, section === s && styles.toggleTexteActif]}>
              {s === 'vehicules' ? 'Véhicules' : 'Logements'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Filtres villes ── */}
      <FlatList
        horizontal
        data={['', ...VILLES.slice(0, 8)]}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, villeFiltre === item && styles.chipActif]}
            onPress={() => setVilleFiltre(item)}
          >
            <Text style={[styles.chipTexte, villeFiltre === item && styles.chipTexteActif]}>
              {item || 'Toutes'}
            </Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsListe}
      />

      {/* ── Résultats ── */}
      {chargement ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.chargementTxt}>Recherche en cours...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={donnees}
          keyExtractor={item => item.id}
          renderItem={({ item }) =>
            section === 'vehicules'
              ? <CarteVehicule vehicule={item} />
              : <CarteLogement logement={item} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons
                name={section === 'vehicules' ? 'car-outline' : 'home-outline'}
                size={52} color={Colors.textLight}
              />
              <Text style={styles.videTitle}>Aucun résultat</Text>
              <Text style={styles.videSous}>
                {recherche
                  ? `Aucun résultat pour "${recherche}"`
                  : villeFiltre
                    ? `Aucune annonce à ${villeFiltre} pour l'instant`
                    : 'Aucune annonce disponible'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },

  titre: {
    fontSize: 24, fontWeight: '800', color: Colors.white,
    paddingHorizontal: 20, marginBottom: 14, marginTop: 8,
  },

  // ── Recherche ──
  barreRecherche: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.glass,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 14,
  },
  input: { flex: 1, fontSize: 14, color: Colors.white },

  // ── Toggle ──
  toggle: {
    flexDirection: 'row', marginHorizontal: 16,
    marginBottom: 14, backgroundColor: Colors.glass,
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 8,
  },
  toggleActif: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  toggleTexte: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  toggleTexteActif: { color: Colors.white, fontWeight: '700' },

  // ── Chips villes ──
  chipsListe: { maxHeight: 44, marginBottom: 14 },
  chips: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipTexte: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTexteActif: { color: Colors.white, fontWeight: '700' },

  // ── États ──
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  chargementTxt: { fontSize: 14, color: Colors.textSecondary },
  vide: { alignItems: 'center', paddingTop: 60, gap: 10 },
  videTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  videSous: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
