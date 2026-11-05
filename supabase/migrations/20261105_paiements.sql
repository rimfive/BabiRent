-- ══════════════════════════════════════════════════════════════════════════════
-- BABI RENT — Paiement Mobile Money (CinetPay)
-- ══════════════════════════════════════════════════════════════════════════════
-- Flux : réservation confirmée par le propriétaire → le locataire paie via
-- CinetPay → CinetPay prévient le serveur → le serveur VÉRIFIE auprès de
-- CinetPay puis marque la réservation "payée".
-- Seules les Edge Functions (service_role) peuvent écrire dans "paiements" ou
-- changer le statut de paiement : l'app ne peut que lire.
-- À exécuter UNE fois dans Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Statut de paiement sur la réservation ─────────────────────────────────
alter table public.reservations
  add column if not exists statut_paiement text not null default 'non_paye';
alter table public.reservations
  add column if not exists paiement_ref text;

alter table public.reservations drop constraint if exists reservations_statut_paiement_check;
alter table public.reservations add constraint reservations_statut_paiement_check
  check (statut_paiement in ('non_paye', 'en_cours', 'paye', 'echoue', 'rembourse'));


-- ── 2. Historique des transactions ───────────────────────────────────────────
create table if not exists public.paiements (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  utilisateur_id  uuid not null references auth.users(id) on delete cascade,
  transaction_id  text not null unique,
  montant         numeric not null check (montant > 0),
  devise          text not null default 'XOF',
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'paye', 'echoue')),
  operateur       text,           -- OM, MOMO, WAVE… (renvoyé par CinetPay)
  payment_url     text,
  reponse         jsonb,          -- dernière réponse brute de CinetPay (débogage)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists paiements_reservation_idx on public.paiements(reservation_id);

alter table public.paiements enable row level security;

-- Lecture : le payeur et le propriétaire de la réservation
drop policy if exists "paiements_lecture" on public.paiements;
create policy "paiements_lecture" on public.paiements for select to authenticated
  using (
    utilisateur_id = auth.uid()
    or exists (select 1 from public.reservations r
               where r.id = paiements.reservation_id
                 and r.proprietaire_id = auth.uid())
  );
-- Aucune règle insert/update/delete → seules les Edge Functions écrivent.


-- ── 3. Création de réservation : statut de paiement imposé ───────────────────
-- (on complète le trigger de 20261105_securite_reservations.sql)
create or replace function public.reservation_paiement_initial()
returns trigger language plpgsql as $$
begin
  new.statut_paiement := 'non_paye';
  new.paiement_ref    := null;
  return new;
end $$;

drop trigger if exists trg_reservation_paiement_initial on public.reservations;
create trigger trg_reservation_paiement_initial
  before insert on public.reservations
  for each row execute function public.reservation_paiement_initial();


-- ── 4. Modification : l'app ne peut pas se déclarer "payée" ─────────────────
create or replace function public.reservation_avant_modification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  est_proprio  boolean := auth.uid() = old.proprietaire_id;
  est_loueur   boolean := auth.uid() = old.loueur_id;
begin
  -- Les Edge Functions (service_role, auth.uid() null) gardent tous les droits
  if auth.uid() is null then
    return new;
  end if;

  -- Interdit de toucher au prix, aux dates, aux personnes, au paiement…
  if (new.type, new.annonce_id, new.loueur_id, new.proprietaire_id,
      new.date_debut, new.date_fin, new.nombre_jours, new.prix_total,
      new.commission, new.montant_proprietaire,
      new.methode_paiement, new.statut_paiement, new.paiement_ref)
     is distinct from
     (old.type, old.annonce_id, old.loueur_id, old.proprietaire_id,
      old.date_debut, old.date_fin, old.nombre_jours, old.prix_total,
      old.commission, old.montant_proprietaire,
      old.methode_paiement, old.statut_paiement, old.paiement_ref)
  then
    raise exception 'Seul le statut d''une réservation peut être modifié';
  end if;

  if new.statut is distinct from old.statut then
    -- Pas de location "en cours" sans paiement (sauf paiement en espèces)
    if new.statut = 'en_cours'
       and old.methode_paiement <> 'especes'
       and old.statut_paiement <> 'paye' then
      raise exception 'La location ne peut pas démarrer : paiement non reçu';
    end if;

    if est_proprio and (
         (old.statut = 'en_attente' and new.statut in ('confirmee', 'annulee')) or
         (old.statut = 'confirmee'  and new.statut in ('en_cours', 'annulee'))  or
         (old.statut = 'en_cours'   and new.statut = 'terminee')
       ) then
      return new;
    end if;
    if est_loueur and old.statut in ('en_attente', 'confirmee') and new.statut = 'annulee' then
      return new;
    end if;
    raise exception 'Changement de statut non autorisé (% → %)', old.statut, new.statut;
  end if;

  return new;
end;
$$;

commit;

notify pgrst, 'reload schema';
