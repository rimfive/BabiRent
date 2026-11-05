import { supabase } from '../config/supabase';
import { Logement, FiltresLogement } from '../types';

// ── Convertir ligne DB → TypeScript ──────────────────────────────────────────
const dbToLogement = (row: any): Logement => ({
  id:                 row.id,
  proprietaireId:     row.proprietaire_id,
  type:               row.type,
  titre:              row.titre,
  photos:             row.photos ?? [],
  prixJour:           row.prix_jour,
  prixMois:           row.prix_mois,
  caution:            row.caution ?? 0,
  ville:              row.ville,
  pays:               row.pays ?? "Côte d'Ivoire",
  adresse:            row.adresse ?? '',
  latitude:           row.latitude,
  longitude:          row.longitude,
  disponible:         row.disponible ?? true,
  nombreChambres:     row.nombre_chambres ?? 1,
  nombreSDB:          row.nombre_sdb ?? 1,
  superficie:         row.superficie ?? 0,
  capacitePersonnes:  row.capacite_personnes ?? 2,
  description:        row.description ?? '',
  equipements:        row.equipements ?? [],
  note:               row.note ?? 0,
  nombreAvis:         row.nombre_avis ?? 0,
  meuble:             row.meuble ?? true,
  createdAt:          row.created_at ?? new Date().toISOString(),
});

// ── Convertir TypeScript → DB ─────────────────────────────────────────────────
const logementToDb = (data: Omit<Logement, 'id' | 'createdAt' | 'note' | 'nombreAvis'>) => ({
  proprietaire_id:    data.proprietaireId,
  type:               data.type,
  titre:              data.titre,
  photos:             data.photos,
  prix_jour:          data.prixJour,
  prix_mois:          data.prixMois,
  caution:            data.caution,
  ville:              data.ville,
  pays:               data.pays,
  adresse:            data.adresse,
  latitude:           data.latitude,
  longitude:          data.longitude,
  disponible:         data.disponible,
  nombre_chambres:    data.nombreChambres,
  nombre_sdb:         data.nombreSDB,
  superficie:         data.superficie,
  capacite_personnes: data.capacitePersonnes,
  description:        data.description,
  equipements:        data.equipements,
  meuble:             data.meuble,
});

// ── Créer une annonce logement ────────────────────────────────────────────────
export const creerLogement = async (
  data: Omit<Logement, 'id' | 'createdAt' | 'note' | 'nombreAvis'>,
): Promise<string> => {
  const { data: result, error } = await supabase
    .from('logements')
    .insert({ ...logementToDb(data), note: 0, nombre_avis: 0 })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
};

// ── Tous les logements disponibles ────────────────────────────────────────────
export const getLogements = async (filtres?: FiltresLogement): Promise<Logement[]> => {
  let query = supabase
    .from('logements')
    .select('*')
    .eq('disponible', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filtres?.ville) query = query.eq('ville', filtres.ville);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToLogement);
};

// ── Un logement par ID ────────────────────────────────────────────────────────
export const getLogement = async (id: string): Promise<Logement | null> => {
  const { data, error } = await supabase
    .from('logements')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToLogement(data);
};

// ── Logements d'un propriétaire ───────────────────────────────────────────────
export const getLogementsProprietaire = async (uid: string): Promise<Logement[]> => {
  const { data, error } = await supabase
    .from('logements')
    .select('*')
    .eq('proprietaire_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToLogement);
};

// ── Mettre à jour ─────────────────────────────────────────────────────────────
export const mettreAJourLogement = async (
  id: string,
  data: Partial<Logement>,
): Promise<void> => {
  const dbData: Record<string, any> = {};
  if (data.titre             !== undefined) dbData.titre              = data.titre;
  if (data.type              !== undefined) dbData.type               = data.type;
  if (data.photos            !== undefined) dbData.photos             = data.photos;
  if (data.prixJour          !== undefined) dbData.prix_jour          = data.prixJour;
  if (data.prixMois          !== undefined) dbData.prix_mois          = data.prixMois;
  if (data.caution           !== undefined) dbData.caution            = data.caution;
  if (data.ville             !== undefined) dbData.ville              = data.ville;
  if (data.adresse           !== undefined) dbData.adresse            = data.adresse;
  if (data.disponible        !== undefined) dbData.disponible         = data.disponible;
  if (data.nombreChambres    !== undefined) dbData.nombre_chambres    = data.nombreChambres;
  if (data.nombreSDB         !== undefined) dbData.nombre_sdb         = data.nombreSDB;
  if (data.superficie        !== undefined) dbData.superficie         = data.superficie;
  if (data.capacitePersonnes !== undefined) dbData.capacite_personnes = data.capacitePersonnes;
  if (data.description       !== undefined) dbData.description        = data.description;
  if (data.equipements       !== undefined) dbData.equipements        = data.equipements;
  if (data.meuble            !== undefined) dbData.meuble             = data.meuble;

  const { error } = await supabase.from('logements').update(dbData).eq('id', id);
  if (error) throw new Error(error.message);
};

// ── Supprimer ─────────────────────────────────────────────────────────────────
export const supprimerLogement = async (id: string): Promise<void> => {
  const { error } = await supabase.from('logements').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ── Recherche ─────────────────────────────────────────────────────────────────
export const rechercherLogements = async (terme: string): Promise<Logement[]> => {
  const termeLower = terme.toLowerCase();
  const { data, error } = await supabase
    .from('logements')
    .select('*')
    .eq('disponible', true)
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(dbToLogement)
    .filter(l =>
      l.titre.toLowerCase().includes(termeLower) ||
      l.type.toLowerCase().includes(termeLower) ||
      l.ville.toLowerCase().includes(termeLower),
    );
};
