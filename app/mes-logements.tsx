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
  getLogementsProprietaire, mettreAJourLogement, supprimerLogement,
} from '../src/services/logement.service';
import { Logement } from '../src/types';
import { formatPrix } from '../src/utils/formatters';

function CarteLogementAdmin({
  logement, onToggle, onSupprimer,
}: {
  logement: Logement;
  onToggle: (id: string, dispo: boolean) => void;
  onSupprimer: (id: string) => void;
}) {
  const photo = logement.photos[0];

  return (
    <View style={styles.carte}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoVide]}>
          <Ionicons name="home-outline" size={32} color={Colors.textLight} />
        </View>
      )}

      <View style={styles.carteInfo}>
        <Text style={styles.carteTitre} numberOfLines={1}>{logement.titre}</Text>
        <Text style={styles.carteSous}>{logement.type} · {logement.ville}</Text>
        <View style={styles.carteMetaRow}>
          <View style={styles.carteMeta}>
            <Ionicons name="bed-outline" size={13} color={Colors.textLight} />
            <Text style={styles.carteMetaTxt}>{logement.nombreChambres} ch</Text>
          </View>
          <View style={styles.carteMeta}>
            <Ionicons name="people-outline" size={13} color={Colors.textLight} />
            <Text style={styles.carteMetaTxt}>{logement.capacitePersonnes} pers</Text>
          </View>
        </View>
        <Text style={styles.cartePrix}>{formatPrix(logement.prixJour)}<Text style={styles.parJour}>/jour</Text></Text>

        <View style={styles.carteActions}>
          <View style={styles.dispoRow}>
            <Text style={[styles.dispoTxt, { color: logement.disponible ? Colors.success : Colors.textSecondary }]}>
              {logement.disponible ? 'Disponible' : 'Indisponible'}
            </Text>
            <ToggleDispo value={logement.disponible} onChange={v => onToggle(logement.id, v)} />
          </View>
          <Pressable
            style={styles.btnSupprimer}
            onPress={() => onSupprimer(logement.id)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MesLogementsScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [logements,   setLogements]   = useState<Logement[]>([]);
  const [chargement,  setChargement]  = useState(true);
  const [rafraich,    setRafraich]    = useState(false);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    if (!utilisateur) return;
    try {
      const data = await getLogementsProprietaire(utilisateur.id);
      setLogements(data);
    } catch {}
    finally { setChargement(false); setRafraich(false); }
  }, [utilisateur]);

  useEffect(() => { charger(); }, []);

  const toggleDisponible = async (id: string, dispo: boolean) => {
    setLogements(ls => ls.map(l => l.id === id ? { ...l, disponible: dispo } : l));
    try {
      await mettreAJourLogement(id, { disponible: dispo });
    } catch {
      setLogements(ls => ls.map(l => l.id === id ? { ...l, disponible: !dispo } : l));
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
            await supprimerLogement(id);
            setLogements(ls => ls.filter(l => l.id !== id));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const disponibles   = logements.filter(l => l.disponible).length;
  const indisponibles = logements.filter(l => !l.disponible).length;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>

      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Mes logements</Text>
        <Pressable style={styles.headerAjouter} onPress={() => router.push('/logement/publier' as any)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {!chargement && logements.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{logements.length}</Text>
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
          data={logements}
          keyExtractor={l => l.id}
          renderItem={({ item }) => (
            <CarteLogementAdmin
              logement={item}
              onToggle={toggleDisponible}
              onSupprimer={supprimer}
            />
          )}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={rafraich} onRefresh={() => { setRafraich(true); charger(true); }} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="home-outline" size={60} color={Colors.textLight} />
              <Text style={styles.videT}>Aucun logement publié</Text>
              <Text style={styles.videS}>Publie ton premier logement et accueille des voyageurs.</Text>
              <Pressable style={styles.videBtn} onPress={() => router.push('/logement/publier' as any)}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.videBtnTxt}>Publier un logement</Text>
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
  photo: { width: 100, height: 120 },
  photoVide: { backgroundColor: Colors.glass, alignItems: 'center', justifyContent: 'center' },

  carteInfo: { flex: 1, paddingVertical: 12, paddingRight: 14, justifyContent: 'space-between' },
  carteTitre:{ fontSize: 15, fontWeight: '800', color: Colors.white },
  carteSous: { fontSize: 13, color: Colors.textSecondary },

  carteMetaRow: { flexDirection: 'row', gap: 10 },
  carteMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  carteMetaTxt: { fontSize: 12, color: Colors.textSecondary },

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
