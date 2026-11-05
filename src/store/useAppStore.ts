import { create } from 'zustand';
import { SectionType, Vehicule, Logement, Article } from '../types';

type AppStore = {
  section: SectionType;
  setSection: (s: SectionType) => void;

  villeSelectionnee: string;
  setVille: (v: string) => void;

  vehicules: Vehicule[];
  logements: Logement[];
  articles: Article[];
  setVehicules: (v: Vehicule[]) => void;
  setLogements: (l: Logement[]) => void;
  setArticles: (a: Article[]) => void;

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
  articles: [],
  setVehicules: (v) => set({ vehicules: v }),
  setLogements: (l) => set({ logements: l }),
  setArticles: (a) => set({ articles: a }),

  termeRecherche: '',
  setTermeRecherche: (t) => set({ termeRecherche: t }),
}));
