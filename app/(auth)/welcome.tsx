// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Welcome Screen (Connexion / Inscription)
// Thème : dark navy + orange — design mobile natif
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Alert, Platform, KeyboardAvoidingView,
  Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import {
  connecter, inscrire, reinitialiserMotDePasse, getProfilUtilisateur,
} from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/useAuthStore';

const { width } = Dimensions.get('window');

// ── Étapes inscription ────────────────────────────────────────────────────────
const ETAPES = ['Compte', 'Détails', 'Ville'];

// ── Barre de progression ──────────────────────────────────────────────────────
function ProgressBar({ etape }: { etape: number }) {
  return (
    <View style={pb.conteneur}>
      {ETAPES.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <View style={[pb.ligne, i <= etape && pb.ligneActif]} />
          )}
          <View style={pb.item}>
            <View style={[pb.cercle, i <= etape && pb.cercleActif]}>
              {i < etape
                ? <Ionicons name="checkmark" size={11} color={Colors.white} />
                : <Text style={[pb.num, i === etape && { color: Colors.white }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[pb.label, i <= etape && pb.labelActif]}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
const pb = StyleSheet.create({
  conteneur: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 28, marginTop: 4 },
  ligne: { flex: 1, height: 2, backgroundColor: Colors.border, marginTop: 11 },
  ligneActif: { backgroundColor: Colors.accent },
  item: { alignItems: 'center', gap: 5 },
  cercle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cercleActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  num: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700' },
  label: { fontSize: 9, color: Colors.textLight, fontWeight: '600', letterSpacing: 0.3 },
  labelActif: { color: Colors.accent },
});

// ── Champ input ───────────────────────────────────────────────────────────────
function Champ({
  icone, label, motDePasse = false, ...props
}: {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  motDePasse?: boolean;
  [key: string]: any;
}) {
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={ch.groupe}>
      <Text style={ch.label}>{label}</Text>
      <View style={[ch.champ, focus && ch.champFocus]}>
        <Ionicons name={icone} size={17} color={focus ? Colors.accent : Colors.textLight} />
        <TextInput
          style={ch.input}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={motDePasse && !visible}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...props}
        />
        {motDePasse && (
          <Pressable onPress={() => setVisible(v => !v)}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textLight} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
const ch = StyleSheet.create({
  groupe: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 7, letterSpacing: 0.3 },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  champFocus: { borderColor: Colors.accent, backgroundColor: 'rgba(232,119,34,0.08)' },
  input: { flex: 1, fontSize: 14, color: Colors.white },
});

// ── Boutons sociaux ───────────────────────────────────────────────────────────
function SocialBtns() {
  return (
    <View style={soc.row}>
      {[
        { icone: 'logo-google' as const, couleur: '#EA4335', label: 'Google' },
        { icone: 'logo-facebook' as const, couleur: '#1877F2', label: 'Facebook' },
        { icone: 'logo-apple' as const, couleur: Colors.white, label: 'Apple' },
      ].map(({ icone, couleur, label }) => (
        <Pressable key={label} style={soc.btn}>
          <Ionicons name={icone} size={19} color={couleur} />
          <Text style={soc.txt}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const soc = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  txt: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function WelcomeScreen() {
  const router = useRouter();
  const { setUtilisateur } = useAuthStore();

  // ── Onglet actif ─────────────────────────────────────────────────────────
  const [onglet, setOnglet] = useState<'connexion' | 'inscription'>('connexion');
  const [etape, setEtape] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Connexion ────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMdp, setLoginMdp]     = useState('');
  const [loginLoad, setLoginLoad]   = useState(false);

  // ── Inscription ──────────────────────────────────────────────────────────
  const [regEmail, setRegEmail]     = useState('');
  const [regMdp, setRegMdp]         = useState('');
  const [regMdpConf, setRegMdpConf] = useState('');
  const [regPrenom, setRegPrenom]   = useState('');
  const [regNom, setRegNom]         = useState('');
  const [regTel, setRegTel]         = useState('');
  const [regVille, setRegVille]     = useState('Abidjan');
  const [regLoad, setRegLoad]       = useState(false);

  // ── Changer d'onglet avec animation ──────────────────────────────────────
  const changerOnglet = (nouvel: 'connexion' | 'inscription') => {
    if (nouvel === onglet) return;
    Animated.spring(slideAnim, {
      toValue: nouvel === 'inscription' ? 1 : 0,
      useNativeDriver: true, friction: 8, tension: 70,
    }).start();
    setOnglet(nouvel);
    setEtape(0);
  };

  // Position de l'indicateur actif
  const indicateurX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width - 48) / 2],
  });

  // ── Étapes inscription ───────────────────────────────────────────────────
  const etapeSuivante = () => {
    if (etape === 0) {
      if (!regEmail.trim() || !/\S+@\S+\.\S+/.test(regEmail)) {
        Alert.alert('Email invalide'); return;
      }
      if (regMdp.length < 6) { Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.'); return; }
      if (regMdp !== regMdpConf) { Alert.alert('Mots de passe différents'); return; }
    }
    if (etape === 1) {
      if (!regPrenom.trim() || !regNom.trim()) { Alert.alert('Prénom et nom requis'); return; }
    }
    setEtape(e => e + 1);
  };

  // ── Actions Firebase ─────────────────────────────────────────────────────
  const seConnecter = async () => {
    if (!loginEmail.trim() || !loginMdp) { Alert.alert('Champs manquants'); return; }
    setLoginLoad(true);
    try {
      const user = await connecter(loginEmail.trim(), loginMdp);
      const profil = await getProfilUtilisateur(user.uid);
      setUtilisateur(profil);
      router.replace('/(tabs)');
    } catch (err: any) {
      let msg = 'Email ou mot de passe incorrect';
      if (err.code === 'auth/too-many-requests') msg = 'Trop de tentatives. Réessaie plus tard.';
      Alert.alert('Connexion impossible', msg);
    } finally { setLoginLoad(false); }
  };

  const oublieMdp = async () => {
    if (!loginEmail.trim()) { Alert.alert('Entre ton email d\'abord.'); return; }
    try {
      await reinitialiserMotDePasse(loginEmail.trim());
      Alert.alert('Email envoyé !', 'Vérifie ta boîte mail.');
    } catch { Alert.alert('Erreur', 'Email introuvable.'); }
  };

  const sInscrire = async () => {
    setRegLoad(true);
    try {
      const profil = await inscrire(regEmail.trim(), regMdp, regNom.trim(), regPrenom.trim(), regTel.trim(), regVille);
      setUtilisateur(profil);
      router.replace('/(tabs)');
    } catch (err: any) {
      let msg = "Erreur d'inscription";
      if (err.code === 'auth/email-already-in-use') msg = 'Cet email est déjà utilisé.';
      Alert.alert('Inscription impossible', msg);
    } finally { setRegLoad(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >

        {/* ── LOGO ── */}
        <View style={styles.logoZone}>
          <View style={styles.logoIcone}>
            <Ionicons name="home" size={28} color={Colors.white} />
          </View>
          <Text style={styles.logoTxt}>
            <Text style={styles.logoBabi}>Babi</Text>
            <Text style={styles.logoRent}> Rent</Text>
          </Text>
        </View>

        {/* ── TITRE ── */}
        <Text style={styles.titre}>
          {onglet === 'connexion' ? 'Bon retour 👋' : 'Créer un compte'}
        </Text>
        <Text style={styles.sousTitre}>
          {onglet === 'connexion'
            ? 'Connecte-toi pour accéder à tes annonces'
            : 'Rejoins la marketplace de location en Afrique'}
        </Text>

        {/* ── ONGLETS ── */}
        <View style={styles.onglets}>
          <Animated.View style={[styles.ongletIndicateur, { transform: [{ translateX: indicateurX }] }]} />
          <Pressable style={styles.onglet} onPress={() => changerOnglet('connexion')}>
            <Text style={[styles.ongletTxt, onglet === 'connexion' && styles.ongletTxtActif]}>
              Connexion
            </Text>
          </Pressable>
          <Pressable style={styles.onglet} onPress={() => changerOnglet('inscription')}>
            <Text style={[styles.ongletTxt, onglet === 'inscription' && styles.ongletTxtActif]}>
              Inscription
            </Text>
          </Pressable>
        </View>

        {/* ══ FORMULAIRE CONNEXION ══ */}
        {onglet === 'connexion' && (
          <View style={styles.form}>
            <SocialBtns />

            <View style={styles.separateurRow}>
              <View style={styles.separateurLigne} />
              <Text style={styles.separateurTxt}>ou par email</Text>
              <View style={styles.separateurLigne} />
            </View>

            <Champ
              icone="mail-outline"
              label="Adresse email"
              placeholder="exemple@email.com"
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Champ
              icone="lock-closed-outline"
              label="Mot de passe"
              placeholder="••••••••"
              value={loginMdp}
              onChangeText={setLoginMdp}
              motDePasse
            />

            <Pressable onPress={oublieMdp} style={styles.lienOublie}>
              <Text style={styles.lienOublieTxt}>Mot de passe oublié ?</Text>
            </Pressable>

            <Pressable
              style={[styles.btnPrincipal, loginLoad && { opacity: 0.6 }]}
              onPress={seConnecter}
              disabled={loginLoad}
            >
              <Text style={styles.btnPrincipalTxt}>
                {loginLoad ? 'Connexion...' : 'Se connecter'}
              </Text>
              {!loginLoad && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
            </Pressable>
          </View>
        )}

        {/* ══ FORMULAIRE INSCRIPTION ══ */}
        {onglet === 'inscription' && (
          <View style={styles.form}>
            <ProgressBar etape={etape} />

            {/* Étape 0 — Email + Mot de passe */}
            {etape === 0 && (
              <>
                <SocialBtns />
                <View style={styles.separateurRow}>
                  <View style={styles.separateurLigne} />
                  <Text style={styles.separateurTxt}>ou par email</Text>
                  <View style={styles.separateurLigne} />
                </View>
                <Champ icone="mail-outline" label="Email" placeholder="exemple@email.com"
                  value={regEmail} onChangeText={setRegEmail} keyboardType="email-address" autoCapitalize="none" />
                <Champ icone="lock-closed-outline" label="Mot de passe" placeholder="Minimum 6 caractères"
                  value={regMdp} onChangeText={setRegMdp} motDePasse />
                <Champ icone="shield-checkmark-outline" label="Confirmer le mot de passe" placeholder="Répète le mot de passe"
                  value={regMdpConf} onChangeText={setRegMdpConf} motDePasse />
                <Pressable style={styles.btnPrincipal} onPress={etapeSuivante}>
                  <Text style={styles.btnPrincipalTxt}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </Pressable>
              </>
            )}

            {/* Étape 1 — Prénom, Nom, Téléphone */}
            {etape === 1 && (
              <>
                <Champ icone="person-outline" label="Prénom" placeholder="Ton prénom"
                  value={regPrenom} onChangeText={setRegPrenom} />
                <Champ icone="person-outline" label="Nom de famille" placeholder="Ton nom"
                  value={regNom} onChangeText={setRegNom} />
                <Champ icone="call-outline" label="Téléphone" placeholder="+225 07 00 00 00 00"
                  value={regTel} onChangeText={setRegTel} keyboardType="phone-pad" />
                <View style={styles.rangee}>
                  <Pressable style={[styles.btnSecondaire, { flex: 1 }]} onPress={() => setEtape(0)}>
                    <Ionicons name="arrow-back" size={16} color={Colors.accent} />
                    <Text style={styles.btnSecondaireTxt}>Retour</Text>
                  </Pressable>
                  <Pressable style={[styles.btnPrincipal, { flex: 2 }]} onPress={etapeSuivante}>
                    <Text style={styles.btnPrincipalTxt}>Suivant</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                  </Pressable>
                </View>
              </>
            )}

            {/* Étape 2 — Ville */}
            {etape === 2 && (
              <>
                <Text style={styles.villeLabel}>Choisis ta ville</Text>
                <View style={styles.villesGrid}>
                  {['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa'].map(v => (
                    <Pressable
                      key={v}
                      style={[styles.villePill, regVille === v && styles.villePillActif]}
                      onPress={() => setRegVille(v)}
                    >
                      <Text style={[styles.villeTxt, regVille === v && styles.villeTxtActif]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.rangee}>
                  <Pressable style={[styles.btnSecondaire, { flex: 1 }]} onPress={() => setEtape(1)}>
                    <Ionicons name="arrow-back" size={16} color={Colors.accent} />
                    <Text style={styles.btnSecondaireTxt}>Retour</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btnPrincipal, { flex: 2 }, regLoad && { opacity: 0.6 }]}
                    onPress={sInscrire}
                    disabled={regLoad}
                  >
                    <Ionicons name="rocket-outline" size={16} color={Colors.white} />
                    <Text style={styles.btnPrincipalTxt}>{regLoad ? 'Création...' : 'Créer mon compte'}</Text>
                  </Pressable>
                </View>
              </>
            )}

          </View>
        )}

        {/* ── Lien bas ── */}
        <View style={styles.piedRow}>
          <Text style={styles.piedTxt}>
            {onglet === 'connexion' ? "Pas encore de compte ? " : "Déjà un compte ? "}
          </Text>
          <Pressable onPress={() => changerOnglet(onglet === 'connexion' ? 'inscription' : 'connexion')}>
            <Text style={styles.piedLien}>
              {onglet === 'connexion' ? "S'inscrire" : "Se connecter"}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },

  // Logo
  logoZone: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIcone: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  logoTxt: { fontSize: 26, fontWeight: '900' },
  logoBabi: { color: Colors.white },
  logoRent: { color: Colors.accent, fontStyle: 'italic' },

  // Titre
  titre: { fontSize: 28, fontWeight: '900', color: Colors.white, marginBottom: 6 },
  sousTitre: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 28 },

  // Onglets
  onglets: {
    flexDirection: 'row', backgroundColor: Colors.glass,
    borderRadius: 14, padding: 4, marginBottom: 28,
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
  },
  ongletIndicateur: {
    position: 'absolute', top: 4, left: 4,
    width: '50%', height: '100%',
    backgroundColor: Colors.accent, borderRadius: 10,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  onglet: { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  ongletTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  ongletTxtActif: { color: Colors.white, fontWeight: '800' },

  // Formulaire
  form: { width: '100%' },

  // Séparateur
  separateurRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  separateurLigne: { flex: 1, height: 1, backgroundColor: Colors.border },
  separateurTxt: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  // Lien oublié
  lienOublie: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  lienOublieTxt: { fontSize: 13, color: Colors.accent, fontWeight: '600' },

  // Bouton principal
  btnPrincipal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    shadowColor: Colors.accent, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
    marginTop: 4,
  },
  btnPrincipalTxt: { color: Colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Bouton secondaire
  btnSecondaire: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 14,
    paddingVertical: 15, marginTop: 4,
    backgroundColor: 'transparent',
  },
  btnSecondaireTxt: { color: Colors.accent, fontSize: 14, fontWeight: '700' },

  rangee: { flexDirection: 'row', gap: 10 },

  // Villes
  villeLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12, fontWeight: '600' },
  villesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  villePill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  villePillActif: {
    backgroundColor: Colors.accent, borderColor: Colors.accent,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
  },
  villeTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  villeTxtActif: { color: Colors.white, fontWeight: '700' },

  // Pied
  piedRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' },
  piedTxt: { fontSize: 14, color: Colors.textSecondary },
  piedLien: { fontSize: 14, color: Colors.accent, fontWeight: '700' },
});
