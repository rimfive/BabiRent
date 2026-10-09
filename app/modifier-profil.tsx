import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/config/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import { mettreAJourProfil } from '../src/services/auth.service';
import { VILLES } from '../src/config/constantes';

function Champ({ label, icone, ...props }: any) {
  return (
    <View style={styles.champGroupe}>
      <Text style={styles.champLabel}>{label}</Text>
      <View style={styles.champBox}>
        {icone && <Ionicons name={icone} size={16} color={Colors.textSecondary} />}
        <TextInput
          style={styles.champInput}
          placeholderTextColor={Colors.textLight}
          {...props}
        />
      </View>
    </View>
  );
}

export default function ModifierProfilScreen() {
  const router = useRouter();
  const { utilisateur, setUtilisateur } = useAuthStore();
  const [loading, setLoading]   = useState(false);
  const [succes, setSucces]     = useState(false);
  const [erreur, setErreur]     = useState<string | null>(null);

  const [form, setForm] = useState({
    prenom:    utilisateur?.prenom    ?? '',
    nom:       utilisateur?.nom       ?? '',
    telephone: utilisateur?.telephone ?? '',
    ville:     utilisateur?.ville     ?? 'Abidjan',
  });

  // Redirige automatiquement 2 s après le succès
  useEffect(() => {
    if (!succes) return;
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile');
    }, 2000);
    return () => clearTimeout(t);
  }, [succes]);

  const maj = (champ: string) => (val: string) => {
    setErreur(null);
    setForm(p => ({ ...p, [champ]: val }));
  };

  const sauvegarder = async () => {
    if (!utilisateur) return;
    setErreur(null);

    if (!form.prenom.trim()) { setErreur('Le prénom est obligatoire.'); return; }
    if (!form.nom.trim())    { setErreur('Le nom est obligatoire.');    return; }

    setLoading(true);
    try {
      await mettreAJourProfil(utilisateur.id, {
        prenom:    form.prenom.trim(),
        nom:       form.nom.trim(),
        telephone: form.telephone.trim(),
        ville:     form.ville,
      });
      // Met à jour le store local immédiatement
      setUtilisateur({
        ...utilisateur,
        prenom:    form.prenom.trim(),
        nom:       form.nom.trim(),
        telephone: form.telephone.trim(),
        ville:     form.ville,
      });
      setSucces(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErreur('Erreur lors de la sauvegarde : ' + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!utilisateur) return null;

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
        <Text style={styles.titrePage}>Modifier mon profil</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* ── Bannière succès ── */}
      {succes && (
        <View style={styles.banniereSucces}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.banniereSuccesTxt}>
            Profil mis à jour ! Redirection en cours...
          </Text>
        </View>
      )}

      {/* ── Bannière erreur ── */}
      {erreur && (
        <View style={styles.banniereErreur}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
          <Text style={styles.banniereErreurTxt}>{erreur}</Text>
          <Pressable onPress={() => setErreur(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.error} />
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>
                {(form.prenom[0] ?? 'U').toUpperCase()}{(form.nom[0] ?? '').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.emailTxt}>{utilisateur.email}</Text>
            <Text style={styles.emailSous}>L'email ne peut pas être modifié</Text>
          </View>

          {/* ── Champs ── */}
          <View style={styles.carte}>
            <Champ
              label="Prénom *"
              value={form.prenom}
              onChangeText={maj('prenom')}
              placeholder="Ton prénom"
              icone="person-outline"
              editable={!succes}
            />
            <Champ
              label="Nom *"
              value={form.nom}
              onChangeText={maj('nom')}
              placeholder="Ton nom"
              icone="person-outline"
              editable={!succes}
            />
            <Champ
              label="Téléphone"
              value={form.telephone}
              onChangeText={maj('telephone')}
              placeholder="+225 07 00 00 00 00"
              icone="call-outline"
              keyboardType="phone-pad"
              editable={!succes}
            />
          </View>

          {/* ── Ville ── */}
          <Text style={styles.villeLabel}>Ville</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.villesList}
          >
            {VILLES.slice(0, 10).map(v => (
              <Pressable
                key={v}
                style={[styles.villePill, form.ville === v && styles.villePillActif]}
                onPress={() => { setErreur(null); maj('ville')(v); }}
                disabled={succes}
              >
                <Text style={[styles.villeTxt, form.ville === v && styles.villeTxtActif]}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Bouton ── */}
          <Pressable
            style={[
              styles.btnSauvegarder,
              (loading || succes) && { opacity: 0.7 },
              succes && { backgroundColor: Colors.success },
            ]}
            onPress={sauvegarder}
            disabled={loading || succes}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : succes ? (
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
            )}
            <Text style={styles.btnTxt}>
              {loading ? 'Sauvegarde en cours...'
                : succes ? 'Modifications sauvegardées ✓'
                : 'Sauvegarder les modifications'}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  titrePage: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.white },

  // ── Bannières ──
  banniereSucces: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.successLight,
    borderBottomWidth: 1, borderBottomColor: Colors.success,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  banniereSuccesTxt: { flex: 1, color: Colors.success, fontSize: 14, fontWeight: '700' },
  banniereErreur: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.errorLight,
    borderBottomWidth: 1, borderBottomColor: Colors.error,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  banniereErreurTxt: { flex: 1, color: Colors.error, fontSize: 13, fontWeight: '600' },

  scroll: { paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  avatarTxt: { fontSize: 28, fontWeight: '900', color: Colors.white },
  emailTxt: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  emailSous: { fontSize: 12, color: Colors.textLight },

  carte: {
    backgroundColor: Colors.card, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 20,
    padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  champGroupe: { marginBottom: 16 },
  champLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 7 },
  champBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Colors.glass,
  },
  champInput: { flex: 1, fontSize: 14, color: Colors.white },

  villeLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
    paddingHorizontal: 20, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  villesList: { paddingHorizontal: 16, gap: 8, marginBottom: 28 },
  villePill: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50,
    backgroundColor: Colors.glass, borderWidth: 1.5, borderColor: Colors.border,
  },
  villePillActif: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  villeTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  villeTxtActif: { color: Colors.white, fontWeight: '700' },

  btnSauvegarder: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, marginHorizontal: 16, borderRadius: 14,
    paddingVertical: 16, marginTop: 8,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    minHeight: 54,
  },
  btnTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },
});
