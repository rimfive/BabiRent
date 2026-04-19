import { DEVISE } from '../config/constantes';

// Formater un prix en FCFA
export const formatPrix = (montant: number): string => {
  return `${montant.toLocaleString('fr-FR')} ${DEVISE}`;
};

// Formater une date
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Formater une date courte
export const formatDateCourte = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// Calculer le nombre de jours entre 2 dates
export const calculerJours = (debut: string, fin: string): number => {
  const d1 = new Date(debut);
  const d2 = new Date(fin);
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Tronquer un texte
export const tronquer = (texte: string, longueur = 80): string => {
  if (texte.length <= longueur) return texte;
  return texte.substring(0, longueur) + '...';
};

// Formater une note (ex: 4.8)
export const formatNote = (note: number): string => note.toFixed(1);

// Initiales d'un nom
export const initiales = (nom: string, prenom?: string): string => {
  const n = nom.charAt(0).toUpperCase();
  const p = prenom ? prenom.charAt(0).toUpperCase() : '';
  return n + p;
};

// Durée depuis maintenant (ex: "il y a 2h")
export const depuisMaintenant = (dateStr: string): string => {
  const date = new Date(dateStr);
  const maintenant = new Date();
  const diff = maintenant.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (heures < 24) return `il y a ${heures}h`;
  if (jours < 7) return `il y a ${jours}j`;
  return formatDate(dateStr);
};
