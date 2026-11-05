import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { ToggleDispo } from '../src/components/ui/ToggleDispo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/config/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import {
  getVehiculesProprietaire, mettreAJourVehicule, supprimerVehicule,
} from '../src/services/vehicule.service';
import { Vehicule } from '../src/types';
import { formatPrix } from '../src/utils/formatters';

function CarteVehiculeAdmin({
  vehicule, onToggle, onSupprimer,
}: {
  vehicule: Vehicule;
  onToggle: (id: string, dispo: boolean) => void;
  onSupprimer: (id: string) => void;
}) {
  const photo = vehicule.photos[0];

  return (
    <View style={styles.carte}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoVide]}>
          <Ionicons name="car-sport-outline" size={32} color={Colors.textLight} />
        </View>
      )}

      <View style={styles.carteInfo}>
        <Text style={styles.carteTitre} numberOfLines={1}>{vehicule.marque} {vehicule.modele}</Text>
        <Text style={styles.carteSous}>{vehicule.annee} · {vehicule.ville}</Text>
        <Text style={styles.cartePrix}>{formatPrix(vehicule.prixJour)}<Text style={styles.parJour}>/jour</Text></Text>

        <View style={styles.carteActions}>
          <View style={styles.dispoRow}>
            <Text style={[styles.dispoTxt, { color: vehicule.disponible ? Colors.success : Colors.textSecondary }]}>
              {vehicule.disponible ? 'Disponible' : 'Indisponible'}
            </Text>
            <ToggleDispo value={vehicule.disponible} onChange={v => onToggle(vehicule.id, v)} />
          </View>
          <Pressable
            style={styles.btnSupprimer}
            onPress={() => onSupprimer(vehicule.id)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MesVehiculesScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [vehicules,   setVehicules]   = useState<Vehicule[]>([]);
  const [chargement,  setChargement]  = useState(true);
  const [rafraich,    setRafraich]    = useState(false);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    if (!utilisateur) return;
    try {
      const data = await getVehiculesProprietaire(utilisateur.id);
      setVehicules(data);
    } catch {}
    finally { setChargement(false); setRafraich(false); }
  }, [utilisateur]);

  useEffect(() => { charger(); }, []);

  const toggleDisponible = async (id: string, dispo: boolean) => {
    setVehicules(vs => vs.map(v => v.id === id ? { ...v, disponible: dispo } : v));
    try {
      await mettreAJourVehicule(id, { disponible: dispo });
    } catch {
      setVehicules(vs => vs.map(v => v.id === id ? { ...v, disponible: !dispo } : v));
      Alert.alert('Erreur', 'Impossible de mettre à jour la disponibilité.');
    }
  };

  const supprimer = (id: string) => {
    Alert.alert('Supprimer l\'annonce', 'Cette action est irréversible. Continuer ?', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supprimerVehicule(id);
            setVehicules(vs => vs.filter(v => v.id !== id));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const disponibles   = vehicules.filter(v => v.disponible).length;
  const indisponibles = vehicules.filter(v => !v.disponible).length;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>

      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Mes véhicules</Text>
        <Pressable style={styles.headerAjouter} onPress={() => router.push('/vehicule/publier' as any)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {!chargement && vehicules.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{vehicules.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={[styles.statVal, { color: Colors.success }]}>{disponibles}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.error }]}>{indisponibles}</Text>
            <Text style={styles.statLabel}>Indisponibles</Text>
          </View>
        </View>
      )}

      {chargement ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : (
        <FlatList
          data={vehicules}
          keyExtractor={v => v.id}
          renderItem={({ item }) => (
            <CarteVehiculeAdmin
              vehicule={item}
              onToggle={toggleDisponible}
              onSupprimer={supprimer}
            />
          )}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={rafraich} onRefresh={() => { setRafraich(true); charger(true); }} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="car-outline" size={60} color={Colors.textLight} />
              <Text style={styles.videT}>Aucun véhicule publié</Text>
              <Text style={styles.videS}>Publie ton premier véhicule et commence à gagner.</Text>
              <Pressable style={styles.videBtn} onPress={() => router.push('/vehicule/publier' as any)}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.videBtnTxt}>Publier un véhicule</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  headerTitre:   { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },
  headerAjouter: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: 16, marginTop: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  statItem:   { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statVal:    { fontSize: 20, fontWeight: '900', color: Colors.white },
  statLabel:  { fontSize: 11, color: Colors.textSecondary },

  liste: { padding: 16, paddingBottom: 100, gap: 12 },

  carte: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  photo: { width: 100, height: 110 },
  photoVide: { backgroundColor: Colors.glass, alignItems: 'center', justifyContent: 'center' },

  carteInfo: { flex: 1, paddingVertical: 12, paddingRight: 14, justifyContent: 'space-between' },
  carteTitre:{ fontSize: 15, fontWeight: '800', color: Colors.white },
  carteSous: { fontSize: 13, color: Colors.textSecondary },
  cartePrix: { fontSize: 16, fontWeight: '900', color: Colors.accent },
  parJour:   { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },

  carteActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dispoRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispoTxt:     { fontSize: 12, color: Colors.textSecondary },
  btnSupprimer: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center',
  },

  vide:       { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  videT:      { fontSize: 17, fontWeight: '800', color: Colors.white },
  videS:      { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  videBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  videBtnTxt: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
