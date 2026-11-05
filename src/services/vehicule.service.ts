import { supabase } from '../config/supabase';
import { Vehicule, FiltresVehicule } from '../types';

// ── Convertir ligne DB → TypeScript ──────────────────────────────────────────
const dbToVehicule = (row: any): Vehicule => ({
  id:                 row.id,
  proprietaireId:     row.proprietaire_id,
  marque:             row.marque,
  modele:             row.modele,
  annee:              row.annee,
  type:               row.type,
  photos:             row.photos ?? [],
  prixJour:           row.prix_jour,
  caution:            row.caution ?? 0,
  ville:              row.ville,
  pays:               row.pays ?? "Côte d'Ivoire",
  adresse:            row.adresse,
  latitude:           row.latitude,
  longitude:          row.longitude,
  disponible:         row.disponible ?? true,
  transmission:       row.transmission,
  carburant:          row.carburant,
  nombrePlaces:       row.nombre_places ?? 5,
  climatisation:      row.climatisation ?? true,
  description:        row.description ?? '',
  note:               row.note ?? 0,
  nombreAvis:         row.nombre_avis ?? 0,
  chauffeurDisponible: row.chauffeur_disponible ?? false,
  createdAt:          row.created_at ?? new Date().toISOString(),
});

// ── Convertir TypeScript → DB ─────────────────────────────────────────────────
const vehiculeToDb = (data: Omit<Vehicule, 'id' | 'createdAt' | 'note' | 'nombreAvis'>) => ({
  proprietaire_id:      data.proprietaireId,
  marque:               data.marque,
  modele:               data.modele,
  annee:                data.annee,
  type:                 data.type,
  photos:               data.photos,
  prix_jour:            data.prixJour,
  caution:              data.caution,
  ville:                data.ville,
  pays:                 data.pays,
  adresse:              data.adresse,
  latitude:             data.latitude,
  longitude:            data.longitude,
  disponible:           data.disponible,
  transmission:         data.transmission,
  carburant:            data.carburant,
  nombre_places:        data.nombrePlaces,
  climatisation:        data.climatisation,
  description:          data.description,
  chauffeur_disponible: data.chauffeurDisponible,
});

// ── Créer une annonce véhicule ────────────────────────────────────────────────
export const creerVehicule = async (
  data: Omit<Vehicule, 'id' | 'createdAt' | 'note' | 'nombreAvis'>,
): Promise<string> => {
  const { data: result, error } = await supabase
    .from('vehicules')
    .insert({ ...vehiculeToDb(data), note: 0, nombre_avis: 0 })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
};

// ── Lire tous les véhicules disponibles ──────────────────────────────────────
export const getVehicules = async (filtres?: FiltresVehicule): Promise<Vehicule[]> => {
  let query = supabase
    .from('vehicules')
    .select('*')
    .eq('disponible', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filtres?.ville) query = query.eq('ville', filtres.ville);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToVehicule);
};

// ── Lire un véhicule par ID ───────────────────────────────────────────────────
export const getVehicule = async (id: string): Promise<Vehicule | null> => {
  const { data, error } = await supabase
    .from('vehicules')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToVehicule(data);
};

// ── Véhicules d'un propriétaire ───────────────────────────────────────────────
export const getVehiculesProprietaire = async (uid: string): Promise<Vehicule[]> => {
  const { data, error } = await supabase
    .from('vehicules')
    .select('*')
    .eq('proprietaire_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToVehicule);
};

// ── Mettre à jour ─────────────────────────────────────────────────────────────
export const mettreAJourVehicule = async (
  id: string,
  data: Partial<Vehicule>,
): Promise<void> => {
  const dbData: Record<string, any> = {};
  if (data.marque            !== undefined) dbData.marque              = data.marque;
  if (data.modele            !== undefined) dbData.modele              = data.modele;
  if (data.annee             !== undefined) dbData.annee               = data.annee;
  if (data.type              !== undefined) dbData.type                = data.type;
  if (data.photos            !== undefined) dbData.photos              = data.photos;
  if (data.prixJour          !== undefined) dbData.prix_jour           = data.prixJour;
  if (data.caution           !== undefined) dbData.caution             = data.caution;
  if (data.ville             !== undefined) dbData.ville               = data.ville;
  if (data.adresse           !== undefined) dbData.adresse             = data.adresse;
  if (data.disponible        !== undefined) dbData.disponible          = data.disponible;
  if (data.transmission      !== undefined) dbData.transmission        = data.transmission;
  if (data.carburant         !== undefined) dbData.carburant           = data.carburant;
  if (data.nombrePlaces      !== undefined) dbData.nombre_places       = data.nombrePlaces;
  if (data.climatisation     !== undefined) dbData.climatisation       = data.climatisation;
  if (data.description       !== undefined) dbData.description         = data.description;
  if (data.chauffeurDisponible !== undefined) dbData.chauffeur_disponible = data.chauffeurDisponible;

  const { error } = await supabase.from('vehicules').update(dbData).eq('id', id);
  if (error) throw new Error(error.message);
};

// ── Supprimer ─────────────────────────────────────────────────────────────────
export const supprimerVehicule = async (id: string): Promise<void> => {
  const { error } = await supabase.from('vehicules').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ── Recherche par marque, modèle ou ville ─────────────────────────────────────
export const rechercherVehicules = async (terme: string): Promise<Vehicule[]> => {
  const termeLower = terme.toLowerCase();
  const { data, error } = await supabase
    .from('vehicules')
    .select('*')
    .eq('disponible', true)
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(dbToVehicule)
    .filter(v =>
      v.marque.toLowerCase().includes(termeLower) ||
      v.modele.toLowerCase().includes(termeLower) ||
      v.ville.toLowerCase().includes(termeLower),
    );
};
