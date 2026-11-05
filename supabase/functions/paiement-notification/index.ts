// ══════════════════════════════════════════════════════════════════════════════
// BABI RENT — Edge Function "paiement-notification" (appelée par CinetPay)
// ══════════════════════════════════════════════════════════════════════════════
// • notify_url : CinetPay envoie { cpm_trans_id, cpm_site_id } (formulaire)
// • return_url (?retour=1) : le navigateur du client revient ici après paiement
// Dans les deux cas, on REVÉRIFIE auprès de CinetPay avant de marquer "payé" :
// une fausse notification ne peut donc rien valider.
// ⚠️ À déployer avec --no-verify-jwt (CinetPay n'a pas de jeton Supabase).
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { clientAdmin, verifierEtEnregistrer, siteId } from '../_shared/cinetpay.ts';

const lireTransaction = async (req: Request): Promise<{ id: string; site: string }> => {
  const url = new URL(req.url);
  let id   = url.searchParams.get('cpm_trans_id') ?? url.searchParams.get('transaction_id') ?? '';
  let site = url.searchParams.get('cpm_site_id') ?? '';
  if (req.method === 'POST') {
    const type = req.headers.get('content-type') ?? '';
    try {
      if (type.includes('application/json')) {
        const corps = await req.json();
        id   = corps.cpm_trans_id ?? corps.transaction_id ?? id;
        site = corps.cpm_site_id ?? site;
      } else {
        const form = await req.formData();
        id   = String(form.get('cpm_trans_id') ?? form.get('transaction_id') ?? id);
        site = String(form.get('cpm_site_id') ?? site);
      }
    } catch { /* corps vide : CinetPay teste juste que l'URL répond */ }
  }
  return { id, site };
};

serve(async (req) => {
  const estRetour = new URL(req.url).searchParams.has('retour');
  let message = 'Paiement en cours de traitement. Tu peux retourner dans l\'application BabiRent.';

  try {
    const { id, site } = await lireTransaction(req);
    if (id && (!site || site === siteId())) {
      const statut = await verifierEtEnregistrer(clientAdmin(), id);
      if (statut === 'paye')   message = '✅ Paiement réussi ! Retourne dans l\'application BabiRent.';
      if (statut === 'echoue') message = '❌ Paiement échoué ou annulé. Retourne dans l\'application BabiRent pour réessayer.';
    }
  } catch (e) {
    console.error(e);
  }

  // Pour CinetPay : un simple 200 suffit. Pour le client : un message lisible.
  return new Response(estRetour ? message : 'ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
});
