import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { getVehicules } from '../../src/services/vehicule.service';
import CarteVehicule from '../../src/components/vehicule/CarteVehicule';
import { Vehicule } from '../../src/types';
import { TYPES_VEHICULE, VILLES } from '../../src/config/constantes';

export default function ListeVehiculesScreen() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');

  useEffect(() => {
    getVehicules(villeFiltre ? { ville: villeFiltre } : undefined)
      .then(setVehicules)
      .finally(() => setChargement(false));
  }, [villeFiltre]);

  const filtres = vehicules.filter(v =>
    !recherche ||
    v.marque.toLowerCase().includes(recherche.toLowerCase()) ||
    v.modele.toLowerCase().includes(recherche.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.conteneur}>
      <Text style={styles.titre}>Tous les véhicules</Text>

      <View style={styles.barreRecherche}>
        <Ionicons name="search" size={18} color={Colors.gray400} />
        <TextInput
          style={styles.input}
          placeholder="Marque, modèle..."
          placeholderTextColor={Colors.gray400}
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <FlatList
        horizontal
        data={['', ...VILLES.slice(0, 8)]}
        keyExtractor={(_, i) => i.toString()}
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
        style={{ maxHeight: 50, marginBottom: 12 }}
      />

      {chargement ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtres}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CarteVehicule vehicule={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="car-outline" size={48} color={Colors.gray300} />
              <Text style={styles.texteVide}>Aucun véhicule trouvé</Text>
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
  titre: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 14, marginTop: 8 },
  barreRecherche: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  chips: { paddingHorizontal: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActif: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTexte: { fontSize: 13, color: Colors.textSecondary },
  chipTexteActif: { color: Colors.white, fontWeight: '700' },
  vide: { alignItems: 'center', paddingTop: 60, gap: 12 },
  texteVide: { fontSize: 16, color: Colors.gray400 },
});
