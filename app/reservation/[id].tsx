import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/config/colors';
import { supabase } from '../../src/config/supabase';
import Bouton from '../../src/components/ui/Bouton';
import ChampTexte from '../../src/components/ui/ChampTexte';
import CalendrierReservation from '../../src/components/ui/CalendrierReservation';
import { COMMISSION_TAUX } from '../../src/config/constantes';
import { formatPrix, calculerJours, formatDateCourte } from '../../src/utils/formatters';

const demain = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };

const METHODES = [
  { id: 'mobile_money', label: 'Mobile Money',   icone: 'phone-portrait-outline' as const, detail: 'Orange Money, MTN, Wave' },
  { id: 'especes',      label: 'Espèces',         icone: 'cash-outline' as const,           detail: 'Paiement en main propre' },
  { id: 'carte',        label: 'Carte bancaire',  icone: 'card-outline' as const,           detail: 'Visa, Mastercard' },
];

const STATUT_CONFIG: Record<string, { label: string; couleur: string; fond: string }> = {
  en_attente: { label: 'En attente',  couleur: Colors.warning, fond: Colors.warningLight },
  confirmee:  { label: 'Confirmée',   couleur: Colors.success, fond: Colors.successLight },
  en_cours:   { label: 'En cours',    couleur: Colors.info,    fond: Colors.infoLight },
  annulee:    { label: 'Annulée',     couleur: Colors.error,   fond: Colors.errorLight },
  terminee:   { label: 'Terminée',    couleur: Colors.info,    fond: Colors.infoLight },
};

export default function ReservationScreen() {
  // id = annonceId (mode création) ou reservationId (mode vue)
  const { id, type, mode } = useLocalSearchParams<{ id: string; type: string; mode?: string }>();
  const router  = useRouter();
  const { utilisateur } = useAuthStore();
  const estVue = mode === 'view';

  // ── Mode vue : afficher une réservation existante ─────────────────────────
  const [reservationExistante, setReservationExistante] = useState<any>(null);
  const [chargementVue, setChargementVue] = useState(estVue);

  useEffect(() => {
    if (!estVue || !id) return;
    supabase.from('reservations').select('*').eq('id', id).single()
      .then(({ data }) => { setReservationExistante(data); setChargementVue(false); });
  }, [estVue, id]);

  // ── Mode création : charger le prix réel depuis l'annonce ─────────────────
  const [prixJour, setPrixJour] = useState(0);
  const [chargementPrix, setChargementPrix] = useState(!estVue);

  useEffect(() => {
    if (estVue || !id || !type) return;
    const table = type === 'logement' ? 'logements' : 'vehicules';
    supabase.from(table).select('prix_jour, proprietaire_id').eq('id', id).single()
      .then(({ data }) => {
        if (data) setPrixJour(data.prix_jour);
        setChargementPrix(false);
      });

    // Charger les dates déjà réservées pour cette annonce
    // Fonction SQL sécurisée : renvoie uniquement les dates (pas qui a réservé),
    // car les règles RLS cachent les réservations des autres utilisateurs.
    supabase
      .rpc('dates_reservees', { p_annonce_id: id })
      .then(({ data: resa }) => {
        if (!resa) return;
        const bloquees: string[] = [];
        (resa as { date_debut: string; date_fin: string }[]).forEach(r => {
          let courant = new Date(r.date_debut);
          const fin = new Date(r.date_fin);
          while (courant <= fin) {
            bloquees.push(courant.toISOString().split('T')[0]);
            courant.setDate(courant.getDate() + 1);
          }
        });
        setDatesBloquees(bloquees);
      });
  }, [estVue, id, type]);

  // ── Formulaire de création ────────────────────────────────────────────────
  const [dateDebut, setDateDebut] = useState(demain());
  const [dateFin,   setDateFin]   = useState('');
  const [datesBloquees, setDatesBloquees] = useState<string[]>([]);
  const [message,   setMessage]   = useState('');
  const [methode, setMethode]     = useState<'mobile_money' | 'especes' | 'carte'>('mobile_money');
  const [loading, setLoading]     = useState(false);

  const nombreJours  = dateFin ? Math.max(1, calculerJours(dateDebut, dateFin)) : 0;
  const prixTotal    = prixJour * nombreJours;
  const commission   = Math.round(prixTotal * COMMISSION_TAUX);
  const montantProp  = prixTotal - commission;

  const confirmer = async () => {
    if (!utilisateur || !id) return;
    if (!dateFin) {
      Alert.alert('Dates incomplètes', 'Sélectionne une date de départ sur le calendrier.');
      return;
    }
    if (calculerJours(dateDebut, dateFin) < 1) {
      Alert.alert('Dates invalides', 'La date de fin doit être après la date de début.');
      return;
    }

    setLoading(true);
    try {
      // Récupérer le proprietaireId depuis l'annonce
      const table = type === 'logement' ? 'logements' : 'vehicules';
      const { data: annonce } = await supabase
        .from(table).select('proprietaire_id').eq('id', id).single();

      if (!annonce) throw new Error('Annonce introuvable');

      const { error } = await supabase.from('reservations').insert({
        type,
        annonce_id:           id,
        loueur_id:            utilisateur.id,
        proprietaire_id:      annonce.proprietaire_id,
        date_debut:           dateDebut,
        date_fin:             dateFin,
        nombre_jours:         nombreJours,
        prix_total:           prixTotal,
        commission,
        montant_proprietaire: montantProp,
        statut:               'en_attente',
        methode_paiement:     methode,
        message,
      });

      if (error) throw new Error(error.message);
      Alert.alert('Réservation envoyée !', 'Le propriétaire va confirmer ta demande.', [
        { text: 'OK', onPress: () => router.replace('/mes-reservations') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu mode VUE ────────────────────────────────────────────────────────
  if (estVue) {
    if (chargementVue) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      );
    }
    const r = reservationExistante;
    const cfg = r ? (STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.en_attente) : null;
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/mes-reservations')} hitSlop={16}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitre}>Détail réservation</Text>
          <View style={styles.headerBtn} />
        </View>
        {r && cfg && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View style={[styles.statutBadge, { backgroundColor: cfg.fond, alignSelf: 'flex-start' }]}>
              <Text style={[styles.statutTxt, { color: cfg.couleur }]}>{cfg.label}</Text>
            </View>
            <View style={styles.infoCard}>
              <LigneInfo label="Type"          valeur={r.type === 'logement' ? '🏠 Logement' : '🚗 Véhicule'} />
              <LigneInfo label="Du"            valeur={formatDateCourte(r.date_debut)} />
              <LigneInfo label="Au"            valeur={formatDateCourte(r.date_fin)} />
              <LigneInfo label="Durée"         valeur={`${r.nombre_jours} jour${r.nombre_jours > 1 ? 's' : ''}`} />
              <LigneInfo label="Paiement"      valeur={r.methode_paiement === 'mobile_money' ? 'Mobile Money' : r.methode_paiement === 'carte' ? 'Carte bancaire' : 'Espèces'} />
              {r.methode_paiement !== 'especes' && (
                <LigneInfo
                  label="Statut paiement"
                  valeur={
                    r.statut_paiement === 'paye'   ? '✅ Payé'
                    : r.statut_paiement === 'echoue' ? '❌ Échoué'
                    : r.statut_paiement === 'en_cours' ? '⏳ En cours'
                    : 'Non payé'
                  }
                />
              )}
              <LigneInfo label="Total"         valeur={formatPrix(r.prix_total)} accent />
            </View>
            {r.message ? (
              <View style={styles.infoCard}>
                <Text style={styles.msgLabel}>Message au propriétaire</Text>
                <Text style={styles.msgTxt}>{r.message}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Rendu mode CRÉATION ───────────────────────────────────────────────────
  if (chargementPrix) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={16}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Réserver</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Calendrier */}
        <Text style={styles.sectionTitre}>Dates de séjour</Text>

        {/* Résumé dates sélectionnées */}
        <View style={styles.resumeDates}>
          <View style={styles.resumeDate}>
            <Text style={styles.resumeDateLabel}>Arrivée</Text>
            <Text style={styles.resumeDateVal}>{dateDebut ? formatDateCourte(dateDebut) : '—'}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} />
          <View style={styles.resumeDate}>
            <Text style={styles.resumeDateLabel}>Départ</Text>
            <Text style={styles.resumeDateVal}>{dateFin ? formatDateCourte(dateFin) : '—'}</Text>
          </View>
          {nombreJours > 0 && (
            <View style={[styles.resumeDate, { alignItems: 'flex-end' }]}>
              <Text style={styles.resumeDateLabel}>Durée</Text>
              <Text style={[styles.resumeDateVal, { color: Colors.accent }]}>{nombreJours}j</Text>
            </View>
          )}
        </View>

        <CalendrierReservation
          dateDebut={dateDebut}
          dateFin={dateFin}
          onSelectDebut={setDateDebut}
          onSelectFin={setDateFin}
          datesBloquees={datesBloquees}
        />

        {/* Récapitulatif prix */}
        <View style={styles.recapCard}>
          <View style={styles.recapLigne}>
            <Text style={styles.recapLabel}>
              {nombreJours > 0
                ? `${formatPrix(prixJour)} × ${nombreJours} jour${nombreJours > 1 ? 's' : ''}`
                : 'Sélectionne tes dates'}
            </Text>
            <Text style={styles.recapVal}>{nombreJours > 0 ? formatPrix(prixTotal) : '—'}</Text>
          </View>
          <View style={styles.recapLigne}>
            <Text style={styles.recapLabel}>Commission Babi Rent</Text>
            <Text style={styles.recapVal}>- {formatPrix(commission)}</Text>
          </View>
          <View style={[styles.recapLigne, styles.recapTotal]}>
            <Text style={styles.recapTotalLabel}>Total à payer</Text>
            <Text style={styles.recapTotalVal}>{formatPrix(prixTotal)}</Text>
          </View>
        </View>

        {/* Méthode de paiement */}
        <Text style={styles.sectionTitre}>Mode de paiement</Text>
        {METHODES.map(m => (
          <Pressable
            key={m.id}
            style={[styles.methodeLigne, methode === m.id && styles.methodeActive]}
            onPress={() => setMethode(m.id as any)}
          >
            <Ionicons name={m.icone} size={22} color={methode === m.id ? Colors.accent : Colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodeLabel, methode === m.id && { color: Colors.white }]}>{m.label}</Text>
              <Text style={styles.methodeDetail}>{m.detail}</Text>
            </View>
            {methode === m.id && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
          </Pressable>
        ))}
        {methode !== 'especes' && (
          <Text style={styles.methodeDetail}>
            💡 Tu ne paies rien maintenant : le paiement se fera dans « Mes réservations »
            une fois que le propriétaire aura confirmé.
          </Text>
        )}

        {/* Message */}
        <Text style={styles.sectionTitre}>Message (optionnel)</Text>
        <ChampTexte
          label=""
          value={message}
          onChangeText={setMessage}
          placeholder="Présente-toi ou pose une question au propriétaire..."
          multiline
          numberOfLines={3}
        />

        <Bouton
          titre={loading ? 'Envoi en cours...' : 'Confirmer la réservation'}
          onPress={confirmer}
          desactive={loading || prixJour === 0 || !dateFin}
          style={{ marginTop: 8 }}
        />

      </ScrollView>
    </View>
  );
}

function LigneInfo({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <View style={styles.ligneInfo}>
      <Text style={styles.ligneInfoLabel}>{label}</Text>
      <Text style={[styles.ligneInfoVal, accent && { color: Colors.accent, fontWeight: '900' }]}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },
  scroll: { padding: 20, paddingBottom: 48 },

  sectionTitre: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },

  resumeDates: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.glass, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12, gap: 8,
  },
  resumeDate:      { alignItems: 'center', flex: 1 },
  resumeDateLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  resumeDateVal:   { fontSize: 15, fontWeight: '800', color: Colors.white },

  recapCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  recapLigne: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  recapLabel: { fontSize: 14, color: Colors.textSecondary },
  recapVal:   { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  recapTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4, marginBottom: 0 },
  recapTotalLabel: { fontSize: 16, fontWeight: '800', color: Colors.white },
  recapTotalVal:   { fontSize: 18, fontWeight: '900', color: Colors.accent },

  methodeLigne: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.glass, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  methodeActive: { borderColor: Colors.accent, backgroundColor: 'rgba(232,119,34,0.10)' },
  methodeLabel:  { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 },
  methodeDetail: { fontSize: 12, color: Colors.textLight },

  // Mode vue
  statutBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  statutTxt:   { fontSize: 13, fontWeight: '700' },
  infoCard:    { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  ligneInfo:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ligneInfoLabel: { fontSize: 14, color: Colors.textSecondary },
  ligneInfoVal:   { fontSize: 14, fontWeight: '700', color: Colors.white },
  msgLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  msgTxt:   { fontSize: 15, color: Colors.white, lineHeight: 22 },
});
