import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Utilisateur } from '../types';

// Inscription
export const inscrire = async (
  email: string,
  motDePasse: string,
  nom: string,
  prenom: string,
  telephone: string,
  ville: string,
): Promise<Utilisateur> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, motDePasse);

  await updateProfile(user, { displayName: `${prenom} ${nom}` });

  const utilisateur: Utilisateur = {
    id: user.uid,
    nom,
    prenom,
    email,
    telephone,
    ville,
    pays: 'Côte d\'Ivoire',
    isVerifie: false,
    isProprietaire: false,
    note: 0,
    nombreAvis: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...utilisateur,
    createdAt: serverTimestamp(),
  });

  return utilisateur;
};

// Connexion
export const connecter = async (email: string, motDePasse: string): Promise<User> => {
  const { user } = await signInWithEmailAndPassword(auth, email, motDePasse);
  return user;
};

// Déconnexion
export const deconnecter = async (): Promise<void> => {
  await signOut(auth);
};

// Récupérer le profil Firestore
export const getProfilUtilisateur = async (uid: string): Promise<Utilisateur | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    // Convertir le Timestamp Firestore en string ISO (évite "Invalid Date")
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  } as Utilisateur;
};

// Mettre à jour le profil
export const mettreAJourProfil = async (
  uid: string,
  data: Partial<Utilisateur>,
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

// Réinitialiser le mot de passe
export const reinitialiserMotDePasse = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// ── AUTH PAR TÉLÉPHONE ────────────────────────────────────────────────

// Étape 1 — Envoyer le code SMS
export const envoyerCodeSMS = async (
  telephone: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> => {
  return signInWithPhoneNumber(auth, telephone, recaptchaVerifier);
};

// Étape 2 — Vérifier le code reçu par SMS
export const verifierCodeSMS = async (
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> => {
  const { user } = await confirmation.confirm(code);
  return user;
};

// Créer le profil Firestore après connexion téléphone
export const creerProfilTelephone = async (
  user: User,
  nom: string,
  prenom: string,
  telephone: string,
  ville: string,
): Promise<Utilisateur> => {
  // Vérifier si le profil existe déjà
  const existant = await getProfilUtilisateur(user.uid);
  if (existant) return existant;

  const utilisateur: Utilisateur = {
    id: user.uid,
    nom,
    prenom,
    email: user.email || '',
    telephone,
    ville,
    pays: 'Côte d\'Ivoire',
    isVerifie: true, // téléphone vérifié automatiquement
    isProprietaire: false,
    note: 0,
    nombreAvis: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...utilisateur,
    createdAt: serverTimestamp(),
  });

  return utilisateur;
};
