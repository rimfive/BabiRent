import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/hooks/useAuth';
import { Colors } from '../src/config/colors';

export default function RootLayout() {
  const { chargement } = useAuth();

  // Pendant que Firebase vérifie l'auth → écran violet avec spinner
  if (chargement) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vehicule/[id]" />
        <Stack.Screen name="logement/[id]" />
        <Stack.Screen name="vehicule/publier" />
        <Stack.Screen name="vehicule/modifier" />
        <Stack.Screen name="logement/publier" />
        <Stack.Screen name="logement/modifier" />
        <Stack.Screen name="reservation/[id]" />
        <Stack.Screen name="mes-vehicules" />
        <Stack.Screen name="mes-logements" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
