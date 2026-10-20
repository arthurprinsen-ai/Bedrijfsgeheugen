-- P0 #4215. Restore the lost Source Universe call in the *existing*
-- Powerhouse runtime mux. Deliberately NO cron.schedule, second worker or
-- parallel intelligence scheduler: pg_cron job 171 already executes v3 at :54.
-- The source refresh is bounded and participates in canonical task receipts.
create or replace function public.powerhouse_runtime_scheduler_mux_v3(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_base jsonb;
  v_infinity jsonb := '{}'::jsonb;
  v_local timestamp := p_now at time zone 'Europe/Amsterdam';
  v_utc_minute integer := extract(minute from (p_now at time zone 'UTC'))::integer;
  v_universe_task jsonb;
  v_existing_healthy boolean;
begin
  -- Reuse all existing v2 source/heartbeat actions, never replace them.
  v_base := public.powerhouse_runtime_scheduler_mux_v2(p_now);

  -- The 2026-10-07 Source Universe migration assigned this to minute 54.
  -- A subsequent v3 replacement accidentally removed it. Minute 54 is
  -- present in the canonical mux job's schedule (4-59/5) every hour.
  if v_utc_minute = 54 then
    v_existing_healthy := coalesce((v_base->>'healthy')::boolean, false);
    v_universe_task := public.powerhouse_runtime_mux_task_v1(
      'external-intelligence-universe',
      'select public.powerhouse_refresh_external_intelligence_universe_v1(''canonical'',200)',
      10000
    );
    v_base := jsonb_set(
      coalesce(v_base, '{}'::jsonb),
      '{tasks}',
      coalesce(v_base->'tasks','[]'::jsonb) || jsonb_build_array(v_universe_task),
      true
    );
    -- No green status when source refresh fails; retain all earlier tasks.
    v_base := jsonb_set(
      v_base,
      '{healthy}',
      to_jsonb(v_existing_healthy and coalesce((v_universe_task->>'ok')::boolean,false)),
      true
    );
  end if;

  -- Preserve the existing Infinity local-time trigger without changing
  -- execution boundaries or permitting any external customer action.
  if extract(hour from v_local)::integer=7
     and extract(minute from v_local)::integer=41 then
    v_infinity:=public.powerhouse_infinity_operating_loop_v1(null,v_local::date);
  end if;

  return coalesce(v_base,'{}'::jsonb) || jsonb_build_object(
    'powerhouse_infinity',v_infinity,
    'contract','powerhouse-runtime-scheduler-mux-v3'
  );
end
$function$;
