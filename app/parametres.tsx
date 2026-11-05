import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/config/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import { deconnecter } from '../src/services/auth.service';

function LigneMenu({
  icone, label, valeur, onPress, toggle, toggleValeur, onToggle, danger = false, couleur = Colors.accent,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  valeur?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValeur?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  couleur?: string;
}) {
  return (
    <Pressable style={styles.ligne} onPress={onPress}>
      <View style={[styles.ligneIcone, { backgroundColor: couleur + '22' }]}>
        <Ionicons name={icone} size={19} color={couleur} />
      </View>
      <Text style={[styles.ligneLabel, danger && { color: Colors.error }]}>{label}</Text>
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
          {!danger && <Ionicons name="chevron-forward" size={15} color={Colors.textLight} />}
        </>
      )}
    </Pressable>
  );
}

export default function ParametresScreen() {
  const router = useRouter();
  const { utilisateur, reinitialiser } = useAuthStore();
  const [notifsPush, setNotifsPush] = useState(true);
  const [notifsEmail, setNotifsEmail] = useState(false);
  const [langue, setLangue] = useState('fr');
  const [modalLangue, setModalLangue] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('babi_langue').then(v => { if (v) setLangue(v); });
    AsyncStorage.getItem('babi_notifs_push').then(v => { if (v !== null) setNotifsPush(v === '1'); });
    AsyncStorage.getItem('babi_notifs_email').then(v => { if (v !== null) setNotifsEmail(v === '1'); });
  }, []);

  const toggleNotifsPush = async (v: boolean) => {
    setNotifsPush(v);
    await AsyncStorage.setItem('babi_notifs_push', v ? '1' : '0');
  };

  const toggleNotifsEmail = async (v: boolean) => {
    setNotifsEmail(v);
    await AsyncStorage.setItem('babi_notifs_email', v ? '1' : '0');
  };

  const supprimerCompte = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront effacées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => Alert.alert('Contacte le support', 'Envoie un email à support@babirent.com pour supprimer ton compte.'),
        },
      ],
    );
  };

  const LANGUES: { code: string; label: string; drapeau: string }[] = [
    { code: 'fr', label: 'Français',  drapeau: '🇫🇷' },
    { code: 'en', label: 'English',   drapeau: '🇬🇧' },
    { code: 'ar', label: 'العربية',   drapeau: '🇲🇦' },
    { code: 'wo', label: 'Wolof',     drapeau: '🇸🇳' },
    { code: 'dj', label: 'Dioula',   drapeau: '🇨🇮' },
  ];
  const langueActuelle = LANGUES.find(l => l.code === langue) ?? LANGUES[0];

  const choisirLangue = async (code: string) => {
    setLangue(code);
    await AsyncStorage.setItem('babi_langue', code);
    setModalLangue(false);
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
        <Text style={styles.titrePage}>Paramètres</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Compte */}
        <Text style={styles.sectionTitre}>Mon compte</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="person-outline" label="Modifier mon profil" onPress={() => router.push('/modifier-profil')} />
          <LigneMenu icone="lock-closed-outline" label="Changer le mot de passe"
            onPress={() => Alert.alert('Réinitialisation', 'Un email de réinitialisation sera envoyé à ' + utilisateur?.email)} />
          <LigneMenu icone="language-outline" label="Langue" valeur={`${langueActuelle.drapeau} ${langueActuelle.label}`}
            onPress={() => setModalLangue(true)} couleur={Colors.info} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitre}>Notifications</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="notifications-outline" label="Notifications push" couleur={Colors.info}
            toggle toggleValeur={notifsPush} onToggle={toggleNotifsPush} />
          <LigneMenu icone="mail-outline" label="Notifications email" couleur={Colors.info}
            toggle toggleValeur={notifsEmail} onToggle={toggleNotifsEmail} />
        </View>

        {/* Aide */}
        <Text style={styles.sectionTitre}>Aide & Informations</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="help-circle-outline" label="Aide & Support" onPress={() => router.push('/aide-support')} couleur={Colors.info} />
          <LigneMenu icone="document-text-outline" label="Conditions d'utilisation" couleur={Colors.info}
            onPress={() => Alert.alert('CGU', 'Consultez nos conditions sur babirent.com')} />
          <LigneMenu icone="shield-outline" label="Politique de confidentialité" couleur={Colors.info}
            onPress={() => Alert.alert('Confidentialité', 'Consultez notre politique sur babirent.com')} />
          <LigneMenu icone="information-circle-outline" label="Version" valeur="1.0.0" couleur={Colors.info} />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionTitre}>Zone danger</Text>
        <View style={styles.groupe}>
          <LigneMenu icone="trash-outline" label="Supprimer mon compte" danger onPress={supprimerCompte} couleur={Colors.error} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal sélection langue */}
      <Modal visible={modalLangue} transparent animationType="slide" onRequestClose={() => setModalLangue(false)}>
        <Pressable style={styles.modalFond} onPress={() => setModalLangue(false)}>
          <Pressable style={styles.modalCarte} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitre}>Choisir la langue</Text>

            {LANGUES.map((l, i) => (
              <Pressable
                key={l.code}
                style={[
                  styles.langueOption,
                  i < LANGUES.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border },
                  l.code === langue && styles.langueActive,
                ]}
                onPress={() => choisirLangue(l.code)}
              >
                <Text style={styles.langueDrapeau}>{l.drapeau}</Text>
                <Text style={[styles.langueLabel, l.code === langue && { color: Colors.white, fontWeight: '800' }]}>
                  {l.label}
                </Text>
                {l.code === langue && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />
                )}
              </Pressable>
            ))}

            <Pressable style={styles.modalAnnuler} onPress={() => setModalLangue(false)}>
              <Text style={styles.modalAnnulerTxt}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
  scroll: { paddingBottom: 40 },
  sectionTitre: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    paddingHorizontal: 20, marginBottom: 8, marginTop: 20,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  groupe: {
    backgroundColor: Colors.card, borderRadius: 16,
    marginHorizontal: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ligneIcone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ligneLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  ligneValeur: { fontSize: 13, color: Colors.textSecondary, marginRight: 4 },

  // Modal langue
  modalFond: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCarte: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34, paddingHorizontal: 16,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  modalTitre: {
    fontSize: 18, fontWeight: '800', color: Colors.white,
    textAlign: 'center', marginBottom: 16,
  },
  langueOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 8, borderRadius: 0,
  },
  langueActive: { backgroundColor: 'rgba(232,119,34,0.08)', borderRadius: 12 },
  langueDrapeau: { fontSize: 26 },
  langueLabel:   { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.textSecondary },
  modalAnnuler: {
    marginTop: 12, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.glass, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalAnnulerTxt: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
});
