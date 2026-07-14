-- ============================================================================
-- Prepaid Class Pass & Credit System
-- ============================================================================
-- Lets clients buy a package (10/20-pack) of Pilates classes, see a remaining
-- balance, and redeem 1 credit per class booking. Each booking decrements the
-- balance by 1; cancelling in time refunds the credit. A full append-only
-- ledger keeps an audit trail for the client and owner.
--
-- Design notes:
--   * `user_passes` is ONE ROW PER PURCHASE (not a single credit counter).
--     It snapshots initial_credits from the package at purchase time so that
--     later edits to the catalog never retroactively change a sold pass.
--   * All credit mutations (decrement on booking, refund on cancel, grant on
--     purchase) happen inside SECURITY DEFINER RPCs using SELECT ... FOR UPDATE
--     on the pass row. RLS forbids clients from writing remaining_credits or
--     inserting ledger rows directly.
--   * Package purchase is idempotent on stripe_payment_intent_id — a retried
--     finalize-pass-purchase call never grants a second pass.
--
-- Security:
--   - RLS restricts class_packages writes to the Owner.
--   - Clients can SELECT/UPDATE only their own user_passes, but the only
--     UPDATE they need (status housekeeping) does not touch credit counts.
--   - credit_ledger is read-only for everyone except the SECURITY DEFINER RPCs.
--
-- Reuses: public.is_owner(), public.set_updated_at() from earlier migrations.
-- ============================================================================


-- ── 1. class_packages (owner-defined catalog) ───────────────────────────

create table if not exists public.class_packages (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        not null references public.profiles(id) on delete set null,
  name          text        not null,
  description   text,
  total_credits integer     not null check (total_credits > 0),
  price_cents   integer     not null check (price_cents >= 0),
  validity_days integer     check (validity_days is null or validity_days > 0),
  is_active     boolean     not null default true,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.class_packages is
  'Owner-defined catalog of purchasable class packages (e.g. 10-pack, 20-pack). '
  'Each row is a template; buying one creates a user_passes row.';

comment on column public.class_packages.total_credits is
  'Number of classes the pass grants. Snapshotted into user_passes.initial_credits at purchase.';
comment on column public.class_packages.price_cents is
  'Stripe charge amount in cents (integer EUR). The server re-derives the real charge from this.';
comment on column public.class_packages.validity_days is
  'Days from purchase until the resulting pass expires. NULL = no expiry.';


-- ── 2. user_passes (one row per purchase / grant) ───────────────────────

create table if not exists public.user_passes (
  id                        uuid        primary key default gen_random_uuid(),
  user_id                   uuid        not null references public.profiles(id) on delete cascade,
  package_id                uuid        not null references public.class_packages(id) on delete restrict,
  purchased_at              timestamptz not null default now(),
  granted_by                uuid        references public.profiles(id) on delete set null,
  initial_credits           integer     not null check (initial_credits > 0),
  remaining_credits         integer     not null default 0
    check (remaining_credits >= 0 and remaining_credits <= initial_credits),
  expires_at                timestamptz,
  status                    text        not null default 'active'
    check (status in ('active', 'exhausted', 'expired')),
  stripe_payment_intent_id  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.user_passes is
  'A client''s active or spent class pass. One row per purchase/grant. '
  'remaining_credits is mutated only by SECURITY DEFINER RPCs (redeem/cancel/grant).';

comment on column public.user_passes.initial_credits is
  'Snapshot of class_packages.total_credits at purchase time. Edits to the catalog never change sold passes.';
comment on column public.user_passes.stripe_payment_intent_id is
  'Idempotency key for finalize-pass-purchase. NULL for owner manual grants.';
comment on column public.user_passes.status is
  'active = has credits and not expired; exhausted = remaining_credits hit 0; expired = past expires_at.';

-- Defaults remaining_credits to initial_credits when only initial is supplied.
create or replace function public.user_passes_set_defaults()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.remaining_credits = 0 and new.initial_credits > 0 then
    new.remaining_credits := new.initial_credits;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_passes_defaults on public.user_passes;
create trigger trg_user_passes_defaults
  before insert on public.user_passes
  for each row execute function public.user_passes_set_defaults();

create index if not exists user_passes_user_status_idx on public.user_passes (user_id, status);
create index if not exists user_passes_user_idx        on public.user_passes (user_id);
create index if not exists user_passes_pi_idx          on public.user_passes (stripe_payment_intent_id);
create index if not exists user_passes_package_id_idx  on public.user_passes (package_id);
create index if not exists user_passes_granted_by_idx  on public.user_passes (granted_by);
create index if not exists class_packages_owner_id_idx on public.class_packages (owner_id);


-- ── 3. credit_ledger (append-only audit trail) ─────────────────────────

create table if not exists public.credit_ledger (
  id              uuid        primary key default gen_random_uuid(),
  user_pass_id    uuid        not null references public.user_passes(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  delta           integer     not null,
  balance_after   integer     not null,
  reason          text        not null check (
    reason in ('purchase', 'booking', 'cancel_refund', 'manual_grant', 'expiry_adjustment')
  ),
  appointment_id  uuid        references public.appointments(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);

comment on table public.credit_ledger is
  'Append-only audit log of every credit movement. Written only by RPCs. '
  'delta is +N for grants/refunds, -N for bookings. balance_after is the '
  'remaining_credits value immediately after the change.';

create index if not exists credit_ledger_pass_idx  on public.credit_ledger (user_pass_id, created_at);
create index if not exists credit_ledger_user_idx  on public.credit_ledger (user_id, created_at);
create index if not exists credit_ledger_appointment_id_idx on public.credit_ledger (appointment_id);


-- ── 4. updated_at trigger for both new tables ───────────────────────────
-- set_updated_at() already exists from migration 20260711000000 (pilates_waivers)
-- and is recreated idempotently in 20260713. Recreate defensively.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_class_packages_updated_at on public.class_packages;
create trigger trg_class_packages_updated_at
  before update on public.class_packages
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_passes_updated_at on public.user_passes;
create trigger trg_user_passes_updated_at
  before update on public.user_passes
  for each row execute function public.set_updated_at();


-- ============================================================================
-- RPC: grant_user_pass
-- ============================================================================
-- Creates a user_passes row + a 'purchase' ledger row. Idempotent on
-- stripe_payment_intent_id (returns the existing pass if that PI was already
-- granted). Called by:
--   * finalize-pass-purchase edge function (granted_by = null)
--   * the Owner manual-grant UI (granted_by = owner id, PI = null)
-- ============================================================================

create or replace function public.grant_user_pass(
  p_user_id                 uuid,
  p_package_id              uuid,
  p_granted_by              uuid default null,
  p_stripe_payment_intent_id text default null,
  p_note                    text default null
) returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_pkg          record;
  v_pass_id      uuid;
  v_expires_at   timestamptz;
begin
  -- Idempotency: if this Stripe PaymentIntent already granted a pass, return it.
  if p_stripe_payment_intent_id is not null then
    select id into v_pass_id
    from public.user_passes
    where stripe_payment_intent_id = p_stripe_payment_intent_id
      and user_id = p_user_id
    limit 1;
    if v_pass_id is not null then
      return v_pass_id;
    end if;
  end if;

  select total_credits, validity_days
  into v_pkg
  from public.class_packages
  where id = p_package_id;

  if not found then
    raise exception 'Class package not found';
  end if;

  v_expires_at := case
    when v_pkg.validity_days is not null
      then now() + make_interval(days => v_pkg.validity_days)
    else null
  end;

  insert into public.user_passes (
    user_id, package_id, granted_by,
    initial_credits, remaining_credits,
    expires_at, status, stripe_payment_intent_id
  ) values (
    p_user_id, p_package_id, p_granted_by,
    v_pkg.total_credits, v_pkg.total_credits,
    v_expires_at, 'active', p_stripe_payment_intent_id
  )
  returning id into v_pass_id;

  insert into public.credit_ledger (
    user_pass_id, user_id, delta, balance_after, reason, note
  ) values (
    v_pass_id, p_user_id, v_pkg.total_credits, v_pkg.total_credits, 'purchase',
    coalesce(p_note, case when p_granted_by is not null then 'Manual grant by owner' else null end)
  );

  return v_pass_id;
end;
$$;


-- ============================================================================
-- RPC: get_active_pass_summary
-- ============================================================================
-- Returns the caller's active passes plus a rolled-up total credit balance.
-- Used by the booking Step 4 "Book with 1 Class Credit" toggle and by the
-- client Passes dashboard.
-- ============================================================================

create or replace function public.get_active_pass_summary(
  p_user_id uuid default null
) returns table (
  user_pass_id    uuid,
  package_id      uuid,
  name            text,
  remaining_credits integer,
  initial_credits integer,
  expires_at      timestamptz
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    up.id            as user_pass_id,
    up.package_id    as package_id,
    cp.name          as name,
    up.remaining_credits,
    up.initial_credits,
    up.expires_at
  from public.user_passes up
  join public.class_packages cp on cp.id = up.package_id
  where up.user_id = v_uid
    and up.status = 'active'
    and up.remaining_credits > 0
    and (up.expires_at is null or up.expires_at > now())
  order by up.expires_at asc nulls last, up.purchased_at asc;
end;
$$;


-- ============================================================================
-- RPC: redeem_class_credit
-- ============================================================================
-- Atomically consumes 1 credit from a user_pass and books the Pilates session.
-- Mirrors the validation in book_pilates_session (capacity, duplicate, started,
-- self-booking) so the credit path has the same guarantees as the paid path.
--
-- Locking: SELECT ... FOR UPDATE on the user_pass row prevents two concurrent
-- bookings from both seeing remaining_credits = 1 and double-spending.
-- ============================================================================

create or replace function public.redeem_class_credit(
  p_session_id    uuid,
  p_user_pass_id  uuid
) returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_client_id     uuid;
  v_pass          record;
  v_session       record;
  v_booked_count  integer;
  v_appointment_id uuid;
  v_master_id     uuid;
  v_duration      integer;
begin
  v_client_id := auth.uid();
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the pass row first. This serializes concurrent redemptions.
  select *
  into v_pass
  from public.user_passes
  where id = p_user_pass_id
    and user_id = v_client_id
  for update;

  if not found then
    raise exception 'Class pass not found';
  end if;

  if v_pass.status <> 'active' then
    raise exception 'This class pass is no longer active';
  end if;

  if v_pass.expires_at is not null and v_pass.expires_at <= now() then
    raise exception 'This class pass has expired';
  end if;

  if v_pass.remaining_credits < 1 then
    raise exception 'This class pass has no remaining credits';
  end if;

  -- Lock + validate the session (same rules as book_pilates_session).
  select
    s.*,
    svc.base_price,
    svc.name as service_name,
    svc.id   as service_id,
    h.profile_id as host_profile_id
  into v_session
  from public.pilates_class_sessions s
  join public.services svc on svc.id = s.service_id
  left join public.pilates_hosts h on h.id = s.host_id
  where s.id = p_session_id
    and svc.category = 'Pilates'
    and svc.is_active = true
  for update of s;

  if not found then
    raise exception 'Pilates session not found';
  end if;

  if v_session.status <> 'scheduled' then
    raise exception 'This Pilates session is not available';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'This Pilates session has already started';
  end if;

  if exists (
    select 1
    from public.pilates_session_bookings
    where session_id = p_session_id
      and client_id = v_client_id
      and status = 'booked'
  ) then
    raise exception 'You have already booked this Pilates session';
  end if;

  select count(*) into v_booked_count
  from public.pilates_session_bookings
  where session_id = p_session_id
    and status = 'booked';

  if v_booked_count >= v_session.capacity then
    raise exception 'This Pilates session is fully booked';
  end if;

  v_master_id := coalesce(v_session.host_profile_id, v_session.owner_id);

  if v_master_id = v_client_id then
    raise exception 'You cannot book a Pilates session hosted by yourself';
  end if;

  v_duration := greatest(1, ceil(extract(epoch from (v_session.ends_at - v_session.starts_at)) / 60.0)::integer);

  -- Create the appointment (price 0 — paid in credit).
  insert into public.appointments (
    master_id, client_id, service_id,
    start_time, end_time,
    price, status, notes,
    deposit_amount, deposit_paid,
    service_duration_minutes, requires_confirmation
  ) values (
    v_master_id, v_client_id, v_session.service_id,
    v_session.starts_at, v_session.ends_at,
    0, 'confirmed', 'Booked with class credit',
    0, false,
    v_duration, false
  )
  returning id into v_appointment_id;

  insert into public.appointment_confirmations (appointment_id, confirmed, confirmed_at)
  values (v_appointment_id, true, now());

  insert into public.pilates_session_bookings (session_id, appointment_id, client_id, status)
  values (p_session_id, v_appointment_id, v_client_id, 'booked');

  -- Decrement + ledger + status flip.
  update public.user_passes
  set remaining_credits = remaining_credits - 1,
      status = case when remaining_credits - 1 = 0 then 'exhausted' else status end
  where id = v_pass.id;

  insert into public.credit_ledger (
    user_pass_id, user_id, delta, balance_after, reason, appointment_id, note
  ) values (
    v_pass.id, v_client_id, -1, v_pass.remaining_credits - 1, 'booking', v_appointment_id,
    'Booked: ' || coalesce(v_session.service_name, 'Pilates class')
  );

  return v_appointment_id;
end;
$$;


-- ============================================================================
-- RPC: cancel_pilates_booking
-- ============================================================================
-- Cancels a Pilates appointment and, if the cancellation is within the refund
-- window AND the booking was credit-funded, refunds +1 credit to the pass and
-- writes a 'cancel_refund' ledger row. Idempotent.
--
-- The refund window defaults to 24h (configurable per call); cancelling MORE
-- than `p_refund_window_hours` before start_time refunds the credit.
-- Late cancellation (within the window) does NOT refund.
-- ============================================================================

create or replace function public.cancel_pilates_booking(
  p_appointment_id        uuid,
  p_refund_window_hours   integer default 24
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_client_id     uuid;
  v_appt          record;
  v_booking       record;
  v_ledger        record;
  v_pass          record;
  v_refunded      boolean := false;
  v_reason        text;
begin
  v_client_id := auth.uid();
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the appointment row.
  select id, client_id, start_time, status
  into v_appt
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if v_appt.client_id <> v_client_id then
    raise exception 'You can only cancel your own appointment';
  end if;

  -- Idempotent: already cancelled.
  if v_appt.status in ('cancelled', 'cancelled_free', 'cancelled_charge') then
    return jsonb_build_object('refunded', false, 'reason', 'Already cancelled');
  end if;

  -- Find the matching pilates_session_bookings row.
  select id, session_id, status
  into v_booking
  from public.pilates_session_bookings
  where appointment_id = p_appointment_id
    and client_id = v_client_id
  for update;

  -- Refund ONLY if this booking consumed a credit and we're outside the window.
  if v_booking.id is not null then
    select *
    into v_ledger
    from public.credit_ledger
    where appointment_id = p_appointment_id
      and user_id = v_client_id
      and reason = 'booking'
      and delta < 0
    order by created_at desc
    limit 1;

    if v_ledger.user_pass_id is not null then
      if extract(epoch from (v_appt.start_time - now())) / 3600.0 > p_refund_window_hours then
        -- Refund the credit.
        select *
        into v_pass
        from public.user_passes
        where id = v_ledger.user_pass_id
        for update;

        if v_pass.id is not null then
          update public.user_passes
          set remaining_credits = remaining_credits + 1,
              status = 'active'
          where id = v_pass.id
            and remaining_credits < initial_credits;

          if found then
            insert into public.credit_ledger (
              user_pass_id, user_id, delta, balance_after, reason, appointment_id, note
            ) values (
              v_pass.id, v_client_id, 1, v_pass.remaining_credits + 1, 'cancel_refund', p_appointment_id,
              'Refund: cancelled ' || p_refund_window_hours || 'h+ before class'
            );
            v_refunded := true;
          end if;
        end if;
        v_reason := 'Refunded';
      else
        v_reason := 'Late cancellation — no refund';
      end if;
    else
      v_reason := 'No credit used for this booking';
    end if;
  else
    v_reason := 'No Pilates booking found';
  end if;

  -- Mark the appointment and booking cancelled.
  update public.appointments
  set status = 'cancelled',
      cancellation_reason = case when v_refunded then 'Cancelled by client (credit refunded)' else 'Cancelled by client' end,
      status_updated_at = now()
  where id = p_appointment_id;

  if v_booking.id is not null then
    update public.pilates_session_bookings
    set status = 'cancelled'
    where id = v_booking.id;
  end if;

  return jsonb_build_object('refunded', v_refunded, 'reason', coalesce(v_reason, 'Cancelled'));
end;
$$;


-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.class_packages enable row level security;
alter table public.user_passes    enable row level security;
alter table public.credit_ledger  enable row level security;

-- ── class_packages ───────────────────────────────────────────────────────
drop policy if exists class_packages_owner_all     on public.class_packages;
drop policy if exists class_packages_select_active on public.class_packages;

create policy class_packages_owner_all
  on public.class_packages
  for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy class_packages_select_active
  on public.class_packages
  for select
  to authenticated
  using (is_active = true);

-- ── user_passes ──────────────────────────────────────────────────────────
-- Clients can SELECT/UPDATE their own rows, but all meaningful mutations
-- (remaining_credits, status) happen through SECURITY DEFINER RPCs that
-- bypass RLS. The client UPDATE policy exists for status housekeeping only.
drop policy if exists user_passes_select_own    on public.user_passes;
drop policy if exists user_passes_select_owner  on public.user_passes;
drop policy if exists user_passes_update_own    on public.user_passes;
drop policy if exists user_passes_update_owner  on public.user_passes;

create policy user_passes_select_own
  on public.user_passes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_passes_select_owner
  on public.user_passes
  for select
  to authenticated
  using (public.is_owner());

create policy user_passes_update_own
  on public.user_passes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_passes_update_owner
  on public.user_passes
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ── credit_ledger (read-only for clients/owner; writes only via RPCs) ────
drop policy if exists credit_ledger_select_own   on public.credit_ledger;
drop policy if exists credit_ledger_select_owner on public.credit_ledger;

create policy credit_ledger_select_own
  on public.credit_ledger
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy credit_ledger_select_owner
  on public.credit_ledger
  for select
  to authenticated
  using (public.is_owner());
