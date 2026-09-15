-- Fix autonomous Powerhouse calibration sync: the existing singular function is a trigger and cannot be called directly.
-- Reuse the same canonical revenue_learning_obligations table and patch only the autonomous cycle call-site.

create or replace function public.powerhouse_refresh_forecast_calibration_obligations()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_count integer := 0;
begin
  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at
  )
  select
    'canonical',
    'forecast-calibration:'||f.forecast_id::text,
    'FORECAST_CALIBRATION',
    null,
    null,
    'OPEN',
    jsonb_build_object(
      'forecast_id',f.forecast_id,
      'forecast_key',f.forecast_key,
      'probability',f.probability,
      'confidence',f.confidence,
      'prediction_mode',f.prediction_mode,
      'contract','predictive-first-mover-intelligence-v1'
    ),
    coalesce(f.expected_by,f.horizon_end)::timestamptz,
    now()
  from public.powerhouse_forecasts f
  where f.status in ('active','claimed')
  on conflict (tenant_id,obligation_id) do update
    set payload=excluded.payload,
        due_at=excluded.due_at,
        updated_at=now(),
        status=case
          when public.revenue_learning_obligations.status='CLOSED' then public.revenue_learning_obligations.status
          else 'OPEN'
        end;

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke all on function public.powerhouse_refresh_forecast_calibration_obligations() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_forecast_calibration_obligations() to service_role;

do $$
declare
  v_before text;
  v_after text;
begin
  select pg_get_functiondef('public.powerhouse_autonomous_growth_revenue_cycle(date)'::regprocedure)
    into v_before;

  v_after := regexp_replace(
    v_before,
    'perform[[:space:]]+public\.powerhouse_sync_forecast_calibration_obligation\(\);',
    'perform public.powerhouse_refresh_forecast_calibration_obligations();',
    'i'
  );

  if v_after = v_before then
    raise exception 'autonomy calibration trigger-call patch did not match current function body';
  end if;

  execute v_after;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'autonomy-direct-call-of-trigger-function-v1',
  'OBSERVED',
  'The autonomous daily cycle directly invoked powerhouse_sync_forecast_calibration_obligation(), but that routine returns trigger and PostgreSQL permits it only in trigger context.',
  'Add powerhouse_refresh_forecast_calibration_obligations() as a normal bounded helper over the existing revenue_learning_obligations table and patch the autonomy cycle to call that helper.',
  'Never invoke RETURNS trigger functions as ordinary routines. Daily reconciliation must use a normal helper while row-level forecast mutations keep the existing trigger.',
  'tests/supabase-powerhouse-autonomous-trigger-fix.test.mjs|powerhouse-autonomous-trigger-fix-v1',
  1,1,now(),now(),
  jsonb_build_object(
    'observed_on','2026-09-15',
    'production_error','trigger functions can only be called as triggers',
    'failed_closed',true,
    'parallel_store',false,
    'canonical_obligation_table','revenue_learning_obligations'
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
