// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Edge Function "paiement" (appelée par l'app, utilisateur connecté)
// ══════════════════════════════════════════════════════════════════════════════
// Corps attendu : { action: 'initier' | 'verifier', reservation_id: string }
//  • initier  → crée la transaction CinetPay et renvoie { payment_url }
//  • verifier → redemande le statut à CinetPay et renvoie { statut_paiement }
// Le montant vient TOUJOURS de la base (jamais de l'app).
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  clientAdmin, arrondirMontant, nouvelleTransaction, creerPaiementCinetPay,
  verifierEtEnregistrer, enTetesCors, reponseJson, cleApi, siteId,
} from '../_shared/cinetpay.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: enTetesCors });

  try {
    if (!cleApi() || !siteId()) {
      return reponseJson({ erreur: 'Paiement non configuré (clés CinetPay manquantes).' }, 500);
    }

    // ── Qui appelle ? (jeton de l'utilisateur envoyé par supabase-js) ──
    const jeton = req.headers.get('Authorization') ?? '';
    const clientUtilisateur = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: jeton } } },
    );
    const { data: { user } } = await clientUtilisateur.auth.getUser();
    if (!user) return reponseJson({ erreur: 'Connexion requise.' }, 401);

    const { action, reservation_id } = await req.json();
    if (!reservation_id) return reponseJson({ erreur: 'Réservation manquante.' }, 400);

    const admin = clientAdmin();
    const { data: resa } = await admin
      .from('reservations')
      .select('id, loueur_id, statut, statut_paiement, prix_total, methode_paiement, type')
      .eq('id', reservation_id)
      .maybeSingle();

    if (!resa || resa.loueur_id !== user.id) {
      return reponseJson({ erreur: 'Réservation introuvable.' }, 404);
    }

    // ── VÉRIFIER ──────────────────────────────────────────────────────────
    if (action === 'verifier') {
      const { data: dernier } = await admin
        .from('paiements')
        .select('transaction_id')
        .eq('reservation_id', reservation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!dernier) return reponseJson({ statut_paiement: resa.statut_paiement });
      const statut = await verifierEtEnregistrer(admin, dernier.transaction_id);
      return reponseJson({ statut_paiement: statut === 'en_attente' ? 'en_cours' : statut });
    }

    // ── INITIER ───────────────────────────────────────────────────────────
    if (action !== 'initier') return reponseJson({ erreur: 'Action inconnue.' }, 400);

    if (resa.statut !== 'confirmee') {
      return reponseJson({ erreur: 'Le propriétaire doit d\'abord confirmer la réservation.' }, 400);
    }
    if (resa.statut_paiement === 'paye') {
      return reponseJson({ erreur: 'Cette réservation est déjà payée.' }, 400);
    }
    if (resa.methode_paiement === 'especes') {
      return reponseJson({ erreur: 'Cette réservation se paie en espèces.' }, 400);
    }

    const montant = arrondirMontant(Number(resa.prix_total));
    if (!(montant > 0)) return reponseJson({ erreur: 'Montant invalide.' }, 400);

    const { data: profil } = await admin
      .from('users')
      .select('nom, prenom, email, telephone, ville')
      .eq('id', user.id)
      .maybeSingle();

    const transactionId = nouvelleTransaction();
    const base = Deno.env.get('SUPABASE_URL')!;
    const urlNotification = `${base}/functions/v1/paiement-notification`;

    // On enregistre la transaction AVANT d'appeler CinetPay
    const { error: errInsert } = await admin.from('paiements').insert({
      reservation_id,
      utilisateur_id: user.id,
      transaction_id: transactionId,
      montant,
    });
    if (errInsert) throw new Error(errInsert.message);

    const { paymentUrl, reponse } = await creerPaiementCinetPay({
      transactionId,
      montant,
      description: `Location BabiRent ${resa.type} ${transactionId}`,
      notifyUrl:   urlNotification,
      returnUrl:   `${urlNotification}?retour=1`,
      canal:       resa.methode_paiement === 'carte' ? 'CREDIT_CARD' : 'MOBILE_MONEY',
      client: {
        nom:       profil?.nom ?? '',
        prenom:    profil?.prenom ?? '',
        email:     profil?.email ?? user.email ?? '',
        telephone: profil?.telephone ?? '',
        ville:     profil?.ville ?? '',
      },
    });

    await admin.from('paiements')
      .update({ payment_url: paymentUrl, reponse })
      .eq('transaction_id', transactionId);
    await admin.from('reservations')
      .update({ statut_paiement: 'en_cours' })
      .eq('id', reservation_id);

    return reponseJson({ payment_url: paymentUrl, montant });
  } catch (e) {
    console.error(e);
    return reponseJson({ erreur: e instanceof Error ? e.message : 'Erreur serveur.' }, 500);
  }
});
