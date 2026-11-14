-- P0 2026-11-14: original watchdog misclassifies never-started innovation
-- PLANNED operations as WORKER_LOST after 120 seconds. Original worker has
-- no matching safe recovery handler; 14 real original intakes became
-- RESULT_UNKNOWN + NO_SAFE_CANONICAL_RECOVERY_HANDLER (0 side effects).
-- Extend ONLY original existing five-minute mux-owned watchdog and one
-- original reconciliation worker; no new scheduler, worker, table, queue,
-- provider mutation, visibility, permission, synthetic ACK or production
-- self-approval. Original idempotency, source revision and binding required.
CREATE OR REPLACE FUNCTION public.powerhouse_execution_resilience_watchdog_v1(p_now timestamp with time zone DEFAULT now(), p_timeout_seconds integer DEFAULT 120, p_limit integer DEFAULT 100)
 RETURNS TABLE(operation_id uuid, reconciliation_job_id uuid, action text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_candidate record;
  v_operation public.brain_operations;
  v_job public.brain_reconciliation_jobs;
  v_job_key text;
  v_recovery_scheduled integer := 0;
  v_stale_unreconciled integer := 0;
  v_guard_pass boolean := false;
  v_stage text;
begin
  if p_now is null or p_timeout_seconds < 10 or p_timeout_seconds > 86400 or p_limit < 1 or p_limit > 500 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_candidate in
    select o.id,o.version,o.evidence
    from public.brain_operations o
    where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
      and o.evidence ? 'execution_resilience'
      and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
      and coalesce((o.evidence->>'selftest')::boolean,false)=false
      and coalesce(o.evidence->>'fixture_classification','') <> 'historical_selftest'
      and not (
        o.operation_type='INNOVATION_INTAKE'
        and o.status='PLANNED'
        and o.remote_ref is null
        and o.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
      )
      and coalesce(
        nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,
        o.updated_at
      ) < p_now - make_interval(secs=>p_timeout_seconds)
    order by o.updated_at
    for update skip locked
    limit p_limit
  loop
    update public.brain_operations o
    set status='RESULT_UNKNOWN',
        evidence=o.evidence || jsonb_build_object(
          'execution_resilience',
          coalesce(o.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
            'state','RECOVERY_REQUIRED',
            'interruption_class','WORKER_LOST',
            'interrupted_at',clock_timestamp(),
            'recovery_required',true,
            'readback_before_replay',true
          )
        ),
        version=o.version+1,
        updated_at=now()
    where o.id=v_candidate.id
    returning * into v_operation;

    v_job_key:='execution-resilience:'||v_candidate.id::text||':v'||v_operation.version::text;
    v_job:=public.brain_schedule_reconciliation(
      v_job_key,v_candidate.id,'EXECUTION_RESILIENCE_RECOVERY',5,
      jsonb_build_object(
        'contract','powerhouse-execution-resilience-v1',
        'trigger','STALE_HEARTBEAT',
        'watchdog',true,
        'readback_before_replay',true
      )
    );
    operation_id:=v_candidate.id;
    reconciliation_job_id:=v_job.id;
    action:='RECOVERY_REQUIRED';
    v_recovery_scheduled := v_recovery_scheduled + 1;
    return next;
  end loop;

  -- Emit genuine audit evidence from this real five-minute watchdog,
  -- preserving all existing operation ownership and safe-replay guards.
  select count(*) into v_stale_unreconciled from public.brain_operations o
  where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
    and o.evidence ? 'execution_resilience'
    and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
    and coalesce((o.evidence->>'selftest')::boolean,false)=false
    and coalesce(o.evidence->>'fixture_classification','') <> 'historical_selftest'
      and not (
        o.operation_type='INNOVATION_INTAKE'
        and o.status='PLANNED'
        and o.remote_ref is null
        and o.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
      )
    and coalesce(nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,o.updated_at)
      < p_now - make_interval(secs=>p_timeout_seconds);
  v_guard_pass := v_stale_unreconciled=0;

  foreach v_stage in array array['input','decision','action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1(
      'execution-resilience',v_stage,
      jsonb_build_object(
        'contract','powerhouse-execution-resilience-v1',
        'evidence_type','verified_existing_watchdog_execution',
        'source_task','execution-resilience-watchdog',
        'watchdog_invocation_at',p_now,
        'watchdog_actual_input','brain_operations / execution_resilience original service-only selector',
        'decision_policy','bounded stale-heartbeat recovery before true downstream result',
        'decision_outcome',case when v_guard_pass then 'WATCHDOG_GUARD_PASS' else 'RECOVERY_PENDING' end,
        'stale_unreconciled_operations',v_stale_unreconciled,
        'recovery_jobs_scheduled_this_run',v_recovery_scheduled,
        'pass',case when v_stage='guard' then v_guard_pass else null end,
        'action_kind',case
          when v_stage='action' and v_guard_pass and v_recovery_scheduled=0 then 'VERIFIED_NO_OP'
          when v_stage='action' and v_recovery_scheduled>0 then 'RECOVERY_SCHEDULED'
          else 'OBSERVED' end,
        'truth_boundary','operational watchdog only; never provider output or customer revenue'
      ),p_now
    );
  end loop;
end;
$function$


CREATE OR REPLACE FUNCTION public.powerhouse_reconciliation_worker_v1(p_worker_id text DEFAULT 'powerhouse-reconciliation-worker-v1'::text, p_limit integer DEFAULT 25)
 RETURNS TABLE(job_key text, action text, resulting_state text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_job public.brain_reconciliation_jobs;
  v_operation public.brain_operations;
  v_updated public.brain_operations;
  v_recorded public.brain_reconciliation_jobs;
  v_evidence jsonb;
begin
  if nullif(btrim(p_worker_id),'') is null or p_limit < 1 or p_limit > 100 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_job in
    select * from public.brain_claim_reconciliation(p_worker_id,p_limit,90)
  loop
    select * into v_operation
      from public.brain_operations
     where id=v_job.operation_id
     for update;

    if not found then
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object('reason','OPERATION_NOT_FOUND'),
        'OPERATION_NOT_FOUND',300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object('worker',p_worker_id,'failure','OPERATION_NOT_FOUND','checked_at',clock_timestamp())
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and coalesce((v_operation.evidence->>'selftest')::boolean,false)=true
       and v_operation.operation_type='SELFTEST'
       and v_operation.status='RESULT_UNKNOWN'
       and v_operation.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
       and coalesce((v_operation.evidence->'execution_resilience'->>'readback_before_replay')::boolean,false)=true then

      v_evidence := v_operation.evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
          'state','RECOVERED_VERIFIED',
          'recovery_required',false,
          'recovery_worker',p_worker_id,
          'recovered_at',clock_timestamp(),
          'readback_result','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false
        ),
        'recovery_closure_proof',jsonb_build_object(
          'contract','powerhouse-execution-resilience-v1',
          'job_key',v_job.job_key,
          'claim_attempt',v_job.attempt_count,
          'readback_before_replay',true,
          'terminal_status','VERIFIED'
        )
      );

      v_updated := public.brain_transition_operation(
        v_operation.id,v_operation.version,'VERIFIED',null,null,v_evidence
      );

      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status',v_updated.status,
          'operation_version',v_updated.version,
          'readback','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false
        ),
        null,60,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'closure','READBACK_VERIFIED_NO_REPLAY',
          'resolved_at',clock_timestamp()
        )
      );

      job_key := v_job.job_key; action := 'RESOLVED_BY_READBACK'; resulting_state := v_recorded.state; return next;
    elsif v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.operation_type='INNOVATION_INTAKE'
       and v_operation.status='RESULT_UNKNOWN'
       and v_operation.remote_ref is null
       and v_operation.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
       and coalesce((v_operation.evidence->'execution_resilience'->>'readback_before_replay')::boolean,false)=true
       and exists(
         select 1 from public.powerhouse_optimization_candidate_v1 c
         join public.brain_obligations b
           on b.obligation_type='INNOVATION_DELIVERY'
          and b.capability_id='powerhouse-self-improvement-layer-v1'
          and b.business_entity=c.candidate_id::text
          and b.change_id=c.source_key
         join public.brain_control_plane_bindings cp
           on cp.operation_id=v_operation.id
         where c.tenant_id='canonical'
           and v_operation.correlation_id='innovation-delivery:'||c.candidate_id::text
           and v_operation.idempotency_key='innovation-delivery:'||c.candidate_id::text||':'||left(b.payload_sha256,16)
           and v_operation.payload_sha256=b.payload_sha256
           and v_operation.change_id=c.source_key
           and v_operation.capability_id=case
             when c.owner_agent='cro' then 'agent:agent-growth-market'
             when c.owner_agent='engineering' then 'agent:agent-integration-engineer'
             else null end
       ) then
      -- Original PLANNED intent was incorrectly labeled WORKER_LOST even
      -- though no worker/side effect had started. Do not fabricate VERIFIED.
      v_evidence := v_operation.evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb)
        || jsonb_build_object(
          'state','WAITING_ORIGINAL_AGENT_INTAKE',
          'recovery_required',false,
          'recovered_at',clock_timestamp(),
          'recovery_worker',p_worker_id,
          'readback_result','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false,
          'safe_replay',false,
          'last_heartbeat_at',clock_timestamp()
        ),
        'innovation_intake_recovery',jsonb_build_object(
          'original_operation_id',v_operation.id,
          'reason','NOT_STARTED_IS_UNCLAIMED_NOT_WORKER_LOST',
          'original_correlation_id',v_operation.correlation_id,
          'consumer_ack_proven',false,
          'independent_effect_proven',false
        )
      );
      v_updated:=public.brain_transition_operation(
        v_operation.id,v_operation.version,'PLANNED',null,null,v_evidence
      );
      v_recorded:=public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status','PLANNED',
          'readback','NO_SIDE_EFFECT_STARTED',
          'consumer_ack_proven',false,
          'replay_performed',false
        ),null,60,
        coalesce(v_job.evidence,'{}'::jsonb)||jsonb_build_object(
          'worker',p_worker_id,
          'closure','ORIGINAL_AGENT_INTAKE_READY_NOT_EXECUTED',
          'resolved_at',clock_timestamp()
        )
      );
      job_key:=v_job.job_key;
      action:='RECOVERED_ORIGINAL_INTAKE_NOT_CONSUMER_ACK';
      resulting_state:=v_recorded.state;
      return next;
    else
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object(
          'operation_id',v_operation.id,
          'operation_status',v_operation.status,
          'reason','NO_SAFE_CANONICAL_RECOVERY_HANDLER'
        ),
        'NO_SAFE_CANONICAL_RECOVERY_HANDLER',300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'fail_closed',true,
          'readback_before_replay',true,
          'checked_at',clock_timestamp()
        )
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
    end if;
  end loop;
end;
$function$

