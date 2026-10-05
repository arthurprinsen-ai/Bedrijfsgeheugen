-- Harden the autonomous Powerhouse control plane after production security readback.
-- Keep execution internal/service-role only and pin the daily guard search_path.

alter function public.powerhouse_daily_execution_guard(date)
  set search_path = public, pg_catalog;

revoke execute on function public.powerhouse_autonomous_growth_revenue_cycle(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_growth_revenue_cycle(date)
  to service_role;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values
(
  'autonomy-security-definer-rpc-browser-exposure-v1',
  'OBSERVED',
  'Production security readback showed powerhouse_autonomous_growth_revenue_cycle(date) was SECURITY DEFINER and still executable by anon/authenticated roles.',
  'Revoke EXECUTE from public, anon and authenticated and grant execution only to service_role.',
  'Internal autonomous control-plane SECURITY DEFINER functions must never be browser-callable unless explicitly reviewed as public intentional.',
  'tests/supabase-powerhouse-autonomy-rpc-security.test.mjs|powerhouse-autonomy-rpc-security-v1',
  1,1,now(),now(),
  jsonb_build_object(
    'observed_on','2026-09-15',
    'source','Supabase security advisor production readback',
    'advisor_lint','anon_security_definer_function_executable/authenticated_security_definer_function_executable',
    'function','powerhouse_autonomous_growth_revenue_cycle(date)',
    'fail_closed',true
  )
),
(
  'daily-execution-guard-mutable-search-path-v1',
  'OBSERVED',
  'Production security readback showed powerhouse_daily_execution_guard(date) had a role-mutable search_path.',
  'Pin search_path to public, pg_catalog on the existing daily execution guard.',
  'All Powerhouse control-plane functions must have a deterministic search_path; production advisor readback is part of release verification.',
  'tests/supabase-powerhouse-autonomy-rpc-security.test.mjs|powerhouse-autonomy-rpc-security-v1',
  1,1,now(),now(),
  jsonb_build_object(
    'observed_on','2026-09-15',
    'source','Supabase security advisor production readback',
    'advisor_lint','function_search_path_mutable',
    'function','powerhouse_daily_execution_guard(date)',
    'fail_closed',true
  )
)
on conflict (fingerprint) do update
set root_cause=excluded.root_cause,
    proven_fix=excluded.proven_fix,
    prevention_rule=excluded.prevention_rule,
    regression_ref=excluded.regression_ref,
    occurrence_count=public.brain_failure_registry.occurrence_count+1,
    last_seen_at=now(),
    evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
