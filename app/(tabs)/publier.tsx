import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/config/colors';
import { useAppStore } from '../../src/store/useAppStore';

export default function PublierTab() {
  const router = useRouter();
  const { section } = useAppStore();

  // Redirige automatiquement selon la section active
  useEffect(() => {
    const timer = setTimeout(() => {
      if (section === 'logements') {
        router.replace('/logement/publier');
      } else {
        router.replace('/vehicule/publier');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [section]);

  // Affichage temporaire pendant la redirection
  return (
    <SafeAreaView style={styles.conteneur}>
      <View style={styles.centre}>
        <View style={styles.iconeBox}>
          <Ionicons
            name={section === 'logements' ? 'home' : 'car-sport'}
            size={44}
            color={Colors.accent}
          />
        </View>
        <Text style={styles.titre}>
          Publier {section === 'logements' ? 'un logement' : 'un véhicule'}
        </Text>
        <Text style={styles.sous}>Redirection en cours...</Text>

        {/* Option manuelle pour changer de type */}
        <Pressable
          style={styles.btnChanger}
          onPress={() =>
            router.replace(
              section === 'logements' ? '/vehicule/publier' : '/logement/publier'
            )
          }
        >
          <Ionicons
            name={section === 'logements' ? 'car-sport-outline' : 'home-outline'}
            size={16}
            color={Colors.textSecondary}
          />
          <Text style={styles.txtChanger}>
            Publier {section === 'logements' ? 'un véhicule' : 'un logement'} à la place
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconeBox: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  titre: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  sous: { fontSize: 15, color: Colors.textSecondary, marginBottom: 32 },
  btnChanger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
  },
  txtChanger: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
});
