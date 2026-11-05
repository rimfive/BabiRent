// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Alert.alert compatible web
// ══════════════════════════════════════════════════════════════════════════════
// Sur le web, react-native-web ne fait RIEN avec Alert.alert : les erreurs
// (inscription, connexion…) étaient donc invisibles. On remplace Alert.alert
// par window.alert / window.confirm quand on tourne dans un navigateur.
// ══════════════════════════════════════════════════════════════════════════════

import { Alert, AlertButton, Platform } from 'react-native';

export const installerAlerteWeb = (): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  Alert.alert = (titre: string, message?: string, boutons?: AlertButton[]) => {
    const texte = [titre, message].filter(Boolean).join('\n\n');

    // Pas de bouton ou un seul → simple message
    if (!boutons || boutons.length <= 1) {
      window.alert(texte);
      boutons?.[0]?.onPress?.();
      return;
    }

    // Plusieurs boutons → OK / Annuler
    const annuler   = boutons.find(b => b.style === 'cancel');
    const confirmer = boutons.find(b => b !== annuler) ?? boutons[boutons.length - 1];
    if (window.confirm(texte)) confirmer?.onPress?.();
    else annuler?.onPress?.();
  };
};
