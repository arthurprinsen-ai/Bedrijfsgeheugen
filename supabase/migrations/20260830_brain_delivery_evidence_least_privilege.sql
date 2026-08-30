-- Harden BRAIN-DELIVERY-v2 evidence after production verification showed
-- Supabase can provision broad service_role table privileges by default.
-- The ledger must remain append-only even against TRUNCATE, which bypasses row triggers.

revoke all on table public.brain_delivery_evidence from service_role;
grant select, insert on table public.brain_delivery_evidence to service_role;

revoke all on table public.brain_delivery_evidence from anon, authenticated;
