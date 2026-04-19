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
    ? vehicules.filter(v => !recherche || v.marque.toLowerCase().includes(recherche.toLowerCase()) || v.ville.toLowerCase().includes(recherche.toLowerCase()))
    : logements.filter(l => !recherche || l.titre.toLowerCase().includes(recherche.toLowerCase()) || l.ville.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <SafeAreaView style={styles.conteneur}>
      <Text style={styles.titre}>Explorer</Text>

      {/* Recherche */}
      <View style={styles.barreRecherche}>
        <Ionicons name="search" size={18} color={Colors.gray400} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher..."
          placeholderTextColor={Colors.gray400}
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      {/* Toggle section */}
      <View style={styles.toggle}>
        {(['vehicules', 'logements'] as SectionType[]).map(s => (
          <Pressable
            key={s}
            style={[styles.toggleBtn, section === s && styles.toggleActif]}
            onPress={() => setSection(s)}
          >
            <Ionicons name={s === 'vehicules' ? 'car-sport-outline' : 'home-outline'} size={16} color={section === s ? Colors.white : Colors.gray400} />
            <Text style={[styles.toggleTexte, section === s && styles.toggleTexteActif]}>
              {s === 'vehicules' ? 'Véhicules' : 'Logements'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Filtres villes */}
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
              {item || 'Toutes villes'}
            </Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsListe}
      />

      {chargement ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
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
              <Ionicons name={section === 'vehicules' ? 'car-outline' : 'home-outline'} size={48} color={Colors.gray300} />
              <Text style={styles.texteVide}>Aucun résultat</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },
  titre: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
  barreRecherche: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  toggle: {
    flexDirection: 'row', marginHorizontal: 16,
    marginBottom: 12, backgroundColor: Colors.gray100,
    borderRadius: 12, padding: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 8,
  },
  toggleActif: { backgroundColor: Colors.primary },
  toggleTexte: { fontSize: 13, fontWeight: '600', color: Colors.gray400 },
  toggleTexteActif: { color: Colors.white },
  chips: { paddingHorizontal: 12, gap: 8 },
  chipsListe: { marginBottom: 16, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActif: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTexte: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTexteActif: { color: Colors.white, fontWeight: '700' },
  loader: { marginTop: 60 },
  vide: { alignItems: 'center', paddingTop: 60, gap: 12 },
  texteVide: { fontSize: 16, color: Colors.gray400 },
});
