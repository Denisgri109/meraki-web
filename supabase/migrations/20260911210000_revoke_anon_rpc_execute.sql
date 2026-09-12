-- Applied to the live database 2026-09-11.
--
-- Nothing in either app calls these before signing in, but they were callable
-- with the public anon key. `get_available_slots` in particular exposed a
-- practitioner's working calendar to anyone holding that key, which ships
-- inside the web bundle and inside the mobile binary.
REVOKE EXECUTE ON FUNCTION public.get_available_slots(uuid, date, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_owner_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_valid_role(text) FROM anon;
