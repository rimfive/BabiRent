import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  // Sécurité : seul le webhook Supabase (qui envoie le secret) peut appeler
  // cette fonction. Sans ça, n'importe qui pouvait envoyer de fausses
  // notifications à tous les utilisateurs.
  const secretAttendu = Deno.env.get('WEBHOOK_SECRET');
  if (!secretAttendu || req.headers.get('x-webhook-secret') !== secretAttendu) {
    return new Response('Non autorisé', { status: 401 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (table === 'messages' && type === 'INSERT') {
      await gererNouveauMessage(supabase, record);
    } else if (table === 'reservations') {
      await gererReservation(supabase, type, record, old_record);
    }
  } catch (e) {
    console.error(e);
  }

  return new Response('ok', { status: 200 });
});

async function envoyerPush(tokens: string[], title: string, body: string, data?: object) {
  if (!tokens.length) return;
  const messages = tokens
    .filter(Boolean)
    .map(to => ({ to, title, body, data, sound: 'default', priority: 'high' }));
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
}

async function gererNouveauMessage(supabase: any, msg: any) {
  const { data: conv } = await supabase
    .from('conversations')
    .select('participants, titre_annonce')
    .eq('id', msg.conversation_id)
    .single();
  if (!conv) return;

  const destinataires = (conv.participants as string[]).filter(p => p !== msg.expediteur_id);
  if (!destinataires.length) return;

  const [{ data: profiles }, { data: expediteur }] = await Promise.all([
    supabase.from('users').select('push_token').in('id', destinataires),
    supabase.from('users').select('nom').eq('id', msg.expediteur_id).single(),
  ]);

  const tokens = (profiles ?? []).map((p: any) => p.push_token).filter(Boolean);
  if (!tokens.length) return;

  const titre = (conv.titre_annonce ?? '').replace(/^(🚗|🏠|🛍️|🚙|🏡|🔑)\s*/u, '').trim() || 'Message';
  const expediteurNom = expediteur?.nom ?? 'Quelqu\'un';
  const preview = msg.contenu.length > 80 ? msg.contenu.substring(0, 80) + '…' : msg.contenu;

  await envoyerPush(tokens, expediteurNom, preview, {
    conversationId: msg.conversation_id,
    titre,
  });
}

async function gererReservation(supabase: any, type: string, record: any, old_record: any) {
  if (type === 'INSERT') {
    const { data: proprio } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', record.proprietaire_id)
      .single();
    if (!proprio?.push_token) return;
    await envoyerPush(
      [proprio.push_token],
      '🔔 Nouvelle demande de location',
      'Quelqu\'un veut louer ton annonce !',
      { screen: 'reservations' },
    );
  } else if (type === 'UPDATE' && old_record?.statut !== record.statut) {
    const { data: locataire } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', record.loueur_id)
      .single();
    if (!locataire?.push_token) return;

    const messages: Record<string, string> = {
      confirmee: '✅ Ta réservation a été confirmée !',
      annulee:   '❌ Ta réservation a été annulée.',
      en_cours:  '🚀 Ta location est maintenant en cours.',
      terminee:  '🏁 Ta location est terminée. Merci !',
    };
    const body = messages[record.statut] ?? 'Statut de ta réservation mis à jour.';
    await envoyerPush([locataire.push_token], 'BABI RENT', body, { screen: 'reservations' });
  }
}
