import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

// Redirige automatiquement selon l'état de connexion
export const useAuth = () => {
  const { utilisateur, chargement, initialise, initialiserAuth } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Initialiser l'écouteur Firebase Auth au montage
  useEffect(() => {
    const unsubscribe = initialiserAuth();
    return unsubscribe;
  }, []);

  // Rediriger selon l'état d'auth
  useEffect(() => {
    if (!initialise) return;

    const dansAuth = segments[0] === '(auth)';

    if (!utilisateur && !dansAuth) {
      router.replace('/(auth)/welcome');
    } else if (utilisateur && dansAuth) {
      router.replace('/(tabs)');
    }
  }, [utilisateur, initialise, segments]);

  return { utilisateur, chargement };
};
