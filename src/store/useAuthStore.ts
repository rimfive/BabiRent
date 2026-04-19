import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getProfilUtilisateur } from '../services/auth.service';
import { Utilisateur } from '../types';

type AuthStore = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  initialise: boolean;
  setUtilisateur: (u: Utilisateur | null) => void;
  setChargement: (v: boolean) => void;
  initialiserAuth: () => () => void;  // retourne unsubscribe
  reinitialiser: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  utilisateur: null,
  chargement: true,
  initialise: false,

  setUtilisateur: (u) => set({ utilisateur: u }),
  setChargement: (v) => set({ chargement: v }),

  initialiserAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profil = await getProfilUtilisateur(firebaseUser.uid);
        set({ utilisateur: profil, chargement: false, initialise: true });
      } else {
        set({ utilisateur: null, chargement: false, initialise: true });
      }
    });
    return unsubscribe;
  },

  reinitialiser: () => set({ utilisateur: null, chargement: false }),
}));
