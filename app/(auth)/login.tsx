import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, Alert, ImageBackground, Dimensions, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { connecter, reinitialiserMotDePasse, getProfilUtilisateur } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/useAuthStore';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setUtilisateur } = useAuthStore();

  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [mdpVisible, setMdpVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const valider = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    if (!mdp) e.mdp = 'Mot de passe obligatoire';
    else if (mdp.length < 6) e.mdp = 'Minimum 6 caractères';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const seConnecter = async () => {
    if (!valider()) return;
    setLoading(true);
    try {
      const user = await connecter(email.trim(), mdp);
      const profil = await getProfilUtilisateur(user.uid);
      setUtilisateur(profil);
      router.replace('/(tabs)');
    } catch (err: any) {
      let msg = 'Erreur de connexion';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Email ou mot de passe incorrect';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Trop de tentatives. Réessaie dans quelques minutes.';
      }
      Alert.alert('Connexion impossible', msg);
    } finally {
      setLoading(false);
    }
  };

  const motDePasseOublie = async () => {
    if (!email.trim()) {
      Alert.alert('Email requis', 'Entre ton email pour recevoir le lien de réinitialisation.');
      return;
    }
    try {
      await reinitialiserMotDePasse(email.trim());
      Alert.alert('Email envoyé !', 'Vérifie ta boîte mail.');
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'email.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Hero haut ── */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900' }}
          style={styles.hero}
          blurRadius={2}
        >
          <View style={styles.heroOverlay}>
            <Pressable onPress={() => router.back()} style={styles.retour}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <View style={styles.heroLogo}>
              <View style={styles.logoIcone}>
                <Ionicons name="home" size={20} color={Colors.white} />
              </View>
              <Text style={styles.logoTexte}>
                <Text style={styles.logoBabi}>Babi</Text>
                <Text style={styles.logoRent}> Rent</Text>
              </Text>
            </View>
            <Text style={styles.heroTitre}>Bienvenue !</Text>
            <Text style={styles.heroSous}>Connectez-vous à votre espace personnel</Text>
          </View>
        </ImageBackground>

        {/* ── Carte formulaire blanche ── */}
        <View style={styles.carte}>

          {/* Onglets Connexion / Inscription */}
          <View style={styles.onglets}>
            <View style={[styles.onglet, styles.ongletActif]}>
              <Text style={[styles.ongletTxt, styles.ongletTxtActif]}>Connexion</Text>
            </View>
            <Pressable
              style={styles.onglet}
              onPress={() => router.replace('/(auth)/register')}
            >
              <Text style={styles.ongletTxt}>Inscription</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {/* Email */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>Adresse courriel *</Text>
              <View style={[styles.champ, erreurs.email ? styles.champErreur : null]}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="exemple@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={t => { setEmail(t); setErreurs(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {erreurs.email ? <Text style={styles.erreur}>{erreurs.email}</Text> : null}
            </View>

            {/* Mot de passe */}
            <View style={styles.champGroupe}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mot de passe *</Text>
                <Pressable onPress={motDePasseOublie}>
                  <Text style={styles.lienOublie}>Mot de passe oublié ?</Text>
                </Pressable>
              </View>
              <View style={[styles.champ, erreurs.mdp ? styles.champErreur : null]}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={mdp}
                  onChangeText={t => { setMdp(t); setErreurs(e => ({ ...e, mdp: '' })); }}
                  secureTextEntry={!mdpVisible}
                />
                <Pressable onPress={() => setMdpVisible(v => !v)}>
                  <Text style={styles.afficher}>{mdpVisible ? 'Masquer' : 'Afficher'}</Text>
                </Pressable>
              </View>
              {erreurs.mdp ? <Text style={styles.erreur}>{erreurs.mdp}</Text> : null}
            </View>

            {/* Bouton principal */}
            <Pressable
              style={[styles.btnPrincipal, loading && styles.btnDisabled]}
              onPress={seConnecter}
              disabled={loading}
            >
              {loading
                ? <Text style={styles.txtPrincipal}>Connexion en cours...</Text>
                : <Text style={styles.txtPrincipal}>Se connecter →</Text>
              }
            </Pressable>

            {/* Séparateur */}
            <View style={styles.separateur}>
              <View style={styles.ligne} />
              <Text style={styles.txOu}>ou continuer avec</Text>
              <View style={styles.ligne} />
            </View>

            {/* Boutons sociaux */}
            <View style={styles.sociauxRow}>
              <Pressable style={styles.btnSocial}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.txSocial}>Google</Text>
              </Pressable>
              <Pressable style={styles.btnSocial}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.txSocial}>Facebook</Text>
              </Pressable>
              <Pressable style={styles.btnSocial}>
                <Ionicons name="logo-apple" size={20} color="#111" />
                <Text style={styles.txSocial}>Apple</Text>
              </Pressable>
            </View>
          </View>

          {/* Pied */}
          <View style={styles.pied}>
            <Text style={styles.txPied}>Pas encore de compte ? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.lienPied}>Créer un compte gratuitement</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#F3F4F6' },

  // Hero
  hero: { width, height: 230 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,15,35,0.72)',
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: 'flex-end',
  },
  retour: {
    position: 'absolute', top: 52, left: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroLogo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  logoIcone: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoTexte: { fontSize: 22, fontWeight: '900' },
  logoBabi: { color: Colors.white },
  logoRent: { color: Colors.accent, fontStyle: 'italic' },
  heroTitre: { fontSize: 28, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  heroSous: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // Carte blanche
  carte: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingBottom: 40,
    minHeight: 600,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 8,
  },

  // Onglets
  onglets: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 28,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  onglet: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
  },
  ongletActif: { backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  ongletTxt: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  ongletTxtActif: { color: Colors.primary },

  // Formulaire
  form: { paddingHorizontal: 24 },
  champGroupe: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7, letterSpacing: 0.2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  lienOublie: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 13, backgroundColor: '#FAFAFA',
  },
  champErreur: { borderColor: Colors.error },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  afficher: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  erreur: { fontSize: 12, color: Colors.error, marginTop: 5, marginLeft: 2 },

  btnPrincipal: {
    backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 24,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  txtPrincipal: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 0.3 },

  // Séparateur + sociaux
  separateur: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  ligne: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  txOu: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  sociauxRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btnSocial: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA',
  },
  txSocial: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Pied
  pied: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: 24, flexWrap: 'wrap', paddingHorizontal: 24,
  },
  txPied: { fontSize: 14, color: '#6B7280' },
  lienPied: { fontSize: 14, color: Colors.accent, fontWeight: '700' },
});
