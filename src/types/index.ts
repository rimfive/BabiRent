// ─── Types TypeScript — BABI RENT ───────────────────────────────────────────

// Utilisateur
export type Utilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photoUrl?: string;
  ville: string;
  pays: string;
  isVerifie: boolean;
  isProprietaire: boolean;
  note: number;
  nombreAvis: number;
  createdAt: string;
};

// ─── VÉHICULES ───────────────────────────────────────────────────────────────

export type Vehicule = {
  id: string;
  proprietaireId: string;
  proprietaire?: Utilisateur;
  marque: string;
  modele: string;
  annee: number;
  type: string;
  photos: string[];
  prixJour: number;       // en FCFA
  caution: number;        // caution en FCFA
  ville: string;
  pays: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  disponible: boolean;
  transmission: 'manuelle' | 'automatique';
  carburant: 'essence' | 'diesel' | 'electrique' | 'hybride';
  nombrePlaces: number;
  climatisation: boolean;
  description: string;
  note: number;
  nombreAvis: number;
  chauffeurDisponible: boolean;
  createdAt: string;
};

// ─── LOGEMENTS ───────────────────────────────────────────────────────────────

export type Logement = {
  id: string;
  proprietaireId: string;
  proprietaire?: Utilisateur;
  type: string;            // Appartement, Villa, Studio...
  titre: string;
  photos: string[];
  prixJour: number;        // en FCFA
  prixMois?: number;
  caution: number;
  ville: string;
  pays: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  disponible: boolean;
  nombreChambres: number;
  nombreSDB: number;
  superficie: number;      // en m²
  capacitePersonnes: number;
  description: string;
  equipements: string[];   // WiFi, Clim, Parking, Piscine...
  note: number;
  nombreAvis: number;
  meuble: boolean;
  createdAt: string;
};

// ─── RÉSERVATIONS ────────────────────────────────────────────────────────────

export type TypeReservation = 'vehicule' | 'logement';

export type StatutReservation =
  | 'en_attente'
  | 'confirmee'
  | 'en_cours'
  | 'terminee'
  | 'annulee';

// Statut du paiement en ligne (CinetPay) — écrit uniquement par le serveur
export type StatutPaiement = 'non_paye' | 'en_cours' | 'paye' | 'echoue' | 'rembourse';

export type Reservation = {
  id: string;
  type: TypeReservation;
  annonceId: string;
  loueurId: string;
  proprietaireId: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  prixTotal: number;
  commission: number;
  montantProprietaire: number;
  statut: StatutReservation;
  methodePaiement: 'mobile_money' | 'carte' | 'especes';
  statutPaiement: StatutPaiement;
  paiementRef?: string;
  avecChauffeur?: boolean;   // pour les véhicules
  message?: string;
  createdAt: string;
  imageUrl?: string;
  titreAnnonce?: string;
};

// ─── MESSAGES / CHAT ─────────────────────────────────────────────────────────

export type Message = {
  id: string;
  conversationId: string;
  expediteurId: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participants: string[];
  dernierMessage?: string;
  dernierMessageDate?: string;
  annonceId?: string;
  typeAnnonce?: TypeReservation;
  nonLu: number;
};

// ─── AVIS ────────────────────────────────────────────────────────────────────

export type Avis = {
  id: string;
  annonceId: string;
  typeAnnonce: TypeReservation;
  auteurId: string;
  auteur?: Utilisateur;
  note: number;          // 1 à 5
  commentaire: string;
  createdAt: string;
};

// ─── MARKETPLACE ─────────────────────────────────────────────────────────────

export type EtatArticle = 'neuf' | 'bon_etat' | 'use';
export type TypeTransaction = 'vente' | 'location';

export type Article = {
  id: string;
  proprietaireId: string;
  titre: string;
  description: string;
  photos: string[];
  prix: number;
  typeTransaction: TypeTransaction;
  categorie: string;
  ville: string;
  pays: string;
  etat: EtatArticle;
  disponible: boolean;
  note: number;
  nombreAvis: number;
  createdAt: string;
};

export type FiltresArticle = {
  ville?: string;
  categorie?: string;
  typeTransaction?: TypeTransaction;
  prixMax?: number;
};

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

export type SectionType = 'vehicules' | 'logements' | 'marketplace';

export type FiltresVehicule = {
  ville?: string;
  prixMin?: number;
  prixMax?: number;
  transmission?: string;
  type?: string;
  avecChauffeur?: boolean;
};

export type FiltresLogement = {
  ville?: string;
  type?: string;
  prixMin?: number;
  prixMax?: number;
  nombreChambresMin?: number;
  meuble?: boolean;
};
