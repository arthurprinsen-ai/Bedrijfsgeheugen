-- Remove SECURITY DEFINER view behavior without changing benchmark query semantics.
-- PostgreSQL/Supabase will evaluate underlying table permissions and RLS as the caller.

alter view public.benchmark_branche set (security_invoker = true);
alter view public.benchmark_niveaus set (security_invoker = true);
alter view public.benchmark_offertes set (security_invoker = true);
