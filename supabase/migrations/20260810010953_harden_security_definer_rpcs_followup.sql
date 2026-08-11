-- ============================================================================
-- Follow-up to 20260810010904_harden_security_definer_rpcs.sql.
--
-- Two corrections found while verifying that migration against the live schema:
--
--   1. get_active_pass_summary exempted the ownership check whenever
--      auth.uid() was null. That is true for `anon`, not just for trusted
--      service_role callers, so an unauthenticated caller could still read any
--      user's passes by naming p_user_id. The exemption is now keyed on
--      auth.role() = 'service_role'.
--
--   2. Revoking from `anon` alone was not enough: all four functions still
--      carried EXECUTE for PUBLIC (=X/postgres), which anon inherits. Execute
--      is now revoked from PUBLIC and granted explicitly.
--
-- Re-running this file after 20260810010904 is a no-op; both migrations are
-- idempotent and converge on the same state.
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

revoke execute on function public.grant_user_pass(uuid, uuid, uuid, text, text) from public, anon;
revoke execute on function public.get_active_pass_summary(uuid) from public, anon;
revoke execute on function public.cancel_pilates_booking(uuid, integer) from public, anon;
revoke execute on function public.redeem_voucher(text, uuid, integer) from public, anon;

grant execute on function public.grant_user_pass(uuid, uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.get_active_pass_summary(uuid) to authenticated, service_role;
grant execute on function public.cancel_pilates_booking(uuid, integer) to authenticated, service_role;
grant execute on function public.redeem_voucher(text, uuid, integer) to authenticated, service_role;
