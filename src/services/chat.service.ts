import { supabase } from '../config/supabase';

// ── Récupère ou crée une conversation ────────────────────────────────────────
export const getOuCreerConversation = async (
  moiId: string,
  autreId: string,
  annonceId: string,
  typeAnnonce: 'vehicule' | 'logement',
  titreAnnonce: string,
): Promise<string> => {
  // Chercher si une conversation existe déjà pour cette annonce avec ces 2 participants
  const { data: existantes } = await supabase
    .from('conversations')
    .select('id, participants')
    .eq('annonce_id', annonceId)
    .contains('participants', [moiId]);

  if (existantes) {
    const existante = existantes.find((c: any) =>
      (c.participants as string[]).includes(autreId)
    );
    if (existante) return existante.id;
  }

  // Créer une nouvelle conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participants:         [moiId, autreId],
      annonce_id:           annonceId,
      type_annonce:         typeAnnonce,
      titre_annonce:        titreAnnonce,
      non_lu:               0,
      dernier_message:      '',
      dernier_message_date: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
};

// ── Envoyer un message ────────────────────────────────────────────────────────
export const envoyerMessage = async (
  conversationId: string,
  expediteurId: string,
  contenu: string,
): Promise<void> => {
  const texte = contenu.trim();
  if (!texte) return;

  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    expediteur_id:   expediteurId,
    contenu:         texte,
    lu:              false,
  });
  if (msgError) throw new Error(msgError.message);

  // Récupérer non_lu actuel pour l'incrémenter
  const { data: conv } = await supabase
    .from('conversations')
    .select('non_lu')
    .eq('id', conversationId)
    .single();

  const { error: convError } = await supabase
    .from('conversations')
    .update({
      dernier_message:      texte,
      dernier_message_date: new Date().toISOString(),
      non_lu:               (conv?.non_lu ?? 0) + 1,
    })
    .eq('id', conversationId);

  if (convError) throw new Error(convError.message);
};

// ── Supprimer un message ─────────────────────────────────────────────────────
export const supprimerMessage = async (messageId: string, conversationId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  if (error) throw new Error(error.message);

  // Mettre à jour le dernier message de la conversation
  const { data: dernierMsg } = await supabase
    .from('messages')
    .select('contenu, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('conversations')
    .update({
      dernier_message:      dernierMsg?.contenu ?? '',
      dernier_message_date: dernierMsg?.created_at ?? new Date().toISOString(),
    })
    .eq('id', conversationId);
};

// ── Marquer les messages comme lus ───────────────────────────────────────────
export const marquerConversationLue = async (
  conversationId: string,
  utilisateurId: string,
): Promise<void> => {
  // Marquer tous les messages non lus (pas envoyés par moi) comme lus
  await supabase
    .from('messages')
    .update({ lu: true })
    .eq('conversation_id', conversationId)
    .eq('lu', false)
    .neq('expediteur_id', utilisateurId);

  // Remettre le compteur non_lu à 0
  await supabase
    .from('conversations')
    .update({ non_lu: 0 })
    .eq('id', conversationId);
};
