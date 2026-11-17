-- P0 #4198. Exact 2026-11-16 production #171 error isolation.
-- Root cause: v3 Infinity call raises when no eligible current intelligence
-- source. The uncaught exception aborts the transaction and rolls back
-- already completed original mux stages. Do not invent signal/provider proof.
-- Existing function and original cron #171 only; no new schedule/queue/agent.
-- The original historical v1/v2 mux, protected provider gates and ACL remain.
CREATE OR REPLACE FUNCTION public.powerhouse_runtime_scheduler_mux_v3(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
    -- A missing current external signal is a source-truth gap, not a reason
    -- to roll back already executed independent Heartbeat/ONE BRAIN stages.
    -- Catch ONLY the exact, known missing-signal precondition. All unexpected
    -- SQL exceptions continue to fail closed.
    begin
      v_infinity:=public.powerhouse_infinity_operating_loop_v1(null,v_local::date);
    exception when raise_exception then
      if SQLERRM <> 'POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED' then
        raise;
      end if;
      v_infinity:=jsonb_build_object(
        'ok',false,
        'state','SOURCE_EVIDENCE_DUE',
        'reason','POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED',
        'independent_provider_result_proven',false,
        'commercial_result_proven',false,
        'retry_policy','NEXT_NATURAL_ORIGINAL_RUN_AFTER_SOURCE_REFRESH',
        'contract','powerhouse-infinity-original-source-isolation-v1'
      );
      -- Preserve the original scheduler's completed source/Heartbeat tasks,
      -- append a failed task receipt, and explicitly keep the mux unhealthy.
      v_base:=jsonb_set(coalesce(v_base,'{}'::jsonb),'{tasks}',
        coalesce(v_base->'tasks','[]'::jsonb)||
          jsonb_build_array(jsonb_build_object(
            'task','powerhouse-infinity-current-signal',
            'ok',false,
            'state','SOURCE_EVIDENCE_DUE',
            'error','POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED')),
        true);
      v_base:=jsonb_set(v_base,'{healthy}','false'::jsonb,true);
    end;
  end if;

  return coalesce(v_base,'{}'::jsonb) || jsonb_build_object(
    'powerhouse_infinity',v_infinity,
    'contract','powerhouse-runtime-scheduler-mux-v3'
  );
end
$function$;
REVOKE ALL ON FUNCTION public.powerhouse_runtime_scheduler_mux_v3(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_scheduler_mux_v3(timestamptz)
  TO service_role;
