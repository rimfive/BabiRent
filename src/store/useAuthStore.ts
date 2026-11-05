import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { getProfilUtilisateur } from '../services/auth.service';
import { Utilisateur } from '../types';

type AuthStore = {
  utilisateur: Utilisateur | null;
  chargement:  boolean;
  initialise:  boolean;
  setUtilisateur:  (u: Utilisateur | null) => void;
  setChargement:   (v: boolean) => void;
  initialiserAuth: () => () => void;
  reinitialiser:   () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  utilisateur: null,
  chargement:  true,
  initialise:  false,

  setUtilisateur: (u) => set({ utilisateur: u }),
  setChargement:  (v) => set({ chargement: v }),

  initialiserAuth: () => {
    // Timeout de sécurité : si Supabase ne répond pas en 5s, débloque l'app
    const securite = setTimeout(() => {
      set({ chargement: false, initialise: true });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        clearTimeout(securite);

        if (event === 'SIGNED_OUT') {
          set({ utilisateur: null, chargement: false, initialise: true });
          return;
        }

        // Le refresh de token ne change pas le profil → inutile de le recharger
        if (event === 'TOKEN_REFRESHED' && get().utilisateur) return;

        if (session?.user) {
          const uid = session.user.id;
          // ⚠️ Supabase : ne jamais "await" un autre appel Supabase directement
          // dans ce callback (risque de blocage). On diffère avec setTimeout.
          setTimeout(async () => {
            let profil = await getProfilUtilisateur(uid);
            // Race condition inscription : profil pas encore inséré → réessaie après 1.5s
            if (!profil) {
              await new Promise(r => setTimeout(r, 1500));
              profil = await getProfilUtilisateur(uid);
            }
            set({ utilisateur: profil, chargement: false, initialise: true });
          }, 0);
        } else {
          set({ chargement: false, initialise: true });
        }
      }
    );

    return () => { clearTimeout(securite); subscription.unsubscribe(); };
  },

  reinitialiser: () => set({ utilisateur: null, chargement: false }),
}));
