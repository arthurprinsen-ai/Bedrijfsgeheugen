-- Non-semantic security hardening: preserve each benchmark view definition
-- and evaluate access with the querying role instead of the view owner.

alter view public.benchmark_branche set (security_invoker = true);
alter view public.benchmark_niveaus set (security_invoker = true);
alter view public.benchmark_offertes set (security_invoker = true);
