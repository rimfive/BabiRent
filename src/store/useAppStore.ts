import { create } from 'zustand';
import { SectionType, Vehicule, Logement } from '../types';

type AppStore = {
  // Section active (véhicules ou logements)
  section: SectionType;
  setSection: (s: SectionType) => void;

  // Ville sélectionnée
  villeSelectionnee: string;
  setVille: (v: string) => void;

  // Cache des annonces
  vehicules: Vehicule[];
  logements: Logement[];
  setVehicules: (v: Vehicule[]) => void;
  setLogements: (l: Logement[]) => void;

  // Recherche
  termeRecherche: string;
  setTermeRecherche: (t: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  section: 'vehicules',
  setSection: (s) => set({ section: s }),

  villeSelectionnee: 'Abidjan',
  setVille: (v) => set({ villeSelectionnee: v }),

  vehicules: [],
  logements: [],
  setVehicules: (v) => set({ vehicules: v }),
  setLogements: (l) => set({ logements: l }),

  termeRecherche: '',
  setTermeRecherche: (t) => set({ termeRecherche: t }),
}));
