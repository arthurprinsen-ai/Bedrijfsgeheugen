-- Hardening for P0 Production Truth.
-- Only the reconcile RPC may mutate derived truth. Callers can read truth but cannot set it directly.

alter function public.brain_reconcile_production_truth(text,text,text,timestamptz)
  security definer;

revoke insert, update, delete, truncate on table public.brain_production_truth from service_role;
grant select on table public.brain_production_truth to service_role;

comment on function public.brain_reconcile_production_truth(text,text,text,timestamptz) is
  'Privileged reconciliation boundary for derived production truth. service_role cannot directly write brain_production_truth.';
