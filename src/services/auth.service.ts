import { supabase } from '../config/supabase';
import { Utilisateur } from '../types';

// ── Convertir la ligne DB (snake_case) → type TypeScript (camelCase) ──────────
const dbToUtilisateur = (row: any): Utilisateur => ({
  id:              row.id,
  nom:             row.nom,
  prenom:          row.prenom,
  email:           row.email,
  telephone:       row.telephone ?? '',
  photoUrl:        row.photo_url,
  ville:           row.ville ?? '',
  pays:            row.pays ?? "Côte d'Ivoire",
  isVerifie:       row.is_verifie ?? false,
  isProprietaire:  row.is_proprietaire ?? false,
  note:            row.note ?? 0,
  nombreAvis:      row.nombre_avis ?? 0,
  createdAt:       row.created_at ?? new Date().toISOString(),
});

// ── Traduire une erreur Supabase Auth en message lisible (français) ──────────
export const traduireErreurAuth = (err: unknown, defaut = 'Une erreur est survenue.'): string => {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed'))       return 'Confirme ton email avant de te connecter (vérifie ta boîte mail).';
  if (m.includes('already registered') || m.includes('already exists')) return 'Cet email est déjà utilisé.';
  if (m.includes('password should be') || m.includes('weak password'))  return 'Mot de passe trop faible (minimum 6 caractères).';
  if (m.includes('rate limit') || m.includes('too many'))               return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (m.includes('network request failed') || m.includes('failed to fetch'))
    return 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
  return msg || defaut;
};

// ── Inscription ───────────────────────────────────────────────────────────────
export const inscrire = async (
  email: string,
  motDePasse: string,
  nom: string,
  prenom: string,
  telephone: string,
  ville: string,
): Promise<Utilisateur> => {
  // 1. Créer le compte dans Supabase Auth (métadonnées pour le trigger DB)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { nom, prenom, telephone, ville } },
  });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Erreur création du compte');

  // Si email confirmation requise → session null
  if (!authData.session) {
    throw new Error('Confirmation email requise. Vérifie ta boîte mail, puis connecte-toi.');
  }

  const uid = authData.user.id;

  const profil = {
    id:               uid,
    nom,
    prenom,
    email,
    telephone,
    ville,
    pays:             "Côte d'Ivoire",
    is_verifie:       false,
    is_proprietaire:  false,
    note:             0,
    nombre_avis:      0,
  };

  // 2. Upsert le profil (resilient si un trigger DB l'a déjà créé)
  const { error: dbError } = await supabase.from('users').upsert(profil);
  if (dbError) throw new Error(dbError.message);

  return dbToUtilisateur({ ...profil, created_at: new Date().toISOString() });
};

// ── Connexion ─────────────────────────────────────────────────────────────────
export const connecter = async (
  email: string,
  motDePasse: string,
): Promise<Utilisateur> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Utilisateur introuvable');

  const profil = await getProfilUtilisateur(data.user.id);
  if (!profil) throw new Error('Profil introuvable');
  return profil;
};

// ── Déconnexion ───────────────────────────────────────────────────────────────
export const deconnecter = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

// ── Récupérer le profil depuis Supabase ──────────────────────────────────────
export const getProfilUtilisateur = async (uid: string): Promise<Utilisateur | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !data) return null;
  return dbToUtilisateur(data);
};

// ── Mettre à jour le profil ───────────────────────────────────────────────────
export const mettreAJourProfil = async (
  uid: string,
  data: Partial<Utilisateur>,
): Promise<void> => {
  // Convertir camelCase → snake_case pour la DB
  const dbData: Record<string, any> = {};
  if (data.nom             !== undefined) dbData.nom              = data.nom;
  if (data.prenom          !== undefined) dbData.prenom           = data.prenom;
  if (data.telephone       !== undefined) dbData.telephone        = data.telephone;
  if (data.ville           !== undefined) dbData.ville            = data.ville;
  if (data.photoUrl        !== undefined) dbData.photo_url        = data.photoUrl;
  if (data.isProprietaire  !== undefined) dbData.is_proprietaire  = data.isProprietaire;

  const { error } = await supabase.from('users').update(dbData).eq('id', uid);
  if (error) throw new Error(error.message);
};

// ── Réinitialiser le mot de passe ────────────────────────────────────────────
export const reinitialiserMotDePasse = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};
