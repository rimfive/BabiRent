import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FavorisStore = {
  ids: string[];
  charger: () => Promise<void>;
  toggle: (id: string) => void;
  estFavori: (id: string) => boolean;
};

export const useFavorisStore = create<FavorisStore>((set, get) => ({
  ids: [],

  charger: async () => {
    try {
      const raw = await AsyncStorage.getItem('babi_favoris');
      if (raw) set({ ids: JSON.parse(raw) });
    } catch {}
  },

  toggle: (id: string) => {
    const current = get().ids;
    const next = current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id];
    set({ ids: next });
    AsyncStorage.setItem('babi_favoris', JSON.stringify(next)).catch(() => {});
  },

  estFavori: (id: string) => get().ids.includes(id),
}));
