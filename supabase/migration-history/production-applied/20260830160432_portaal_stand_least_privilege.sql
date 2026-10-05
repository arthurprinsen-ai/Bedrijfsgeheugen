-- Align SQL grants with the existing RLS contract on public.portaal_stand.
-- Anonymous callers have no RLS policy and therefore need no table privileges.
-- Authenticated callers may CRUD only rows permitted by the existing own-row policies.
-- service_role is intentionally left unchanged.

revoke all on table public.portaal_stand from anon, authenticated;

grant select, insert, update, delete on table public.portaal_stand to authenticated;
