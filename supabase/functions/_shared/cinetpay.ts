// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Outils CinetPay partagés (Edge Functions uniquement)
// ══════════════════════════════════════════════════════════════════════════════
// ⚠️ Les clés CinetPay sont des SECRETS Supabase (jamais dans l'app) :
//     supabase secrets set CINETPAY_API_KEY=... CINETPAY_SITE_ID=...
// ══════════════════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CINETPAY_API = 'https://api-checkout.cinetpay.com/v2';

export const cleApi  = () => Deno.env.get('CINETPAY_API_KEY') ?? '';
export const siteId  = () => Deno.env.get('CINETPAY_SITE_ID') ?? '';

// Client "service_role" : contourne RLS → à n'utiliser QUE côté serveur
export const clientAdmin = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// CinetPay exige un montant XOF multiple de 5
export const arrondirMontant = (montant: number): number => Math.ceil(montant / 5) * 5;

// Identifiant de transaction unique, alphanumérique (exigé par CinetPay)
export const nouvelleTransaction = (): string =>
  'BR' + Date.now().toString(36).toUpperCase() +
  crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

// ── Créer la page de paiement chez CinetPay ──────────────────────────────────
export const creerPaiementCinetPay = async (params: {
  transactionId: string;
  montant:       number;
  description:   string;
  notifyUrl:     string;
  returnUrl:     string;
  canal:         'MOBILE_MONEY' | 'CREDIT_CARD' | 'ALL';
  client: { nom: string; prenom: string; email: string; telephone: string; ville: string };
}): Promise<{ paymentUrl: string; reponse: unknown }> => {
  const res = await fetch(`${CINETPAY_API}/payment`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:         cleApi(),
      site_id:        siteId(),
      transaction_id: params.transactionId,
      amount:         params.montant,
      currency:       'XOF',
      description:    params.description,
      notify_url:     params.notifyUrl,
      return_url:     params.returnUrl,
      channels:       params.canal,
      lang:           'fr',
      // Infos client (obligatoires pour la carte bancaire, utiles sinon)
      customer_name:         params.client.nom || 'Client',
      customer_surname:      params.client.prenom || 'BabiRent',
      customer_email:        params.client.email,
      customer_phone_number: params.client.telephone,
      customer_address:      params.client.ville || 'Abidjan',
      customer_city:         params.client.ville || 'Abidjan',
      customer_country:      'CI',
      customer_state:        'CI',
      customer_zip_code:     '00225',
    }),
  });
  const reponse = await res.json().catch(() => ({}));
  const url = (reponse as any)?.data?.payment_url;
  if ((reponse as any)?.code !== '201' || !url) {
    throw new Error(`CinetPay a refusé la demande : ${(reponse as any)?.message ?? res.status}`);
  }
  return { paymentUrl: url, reponse };
};

// ── Vérifier une transaction auprès de CinetPay et mettre la base à jour ─────
// On ne fait JAMAIS confiance à la notification seule : on redemande à CinetPay.
export const verifierEtEnregistrer = async (
  admin: SupabaseClient,
  transactionId: string,
): Promise<'paye' | 'echoue' | 'en_attente'> => {
  const { data: paiement } = await admin
    .from('paiements')
    .select('id, reservation_id, montant, statut')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (!paiement) throw new Error('Transaction inconnue');
  if (paiement.statut === 'paye') return 'paye';  // déjà traité

  const res = await fetch(`${CINETPAY_API}/payment/check`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: cleApi(), site_id: siteId(), transaction_id: transactionId }),
  });
  const reponse: any = await res.json().catch(() => ({}));
  const statutCinetPay: string = reponse?.data?.status ?? '';
  const montantRecu = Number(reponse?.data?.amount ?? 0);

  let statut: 'paye' | 'echoue' | 'en_attente' = 'en_attente';
  if (statutCinetPay === 'ACCEPTED' && montantRecu >= Number(paiement.montant)
      && (reponse?.data?.currency ?? 'XOF') === 'XOF') {
    statut = 'paye';
  } else if (statutCinetPay === 'REFUSED' || statutCinetPay === 'CANCELED') {
    statut = 'echoue';
  }

  await admin.from('paiements').update({
    statut,
    operateur:  reponse?.data?.payment_method ?? null,
    reponse,
    updated_at: new Date().toISOString(),
  }).eq('id', paiement.id);

  if (statut === 'paye') {
    await admin.from('reservations')
      .update({ statut_paiement: 'paye', paiement_ref: transactionId })
      .eq('id', paiement.reservation_id);
  } else if (statut === 'echoue') {
    await admin.from('reservations')
      .update({ statut_paiement: 'echoue' })
      .eq('id', paiement.reservation_id)
      .neq('statut_paiement', 'paye');
  }
  return statut;
};

export const enTetesCors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const reponseJson = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: { ...enTetesCors, 'Content-Type': 'application/json' },
  });
