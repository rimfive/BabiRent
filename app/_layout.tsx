import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../src/hooks/useAuth';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/config/colors';
import { enregistrerNotifications } from '../src/services/notification.service';
import { installerAlerteWeb } from '../src/utils/alerteWeb';

// Sur le web, afficher les Alert.alert (sinon les erreurs sont invisibles)
installerAlerteWeb();

// ── Chargement des variantes Roboto ───────────────────────────────────────────
import {
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
  Roboto_800ExtraBold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';

// ── Roboto par défaut sur tous les <Text> de l'app ────────────────────────────
// (les composants <Texte> gèrent le mapping de graisse automatiquement)
(Text as any).defaultProps = {
  ...((Text as any).defaultProps ?? {}),
  style: { fontFamily: 'Roboto_400Regular' },
};

export default function RootLayout() {
  const { chargement } = useAuth();
  const { utilisateur } = useAuthStore();
  const router = useRouter();
  const notifListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Enregistrer le token push dès que l'user est connecté
  useEffect(() => {
    if (!utilisateur?.id) return;
    enregistrerNotifications(utilisateur.id).catch(() => {});

    // Naviguer vers le bon écran quand l'user tape une notif
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}` as any);
      } else if (data?.screen === 'reservations') {
        router.push('/mes-reservations' as any);
      }
    });

    return () => {
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        responseListener.current.remove();
      }
    };
  }, [utilisateur?.id]);

  const [fontsLoaded, fontError] = useFonts({
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
    Roboto_800ExtraBold,
    Roboto_900Black,
  });

  // Affiche le spinner tant que l'auth OU les fonts ne sont pas prêts
  if (chargement || (!fontsLoaded && !fontError)) {
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
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="vehicule/publier" />
        <Stack.Screen name="vehicule/modifier" />
        <Stack.Screen name="logement/publier" />
        <Stack.Screen name="logement/modifier" />
        <Stack.Screen name="article/publier" />
        <Stack.Screen name="reservation/[id]" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="mes-vehicules" />
        <Stack.Screen name="mes-logements" />
        <Stack.Screen name="mes-reservations" />
        <Stack.Screen name="modifier-profil" />
        <Stack.Screen name="parametres" />
        <Stack.Screen name="aide-support" />
        <Stack.Screen name="chat/[id]" />
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
