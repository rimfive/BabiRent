import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl, ScrollView,
  Dimensions, Modal, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
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

// ── Noms des mois et jours en français ───────────────────────────────────────
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ── Formater une date en "12 jan" ────────────────────────────────────────────
function fmtDate(d: Date) {
  return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

// ── Taille fixe des cellules du calendrier (compatible web + mobile) ──────────
const CAL_MAX   = Math.min(width, 480);      // largeur max de la feuille
const CAL_PAD   = 24;                        // padding horizontal de la feuille
const CELL_SIZE = Math.floor((CAL_MAX - CAL_PAD * 2) / 7);  // ≈ 62px sur mobile

// ── Calendrier modal ──────────────────────────────────────────────────────────
function CalendrierModal({
  visible, onClose, onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (debut: Date, fin: Date) => void;
}) {
  const today = new Date();
  const [annee, setAnnee] = useState(today.getFullYear());
  const [mois, setMois]   = useState(today.getMonth());
  const [debut, setDebut] = useState<Date | null>(null);
  const [fin, setFin]     = useState<Date | null>(null);

  // Grille : tableau de rangées de 7 jours (Date | null)[][]
  const rangees = useMemo(() => {
    const premier = new Date(annee, mois, 1);
    const offset  = (premier.getDay() + 6) % 7; // 0=lun, …, 6=dim
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: nbJours }, (_, d) => new Date(annee, mois, d + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [annee, mois]);

  const moisPrecedent = () => {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1); }
    else setMois(m => m - 1);
  };
  const moisSuivant = () => {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1); }
    else setMois(m => m + 1);
  };

  const selectionnerJour = (jour: Date) => {
    const d = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate());
    if (!debut || (debut && fin)) {
      setDebut(d); setFin(null);
    } else {
      if (d < debut) { setDebut(d); setFin(null); }
      else setFin(d);
    }
  };

  const memeJour  = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const estDebut  = (j: Date) => !!debut && memeJour(j, debut);
  const estFin    = (j: Date) => !!fin   && memeJour(j, fin);
  const estPlage  = (j: Date) => !!debut && !!fin && j > debut && j < fin;
  const estPasse  = (j: Date) => { const auj = new Date(); auj.setHours(0,0,0,0); return j < auj; };

  const confirmer = () => {
    if (debut && fin) { onConfirm(debut, fin); onClose(); }
  };

  const nuits = debut && fin ? Math.round((fin.getTime() - debut.getTime()) / 86400000) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cal.fond}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={cal.feuille}>
          {/* ── Titre ── */}
          <View style={cal.entete}>
            <Text style={cal.titre}>Choisir les dates</Text>
            <Pressable onPress={onClose} hitSlop={14} style={cal.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.white} />
            </Pressable>
          </View>

          {/* ── Navigation mois / année ── */}
          <View style={cal.navRow}>
            <Pressable onPress={moisPrecedent} style={cal.navBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={18} color={Colors.white} />
            </Pressable>
            <View style={cal.navCentre}>
              <Text style={cal.navMois}>{MOIS[mois]}</Text>
              <Text style={cal.navAnnee}>{annee}</Text>
            </View>
            <Pressable onPress={moisSuivant} style={cal.navBtn} hitSlop={10}>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </Pressable>
          </View>

          {/* ── Noms des jours ── */}
          <View style={cal.joursRow}>
            {JOURS.map(j => (
              <View key={j} style={cal.enteteCell}>
                <Text style={cal.jourNom}>{j}</Text>
              </View>
            ))}
          </View>

          {/* ── Grille des jours (rangées fixes de 7) ── */}
          {rangees.map((rangee, ri) => (
            <View key={ri} style={cal.rangee}>
              {rangee.map((jour, ci) => {
                if (!jour) return <View key={ci} style={cal.cellVide} />;
                const passe  = estPasse(jour);
                const active = estDebut(jour) || estFin(jour);
                const plage  = estPlage(jour);
                const isD    = estDebut(jour);
                const isF    = estFin(jour);
                return (
                  <Pressable
                    key={ci}
                    style={[
                      cal.cell,
                      plage && cal.cellPlage,
                      isD   && cal.cellDebutRound,
                      isF   && cal.cellFinRound,
                      active && cal.cellActive,
                    ]}
                    onPress={() => !passe && selectionnerJour(jour)}
                    disabled={passe}
                  >
                    <Text style={[
                      cal.cellTxt,
                      active && cal.cellTxtActive,
                      passe  && cal.cellTxtPasse,
                      (!active && plage) && cal.cellTxtPlage,
                    ]}>
                      {jour.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* ── Résumé ── */}
          <View style={cal.resume}>
            {debut ? (
              <Text style={cal.resumeTxt}>
                {fin
                  ? `✈ ${fmtDate(debut)}  →  ${fmtDate(fin)}   •   ${nuits} nuit${nuits > 1 ? 's' : ''}`
                  : `Arrivée : ${fmtDate(debut)}  —  Choisissez le départ`}
              </Text>
            ) : (
              <Text style={cal.resumeTxt}>Touchez une date d'arrivée</Text>
            )}
          </View>

          {/* ── Boutons ── */}
          <View style={cal.btnRow}>
            {(debut || fin) && (
              <Pressable onPress={() => { setDebut(null); setFin(null); }} style={cal.btnReset}>
                <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                <Text style={cal.btnResetTxt}>Effacer</Text>
              </Pressable>
            )}
            <Pressable
              style={[cal.btnConfirmer, (!debut || !fin) && { opacity: 0.45 }]}
              onPress={confirmer}
              disabled={!debut || !fin}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
              <Text style={cal.btnConfirmerTxt}>Confirmer</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const cal = StyleSheet.create({
  fond: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  feuille: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: CAL_PAD, paddingTop: 20, paddingBottom: 32,
    borderTopWidth: 1, borderColor: Colors.border,
    // Centrer sur grand écran (web)
    maxWidth: CAL_MAX, width: '100%', alignSelf: 'center',
  },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  titre: { fontSize: 17, fontWeight: '800', color: Colors.white },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navCentre: { alignItems: 'center' },
  navMois: { fontSize: 16, fontWeight: '800', color: Colors.white },
  navAnnee: { fontSize: 12, color: Colors.accent, fontWeight: '700' },

  joursRow: { flexDirection: 'row', marginBottom: 4 },
  enteteCell: { width: CELL_SIZE, height: 28, alignItems: 'center', justifyContent: 'center' },
  jourNom: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },

  rangee: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  cellVide: { width: CELL_SIZE, height: CELL_SIZE },

  // Plage : fond orange léger sans arrondi
  cellPlage: { backgroundColor: 'rgba(232,119,34,0.18)' },
  // Jour début : arrondi à gauche
  cellDebutRound: { borderTopLeftRadius: CELL_SIZE / 2, borderBottomLeftRadius: CELL_SIZE / 2 },
  // Jour fin : arrondi à droite
  cellFinRound: { borderTopRightRadius: CELL_SIZE / 2, borderBottomRightRadius: CELL_SIZE / 2 },
  // Jour sélectionné (début ou fin)
  cellActive: {
    backgroundColor: Colors.accent,
    borderRadius: CELL_SIZE / 2,
  },

  cellTxt: { fontSize: 14, fontWeight: '500', color: Colors.white },
  cellTxtActive: { fontWeight: '800', color: Colors.white },
  cellTxtPasse: { color: 'rgba(255,255,255,0.25)' },
  cellTxtPlage: { color: Colors.accent, fontWeight: '600' },

  resume: {
    backgroundColor: Colors.glass, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 12, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 38, justifyContent: 'center',
  },
  resumeTxt: { fontSize: 12, color: Colors.white, textAlign: 'center', fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnReset: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 12, backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnResetTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  btnConfirmer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 13,
  },
  btnConfirmerTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
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
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin]     = useState<Date | null>(null);

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

  const ouvrirCarte = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      const ok = await Linking.canOpenURL(url);
      if (ok) Linking.openURL(url);
    } else {
      Alert.alert(
        'Localisation désactivée',
        'Active la localisation dans les paramètres de ton appareil pour voir la carte.',
      );
    }
  };

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
              { icone: 'settings-outline' as const,   label: 'Paramètres',       route: '/parametres' },
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
            <Pressable onPress={ouvrirCarte} hitSlop={8}>
              <Ionicons name="location-outline" size={18} color={Colors.accent} />
            </Pressable>
            <TextInput
              style={styles.inputRecherche}
              placeholder="Localisation"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={recherche}
              onChangeText={setRecherche}
            />
          </View>
          <View style={styles.dividerV} />
          <Pressable style={styles.rechercheDroite} onPress={() => setCalendarVisible(true)}>
            <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
            <Text style={[styles.txtDates, (dateDebut && dateFin) && styles.txtDatesActif]} numberOfLines={1}>
              {dateDebut && dateFin
                ? `${fmtDate(dateDebut)} → ${fmtDate(dateFin)}`
                : 'Dates'}
            </Text>
          </Pressable>
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

      {/* ── Calendrier de dates ── */}
      <CalendrierModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onConfirm={(d, f) => { setDateDebut(d); setDateFin(f); }}
      />

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
  txtDatesActif: { color: Colors.white, fontWeight: '600', fontSize: 12 },

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
