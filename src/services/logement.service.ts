import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, limit,
  serverTimestamp, DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Logement, FiltresLogement } from '../types';

const COL = 'logements';

const toLogement = (id: string, data: DocumentData): Logement => ({
  id,
  ...data,
  createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
} as Logement);

// Créer une annonce logement
export const creerLogement = async (
  data: Omit<Logement, 'id' | 'createdAt' | 'note' | 'nombreAvis'>,
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    note: 0,
    nombreAvis: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Tous les logements disponibles (tri côté app pour éviter les index composites)
export const getLogements = async (filtres?: FiltresLogement): Promise<Logement[]> => {
  let q = query(collection(db, COL), where('disponible', '==', true), limit(50));

  if (filtres?.ville) {
    q = query(collection(db, COL), where('disponible', '==', true), where('ville', '==', filtres.ville), limit(50));
  }

  const snap = await getDocs(q);
  return snap.docs
    .map(d => toLogement(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Un logement par ID
export const getLogement = async (id: string): Promise<Logement | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return toLogement(snap.id, snap.data());
};

// Logements d'un propriétaire (tri côté app)
export const getLogementsProprietaire = async (uid: string): Promise<Logement[]> => {
  const q = query(collection(db, COL), where('proprietaireId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toLogement(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Mettre à jour
export const mettreAJourLogement = async (id: string, data: Partial<Logement>): Promise<void> => {
  await updateDoc(doc(db, COL, id), data);
};

// Supprimer
export const supprimerLogement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

// Recherche
export const rechercherLogements = async (terme: string): Promise<Logement[]> => {
  const snap = await getDocs(
    query(collection(db, COL), where('disponible', '==', true), limit(100)),
  );
  const termeLower = terme.toLowerCase();
  return snap.docs
    .map(d => toLogement(d.id, d.data()))
    .filter(l =>
      l.titre.toLowerCase().includes(termeLower) ||
      l.type.toLowerCase().includes(termeLower) ||
      l.ville.toLowerCase().includes(termeLower),
    );
};
