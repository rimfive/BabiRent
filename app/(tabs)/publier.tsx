import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/config/colors';
import { useAppStore } from '../../src/store/useAppStore';

const CONFIGS = {
  vehicules:   { route: '/vehicule/publier',  icone: 'car-sport'     as const, label: 'un véhicule' },
  logements:   { route: '/logement/publier',  icone: 'home'          as const, label: 'un logement' },
  marketplace: { route: '/article/publier',   icone: 'storefront'    as const, label: 'un article'  },
};

export default function PublierTab() {
  const router = useRouter();
  const { section } = useAppStore();
  const config = CONFIGS[section];

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(config.route as any);
    }, 0);
    return () => clearTimeout(timer);
  }, [section]);

  return (
    <SafeAreaView style={styles.conteneur}>
      <View style={styles.centre}>
        <View style={styles.iconeBox}>
          <Ionicons name={config.icone} size={44} color={Colors.accent} />
        </View>
        <Text style={styles.titre}>Publier {config.label}</Text>
        <Text style={styles.sous}>Redirection en cours...</Text>

        <View style={styles.autresOptions}>
          {(Object.entries(CONFIGS) as [string, typeof config][])
            .filter(([key]) => key !== section)
            .map(([key, cfg]) => (
              <Pressable
                key={key}
                style={styles.btnChanger}
                onPress={() => router.replace(cfg.route as any)}
              >
                <Ionicons name={cfg.icone} size={16} color={Colors.textSecondary} />
                <Text style={styles.txtChanger}>Publier {cfg.label}</Text>
              </Pressable>
            ))
          }
        </View>
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
  autresOptions: { gap: 10, alignItems: 'center' },
  btnChanger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.border,
  },
  txtChanger: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
});
