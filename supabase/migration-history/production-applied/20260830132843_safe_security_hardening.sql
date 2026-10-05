-- Safe, non-semantic Supabase hardening discovered by security advisor review.
-- Keep existing benchmark read behavior intact while removing broad mutation grants.

alter function public.stand_bijgewerkt() set search_path = public, pg_temp;

revoke all on table
  public.benchmark_branche,
  public.benchmark_niveaus,
  public.benchmark_offertes,
  public.prijsadvies,
  public.hergebruik_rendement
from anon, authenticated, service_role;

grant select on table
  public.benchmark_branche,
  public.benchmark_niveaus,
  public.benchmark_offertes,
  public.prijsadvies,
  public.hergebruik_rendement
to anon, authenticated, service_role;
