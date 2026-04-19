// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Profil utilisateur
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/config/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { deconnecter } from '../../src/services/auth.service';
import { initiales, formatDate } from '../../src/utils/formatters';

// ── Ligne de menu réutilisable ────────────────────────────────────────────────
function LigneMenu({
  icone, label, onPress, valeur, couleur = Colors.textPrimary,
  toggle, toggleValeur, onToggle, danger = false,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  valeur?: string;
  couleur?: string;
  toggle?: boolean;
  toggleValeur?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.ligne} onPress={onPress}>
      <View style={[styles.ligneIcone, { backgroundColor: couleur + '20' }]}>
        <Ionicons name={icone} size={20} color={couleur} />
      </View>
      <Text style={[styles.ligneLabel, { color: danger ? Colors.error : Colors.textPrimary }]}>
        {label}
      </Text>
      {toggle ? (
        <Switch
          value={toggleValeur}
          onValueChange={onToggle}
          trackColor={{ true: Colors.accent, false: Colors.border }}
          thumbColor={Colors.white}
        />
      ) : (
        <>
          {valeur ? <Text style={styles.ligneValeur}>{valeur}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </>
      )}
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const router = useRouter();
  const { utilisateur, reinitialiser } = useAuthStore();
  const [notifs, setNotifs] = useState(true);

  // ── Déconnexion ──────────────────────────────────────────────────────────
  const seDeconnecter = async () => {
    try {
      await deconnecter(); // signOut Firebase
    } catch (_) {
      // Si Firebase échoue, on déconnecte quand même localement
    } finally {
      reinitialiser();                        // vide le store Zustand
      router.replace('/(auth)/welcome');      // redirige vers login
    }
  };

  // Si pas connecté → ne rien afficher
  if (!utilisateur) return null;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Titre ── */}
        <Text style={styles.titrePage}>Mon Profil</Text>

        {/* ══ CARTE PROFIL ══ */}
        <View style={styles.carteProfil}>
          {/* Avatar avec initiales */}
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {initiales(utilisateur.nom, utilisateur.prenom)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nom}>{utilisateur.prenom} {utilisateur.nom}</Text>
            <Text style={styles.email}>{utilisateur.email}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.ville}>{utilisateur.ville}</Text>

              {utilisateur.isVerifie && (
                <View style={styles.badgeVerifie}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                  <Text style={styles.badgeVerifieTxt}>Vérifié</Text>
                </View>
              )}
            </View>

            <Text style={styles.depuis}>
              Membre depuis {formatDate(utilisateur.createdAt)}
            </Text>
          </View>
        </View>

        {/* ══ STATISTIQUES ══ */}
        <View style={styles.statsRow}>
          {[
            { icone: 'star' as const,             valeur: utilisateur.note.toFixed(1),           label: 'Note' },
            { icone: 'chatbubble-outline' as const, valeur: String(utilisateur.nombreAvis),       label: 'Avis' },
            { icone: 'shield-checkmark-outline' as const, valeur: utilisateur.isProprietaire ? 'Oui' : 'Non', label: 'Bailleur' },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
              <Ionicons name={s.icone} size={20} color={Colors.accent} />
              <Text style={styles.statValeur}>{s.valeur}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ══ MENU — Mon compte ══ */}
        <Text style={styles.sectionTitre}>Mon compte</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="person-outline"   label="Modifier mon profil"  couleur={Colors.accent} onPress={() => router.push('/modifier-profil')} />
          <LigneMenu icone="car-outline"      label="Mes véhicules"         couleur={Colors.accent} onPress={() => router.push('/mes-vehicules')} />
          <LigneMenu icone="home-outline"     label="Mes logements"         couleur={Colors.accent} onPress={() => router.push('/mes-logements')} />
          <LigneMenu icone="calendar-outline" label="Mes réservations"      couleur={Colors.accent} onPress={() => router.push('/mes-reservations')} />
        </View>

        {/* ══ MENU — Préférences ══ */}
        <Text style={styles.sectionTitre}>Préférences</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="notifications-outline" label="Notifications"  couleur={Colors.info}    toggle toggleValeur={notifs} onToggle={setNotifs} />
          <LigneMenu icone="language-outline"      label="Langue"         couleur={Colors.info}    valeur="Français" onPress={() => {}} />
          <LigneMenu icone="help-circle-outline"   label="Aide & Support" couleur={Colors.info}    onPress={() => {}} />
        </View>

        {/* ══ BOUTON DÉCONNEXION ══ */}
        <Pressable style={styles.btnDeconnexion} onPress={seDeconnecter}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.btnDeconnexionTxt}>Se déconnecter</Text>
        </Pressable>

        <Text style={styles.version}>BABI RENT v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  titrePage: {
    fontSize: 26, fontWeight: '900', color: Colors.white,
    paddingHorizontal: 20, marginTop: 8, marginBottom: 20,
  },

  // ── Carte profil ──
  carteProfil: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.card, borderRadius: 20,
    padding: 20, marginHorizontal: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  avatarTxt: { color: Colors.white, fontSize: 24, fontWeight: '900' },
  nom: { fontSize: 17, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  email: { fontSize: 13, color: Colors.textSecondary, marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  ville: { fontSize: 13, color: Colors.textSecondary },
  badgeVerifie: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6,
    backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: 50,
  },
  badgeVerifieTxt: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  depuis: { fontSize: 11, color: Colors.textLight },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: 16, marginHorizontal: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statValeur: { fontSize: 18, fontWeight: '900', color: Colors.white },
  statLabel: { fontSize: 11, color: Colors.textSecondary },

  // ── Sections menu ──
  sectionTitre: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    paddingHorizontal: 20, marginBottom: 8, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  groupe: {
    backgroundColor: Colors.card, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ligneIcone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ligneLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  ligneValeur: { fontSize: 13, color: Colors.textSecondary, marginRight: 4 },

  // ── Bouton déconnexion ──
  btnDeconnexion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 20,
    paddingVertical: 15, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.35)',
  },
  btnDeconnexionTxt: { fontSize: 16, fontWeight: '700', color: Colors.error },

  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 8 },
});
