import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, Alert, ImageBackground, Dimensions, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../src/config/colors';
import { inscrire } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VILLES } from '../../src/config/constantes';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { setUtilisateur } = useAuthStore();

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '',
    telephone: '', ville: 'Abidjan', mdp: '', mdpConfirm: '',
  });
  const [mdpVisible, setMdpVisible] = useState(false);
  const [mdpConfirmVisible, setMdpConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const maj = (champ: string) => (val: string) => {
    setForm(f => ({ ...f, [champ]: val }));
    setErreurs(e => ({ ...e, [champ]: '' }));
  };

  const valider = () => {
    const e: Record<string, string> = {};
    if (!form.prenom.trim()) e.prenom = 'Obligatoire';
    if (!form.nom.trim()) e.nom = 'Obligatoire';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.telephone.trim()) e.telephone = 'Obligatoire';
    if (!form.mdp || form.mdp.length < 6) e.mdp = 'Minimum 6 caractères';
    if (form.mdp !== form.mdpConfirm) e.mdpConfirm = 'Les mots de passe ne correspondent pas';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const sInscrire = async () => {
    if (!valider()) return;
    setLoading(true);
    try {
      const profil = await inscrire(
        form.email.trim(), form.mdp,
        form.nom.trim(), form.prenom.trim(),
        form.telephone.trim(), form.ville,
      );
      setUtilisateur(profil);
      router.replace('/(tabs)');
    } catch (err: any) {
      let msg = "Erreur lors de l'inscription";
      if (err.code === 'auth/email-already-in-use') msg = 'Cet email est déjà utilisé.';
      if (err.code === 'auth/weak-password') msg = 'Mot de passe trop faible.';
      Alert.alert('Inscription impossible', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Hero haut ── */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900' }}
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
            <Text style={styles.heroTitre}>Créer un compte</Text>
            <Text style={styles.heroSous}>Rejoignez des milliers d'utilisateurs en Côte d'Ivoire</Text>
          </View>
        </ImageBackground>

        {/* ── Carte blanche ── */}
        <View style={styles.carte}>

          {/* Onglets */}
          <View style={styles.onglets}>
            <Pressable style={styles.onglet} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.ongletTxt}>Connexion</Text>
            </Pressable>
            <View style={[styles.onglet, styles.ongletActif]}>
              <Text style={[styles.ongletTxt, styles.ongletTxtActif]}>Inscription</Text>
            </View>
          </View>

          {/* ── Section 1 : Mon profil ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumTxt}>1</Text></View>
              <Text style={styles.sectionTitre}>Mon profil</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.rangee}>
                <View style={[styles.champGroupe, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <View style={[styles.champ, erreurs.prenom ? styles.champErreur : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Votre prénom"
                      placeholderTextColor="#9CA3AF"
                      value={form.prenom}
                      onChangeText={maj('prenom')}
                    />
                  </View>
                  {erreurs.prenom ? <Text style={styles.erreur}>{erreurs.prenom}</Text> : null}
                </View>
                <View style={[styles.champGroupe, { flex: 1 }]}>
                  <Text style={styles.label}>Nom de famille *</Text>
                  <View style={[styles.champ, erreurs.nom ? styles.champErreur : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Votre nom"
                      placeholderTextColor="#9CA3AF"
                      value={form.nom}
                      onChangeText={maj('nom')}
                    />
                  </View>
                  {erreurs.nom ? <Text style={styles.erreur}>{erreurs.nom}</Text> : null}
                </View>
              </View>

              <View style={styles.champGroupe}>
                <Text style={styles.label}>Adresse courriel *</Text>
                <View style={[styles.champ, erreurs.email ? styles.champErreur : null]}>
                  <Ionicons name="mail-outline" size={16} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="exemple@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={form.email}
                    onChangeText={maj('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {erreurs.email ? <Text style={styles.erreur}>{erreurs.email}</Text> : null}
              </View>

              <View style={styles.champGroupe}>
                <Text style={styles.label}>Téléphone *</Text>
                <View style={[styles.champ, erreurs.telephone ? styles.champErreur : null]}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="+225 07 00 00 00 00"
                    placeholderTextColor="#9CA3AF"
                    value={form.telephone}
                    onChangeText={maj('telephone')}
                    keyboardType="phone-pad"
                  />
                </View>
                {erreurs.telephone ? <Text style={styles.erreur}>{erreurs.telephone}</Text> : null}
              </View>
            </View>
          </View>

          {/* ── Section 2 : Ma ville ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumTxt}>2</Text></View>
              <Text style={styles.sectionTitre}>Ma ville</Text>
            </View>
            <View style={styles.form}>
              <View style={styles.champGroupe}>
                <Text style={styles.label}>Ville de résidence *</Text>
                <View style={styles.pickerConteneur}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Picker
                    selectedValue={form.ville}
                    onValueChange={maj('ville')}
                    style={styles.picker}
                    dropdownIconColor="#6B7280"
                  >
                    {VILLES.map(v => (
                      <Picker.Item key={v} label={v} value={v} color="#111827" />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 3 : Sécurité ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumTxt}>3</Text></View>
              <Text style={styles.sectionTitre}>Sécurité</Text>
            </View>
            <View style={styles.form}>
              {/* Règles mdp */}
              <View style={styles.reglesMdp}>
                <Text style={styles.regleTitre}>Votre mot de passe doit :</Text>
                {['Contenir au moins 6 caractères', 'Contenir une lettre', 'Contenir un chiffre'].map(r => (
                  <View key={r} style={styles.regleItem}>
                    <View style={styles.regleDot} />
                    <Text style={styles.regleTxt}>{r}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.champGroupe}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Mot de passe *</Text>
                  <Pressable onPress={() => setMdpVisible(v => !v)}>
                    <Text style={styles.afficher}>{mdpVisible ? 'Masquer' : 'Afficher'} 👁</Text>
                  </Pressable>
                </View>
                <View style={[styles.champ, erreurs.mdp ? styles.champErreur : null]}>
                  <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#9CA3AF"
                    value={form.mdp}
                    onChangeText={maj('mdp')}
                    secureTextEntry={!mdpVisible}
                  />
                </View>
                {erreurs.mdp ? <Text style={styles.erreur}>{erreurs.mdp}</Text> : null}
              </View>

              <View style={styles.champGroupe}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Confirmer le mot de passe *</Text>
                  <Pressable onPress={() => setMdpConfirmVisible(v => !v)}>
                    <Text style={styles.afficher}>{mdpConfirmVisible ? 'Masquer' : 'Afficher'} 👁</Text>
                  </Pressable>
                </View>
                <View style={[styles.champ, erreurs.mdpConfirm ? styles.champErreur : null]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Répétez votre mot de passe"
                    placeholderTextColor="#9CA3AF"
                    value={form.mdpConfirm}
                    onChangeText={maj('mdpConfirm')}
                    secureTextEntry={!mdpConfirmVisible}
                  />
                </View>
                {erreurs.mdpConfirm ? <Text style={styles.erreur}>{erreurs.mdpConfirm}</Text> : null}
              </View>
            </View>
          </View>

          {/* CGU + Bouton */}
          <View style={styles.piedForm}>
            <Text style={styles.txCgu}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={styles.lienCgu}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={styles.lienCgu}>Politique de confidentialité</Text>.
            </Text>

            <Pressable
              style={[styles.btnPrincipal, loading && styles.btnDisabled]}
              onPress={sInscrire}
              disabled={loading}
            >
              <Text style={styles.txtPrincipal}>
                {loading ? 'Création en cours...' : 'Créer mon compte →'}
              </Text>
            </Pressable>

            <View style={styles.pied}>
              <Text style={styles.txPied}>Déjà un compte ? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.lienPied}>Se connecter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#F3F4F6' },

  hero: { width, height: 220 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,15,35,0.72)',
    paddingTop: 52, paddingHorizontal: 24, paddingBottom: 28,
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
  heroTitre: { fontSize: 26, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  heroSous: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  carte: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 8,
  },

  onglets: {
    flexDirection: 'row', marginHorizontal: 24,
    marginTop: 24, marginBottom: 8,
    borderRadius: 12, backgroundColor: '#F3F4F6', padding: 4,
  },
  onglet: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  ongletActif: { backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  ongletTxt: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  ongletTxtActif: { color: Colors.primary },

  section: {
    borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 20, marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, marginBottom: 16,
  },
  sectionNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNumTxt: { fontSize: 13, fontWeight: '800', color: Colors.white },
  sectionTitre: { fontSize: 17, fontWeight: '700', color: '#111827' },

  form: { paddingHorizontal: 24 },
  rangee: { flexDirection: 'row', gap: 12 },
  champGroupe: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  afficher: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  champErreur: { borderColor: Colors.error },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  erreur: { fontSize: 11, color: Colors.error, marginTop: 4, marginLeft: 2 },

  pickerConteneur: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12,
    backgroundColor: '#FAFAFA', minHeight: 50,
  },
  picker: { flex: 1, color: '#111827' },

  reglesMdp: {
    backgroundColor: '#F0F9FF', borderRadius: 10,
    padding: 14, marginBottom: 18,
    borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
  regleTitre: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 },
  regleItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  regleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent },
  regleTxt: { fontSize: 12, color: '#6B7280' },

  piedForm: { paddingHorizontal: 24, paddingTop: 16 },
  txCgu: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 20 },
  lienCgu: { color: Colors.accent, fontWeight: '600' },

  btnPrincipal: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  txtPrincipal: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 0.3 },

  pied: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  txPied: { fontSize: 14, color: '#6B7280' },
  lienPied: { fontSize: 14, color: Colors.accent, fontWeight: '700' },
});
