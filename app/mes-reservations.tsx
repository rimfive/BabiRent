import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Alert, Image, Linking, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/config/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import {
  getMesReservations, getReservationsRecues, changerStatutReservation,
} from '../src/services/reservation.service';
import { initierPaiement, verifierPaiement } from '../src/services/paiement.service';
import { Reservation } from '../src/types';
import { formatPrix, formatDateCourte } from '../src/utils/formatters';

// Le locataire doit-il payer en ligne cette réservation ?
const doitPayer = (r: Reservation) =>
  r.statut === 'confirmee' && r.methodePaiement !== 'especes' && r.statutPaiement !== 'paye';

// ── Badge de paiement ─────────────────────────────────────────────────────────
function BadgePaiement({ reservation }: { reservation: Reservation }) {
  let label = '', couleur: string = Colors.textSecondary, icone: any = 'card-outline';
  if (reservation.statutPaiement === 'paye') {
    label = 'Payé'; couleur = Colors.success; icone = 'checkmark-circle';
  } else if (reservation.methodePaiement === 'especes') {
    if (reservation.statut === 'annulee') return null;
    label = 'Espèces'; icone = 'cash-outline';
  } else if (reservation.statut === 'confirmee') {
    label = reservation.statutPaiement === 'echoue' ? 'Paiement échoué' : 'À payer';
    couleur = reservation.statutPaiement === 'echoue' ? Colors.error : Colors.warning;
    icone = 'time-outline';
  } else {
    return null;
  }
  return (
    <View style={[styles.badgePaiement, { borderColor: couleur + '60', backgroundColor: couleur + '15' }]}>
      <Ionicons name={icone} size={11} color={couleur} />
      <Text style={[styles.badgePaiementTxt, { color: couleur }]}>{label}</Text>
    </View>
  );
}

// ── Config des statuts ────────────────────────────────────────────────────────
const STATUT_CONFIG: Record<Reservation['statut'], { label: string; couleur: string; icone: any }> = {
  en_attente: { label: 'En attente',  couleur: Colors.warning,       icone: 'time-outline' },
  confirmee:  { label: 'Confirmée',   couleur: Colors.success,       icone: 'checkmark-circle-outline' },
  en_cours:   { label: 'En cours',    couleur: Colors.info,          icone: 'play-circle-outline' },
  terminee:   { label: 'Terminée',    couleur: Colors.textSecondary, icone: 'checkmark-done-outline' },
  annulee:    { label: 'Annulée',     couleur: Colors.error,         icone: 'close-circle-outline' },
};

// ── Carte réservation ─────────────────────────────────────────────────────────
function CarteReservation({
  reservation, estProprietaire, onActionner, onPayer, onVerifier, paiementEnCours,
}: {
  reservation: Reservation;
  estProprietaire: boolean;
  onActionner: (r: Reservation) => void;
  onPayer: (r: Reservation) => void;
  onVerifier: (r: Reservation) => void;
  paiementEnCours: boolean;
}) {
  const cfg      = STATUT_CONFIG[reservation.statut];
  const iconeT   = reservation.type === 'vehicule' ? 'car-sport-outline' : 'home-outline';
  const typeLabel = reservation.type === 'vehicule' ? '🚗 Véhicule' : '🏠 Logement';

  return (
    <View style={styles.carte}>
      {/* Image ou icône */}
      <View style={styles.carteGauche}>
        {reservation.imageUrl ? (
          <Image source={{ uri: reservation.imageUrl }} style={styles.annonceImage} resizeMode="cover" />
        ) : (
          <View style={[styles.typeIcone, {
            backgroundColor: reservation.type === 'vehicule' ? '#0f1f2e' : '#0f2e1a',
            borderWidth: 1,
            borderColor: (reservation.type === 'vehicule' ? Colors.accent : Colors.success) + '40',
          }]}>
            <Ionicons name={iconeT} size={28} color={reservation.type === 'vehicule' ? Colors.accent : Colors.success} />
          </View>
        )}
        <View style={[styles.badgeStatut, { backgroundColor: cfg.couleur + '20', borderColor: cfg.couleur + '60' }]}>
          <Ionicons name={cfg.icone} size={10} color={cfg.couleur} />
          <Text style={[styles.badgeStatutTxt, { color: cfg.couleur }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.carteCentre}>
        {/* Titre annonce */}
        <Text style={styles.carteTitre} numberOfLines={1}>
          {reservation.titreAnnonce ?? typeLabel}
        </Text>
        <Text style={styles.carteType}>{typeLabel}</Text>

        {/* Dates */}
        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
          <Text style={styles.datesTxt}>
            {formatDateCourte(reservation.dateDebut)} → {formatDateCourte(reservation.dateFin)}
          </Text>
          <Text style={styles.joursTag}>{reservation.nombreJours}j</Text>
        </View>

        {/* Prix + action */}
        <View style={styles.carteBottomRow}>
          <Text style={styles.prixTotal}>{formatPrix(reservation.prixTotal)}</Text>
          {(reservation.statut === 'en_attente' || reservation.statut === 'confirmee') && (
            <Pressable style={styles.btnAction} onPress={() => onActionner(reservation)}>
              <Text style={styles.btnActionTxt}>
                {estProprietaire && reservation.statut === 'en_attente' ? 'Gérer' : 'Détails'}
              </Text>
            </Pressable>
          )}
        </View>

        <BadgePaiement reservation={reservation} />

        {/* Paiement Mobile Money (locataire, après confirmation du propriétaire) */}
        {!estProprietaire && doitPayer(reservation) && (
          <View style={styles.paiementRow}>
            <Pressable
              style={[styles.btnPayer, paiementEnCours && { opacity: 0.6 }]}
              onPress={() => onPayer(reservation)}
              disabled={paiementEnCours}
            >
              {paiementEnCours
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="phone-portrait-outline" size={15} color={Colors.white} />}
              <Text style={styles.btnPayerTxt}>Payer {formatPrix(reservation.prixTotal)}</Text>
            </Pressable>
            {reservation.statutPaiement === 'en_cours' && (
              <Pressable onPress={() => onVerifier(reservation)} disabled={paiementEnCours} hitSlop={8}>
                <Text style={styles.lienVerifier}>J'ai payé</Text>
              </Pressable>
            )}
          </View>
        )}

        {reservation.message ? (
          <Text style={styles.message} numberOfLines={1}>💬 {reservation.message}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function MesReservationsScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();

  const [onglet,    setOnglet]    = useState<'mes' | 'recues'>('mes');
  const [mesRes,    setMesRes]    = useState<Reservation[]>([]);
  const [recues,    setRecues]    = useState<Reservation[]>([]);
  const [chargement,setChargement]= useState(true);
  const [rafraich,  setRafraich]  = useState(false);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    if (!utilisateur) return;
    try {
      const [m, r] = await Promise.all([
        getMesReservations(utilisateur.id),
        getReservationsRecues(utilisateur.id),
      ]);
      setMesRes(m);
      setRecues(r);
    } catch {}
    finally { setChargement(false); setRafraich(false); }
  }, [utilisateur]);

  useEffect(() => { charger(); }, []);

  // ── Paiement Mobile Money ─────────────────────────────────────────────────
  const [paiementId, setPaiementId] = useState<string | null>(null);
  // Réservation dont la page CinetPay est ouverte → à vérifier au retour
  const enAttenteRetour = useRef<string | null>(null);

  const verifier = useCallback(async (reservationId: string, silencieux = false) => {
    setPaiementId(reservationId);
    try {
      const statut = await verifierPaiement(reservationId);
      if (statut === 'paye') {
        Alert.alert('Paiement reçu ✅', 'Ta réservation est payée. Bonne location !');
      } else if (statut === 'echoue') {
        Alert.alert('Paiement échoué', 'Le paiement a été refusé ou annulé. Tu peux réessayer.');
      } else if (!silencieux) {
        Alert.alert('Paiement en attente', 'Valide le paiement sur ton téléphone (code ou notification de ton opérateur), puis réessaie.');
      }
    } catch (e: any) {
      if (!silencieux) Alert.alert('Erreur', e.message ?? 'Vérification impossible.');
    } finally {
      setPaiementId(null);
      charger(true);
    }
  }, [charger]);

  const payer = async (r: Reservation) => {
    setPaiementId(r.id);
    try {
      const { paymentUrl } = await initierPaiement(r.id);
      enAttenteRetour.current = r.id;
      await Linking.openURL(paymentUrl);
    } catch (e: any) {
      Alert.alert('Paiement impossible', e.message ?? 'Réessaie dans un instant.');
    } finally {
      setPaiementId(null);
      charger(true);
    }
  };

  // Au retour dans l'app (après la page CinetPay) → vérifier automatiquement
  useEffect(() => {
    const abonnement = AppState.addEventListener('change', etat => {
      if (etat === 'active' && enAttenteRetour.current) {
        const id = enAttenteRetour.current;
        enAttenteRetour.current = null;
        verifier(id, true);
      }
    });
    return () => abonnement.remove();
  }, [verifier]);

  const gererReservation = (r: Reservation) => {
    if (!utilisateur) return;
    const estProp = r.proprietaireId === utilisateur.id;

    if (estProp && r.statut === 'en_attente') {
      Alert.alert('Gérer la réservation', `Que faire avec cette demande ?`, [
        {
          text: '✅ Confirmer',
          onPress: async () => {
            await changerStatutReservation(r.id, 'confirmee');
            charger(true);
          },
        },
        {
          text: '❌ Refuser',
          style: 'destructive',
          onPress: async () => {
            await changerStatutReservation(r.id, 'annulee');
            charger(true);
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]);
    } else if (r.statut === 'confirmee') {
      Alert.alert('Réservation confirmée', `Du ${formatDateCourte(r.dateDebut)} au ${formatDateCourte(r.dateFin)}\nTotal : ${formatPrix(r.prixTotal)}`, [
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Confirmer l\'annulation', 'Es-tu sûr de vouloir annuler ?', [
              {
                text: 'Oui, annuler',
                style: 'destructive',
                onPress: async () => { await changerStatutReservation(r.id, 'annulee'); charger(true); },
              },
              { text: 'Non', style: 'cancel' },
            ]);
          },
        },
        { text: 'Fermer', style: 'cancel' },
      ]);
    }
  };

  const donnees = onglet === 'mes' ? mesRes : recues;
  const enAttente = recues.filter(r => r.statut === 'en_attente').length;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitre}>Mes réservations</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Onglets */}
      <View style={styles.onglets}>
        <Pressable style={[styles.onglet, onglet === 'mes' && styles.ongletActif]} onPress={() => setOnglet('mes')}>
          <Ionicons name="person-outline" size={16} color={onglet === 'mes' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.ongletTxt, onglet === 'mes' && styles.ongletTxtActif]}>Mes locations</Text>
          {mesRes.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{mesRes.length}</Text></View>}
        </Pressable>
        <Pressable style={[styles.onglet, onglet === 'recues' && styles.ongletActif]} onPress={() => setOnglet('recues')}>
          <Ionicons name="home-outline" size={16} color={onglet === 'recues' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.ongletTxt, onglet === 'recues' && styles.ongletTxtActif]}>Demandes reçues</Text>
          {enAttente > 0 && <View style={[styles.badge, styles.badgeAlerte]}><Text style={styles.badgeTxt}>{enAttente}</Text></View>}
        </Pressable>
      </View>

      {chargement ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : (
        <FlatList
          data={donnees}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <CarteReservation
              reservation={item}
              estProprietaire={item.proprietaireId === utilisateur?.id}
              onActionner={gererReservation}
              onPayer={payer}
              onVerifier={r => verifier(r.id)}
              paiementEnCours={paiementId === item.id}
            />
          )}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={rafraich} onRefresh={() => { setRafraich(true); charger(true); }} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="calendar-outline" size={60} color={Colors.textLight} />
              <Text style={styles.videT}>
                {onglet === 'mes' ? 'Aucune location effectuée' : 'Aucune demande reçue'}
              </Text>
              <Text style={styles.videS}>
                {onglet === 'mes'
                  ? 'Tes futures locations apparaîtront ici.'
                  : 'Les demandes de location pour tes annonces apparaîtront ici.'}
              </Text>
              {onglet === 'mes' && (
                <Pressable style={styles.videBtn} onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.videBtnTxt}>Explorer les annonces</Text>
                </Pressable>
              )}
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
  headerTitre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },

  onglets: {
    flexDirection: 'row', margin: 16, gap: 8,
    backgroundColor: Colors.glass, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  onglet: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  ongletActif: { backgroundColor: Colors.accent },
  ongletTxt:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  ongletTxtActif:{ color: Colors.white },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 18, alignItems: 'center',
  },
  badgeAlerte: { backgroundColor: Colors.error },
  badgeTxt:    { fontSize: 10, fontWeight: '800', color: Colors.white },

  liste: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },

  carte: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  carteGauche: { alignItems: 'center', gap: 8, paddingTop: 2 },
  annonceImage: { width: 72, height: 72, borderRadius: 14 },
  typeIcone: {
    width: 72, height: 72, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeStatut: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 50, borderWidth: 1,
  },
  badgeStatutTxt: { fontSize: 9, fontWeight: '700' },
  carteCentre: { flex: 1, gap: 5 },
  carteTitre:  { fontSize: 15, fontWeight: '800', color: Colors.white },
  carteType:   { fontSize: 12, color: Colors.textSecondary, marginTop: -3 },

  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  datesTxt: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  joursTag: {
    fontSize: 11, fontWeight: '700', color: Colors.accent,
    backgroundColor: Colors.accent + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 50,
  },

  carteBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  prixTotal: { fontSize: 16, fontWeight: '900', color: Colors.accent },
  btnAction: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.accent + '60',
  },
  btnActionTxt: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  message: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },

  badgePaiement: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1,
  },
  badgePaiementTxt: { fontSize: 11, fontWeight: '700' },
  paiementRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  btnPayer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnPayerTxt:  { fontSize: 13, fontWeight: '800', color: Colors.white },
  lienVerifier: { fontSize: 12, fontWeight: '700', color: Colors.accent, textDecorationLine: 'underline' },

  vide:    { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  videT:   { fontSize: 17, fontWeight: '800', color: Colors.white },
  videS:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  videBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  videBtnTxt: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
