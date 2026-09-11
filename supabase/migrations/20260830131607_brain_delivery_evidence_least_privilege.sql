-- Harden BRAIN delivery evidence to true append-only least privilege.
-- Supabase may provision broad service_role table grants by default, so revoke them explicitly.
revoke all on table public.brain_delivery_evidence from service_role;
grant select, insert on table public.brain_delivery_evidence to service_role;

-- Keep client roles fully denied.
revoke all on table public.brain_delivery_evidence from anon, authenticated;