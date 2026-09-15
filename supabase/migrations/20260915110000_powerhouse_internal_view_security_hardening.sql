-- Harden internal Powerhouse views after production advisor readback proved browser-role exposure.
-- These views are internal control-plane/queue/flywheel projections and must be service-role only.

alter view public.powerhouse_revenue_flywheel_v1 set (security_invoker = true);
revoke all on table public.powerhouse_revenue_flywheel_v1 from public, anon, authenticated;
grant select on table public.powerhouse_revenue_flywheel_v1 to service_role;

alter view public.powerhouse_outcome_sweep_queue_v1 set (security_invoker = true);
revoke all on table public.powerhouse_outcome_sweep_queue_v1 from public, anon, authenticated;
grant select on table public.powerhouse_outcome_sweep_queue_v1 to service_role;

alter view public.powerhouse_experiment_decision_queue_v1 set (security_invoker = true);
revoke all on table public.powerhouse_experiment_decision_queue_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_decision_queue_v1 to service_role;

do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'powerhouse_revenue_flywheel_v1',
    'powerhouse_outcome_sweep_queue_v1',
    'powerhouse_experiment_decision_queue_v1'
  ] loop
    if has_table_privilege('anon',format('public.%I',v_name),'SELECT') then
      raise exception 'anon still has SELECT on %', v_name;
    end if;
    if has_table_privilege('authenticated',format('public.%I',v_name),'SELECT') then
      raise exception 'authenticated still has SELECT on %', v_name;
    end if;
    if not has_table_privilege('service_role',format('public.%I',v_name),'SELECT') then
      raise exception 'service_role lost SELECT on %', v_name;
    end if;
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relname=v_name
        and coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']
    ) then
      raise exception 'security_invoker not enabled on %', v_name;
    end if;
  end loop;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'powerhouse-internal-view-browser-exposure-v1',
  'OBSERVED',
  'Production Supabase security readback showed three internal Powerhouse views using owner-security semantics while anon and authenticated retained SELECT.',
  'Set all three internal views to security_invoker and revoke all browser-role privileges while retaining service_role SELECT.',
  'Internal Powerhouse control-plane, queue and flywheel views must be security_invoker and service-role only; production security-advisor readback is mandatory after DDL.',
  'tests/supabase-powerhouse-internal-view-security.test.mjs|powerhouse-internal-view-browser-exposure-v1',
  1,1,now(),now(),
  jsonb_build_object(
    'observed_on','2026-09-15',
    'advisor_lint','security_definer_view',
    'views',jsonb_build_array(
      'powerhouse_revenue_flywheel_v1',
      'powerhouse_outcome_sweep_queue_v1',
      'powerhouse_experiment_decision_queue_v1'
    ),
    'anon_select_before',true,
    'authenticated_select_before',true,
    'fail_closed',true
  )
)
on conflict (fingerprint) do update
set root_cause=excluded.root_cause,
    proven_fix=excluded.proven_fix,
    prevention_rule=excluded.prevention_rule,
    regression_ref=excluded.regression_ref,
    occurrence_count=public.brain_failure_registry.occurrence_count+1,
    version=greatest(public.brain_failure_registry.version,excluded.version),
    last_seen_at=now(),
    evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;