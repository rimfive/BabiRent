import { supabase } from '../config/supabase';
import { Reservation } from '../types';

const enrichirReservations = async (reservations: Reservation[]): Promise<Reservation[]> => {
  if (reservations.length === 0) return reservations;

  const vehiculeIds = reservations.filter(r => r.type === 'vehicule').map(r => r.annonceId);
  const logementIds = reservations.filter(r => r.type === 'logement').map(r => r.annonceId);
  const imagesMap: Record<string, { imageUrl: string; titreAnnonce: string }> = {};

  await Promise.all([
    vehiculeIds.length
      ? supabase.from('vehicules').select('id, marque, modele, photos').in('id', vehiculeIds)
          .then(({ data }) => (data ?? []).forEach((v: any) => {
            imagesMap[v.id] = { imageUrl: v.photos?.[0] ?? '', titreAnnonce: `${v.marque} ${v.modele}` };
          }))
      : Promise.resolve(),
    logementIds.length
      ? supabase.from('logements').select('id, titre, photos').in('id', logementIds)
          .then(({ data }) => (data ?? []).forEach((l: any) => {
            imagesMap[l.id] = { imageUrl: l.photos?.[0] ?? '', titreAnnonce: l.titre };
          }))
      : Promise.resolve(),
  ]);

  return reservations.map(r => ({
    ...r,
    imageUrl:     imagesMap[r.annonceId]?.imageUrl,
    titreAnnonce: imagesMap[r.annonceId]?.titreAnnonce,
  }));
};

const dbToReservation = (row: any): Reservation => ({
  id:                   row.id,
  type:                 row.type,
  annonceId:            row.annonce_id,
  loueurId:             row.loueur_id,
  proprietaireId:       row.proprietaire_id,
  dateDebut:            row.date_debut,
  dateFin:              row.date_fin,
  nombreJours:          row.nombre_jours,
  prixTotal:            row.prix_total,
  commission:           row.commission ?? 0,
  montantProprietaire:  row.montant_proprietaire ?? row.prix_total,
  statut:               row.statut,
  methodePaiement:      row.methode_paiement ?? 'especes',
  statutPaiement:       row.statut_paiement ?? 'non_paye',
  paiementRef:          row.paiement_ref,
  avecChauffeur:        row.avec_chauffeur ?? false,
  message:              row.message,
  createdAt:            row.created_at ?? new Date().toISOString(),
});

// Réservations où l'utilisateur est locataire
export const getMesReservations = async (uid: string): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('loueur_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return enrichirReservations((data ?? []).map(dbToReservation));
};

// Réservations reçues sur les annonces du propriétaire
export const getReservationsRecues = async (uid: string): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('proprietaire_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return enrichirReservations((data ?? []).map(dbToReservation));
};

// Changer le statut d'une réservation
export const changerStatutReservation = async (
  id: string,
  statut: Reservation['statut'],
): Promise<void> => {
  const { error } = await supabase
    .from('reservations')
    .update({ statut })
    .eq('id', id);
  if (error) throw new Error(error.message);
};
