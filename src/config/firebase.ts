// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Configuration Firebase
// ──────────────────────────────────────────────────────────────────────────────
// ⚠️  Ce fichier N'UTILISE JAMAIS de clés écrites en dur.
//     Toutes les valeurs viennent du fichier .env à la racine du projet.
//     Le fichier .env ne doit JAMAIS être mis sur GitHub.
//
// Pour configurer :
//   1. Copie .env.example → .env
//   2. Remplis les valeurs depuis Firebase Console :
//      console.firebase.google.com → ton projet → Paramètres ⚙️ → Config web
// ══════════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ── Lecture des clés depuis les variables d'environnement ──────────────────
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ── Vérification : affiche un avertissement si une clé est manquante ─────────
if (__DEV__) {
  const manquantes = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (manquantes.length > 0) {
    console.warn(
      '[Firebase] Clés manquantes dans .env :\n' + manquantes.join('\n') +
      '\n→ Copie .env.example en .env et remplis les valeurs.'
    );
  }
}

// ── Initialisation (évite de créer plusieurs instances en dev) ───────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Services exportés ────────────────────────────────────────────────────────
// Utilise ces exports dans tous les services de l'app :
//   import { db, auth, storage } from '../config/firebase'

export const auth    = getAuth(app);       // Authentification des utilisateurs
export const db      = getFirestore(app);  // Base de données Firestore
export const storage = getStorage(app);    // Stockage de fichiers (photos)

export default app;
