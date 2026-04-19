import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/config/colors';
import Bouton from '../../src/components/ui/Bouton';
import ChampTexte from '../../src/components/ui/ChampTexte';
import { COMMISSION_TAUX } from '../../src/config/constantes';
import { formatPrix, calculerJours } from '../../src/utils/formatters';

// Dates par défaut : demain et dans 3 jours
const demain = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};
const dans3jours = () => {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toISOString().split('T')[0];
};

const METHODES = [
  { id: 'mobile_money', label: 'Mobile Money', icone: 'phone-portrait-outline' as const, detail: 'Orange Money, MTN, Wave' },
  { id: 'especes', label: 'Espèces', icone: 'cash-outline' as const, detail: 'Paiement en main propre' },
  { id: 'carte', label: 'Carte bancaire', icone: 'card-outline' as const, detail: 'Visa, Mastercard' },
];

export default function ReservationScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [dateDebut, setDateDebut] = useState(demain());
  const [dateFin, setDateFin] = useState(dans3jours());
  const [message, setMessage] = useState('');
  const [methode, setMethode] = useState<'mobile_money' | 'especes' | 'carte'>('mobile_money');
  const [loading, setLoading] = useState(false);

  // Pour demo : prix fixe (en prod, charger depuis Firestore)
  const prixJour = 25000;
  const nombreJours = Math.max(1, calculerJours(dateDebut, dateFin));
  const prixTotal = prixJour * nombreJours;
  const commission = Math.round(prixTotal * COMMISSION_TAUX);
  const montantProprietaire = prixTotal - commission;

  const confirmer = async () => {
    if (!utilisateur || !id) return;

    if (calculerJours(dateDebut, dateFin) < 1) {
      Alert.alert('Dates invalides', 'La date de fin doit être après la date de début.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reservations'), {
        type: type || 'vehicule',
        annonceId: id,
        loueurId: utilisateur.id,
        proprietaireId: 'proprietaire_id_placeholder', // à récupérer depuis l'annonce
        dateDebut,
        dateFin,
        nombreJours,
        prixTotal,
        commission,
        montantProprietaire,
        statut: 'en_attente',
        methodePaiement: methode,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Demande envoyée !',
        'Le propriétaire va confirmer ta réservation sous 24h. Tu seras notifié par message.',
        [{ text: 'Super !', onPress: () => router.replace('/(tabs)') }],
      );
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.sousTitre}>
        {type === 'logement' ? '🏠 Réservation logement' : '🚗 Réservation véhicule'}
      </Text>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Période de location</Text>
        <View style={styles.rangee}>
          <View style={styles.dateChamp}>
            <Text style={styles.dateLabel}>Date de début</Text>
            <Pressable style={styles.dateBtn}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnTexte}>{dateDebut}</Text>
            </Pressable>
          </View>
          <View style={styles.dateSep}>
            <Ionicons name="arrow-forward" size={20} color={Colors.gray300} />
          </View>
          <View style={styles.dateChamp}>
            <Text style={styles.dateLabel}>Date de fin</Text>
            <Pressable style={styles.dateBtn}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnTexte}>{dateFin}</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.dureeInfo}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.dureeTexte}>{nombreJours} jour{nombreJours > 1 ? 's' : ''} de location</Text>
        </View>
      </View>

      {/* Méthode de paiement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Méthode de paiement</Text>
        {METHODES.map(m => (
          <Pressable
            key={m.id}
            style={[styles.methode, methode === m.id && styles.methodeActif]}
            onPress={() => setMethode(m.id as typeof methode)}
          >
            <View style={[styles.methodeIcone, methode === m.id && styles.methodeIconeActif]}>
              <Ionicons name={m.icone} size={22} color={methode === m.id ? Colors.white : Colors.primary} />
            </View>
            <View style={styles.methodeInfos}>
              <Text style={[styles.methodeLabel, methode === m.id && styles.methodeLabelActif]}>{m.label}</Text>
              <Text style={styles.methodeDetail}>{m.detail}</Text>
            </View>
            <View style={[styles.radio, methode === m.id && styles.radioActif]}>
              {methode === m.id && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Message */}
      <View style={styles.section}>
        <ChampTexte
          label="Message pour le propriétaire (optionnel)"
          value={message}
          onChangeText={setMessage}
          placeholder="Présentez-vous, précisez vos besoins..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Récapitulatif */}
      <View style={styles.recap}>
        <Text style={styles.sectionTitre}>Récapitulatif</Text>
        {[
          { label: `Prix / jour × ${nombreJours}j`, valeur: formatPrix(prixTotal) },
          { label: 'Commission BABI RENT (10%)', valeur: `-${formatPrix(commission)}` },
        ].map((ligne, i) => (
          <View key={i} style={styles.lignePrix}>
            <Text style={styles.ligneLabel}>{ligne.label}</Text>
            <Text style={styles.ligneValeur}>{ligne.valeur}</Text>
          </View>
        ))}
        <View style={styles.separateur} />
        <View style={styles.lignePrix}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValeur}>{formatPrix(prixTotal)}</Text>
        </View>
        <View style={styles.infoComm}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.texteComm}>
            {formatPrix(montantProprietaire)} seront reversés au propriétaire.
          </Text>
        </View>
      </View>

      <Bouton titre="Confirmer la réservation" onPress={confirmer} loading={loading} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  sousTitre: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateChamp: { flex: 1 },
  dateLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 12, borderWidth: 1.5, borderColor: Colors.primary,
  },
  dateBtnTexte: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  dateSep: { paddingTop: 24 },
  dureeInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    padding: 10, marginTop: 12,
  },
  dureeTexte: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  methode: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: Colors.border,
  },
  methodeActif: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  methodeIcone: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  methodeIconeActif: { backgroundColor: Colors.primary },
  methodeInfos: { flex: 1 },
  methodeLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  methodeLabelActif: { color: Colors.primary },
  methodeDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActif: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  recap: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  lignePrix: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  ligneLabel: { fontSize: 14, color: Colors.textSecondary },
  ligneValeur: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  separateur: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValeur: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  infoComm: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  texteComm: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
