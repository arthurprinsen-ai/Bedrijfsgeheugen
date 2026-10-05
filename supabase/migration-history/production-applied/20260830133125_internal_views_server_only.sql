-- Internal pricing/reuse intelligence must not be exposed through client roles.
-- service_role keeps server-side read access and SECURITY INVOKER makes underlying RLS explicit.

alter view public.prijsadvies set (security_invoker = true);
alter view public.hergebruik_rendement set (security_invoker = true);

revoke all on table public.prijsadvies, public.hergebruik_rendement from anon, authenticated, service_role;
grant select on table public.prijsadvies, public.hergebruik_rendement to service_role;
