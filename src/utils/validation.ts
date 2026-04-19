// Validations pour les formulaires BABI RENT

export const validerEmail = (email: string): string | true => {
  if (!email) return 'Email obligatoire';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) return 'Email invalide';
  return true;
};

export const validerTelephone = (tel: string): string | true => {
  if (!tel) return 'Téléphone obligatoire';
  const regex = /^\+?[1-9]\d{7,14}$/;
  const telNettoye = tel.replace(/[\s\-().]/g, '');
  if (!regex.test(telNettoye)) return 'Numéro invalide (ex: +2250700000000)';
  return true;
};

export const validerMotDePasse = (mdp: string): string | true => {
  if (!mdp) return 'Mot de passe obligatoire';
  if (mdp.length < 6) return 'Minimum 6 caractères';
  return true;
};

export const validerNom = (nom: string): string | true => {
  if (!nom || nom.trim().length < 2) return 'Nom obligatoire (min 2 caractères)';
  return true;
};

export const validerPrix = (prix: number): string | true => {
  if (!prix || prix <= 0) return 'Prix invalide';
  if (prix > 10000000) return 'Prix trop élevé';
  return true;
};

export const validerDescription = (desc: string): string | true => {
  if (!desc || desc.trim().length < 20) return 'Description trop courte (min 20 caractères)';
  return true;
};
