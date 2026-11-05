-- ══════════════════════════════════════════════════════════════════════════════
-- BABI RENT — Nettoyage et durcissement des règles d'accès (RLS + Storage)
-- ══════════════════════════════════════════════════════════════════════════════
-- Problèmes corrigés :
--  1. Photos : n'importe quel connecté pouvait SUPPRIMER ou REMPLACER la photo
--     de profil de n'importe qui, et envoyer des fichiers dans n'importe quel
--     dossier (une règle "with check true" ouvrait tous les buckets).
--  2. Messages : une règle permettait d'écrire dans une conversation dont on ne
--     fait pas partie (et donc d'envoyer des notifications à des inconnus).
--  3. Messages : "marquer comme lu" ne marchait pas (aucune règle UPDATE).
--  4. Conversations : on pouvait modifier la liste des participants.
--  5. Doublons : 2 à 3 règles identiques par action → remplacées par une seule.
-- Toutes les règles visent "authenticated" (connecté), sauf la lecture des
-- annonces et des photos d'annonces, qui reste publique.
-- À exécuter UNE fois dans Supabase → SQL Editor (après 20261105_securite_reservations.sql).
-- ══════════════════════════════════════════════════════════════════════════════

begin;

-- ── 0. Supprimer toutes les anciennes règles des tables concernées ─────────────
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where (schemaname = 'public'  and tablename in
            ('vehicules','logements','articles','reservations','conversations','messages'))
       or (schemaname = 'storage' and tablename = 'objects')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.vehicules     enable row level security;
alter table public.logements     enable row level security;
alter table public.articles      enable row level security;
alter table public.reservations  enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;


-- ── 1. Annonces (véhicules, logements, articles) ──────────────────────────────
-- Lecture publique, écriture réservée au propriétaire.
create policy "vehicules_lecture"   on public.vehicules for select using (true);
create policy "vehicules_creation"  on public.vehicules for insert to authenticated
  with check (auth.uid() = proprietaire_id);
create policy "vehicules_modif"     on public.vehicules for update to authenticated
  using (auth.uid() = proprietaire_id) with check (auth.uid() = proprietaire_id);
create policy "vehicules_suppr"     on public.vehicules for delete to authenticated
  using (auth.uid() = proprietaire_id);

create policy "logements_lecture"   on public.logements for select using (true);
create policy "logements_creation"  on public.logements for insert to authenticated
  with check (auth.uid() = proprietaire_id);
create policy "logements_modif"     on public.logements for update to authenticated
  using (auth.uid() = proprietaire_id) with check (auth.uid() = proprietaire_id);
create policy "logements_suppr"     on public.logements for delete to authenticated
  using (auth.uid() = proprietaire_id);

create policy "articles_lecture"    on public.articles for select using (true);
create policy "articles_creation"   on public.articles for insert to authenticated
  with check (auth.uid() = proprietaire_id);
create policy "articles_modif"      on public.articles for update to authenticated
  using (auth.uid() = proprietaire_id) with check (auth.uid() = proprietaire_id);
create policy "articles_suppr"      on public.articles for delete to authenticated
  using (auth.uid() = proprietaire_id);


-- ── 2. Réservations ──────────────────────────────────────────────────────────
-- Les montants, le statut et les transitions sont contrôlés par les triggers
-- de 20261105_securite_reservations.sql.
create policy "reservations_lecture" on public.reservations for select to authenticated
  using (auth.uid() in (loueur_id, proprietaire_id));
create policy "reservations_creation" on public.reservations for insert to authenticated
  with check (auth.uid() = loueur_id);
create policy "reservations_modif" on public.reservations for update to authenticated
  using (auth.uid() in (loueur_id, proprietaire_id))
  with check (auth.uid() in (loueur_id, proprietaire_id));
-- Pas de DELETE : on annule une réservation, on ne l'efface pas.


-- ── 3. Conversations ─────────────────────────────────────────────────────────
create policy "conversations_lecture" on public.conversations for select to authenticated
  using (participants @> array[auth.uid()]);
-- Une conversation = exactement 2 personnes dont moi
create policy "conversations_creation" on public.conversations for insert to authenticated
  with check (participants @> array[auth.uid()] and cardinality(participants) = 2);
create policy "conversations_modif" on public.conversations for update to authenticated
  using (participants @> array[auth.uid()])
  with check (participants @> array[auth.uid()]);

-- Les participants et l'annonce d'une conversation ne peuvent plus changer
create or replace function public.conversation_champs_figes()
returns trigger language plpgsql as $$
begin
  if new.participants is distinct from old.participants
     or new.annonce_id is distinct from old.annonce_id then
    raise exception 'Les participants d''une conversation ne peuvent pas être modifiés';
  end if;
  return new;
end $$;

drop trigger if exists trg_conversation_champs_figes on public.conversations;
create trigger trg_conversation_champs_figes
  before update on public.conversations
  for each row execute function public.conversation_champs_figes();


-- ── 4. Messages ──────────────────────────────────────────────────────────────
create policy "messages_lecture" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c
                 where c.id = messages.conversation_id
                   and c.participants @> array[auth.uid()]));
-- Écrire seulement dans SES conversations, en son propre nom
create policy "messages_envoi" on public.messages for insert to authenticated
  with check (auth.uid() = expediteur_id
              and exists (select 1 from public.conversations c
                          where c.id = messages.conversation_id
                            and c.participants @> array[auth.uid()]));
-- Marquer comme lus les messages REÇUS
create policy "messages_marquer_lu" on public.messages for update to authenticated
  using (expediteur_id <> auth.uid()
         and exists (select 1 from public.conversations c
                     where c.id = messages.conversation_id
                       and c.participants @> array[auth.uid()]))
  with check (expediteur_id <> auth.uid());
-- … et seule la colonne "lu" est modifiable (impossible de réécrire le texte)
revoke update on public.messages from authenticated, anon;
grant  update (lu) on public.messages to authenticated;

create policy "messages_suppr" on public.messages for delete to authenticated
  using (auth.uid() = expediteur_id);


-- ── 5. Photos (Storage) ──────────────────────────────────────────────────────
-- L'app range chaque fichier dans "<uid>/..." → chacun ne touche qu'à SON dossier.
-- Lecture publique (les photos d'annonces et d'avatar sont affichées à tous).
create policy "photos_lecture" on storage.objects for select
  using (bucket_id in ('vehicules','logements','marketplace','profiles'));

create policy "photos_envoi" on storage.objects for insert to authenticated
  with check (bucket_id in ('vehicules','logements','marketplace','profiles')
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_modif" on storage.objects for update to authenticated
  using (bucket_id in ('vehicules','logements','marketplace','profiles')
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('vehicules','logements','marketplace','profiles')
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_suppr" on storage.objects for delete to authenticated
  using (bucket_id in ('vehicules','logements','marketplace','profiles')
         and (storage.foldername(name))[1] = auth.uid()::text);

commit;
