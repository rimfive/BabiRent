import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/config/colors';
import { formatPrix, formatDateCourte } from '../src/utils/formatters';

type Reservation = {
  id: string;
  type: string;
  annonceId: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  prixTotal: number;
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
  methodePaiement: string;
  createdAt: any;
};

const STATUT_CONFIG = {
  en_attente:  { label: 'En attente',  couleur: Colors.warning,  fond: Colors.warningLight,  icone: 'time-outline' as const },
  confirmee:   { label: 'Confirmée',   couleur: Colors.success,  fond: Colors.successLight,  icone: 'checkmark-circle-outline' as const },
  annulee:     { label: 'Annulée',     couleur: Colors.error,    fond: Colors.errorLight,    icone: 'close-circle-outline' as const },
  terminee:    { label: 'Terminée',    couleur: Colors.info,     fond: Colors.infoLight,     icone: 'flag-outline' as const },
};

export default function MesReservationsScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'toutes' | 'en_attente' | 'confirmee' | 'annulee' | 'terminee'>('toutes');

  useEffect(() => {
    if (!utilisateur) return;
    charger();
  }, [utilisateur]);

  const charger = async () => {
    if (!utilisateur) return;
    setChargement(true);
    setErreur(null);
    try {
      const q = query(
        collection(db, 'reservations'),
        where('loueurId', '==', utilisateur.id),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      const liste: Reservation[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Reservation, 'id'>),
      }));
      setReservations(liste);
    } catch (e) {
      setErreur('Impossible de charger tes réservations.');
    } finally {
      setChargement(false);
    }
  };

  const filtrees = filtre === 'toutes'
    ? reservations
    : reservations.filter(r => r.statut === filtre);

  const CarteReservation = ({ item }: { item: Reservation }) => {
    const cfg = STATUT_CONFIG[item.statut] ?? STATUT_CONFIG.en_attente;
    return (
      <Pressable
        style={styles.carte}
        onPress={() => router.push(`/reservation/${item.annonceId}?type=${item.type}`)}
      >
        <View style={styles.carteTop}>
          <View style={styles.typeRow}>
            <Ionicons
              name={item.type === 'logement' ? 'home-outline' : 'car-outline'}
              size={16} color={Colors.accent}
            />
            <Text style={styles.typeLabel}>
              {item.type === 'logement' ? 'Logement' : 'Véhicule'}
            </Text>
          </View>
          <View style={[styles.statutBadge, { backgroundColor: cfg.fond }]}>
            <Ionicons name={cfg.icone} size={13} color={cfg.couleur} />
            <Text style={[styles.statutTxt, { color: cfg.couleur }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.datesTxt}>
            {item.dateDebut} → {item.dateFin}
          </Text>
          <Text style={styles.joursLabel}>({item.nombreJours} jour{item.nombreJours > 1 ? 's' : ''})</Text>
        </View>

        <View style={styles.carteBottom}>
          <Text style={styles.prix}>{formatPrix(item.prixTotal)}</Text>
          <View style={styles.paiementRow}>
            <Ionicons name="wallet-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.paiementTxt}>
              {item.methodePaiement === 'mobile_money' ? 'Mobile Money'
                : item.methodePaiement === 'carte' ? 'Carte bancaire'
                : 'Espèces'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.titre}>Mes réservations</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {([
          { key: 'toutes', label: 'Toutes' },
          { key: 'en_attente', label: 'En attente' },
          { key: 'confirmee', label: 'Confirmées' },
          { key: 'terminee', label: 'Terminées' },
        ] as const).map(f => (
          <Pressable
            key={f.key}
            style={[styles.filtrePill, filtre === f.key && styles.filtrePillActif]}
            onPress={() => setFiltre(f.key)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActif]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {chargement ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : erreur ? (
        <View style={styles.centre}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.erreurTxt}>{erreur}</Text>
          <Pressable style={styles.btnRessayer} onPress={charger}>
            <Text style={styles.btnRessayerTxt}>Réessayer</Text>
          </Pressable>
        </View>
      ) : filtrees.length === 0 ? (
        <View style={styles.centre}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
          <Text style={styles.videTitle}>Aucune réservation</Text>
          <Text style={styles.videSous}>
            {filtre === 'toutes'
              ? 'Tu n\'as pas encore fait de réservation.'
              : 'Aucune réservation dans cette catégorie.'}
          </Text>
          <Pressable style={styles.btnExplorer} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="search-outline" size={18} color={Colors.white} />
            <Text style={styles.btnExplorerTxt}>Explorer les annonces</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtrees}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CarteReservation item={item} />}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.compteLabel}>
              {filtrees.length} réservation{filtrees.length > 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },

  filtresRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexWrap: 'wrap',
  },
  filtrePill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
  },
  filtrePillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filtreTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filtreTxtActif: { color: Colors.white },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  erreurTxt: { fontSize: 15, color: Colors.error, textAlign: 'center' },
  btnRessayer: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.accent, marginTop: 8,
  },
  btnRessayerTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  videTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  videSous: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btnExplorer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  btnExplorerTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },

  liste: { padding: 16, paddingBottom: 40 },
  compteLabel: {
    fontSize: 12, color: Colors.textSecondary, marginBottom: 14,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },

  carte: {
    backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  carteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },
  statutBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50,
  },
  statutTxt: { fontSize: 12, fontWeight: '700' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  datesTxt: { fontSize: 13, color: Colors.textSecondary },
  joursLabel: { fontSize: 12, color: Colors.textLight },
  carteBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prix: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  paiementRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paiementTxt: { fontSize: 12, color: Colors.textSecondary },
});
