import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, limit,
  serverTimestamp, DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Vehicule, FiltresVehicule } from '../types';

const COL = 'vehicules';

// Convertir Firestore → Vehicule
const toVehicule = (id: string, data: DocumentData): Vehicule => ({
  id,
  ...data,
  createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
} as Vehicule);

// Créer une annonce véhicule
export const creerVehicule = async (
  data: Omit<Vehicule, 'id' | 'createdAt' | 'note' | 'nombreAvis'>,
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    note: 0,
    nombreAvis: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Lire tous les véhicules disponibles
// Note: pas de orderBy dans la requête pour éviter les index composites Firestore
// Le tri est fait côté app après réception des données
export const getVehicules = async (filtres?: FiltresVehicule): Promise<Vehicule[]> => {
  let q = query(
    collection(db, COL),
    where('disponible', '==', true),
    limit(50),
  );

  if (filtres?.ville) {
    q = query(collection(db, COL), where('disponible', '==', true), where('ville', '==', filtres.ville), limit(50));
  }

  const snap = await getDocs(q);
  return snap.docs
    .map(d => toVehicule(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Lire un véhicule par ID
export const getVehicule = async (id: string): Promise<Vehicule | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return toVehicule(snap.id, snap.data());
};

// Véhicules d'un propriétaire (tri côté app pour éviter l'index composite Firestore)
export const getVehiculesProprietaire = async (uid: string): Promise<Vehicule[]> => {
  const q = query(collection(db, COL), where('proprietaireId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toVehicule(d.id, d.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Mettre à jour
export const mettreAJourVehicule = async (id: string, data: Partial<Vehicule>): Promise<void> => {
  await updateDoc(doc(db, COL, id), data);
};

// Supprimer
export const supprimerVehicule = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

// Recherche par marque ou ville
export const rechercherVehicules = async (terme: string): Promise<Vehicule[]> => {
  const snap = await getDocs(
    query(collection(db, COL), where('disponible', '==', true), limit(100)),
  );
  const termeLower = terme.toLowerCase();
  return snap.docs
    .map(d => toVehicule(d.id, d.data()))
    .filter(v =>
      v.marque.toLowerCase().includes(termeLower) ||
      v.modele.toLowerCase().includes(termeLower) ||
      v.ville.toLowerCase().includes(termeLower),
    );
};
