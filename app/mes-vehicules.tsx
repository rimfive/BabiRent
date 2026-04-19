// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Mes véhicules publiés
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/config/colors';
import { getVehiculesProprietaire, supprimerVehicule } from '../src/services/vehicule.service';
import { useAuthStore } from '../src/store/useAuthStore';
import { Vehicule } from '../src/types';
import { formatPrix } from '../src/utils/formatters';

export default function MesVehiculesScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  // ID du véhicule en attente de confirmation de suppression
  const [supprimerConfirm, setSupprimerConfirm] = useState<string | null>(null);
  const [supprimerEnCours, setSupprimerEnCours] = useState(false);

  useEffect(() => {
    if (!utilisateur) return;
    charger();
  }, [utilisateur]);

  const charger = async () => {
    if (!utilisateur) return;
    setChargement(true);
    setErreur(null);
    try {
      const liste = await getVehiculesProprietaire(utilisateur.id);
      setVehicules(liste);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ── Supprimer un véhicule ───────────────────────────────────────────────
  const confirmerSuppression = async () => {
    if (!supprimerConfirm) return;
    setSupprimerEnCours(true);
    try {
      await supprimerVehicule(supprimerConfirm);
      setVehicules(p => p.filter(v => v.id !== supprimerConfirm));
      setSupprimerConfirm(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErreur(`Suppression impossible : ${msg}`);
      setSupprimerConfirm(null);
    } finally {
      setSupprimerEnCours(false);
    }
  };

  // ── Carte véhicule ──────────────────────────────────────────────────────
  const CarteVehicule = ({ item }: { item: Vehicule }) => (
    <Pressable
      style={styles.carte}
      onPress={() => router.push(`/vehicule/${item.id}`)}
    >
      {/* Photo */}
      <View style={styles.photoBox}>
        <Image
          source={{ uri: item.photos?.[0] ?? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400' }}
          style={styles.photo}
          resizeMode="cover"
        />
        {/* Badge disponibilité */}
        <View style={[styles.badge, { backgroundColor: item.disponible ? Colors.successLight : Colors.errorLight }]}>
          <View style={[styles.badgeDot, { backgroundColor: item.disponible ? Colors.success : Colors.error }]} />
          <Text style={[styles.badgeTxt, { color: item.disponible ? Colors.success : Colors.error }]}>
            {item.disponible ? 'Disponible' : 'Indisponible'}
          </Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.infos}>
        <View style={styles.infosTop}>
          <Text style={styles.nom}>{item.marque} {item.modele}</Text>
          <Text style={styles.prix}>{formatPrix(item.prixJour)}<Text style={styles.prixUnit}>/j</Text></Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.meta}>{item.ville}</Text>
          <Text style={styles.sep}>·</Text>
          <Ionicons name="car-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.meta}>{item.type}</Text>
          <Text style={styles.sep}>·</Text>
          <Text style={styles.meta}>{item.annee}</Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsRow}>
          <Ionicons name="star" size={13} color={Colors.accent} />
          <Text style={styles.note}>{item.note.toFixed(1)}</Text>
          <Text style={styles.avis}>({item.nombreAvis} avis)</Text>

          <View style={{ flex: 1 }} />

          {/* Bouton Modifier */}
          <Pressable
            style={styles.btnModif}
            onPress={() => router.push({ pathname: '/vehicule/modifier', params: { id: item.id } })}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={14} color={Colors.accent} />
            <Text style={styles.btnModifTxt}>Modifier</Text>
          </Pressable>

          {/* Bouton Supprimer */}
          <Pressable
            style={styles.btnSuppr}
            onPress={() => setSupprimerConfirm(item.id)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={14} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.page}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.titre}>Mes véhicules</Text>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/vehicule/publier')} hitSlop={16}>
          <Ionicons name="add" size={26} color={Colors.accent} />
        </Pressable>
      </View>

      {/* ── Dialog confirmation suppression ── */}
      {supprimerConfirm && (
        <>
          <Pressable style={styles.overlay} onPress={() => setSupprimerConfirm(null)} />
          <View style={styles.dialog}>
            <View style={styles.dialogIcone}>
              <Ionicons name="trash-outline" size={28} color={Colors.error} />
            </View>
            <Text style={styles.dialogTitre}>Supprimer ce véhicule ?</Text>
            <Text style={styles.dialogSous}>
              Cette action est irréversible. L'annonce sera définitivement supprimée.
            </Text>
            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogBtnAnnuler}
                onPress={() => setSupprimerConfirm(null)}
                disabled={supprimerEnCours}
              >
                <Text style={styles.dialogBtnAnnulerTxt}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtnSuppr, supprimerEnCours && { opacity: 0.6 }]}
                onPress={confirmerSuppression}
                disabled={supprimerEnCours}
              >
                {supprimerEnCours
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={styles.dialogBtnSupprTxt}>Supprimer</Text>
                }
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* ── Erreur globale ── */}
      {erreur && !chargement && (
        <View style={styles.bandeauErreur}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.bandeauErreurTxt} numberOfLines={2}>{erreur}</Text>
          <Pressable onPress={() => setErreur(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.error} />
          </Pressable>
        </View>
      )}

      {/* ── Contenu ── */}
      {chargement ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.chargementTxt}>Chargement...</Text>
        </View>
      ) : vehicules.length === 0 && !erreur ? (
        <View style={styles.centre}>
          <Ionicons name="car-outline" size={64} color={Colors.textLight} />
          <Text style={styles.videTitle}>Aucun véhicule publié</Text>
          <Text style={styles.videSous}>Publie ton premier véhicule et commence à gagner !</Text>
          <Pressable style={styles.btnPublier} onPress={() => router.push('/vehicule/publier')}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.btnPublierTxt}>Publier un véhicule</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={vehicules}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CarteVehicule item={item} />}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.compteLabel}>
              {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} publié{vehicules.length > 1 ? 's' : ''}
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
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  titre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },

  // ── Dialog suppression ──
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50,
  },
  dialog: {
    position: 'absolute', left: 24, right: 24,
    top: '35%', zIndex: 51,
    backgroundColor: Colors.card, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, elevation: 20,
  },
  dialogIcone: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.errorLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  dialogTitre: { fontSize: 18, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  dialogSous: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  dialogBtns: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  dialogBtnAnnuler: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  dialogBtnAnnulerTxt: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  dialogBtnSuppr: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  dialogBtnSupprTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },

  // ── Bandeau erreur ──
  bandeauErreur: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderBottomWidth: 1, borderBottomColor: Colors.error,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  bandeauErreurTxt: { flex: 1, color: Colors.error, fontSize: 13 },

  // ── États ──
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  chargementTxt: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  videTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  videSous: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  btnPublier: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  btnPublierTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },

  // ── Liste ──
  liste: { padding: 16, paddingBottom: 40 },
  compteLabel: {
    fontSize: 12, color: Colors.textSecondary, marginBottom: 14,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },

  // ── Carte ──
  carte: {
    backgroundColor: Colors.card, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  photoBox: { position: 'relative', height: 180 },
  photo: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },

  infos: { padding: 14 },
  infosTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 6,
  },
  nom: { fontSize: 16, fontWeight: '800', color: Colors.white, flex: 1 },
  prix: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  prixUnit: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  meta: { fontSize: 13, color: Colors.textSecondary },
  sep: { color: Colors.textLight, marginHorizontal: 2 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  note: { fontSize: 13, fontWeight: '700', color: Colors.white },
  avis: { fontSize: 12, color: Colors.textSecondary },

  btnModif: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(232,119,34,0.12)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(232,119,34,0.3)',
  },
  btnModifTxt: { fontSize: 13, fontWeight: '700', color: Colors.accent },

  btnSuppr: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    marginLeft: 6,
  },
});
