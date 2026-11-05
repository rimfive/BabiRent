// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Paiement Mobile Money (CinetPay) côté app
// ══════════════════════════════════════════════════════════════════════════════
// L'app ne connaît AUCUNE clé CinetPay : elle appelle l'Edge Function
// "paiement", qui calcule le montant depuis la base et parle à CinetPay.
// ══════════════════════════════════════════════════════════════════════════════

import { supabase } from '../config/supabase';
import { StatutPaiement } from '../types';

// Extrait le message d'erreur renvoyé par l'Edge Function
const lireErreur = async (error: any, defaut: string): Promise<string> => {
  try {
    const corps = await error?.context?.json?.();
    if (corps?.erreur) return corps.erreur;
  } catch { /* corps illisible */ }
  return error?.message ?? defaut;
};

// ── Démarrer un paiement → renvoie l'URL de la page CinetPay ─────────────────
export const initierPaiement = async (
  reservationId: string,
): Promise<{ paymentUrl: string; montant: number }> => {
  try {
    const { data, error } = await supabase.functions.invoke('paiement', {
      body: { action: 'initier', reservation_id: reservationId },
    });
    if (error) throw new Error(await lireErreur(error, 'Impossible de démarrer le paiement.'));
    if (!data?.payment_url) throw new Error(data?.erreur ?? 'Réponse de paiement invalide.');
    return { paymentUrl: data.payment_url, montant: data.montant };
  } catch (e) {
    throw e instanceof Error ? e : new Error('Impossible de démarrer le paiement.');
  }
};

// ── Redemander le statut du paiement (après retour de la page CinetPay) ─────
export const verifierPaiement = async (reservationId: string): Promise<StatutPaiement> => {
  try {
    const { data, error } = await supabase.functions.invoke('paiement', {
      body: { action: 'verifier', reservation_id: reservationId },
    });
    if (error) throw new Error(await lireErreur(error, 'Vérification impossible.'));
    return (data?.statut_paiement ?? 'en_cours') as StatutPaiement;
  } catch (e) {
    throw e instanceof Error ? e : new Error('Vérification impossible.');
  }
};
