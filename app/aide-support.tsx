import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/config/colors';

const FAQ = [
  {
    q: 'Comment publier une annonce ?',
    r: 'Appuie sur le bouton "+" en bas de l\'écran, choisis "Véhicule" ou "Logement", remplis le formulaire et appuie sur "Publier l\'annonce".',
  },
  {
    q: 'Comment réserver un véhicule ou un logement ?',
    r: 'Ouvre la fiche d\'un véhicule ou logement, choisis tes dates et appuie sur "Réserver". Le propriétaire confirmera ta demande sous 24h.',
  },
  {
    q: 'Quels sont les moyens de paiement acceptés ?',
    r: 'Orange Money, MTN MoMo, Wave, Moov Money (Mobile Money), Carte Visa/Mastercard, et paiement en espèces.',
  },
  {
    q: 'Comment contacter un propriétaire ?',
    r: 'Depuis la fiche d\'un véhicule ou logement, appuie sur "Contacter" pour ouvrir le chat directement avec le propriétaire.',
  },
  {
    q: 'Quels sont les frais de BABI RENT ?',
    r: 'BABI RENT prélève une commission de 10% sur chaque réservation pour couvrir les frais de service et d\'assurance.',
  },
  {
    q: 'Comment modifier ou supprimer mon annonce ?',
    r: 'Va dans "Mes véhicules" ou "Mes logements" depuis ton profil. Tu peux modifier ou supprimer chaque annonce individuellement.',
  },
];

function AccordionItem({ question, reponse }: { question: string; reponse: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <Pressable style={styles.faqItem} onPress={() => setOuvert(o => !o)}>
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQ}>{question}</Text>
        <Ionicons
          name={ouvert ? 'chevron-up' : 'chevron-down'}
          size={16} color={Colors.textSecondary}
        />
      </View>
      {ouvert && <Text style={styles.faqR}>{reponse}</Text>}
    </Pressable>
  );
}

export default function AideSupportScreen() {
  const router = useRouter();

  const contacterEmail = () => {
    Linking.openURL('mailto:support@babirent.com?subject=Support BABI RENT');
  };

  const contacterWhatsApp = () => {
    Linking.openURL('https://wa.me/2250700000000?text=Bonjour, j\'ai besoin d\'aide avec BABI RENT.');
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
        <Text style={styles.titrePage}>Aide & Support</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* À propos de BABI RENT */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIcone}>
            <Ionicons name="home" size={32} color={Colors.white} />
          </View>
          <Text style={styles.heroTitre}>BABI RENT</Text>
          <Text style={styles.heroSous}>
            La marketplace africaine de location de véhicules et de logements.
            Trouvez, louez et gagnez — simplement.
          </Text>
          <Text style={styles.heroVersion}>Version 1.0.0</Text>
        </View>

        {/* Ce que BABI RENT permet */}
        <Text style={styles.sectionTitre}>Ce que tu peux faire</Text>
        <View style={styles.carte}>
          {[
            { icone: 'car-outline' as const,      label: 'Louer des véhicules',   desc: 'Berlines, SUV, motos... à Abidjan et dans toute l\'Afrique.' },
            { icone: 'home-outline' as const,     label: 'Louer des logements',   desc: 'Appartements, villas, studios en courte ou longue durée.' },
            { icone: 'add-circle-outline' as const, label: 'Publier tes annonces', desc: 'Deviens propriétaire et génère des revenus avec tes biens.' },
            { icone: 'chatbubbles-outline' as const, label: 'Chatter en direct',  desc: 'Discute directement avec les propriétaires ou locataires.' },
            { icone: 'wallet-outline' as const,   label: 'Payer en Mobile Money', desc: 'Orange Money, MTN, Wave, Moov. Simple et sécurisé.' },
          ].map((item, i) => (
            <View key={i} style={[styles.fonctionnalite, i < 4 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
              <View style={styles.fonctIcne}>
                <Ionicons name={item.icone} size={22} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fonctLabel}>{item.label}</Text>
                <Text style={styles.fonctDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitre}>Questions fréquentes</Text>
        <View style={styles.carte}>
          {FAQ.map((item, i) => (
            <View key={i} style={i < FAQ.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <AccordionItem question={item.q} reponse={item.r} />
            </View>
          ))}
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitre}>Nous contacter</Text>
        <View style={styles.carte}>
          <Pressable style={[styles.contactBtn, { borderBottomWidth: 1, borderBottomColor: Colors.border }]} onPress={contacterEmail}>
            <View style={[styles.contactIcne, { backgroundColor: Colors.infoLight }]}>
              <Ionicons name="mail-outline" size={22} color={Colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Email support</Text>
              <Text style={styles.contactValeur}>support@babirent.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={Colors.textLight} />
          </Pressable>

          <Pressable style={styles.contactBtn} onPress={contacterWhatsApp}>
            <View style={[styles.contactIcne, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="logo-whatsapp" size={22} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValeur}>+225 07 00 00 00 00</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* Infos légales */}
        <Text style={styles.sectionTitre}>Informations</Text>
        <View style={styles.carte}>
          {[
            { label: 'Pays de lancement', valeur: 'Côte d\'Ivoire' },
            { label: 'Commission', valeur: '10% par réservation' },
            { label: 'Paiements', valeur: 'Mobile Money + Carte' },
            { label: 'Support', valeur: 'Lun-Sam, 8h-20h' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoLigne, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValeur}>{item.valeur}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>© 2026 BABI RENT. Tous droits réservés.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
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

  heroBanner: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24,
    backgroundColor: Colors.card, marginHorizontal: 16, marginVertical: 16,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  heroIcone: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    marginBottom: 4,
  },
  heroTitre: { fontSize: 28, fontWeight: '900', color: Colors.white },
  heroSous: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  heroVersion: { fontSize: 12, color: Colors.textLight, marginTop: 4 },

  sectionTitre: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    paddingHorizontal: 20, marginBottom: 8, marginTop: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  carte: {
    backgroundColor: Colors.card, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },

  fonctionnalite: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  fonctIcne: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(232,119,34,0.15)', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  fonctLabel: { fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  fonctDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.white },
  faqR: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 10, paddingLeft: 4 },

  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  contactIcne: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },
  contactValeur: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },

  infoLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValeur: { fontSize: 14, fontWeight: '600', color: Colors.white },

  footer: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 8 },
});
