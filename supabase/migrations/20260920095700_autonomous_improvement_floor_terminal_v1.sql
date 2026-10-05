-- autonomous-improvement-floor-terminal-v1
-- Once the proven replay window reaches the safe floor (12h), the hourly cycle becomes an idempotent terminal no-op.
-- It must not manufacture an impossible 6h challenger and re-block an already proven policy.

create or replace function public.powerhouse_autonomous_improvement_cron_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, cron, pg_catalog, pg_temp
as $function$
declare
  v_now timestamptz := now();
  v_runid bigint;
  v_base public.brain_records;
  v_completion jsonb;
  v_promoted_window integer;
  v_obligation public.brain_obligations;
begin
  select r.runid into v_runid
  from cron.job j
  join cron.job_run_details r on r.jobid=j.jobid
  where j.jobname='powerhouse-autonomous-improvement-cycle-v1'
    and r.start_time between v_now - interval '10 minutes' and v_now + interval '1 minute'
  order by r.start_time desc limit 1;

  select * into v_base from public.powerhouse_autonomous_improvement_cycle_v1(v_now);

  select (payload->>'replay_window_hours')::integer
    into v_promoted_window
  from public.brain_records
  where tenant_id='canonical'
    and owner_id='powerhouse-autonomous-improvement-runtime-v1'
    and record_type='Decision'
    and record_kind='decision'
    and payload->>'policy_key'='failure_replay_window_hours'
    and status='PROMOTED'
  order by observed_at desc
  limit 1;

  if coalesce(v_promoted_window,24) <= 12 then
    select * into v_obligation
    from public.brain_obligations
    where obligation_type='AUTONOMOUS_IMPROVEMENT'
      and capability_id='powerhouse-autonomous-improvement-runtime-v1'
      and business_entity='failure-replay-window-efficiency-v1'
      and business_period='continuous'
      and business_timezone='Europe/Amsterdam'
    for update;

    if found and v_obligation.state not in ('FULFILLED','CANCELLED','BREACHED') then
      v_obligation := public.brain_transition_obligation(
        v_obligation.id,
        v_obligation.version,
        'FULFILLED',
        v_obligation.owner,
        coalesce(v_obligation.evidence,'{}'::jsonb) ||
        jsonb_build_object(
          'lifecycle','LEARNED',
          'blocker',null,
          'floor_terminal',jsonb_build_object(
            'contract','autonomous-improvement-floor-terminal-v1',
            'safe_floor_hours',12,
            'promoted_window_hours',v_promoted_window,
            'classification','ALREADY_PROMOTED_AT_SAFE_FLOOR',
            'production_readback_preserved',coalesce((v_obligation.evidence->'promotion'->>'production_readback')::boolean,false),
            'closed_at',v_now
          )
        )
      );
    end if;

    v_completion := jsonb_build_object(
      'state','FULFILLED',
      'decision','NO_OP_ALREADY_AT_SAFE_FLOOR',
      'promoted_window_hours',v_promoted_window,
      'safe_floor_hours',12,
      'production_mutation',false
    );
  else
    v_completion := public.powerhouse_autonomous_improvement_executor_v1(v_now,'pg_cron',v_runid);
  end if;

  return jsonb_build_object(
    'base_record_id',v_base.record_id,
    'completion',v_completion,
    'invocation_source','pg_cron',
    'cron_run_id',v_runid
  );
end
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_cron_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_cron_v1() to service_role;
