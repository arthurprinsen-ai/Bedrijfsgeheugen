-- Safe, non-semantic Supabase hardening discovered by security advisor review.
-- Keep benchmark read behavior intact while removing broad mutation grants.
-- Internal intelligence views are governed separately as server-only.

alter function public.stand_bijgewerkt() set search_path = public, pg_temp;

revoke all on table
  public.benchmark_branche,
  public.benchmark_niveaus,
  public.benchmark_offertes
from anon, authenticated, service_role;

grant select on table
  public.benchmark_branche,
  public.benchmark_niveaus,
  public.benchmark_offertes
to anon, authenticated, service_role;
