import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl, ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/config/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useAppStore } from '../../src/store/useAppStore';
import { getVehicules } from '../../src/services/vehicule.service';
import { getLogements } from '../../src/services/logement.service';
import CarteVehicule from '../../src/components/vehicule/CarteVehicule';
import CarteLogement from '../../src/components/logement/CarteLogement';
import { Vehicule, Logement, SectionType } from '../../src/types';

const { width } = Dimensions.get('window');

const FILTRES_VEHICULES = ['Tous', 'Luxe', 'Sport', 'Éco', 'Mariage', 'SUV', 'Électrique'];
const FILTRES_LOGEMENTS = ['Tous', 'Chambres', 'Piscine', 'Vue mer', 'Meublé', 'Villa', 'Studio'];

// ── Logo inline ──────────────────────────────────────────────────────────────
function Logo() {
  return (
    <View style={logoS.conteneur}>
      <View style={logoS.icone}>
        <Ionicons name="home" size={16} color={Colors.white} />
      </View>
      <Text style={logoS.texte}>
        <Text style={logoS.babi}>Babi</Text>
        <Text style={logoS.rent}> Rent</Text>
      </Text>
    </View>
  );
}
const logoS = StyleSheet.create({
  conteneur: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icone: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  texte: { fontSize: 22, fontWeight: '900' },
  babi: { color: Colors.white },
  rent: { color: Colors.accent, fontStyle: 'italic' },
});

// ── Écran principal ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const { section, setSection, vehicules, logements, setVehicules, setLogements } = useAppStore();

  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('Tous');
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const charger = async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    try {
      const [v, l] = await Promise.all([getVehicules(), getLogements()]);
      setVehicules(v);
      setLogements(l);
    } catch (e) {
      console.error('Erreur chargement:', e);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  };

  useEffect(() => { charger(); }, []);
  useEffect(() => { setFiltreActif('Tous'); }, [section]);

  const onRafraichir = () => { setRafraichissement(true); charger(true); };

  const vehiculesFiltres = vehicules.filter(v =>
    (!recherche || v.marque.toLowerCase().includes(recherche.toLowerCase()) ||
      v.modele.toLowerCase().includes(recherche.toLowerCase()) ||
      v.ville.toLowerCase().includes(recherche.toLowerCase()))
  );

  const logementsFiltres = logements.filter(l =>
    (!recherche || l.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      l.ville.toLowerCase().includes(recherche.toLowerCase()))
  );

  const changerSection = (s: SectionType) => {
    setSection(s);
    setRecherche('');
  };

  const filtres = section === 'vehicules' ? FILTRES_VEHICULES : FILTRES_LOGEMENTS;

  return (
    <SafeAreaView style={styles.conteneur} edges={['top']}>

      {/* ── Menu latéral (dropdown) ── */}
      {menuVisible && (
        <>
          <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuDropdown}>
            {[
              { icone: 'car-outline' as const,       label: 'Mes véhicules',    route: '/mes-vehicules' },
              { icone: 'home-outline' as const,       label: 'Mes logements',    route: '/mes-logements' },
              { icone: 'calendar-outline' as const,   label: 'Mes réservations', route: '/mes-reservations' },
              { icone: 'person-outline' as const,     label: 'Mon profil',       route: '/(tabs)/profile' },
              { icone: 'settings-outline' as const,   label: 'Paramètres',       route: '/(tabs)/profile' },
            ].map(item => (
              <Pressable
                key={item.label}
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); router.push(item.route as any); }}
              >
                <Ionicons name={item.icone} size={18} color={Colors.accent} />
                <Text style={styles.menuItemTxt}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.iconeBtn} onPress={() => setMenuVisible(v => !v)} hitSlop={8}>
          <Ionicons name="menu-outline" size={22} color={Colors.white} />
        </Pressable>
        <Logo />
        <Pressable
          style={styles.iconeBtn}
          onPress={() => router.push('/(tabs)/profile')}
          hitSlop={8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {(utilisateur?.prenom?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── Barre de recherche glass ── */}
      <View style={styles.rechercheWrapper}>
        <View style={styles.barreRecherche}>
          <View style={styles.rechercheGauche}>
            <Ionicons name="location-outline" size={18} color={Colors.accent} />
            <TextInput
              style={styles.inputRecherche}
              placeholder="Localisation"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={recherche}
              onChangeText={setRecherche}
            />
          </View>
          <View style={styles.dividerV} />
          <View style={styles.rechercheDroite}>
            <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
            <Text style={styles.txtDates}>Dates</Text>
          </View>
        </View>
      </View>

      {/* ── Toggle section ── */}
      <View style={styles.toggleSection}>
        {(['vehicules', 'logements'] as SectionType[]).map(s => (
          <Pressable
            key={s}
            style={[styles.toggleBtn, section === s && styles.toggleBtnActif]}
            onPress={() => changerSection(s)}
          >
            <Ionicons
              name={s === 'vehicules' ? 'car-sport-outline' : 'home-outline'}
              size={16}
              color={section === s ? Colors.white : 'rgba(255,255,255,0.45)'}
            />
            <Text style={[styles.toggleTxt, section === s && styles.toggleTxtActif]}>
              {s === 'vehicules' ? 'Véhicules' : 'Logements'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Filtres pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtresListe}
        style={styles.filtresScroll}
      >
        {filtres.map(f => (
          <Pressable
            key={f}
            style={[styles.filtrePill, filtreActif === f && styles.filtrePillActif]}
            onPress={() => setFiltreActif(f)}
          >
            <Text style={[styles.filtreTxt, filtreActif === f && styles.filtreTxtActif]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Liste — flex:1 pour ne pas déborder sur les filtres ── */}
      {chargement ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : section === 'vehicules' ? (
        <FlatList
          key="vehicules"
          style={styles.flatlist}
          data={vehiculesFiltres}
          keyExtractor={v => v.id}
          renderItem={({ item }) => <CarteVehicule vehicule={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={onRafraichir}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="car-outline" size={52} color={Colors.gray300} />
              <Text style={styles.txVide}>Aucun véhicule disponible</Text>
              <Pressable onPress={() => charger()}>
                <Text style={styles.lienVide}>Actualiser</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        <FlatList
          key="logements"
          style={styles.flatlist}
          data={logementsFiltres}
          keyExtractor={l => l.id}
          renderItem={({ item }) => <CarteLogement logement={item} />}
          numColumns={2}
          columnWrapperStyle={styles.grille}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={onRafraichir}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="home-outline" size={52} color={Colors.gray300} />
              <Text style={styles.txVide}>Aucun logement disponible</Text>
              <Pressable onPress={() => charger()}>
                <Text style={styles.lienVide}>Actualiser</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  // Recherche
  rechercheWrapper: { paddingHorizontal: 20, marginBottom: 16 },
  barreRecherche: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  rechercheGauche: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 13, paddingHorizontal: 16,
  },
  dividerV: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  rechercheDroite: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 13, paddingHorizontal: 16,
  },
  inputRecherche: { flex: 1, fontSize: 14, color: Colors.white },
  txtDates: { fontSize: 14, color: 'rgba(255,255,255,0.45)', flex: 1 },

  // Toggle
  toggleSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.glass,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 9, borderRadius: 10,
  },
  toggleBtnActif: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  toggleTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  toggleTxtActif: { color: Colors.white },

  // Filtres
  filtresScroll: { maxHeight: 44, marginBottom: 14 },
  filtresListe: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filtrePill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
  },
  filtrePillActif: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filtreTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  filtreTxtActif: { color: Colors.white },

  // Menu dropdown
  menuOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 98,
  },
  menuDropdown: {
    position: 'absolute', top: 60, left: 12,
    zIndex: 99,
    backgroundColor: Colors.card, borderRadius: 16,
    paddingVertical: 6, minWidth: 220,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  menuItemTxt: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  // Liste
  flatlist: { flex: 1 },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liste: { paddingTop: 4, paddingBottom: 100 },
  grille: { paddingHorizontal: 16, gap: 12 },
  vide: { alignItems: 'center', paddingTop: 60, gap: 14 },
  txVide: { fontSize: 15, color: Colors.textSecondary },
  lienVide: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
});
