-- ══════════════════════════════════════════════════════════════════════════════
-- BABI RENT — Sécurisation des réservations (côté serveur)
-- ══════════════════════════════════════════════════════════════════════════════
-- Avant : le prix, la commission, le propriétaire et le statut étaient calculés
-- dans l'app → n'importe qui pouvait envoyer prix_total = 1 ou statut = 'confirmee'.
-- Maintenant : la base recalcule tout elle-même et refuse les changements interdits.
-- À exécuter UNE fois dans Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Création : la base impose les valeurs sensibles ───────────────────────
create or replace function public.reservation_avant_insertion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prix_jour  numeric;
  v_proprio    uuid;
  v_jours      int;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  -- Le locataire est TOUJOURS l'utilisateur connecté
  new.loueur_id := auth.uid();

  -- Prix et propriétaire lus dans l'annonce (jamais ceux envoyés par l'app)
  if new.type = 'vehicule' then
    select prix_jour, proprietaire_id into v_prix_jour, v_proprio
      from public.vehicules where id = new.annonce_id;
  elsif new.type = 'logement' then
    select prix_jour, proprietaire_id into v_prix_jour, v_proprio
      from public.logements where id = new.annonce_id;
  else
    raise exception 'Type de réservation invalide';
  end if;

  if v_proprio is null then
    raise exception 'Annonce introuvable';
  end if;
  if v_proprio = auth.uid() then
    raise exception 'Tu ne peux pas réserver ta propre annonce';
  end if;

  -- Dates valides : pas dans le passé, fin après début
  if new.date_debut::date < current_date then
    raise exception 'La date de début est passée';
  end if;
  v_jours := new.date_fin::date - new.date_debut::date;
  if v_jours < 1 then
    raise exception 'La date de fin doit être après la date de début';
  end if;

  -- Pas de chevauchement avec une réservation active
  if exists (
    select 1 from public.reservations r
    where r.annonce_id = new.annonce_id
      and r.statut in ('en_attente', 'confirmee', 'en_cours')
      and r.date_debut::date <= new.date_fin::date
      and r.date_fin::date   >= new.date_debut::date
  ) then
    raise exception 'Ces dates sont déjà réservées';
  end if;

  -- Montants recalculés (commission 10 %, comme COMMISSION_TAUX dans l'app)
  new.proprietaire_id      := v_proprio;
  new.nombre_jours         := v_jours;
  new.prix_total           := coalesce(v_prix_jour, 0) * v_jours;
  new.commission           := round(new.prix_total * 0.10);
  new.montant_proprietaire := new.prix_total - new.commission;
  new.statut               := 'en_attente';
  return new;
end;
$$;

drop trigger if exists trg_reservation_avant_insertion on public.reservations;
create trigger trg_reservation_avant_insertion
  before insert on public.reservations
  for each row execute function public.reservation_avant_insertion();


-- ── 2. Modification : seul le statut peut changer, selon qui on est ─────────
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
  -- Les fonctions serveur (service_role, auth.uid() null) gardent tous les droits
  if auth.uid() is null then
    return new;
  end if;

  -- Interdit de toucher au prix, aux dates, aux personnes…
  if (new.type, new.annonce_id, new.loueur_id, new.proprietaire_id,
      new.date_debut, new.date_fin, new.nombre_jours, new.prix_total,
      new.commission, new.montant_proprietaire)
     is distinct from
     (old.type, old.annonce_id, old.loueur_id, old.proprietaire_id,
      old.date_debut, old.date_fin, old.nombre_jours, old.prix_total,
      old.commission, old.montant_proprietaire)
  then
    raise exception 'Seul le statut d''une réservation peut être modifié';
  end if;

  if new.statut is distinct from old.statut then
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

drop trigger if exists trg_reservation_avant_modification on public.reservations;
create trigger trg_reservation_avant_modification
  before update on public.reservations
  for each row execute function public.reservation_avant_modification();


-- ── 3. Dates déjà réservées d'une annonce (calendrier) ──────────────────────
-- Les règles RLS cachent (à raison) les réservations des autres → le calendrier
-- ne voyait aucune date bloquée et laissait réserver des dates déjà prises.
-- Cette fonction ne renvoie QUE les dates, sans qui a réservé ni le prix.
create or replace function public.dates_reservees(p_annonce_id uuid)
returns table (date_debut date, date_fin date)
language sql
stable
security definer
set search_path = public
as $$
  select r.date_debut::date, r.date_fin::date
  from public.reservations r
  where r.annonce_id = p_annonce_id
    and r.statut in ('en_attente', 'confirmee', 'en_cours');
$$;

revoke all on function public.dates_reservees(uuid) from public;
grant execute on function public.dates_reservees(uuid) to anon, authenticated;
