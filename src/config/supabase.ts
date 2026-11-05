// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Configuration Supabase
// ══════════════════════════════════════════════════════════════════════════════
// ⚠️  Les clés viennent du fichier .env — ne jamais écrire les valeurs ici.
//     EXPO_PUBLIC_SUPABASE_URL      → ton URL Supabase (Settings → API)
//     EXPO_PUBLIC_SUPABASE_ANON_KEY → ta clé anon publique (Settings → API)
// ══════════════════════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__ && (!supabaseUrl || !supabaseAnon)) {
  console.warn(
    '[Supabase] Clés manquantes dans .env !\n' +
    '→ Ouvre .env et remplis EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Le client Supabase — utilise AsyncStorage pour persister la session sur mobile
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,  // obligatoire en React Native (pas de navigateur)
  },
});
