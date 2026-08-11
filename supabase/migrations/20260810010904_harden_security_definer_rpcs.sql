-- ============================================================================
-- Harden four SECURITY DEFINER RPCs that trusted caller-supplied identity
-- or caller-supplied policy parameters.
--
-- All four are reachable by the `authenticated` (and `anon`) role over
-- PostgREST: they were created without the REVOKE EXECUTE ... FROM PUBLIC
-- guard that the rest of this codebase applies. Rather than revoke — which
-- would break the owner UIs that legitimately call them — each function now
-- derives identity from auth.uid() and authorises explicitly.
--
-- Function bodies are otherwise byte-identical to the versions created in
-- 20260713000000_voucher_system.sql and 20260714000000_class_pass_system.sql.
--
-- Issues fixed:
--   1. grant_user_pass          — no auth check at all; any caller could mint
--                                 paid class passes for any account.
--   2. redeem_voucher           — p_user_id was trusted, so a caller could
--                                 redeem vouchers as any other user.
--   3. get_active_pass_summary  — p_user_id was trusted, leaking any user's
--                                 pass balances to any caller.
--   4. cancel_pilates_booking   — the refund window was a caller-supplied
--                                 parameter, so a client could always refund
--                                 its own late cancellation.
-- ============================================================================


-- ── 1. grant_user_pass ──────────────────────────────────────────────────────
-- Callers that must keep working:
--   * finalize-pass-purchase edge function (service_role, after verifying the
--     Stripe PaymentIntent) — granted_by = null
--   * the Owner manual-grant UI (authenticated owner) — granted_by = owner id
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
  -- Granting credits is a privileged action. Only the Owner (manual grant) or
  -- a trusted server context (the Stripe finalize edge function, which runs as
  -- service_role and has already verified payment) may call this.
  if not (public.is_owner() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only the Owner can grant class passes';
  end if;

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



-- ── 2. get_active_pass_summary ──────────────────────────────────────────────
-- p_user_id stays supported because the Owner's client-detail screens read
-- another user's passes with it, but non-owners may only read their own.
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

  -- Reading someone else's passes is an Owner-only capability. Only a trusted
  -- server context (service_role) is exempt — note that "auth.uid() is null"
  -- alone is NOT a safe exemption, because that is also true for anon.
  if coalesce(auth.role(), '') <> 'service_role'
     and (auth.uid() is null or (v_uid <> auth.uid() and not public.is_owner())) then
    raise exception 'Not authorised to view another user''s passes';
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



-- ── 3. cancel_pilates_booking ───────────────────────────────────────────────
-- p_refund_window_hours is retained for signature compatibility but is now
-- ignored: the refund window is read from the master's own settings so a
-- client cannot declare its own late cancellation refundable.
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
  v_window        integer;
begin
  v_client_id := auth.uid();
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  select id, client_id, master_id, start_time, status
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

  -- Server-side refund policy. The caller's p_refund_window_hours is ignored.
  select coalesce(ms.late_cancellation_window_hours, 24)
  into v_window
  from public.master_settings ms
  where ms.master_id = v_appt.master_id;

  v_window := coalesce(v_window, 24);

  if v_appt.status in ('cancelled', 'cancelled_free', 'cancelled_charge') then
    return jsonb_build_object('refunded', false, 'reason', 'Already cancelled');
  end if;

  select id, session_id, status
  into v_booking
  from public.pilates_session_bookings
  where appointment_id = p_appointment_id
    and client_id = v_client_id
  for update;

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
      if extract(epoch from (v_appt.start_time - now())) / 3600.0 > v_window then
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
              'Refund: cancelled ' || v_window || 'h+ before class'
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



-- ── 4. redeem_voucher ───────────────────────────────────────────────────────
-- p_user_id is retained for signature compatibility but is only honoured for
-- trusted server (service_role) callers; everyone else redeems as themselves.
create or replace function public.redeem_voucher(
  p_code         text,
  p_user_id      uuid,
  p_amount_cents integer default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher      public.vouchers%rowtype;
  v_discount     integer := 0;
  v_new_total    integer := 0;
  v_benefit_exp  timestamptz;
  v_already      integer;
  v_uid          uuid;
begin
  -- Identity comes from the JWT, never from the request body. Only a trusted
  -- server context (service_role, no JWT subject) may name a different user.
  v_uid := coalesce(
    auth.uid(),
    case when coalesce(auth.role(), '') = 'service_role' then p_user_id end
  );

  if v_uid is null then
    return json_build_object('success', false, 'message', 'Not authenticated.');
  end if;

  select *
    into v_voucher
    from public.vouchers
    where upper(code) = upper(p_code)
      and is_active = true
    for update;

  if not found then
    return json_build_object('success', false, 'message', 'Voucher code not found or inactive.');
  end if;

  if v_voucher.expires_at <= now() then
    return json_build_object('success', false, 'message', 'This voucher has expired.');
  end if;

  if v_voucher.current_uses >= v_voucher.max_uses then
    return json_build_object('success', false, 'message', 'This voucher has reached its usage limit.');
  end if;

  select count(*) into v_already
    from public.voucher_redemptions
    where user_id = v_uid and voucher_id = v_voucher.id;

  if v_already > 0 then
    return json_build_object('success', false, 'message', 'You have already redeemed this voucher.');
  end if;

  if v_voucher.discount_type in ('free_month', 'free_trial') then
    v_discount := coalesce(p_amount_cents, 0);
    v_new_total := 0;
  elsif v_voucher.discount_type = 'percentage' then
    v_discount := round(coalesce(p_amount_cents, 0) * v_voucher.discount_value / 100);
    v_new_total := coalesce(p_amount_cents, 0) - v_discount;
  elsif v_voucher.discount_type in ('fixed_amount', 'fixed') then
    v_discount := least(v_voucher.discount_value, coalesce(p_amount_cents, 0));
    v_new_total := coalesce(p_amount_cents, 0) - v_discount;
  else
    return json_build_object('success', false, 'message', 'Unknown discount type.');
  end if;

  if v_voucher.discount_type in ('free_month', 'free_trial') then
    v_benefit_exp := now() + (v_voucher.benefit_expires_days || ' days')::interval;
  else
    v_benefit_exp := null;
  end if;

  insert into public.voucher_redemptions (
    voucher_id, user_id, redeemed_at, benefit_expires_at, status, discount_applied
  ) values (
    v_voucher.id, v_uid, now(), v_benefit_exp,
    case when v_benefit_exp is not null then 'active' else 'used' end,
    v_discount
  );

  update public.vouchers
    set current_uses = current_uses + 1
    where id = v_voucher.id;

  if v_voucher.current_uses + 1 >= v_voucher.max_uses then
    update public.vouchers set is_active = false where id = v_voucher.id;
  end if;

  return json_build_object(
    'success', true,
    'message', 'Voucher applied successfully.',
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'discount_type', v_voucher.discount_type,
    'discount_value', v_voucher.discount_value,
    'discount_amount_cents', v_discount,
    'new_total_cents', v_new_total,
    'benefit_expires_at', v_benefit_exp
  );
end;
$$;


-- ── 5. Lock down execution ──────────────────────────────────────────────────
-- These four were created without the REVOKE ... FROM PUBLIC guard the rest of
-- the schema uses, so anon inherited EXECUTE through PUBLIC. Grant explicitly.
revoke execute on function public.grant_user_pass(uuid, uuid, uuid, text, text) from public, anon;
revoke execute on function public.get_active_pass_summary(uuid) from public, anon;
revoke execute on function public.cancel_pilates_booking(uuid, integer) from public, anon;
revoke execute on function public.redeem_voucher(text, uuid, integer) from public, anon;

grant execute on function public.grant_user_pass(uuid, uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.get_active_pass_summary(uuid) to authenticated, service_role;
grant execute on function public.cancel_pilates_booking(uuid, integer) to authenticated, service_role;
grant execute on function public.redeem_voucher(text, uuid, integer) to authenticated, service_role;
