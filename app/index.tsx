import { Redirect } from 'expo-router';

// Point d'entrée de l'app — redirige vers le Splash Screen
// Le Splash Screen gère ensuite toutes les redirections :
//   → Onboarding (1ère ouverture)
//   → Welcome (déjà vu l'onboarding, pas connecté)
//   → Tabs (déjà connecté)
export default function Index() {
  return <Redirect href="/(auth)/splash" />;
}
