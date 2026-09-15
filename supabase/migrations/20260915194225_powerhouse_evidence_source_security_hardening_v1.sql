-- Mirror the exact production security hardening for evidence coverage views and Calendly ingress.
alter view public.powerhouse_evidence_source_coverage_v1 set (security_invoker = true);
alter view public.powerhouse_full_cycle_evidence_v2 set (security_invoker = true);
alter view public.powerhouse_experiment_effect_uncertainty_v1 set (security_invoker = true);
alter view public.powerhouse_evidence_operating_health_v2 set (security_invoker = true);
alter view public.powerhouse_evidence_operating_health_v3 set (security_invoker = true);
revoke all on function public.bg_calendly_uitkomst(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.bg_calendly_uitkomst(text,text,jsonb) to service_role;
