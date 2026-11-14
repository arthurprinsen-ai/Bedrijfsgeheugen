-- P0 #4198 canonical ONE BRAIN: atomic original innovation recovery.
-- One protected native migration after provider-applied 862 (version 20261114211500).
-- Both changes were previously PROPOSED, not applied to production.
-- Reuses only the original daily self-improvement, existing runtime mux-owned
-- watchdog, original runtime-invoked reconciliation worker V2 and same brain_operations queue.
-- No second executor, scheduler, table, provider grant, external action,
-- self-approval or fabricated outcome. Escalated never-started intakes
-- receive one source-bound idempotent recovery in original queue only.

-- P0 2026-11-14: zero source is never independently verified innovation.
-- Evidence: original provider preview had 0 source candidates and reported
-- INDEPENDENTLY_VERIFIED (incorrect). Existing production with 14 candidates
-- correctly reports RECOVERY_DUE. Preserve existing original function, cron,
-- consumer operations, permissions, approval gates and source history.
-- One protected new migration; no out-of-band production mutation.
create or replace function public.powerhouse_run_self_improvement_layer_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_control jsonb;
  v_company_snapshot jsonb;
  v_result jsonb;
  v_candidates_created integer := 0;
  v_handoffs_changed integer := 0;
  v_handoffs_expected integer := 0;
  v_handoffs_verified integer := 0;
  v_intake_expected integer := 0;
  v_intake_proven integer := 0;
  v_consumer_proven integer := 0;
  v_unclaimed integer := 0;
  v_stale_unclaimed integer := 0;
  v_outcomes_verified integer := 0;
  v_owner_work jsonb := '[]'::jsonb;
  v_intake_row record;
begin
  -- Only verified, regression-protected *source facts* qualify. A learning
  -- record is not proof that a new optimization is valuable or safe.
  with eligible as materialized (
    select
      'quality-learning-v1:' || l.source_key as candidate_key,
      l.source_key as quality_fingerprint,
      l.component_id, l.owner_agent, l.observed_at,
      q.production_evidence_ref, q.regression_guard_ref
    from public.powerhouse_learning_compiler_queue_v1 l
    join public.powerhouse_quality_events q on
      l.source_type = 'quality_event' and q.fingerprint = l.source_key
    where l.compiler_state = 'READY'
      and l.verified_evidence is true
      and l.regression_proven is true
      and l.material is true
      and nullif(btrim(l.source_key), '') is not null
      and nullif(btrim(l.component_id), '') is not null
      and nullif(btrim(q.production_evidence_ref), '') is not null
      and nullif(btrim(q.regression_guard_ref), '') is not null
      and not exists (
        select 1 from public.powerhouse_optimization_candidate_v1 c
        where c.source_key = 'quality-learning-v1:' || l.source_key
      )
    order by l.observed_at desc, l.source_key
    limit 3
  )
  insert into public.powerhouse_optimization_candidate_v1 (
    source_key, component_id, owner_agent, opportunity_type,
    baseline, expected_impact, confidence, safety_class,
    proposed_action, rollback_plan, status, production_authority,
    learning_fingerprint, tenant_id
  )
  select
    e.candidate_key, e.component_id, e.owner_agent,
    'verified_learning_followup',
    jsonb_build_object(
      'source_kind', 'quality_event',
      'quality_fingerprint', e.quality_fingerprint,
      'observed_at', e.observed_at,
      'source_production_evidence_ref', e.production_evidence_ref,
      'source_regression_guard_ref', e.regression_guard_ref,
      'measured_improvement', null
    ),
    jsonb_build_object(
      'hypothesis', 'Assess whether verified prevention can improve the next comparable change',
      'predicted_value_eur', null,
      'predicted_latency_reduction_ms', null,
      'causal_effect_verified', false
    ),
    0, 'review_required',
    jsonb_build_object(
      'kind', 'bounded_learning_followup',
      'source_quality_fingerprint', e.quality_fingerprint,
      'next_step', 'Design baseline, alternative, representative evaluation and guardrails',
      'regression_proven', false,
      'human_review_required', true,
      'provider_dispatch_authorized', false,
      'direct_production_mutation', false
    ),
    jsonb_build_object('required', true, 'route', 'existing_protected_delivery'),
    'candidate', 'BG169', e.quality_fingerprint, 'canonical'
  from eligible e
  on conflict (source_key) do nothing;

  get diagnostics v_candidates_created = row_count;

  -- SAME original daily writer: no parallel executor, job, table or sender.
  -- The intent ACK is atomic with source discovery and remains OPEN until an
  -- independently verified protected release, application, effect and learning.
  with source_candidates as materialized (
    select c.candidate_id,c.source_key,c.component_id,c.owner_agent,c.tenant_id,
           c.status,c.updated_at
    from public.powerhouse_optimization_candidate_v1 c
    where c.tenant_id='canonical'
  )
  insert into public.brain_obligations (
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at
  )
  select 'INNOVATION_DELIVERY','powerhouse-self-improvement-layer-v1',
         c.candidate_id::text,'continuous','Europe/Amsterdam',
         encode(sha256(convert_to(c.source_key || '|' || c.candidate_id::text ||
           '|' || c.updated_at::text,'UTF8')),'hex'),
         c.source_key,'original-agent:' || c.owner_agent,'OPEN',
         jsonb_build_object(
           'source','public.powerhouse_optimization_candidate_v1',
           'source_key',c.source_key,
           'candidate_id',c.candidate_id,
           'component_id',c.component_id,
           'tenant_id',c.tenant_id,
           'source_revision',c.updated_at,
           'owner_agent',c.owner_agent,
           'original_candidate_status',c.status,
           'correlation_id','innovation-delivery:' || c.candidate_id::text,
           'handoff_state','OPEN_UNTIL_CONSUMER_ACK',
           'original_authority','powerhouse-self-improvement-layer-v1',
           'next_action','Existing owner must evaluate a reversible change via protected CI/CD, verify exact production SHA and independent effect, then record next natural agent application and ONE BRAIN learning ACK.',
           'terminal_proof_required',true,
           'approval_or_release_inferred',false,
           'customer_value_inferred',false
         ),
         now(),now()
  from source_candidates c
  on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
  do update set
    payload_sha256=excluded.payload_sha256,
    change_id=excluded.change_id,
    owner=excluded.owner,
    evidence=public.brain_obligations.evidence || excluded.evidence,
    updated_at=now(),
    version=public.brain_obligations.version+1
  where public.brain_obligations.state not in ('FULFILLED','CANCELLED','BREACHED')
    and (
      public.brain_obligations.evidence->>'source_revision'
        is distinct from excluded.evidence->>'source_revision'
      or public.brain_obligations.owner is distinct from excluded.owner
    );
  get diagnostics v_handoffs_changed = row_count;

  select count(*) into v_handoffs_expected
    from public.powerhouse_optimization_candidate_v1
    where tenant_id='canonical';
  select count(*) into v_handoffs_verified
    from public.powerhouse_optimization_candidate_v1 c
    join public.brain_obligations b
      on b.obligation_type='INNOVATION_DELIVERY'
     and b.capability_id='powerhouse-self-improvement-layer-v1'
     and b.business_entity=c.candidate_id::text
     and b.business_period='continuous'
     and b.business_timezone='Europe/Amsterdam'
     and b.change_id=c.source_key
     and b.owner='original-agent:' || c.owner_agent
    where c.tenant_id='canonical';

  -- If consumer handoff is missing the existing daily job must fail visibly.
  -- Fail the transaction, not the durable scheduler; never claim false-green.
  if v_handoffs_expected <> v_handoffs_verified then
    raise exception 'INNOVATION_HANDOFF_INCOMPLETE: expected %, readback %',
      v_handoffs_expected,v_handoffs_verified;
  end if;


  -- ORIGINAL Brain universal operations and original registered agents:
  -- a PLANNED operation is a durable intake intent, never consumer execution.
  -- Stable per source revision: replay never duplicates operations or bypasses review.
  for v_intake_row in
    select c.candidate_id,c.source_key,c.owner_agent,b.payload_sha256
    from public.powerhouse_optimization_candidate_v1 c
    join public.brain_obligations b
      on b.obligation_type='INNOVATION_DELIVERY'
     and b.capability_id='powerhouse-self-improvement-layer-v1'
     and b.business_entity=c.candidate_id::text
     and b.change_id=c.source_key
    where c.tenant_id='canonical'
    order by c.created_at,c.candidate_id
  loop
    if v_intake_row.owner_agent not in ('engineering','cro') then
      raise exception 'INNOVATION_ORIGINAL_OWNER_UNMAPPED: %',v_intake_row.owner_agent;
    end if;
    perform public.brain_create_operation(
      case when v_intake_row.owner_agent='cro'
           then 'agent:agent-growth-market'
           else 'agent:agent-integration-engineer' end,
      'INNOVATION_INTAKE',
      'innovation-delivery:' || v_intake_row.candidate_id::text ||
        ':' || left(v_intake_row.payload_sha256,16),
      v_intake_row.payload_sha256,
      v_intake_row.source_key,
      'innovation-delivery:' || v_intake_row.candidate_id::text
    );
  end loop;

  -- An operation is NOT a consumer ACK unless the original agent later writes
  -- a VERIFIED receipt with independent remote readback, exact source revision,
  -- matching registered agent, and unchanged candidate correlation.
  with original_intake as materialized (
    select c.candidate_id,c.source_key,c.component_id,c.owner_agent,
           c.created_at,b.payload_sha256,
           b.evidence->>'source_revision' source_revision,
           case when c.owner_agent='cro' then 'agent:agent-growth-market'
                when c.owner_agent='engineering' then 'agent:agent-integration-engineer'
                else null end original_agent_id,
           o.status operation_status,o.remote_ref,o.evidence operation_evidence
    from public.powerhouse_optimization_candidate_v1 c
    join public.brain_obligations b
      on b.obligation_type='INNOVATION_DELIVERY'
     and b.capability_id='powerhouse-self-improvement-layer-v1'
     and b.business_entity=c.candidate_id::text
     and b.change_id=c.source_key
    left join lateral (
      select op.*
      from public.brain_operations op
      where op.operation_type='INNOVATION_INTAKE'
        and op.capability_id=
          case when c.owner_agent='cro' then 'agent:agent-growth-market'
               when c.owner_agent='engineering' then 'agent:agent-integration-engineer'
               else 'agent:agent-reliability' end
        and op.idempotency_key='innovation-delivery:'||c.candidate_id::text||
          ':'||left(b.payload_sha256,16)
        and op.payload_sha256=b.payload_sha256
        and op.change_id=c.source_key
        and op.correlation_id='innovation-delivery:'||c.candidate_id::text
      order by op.created_at desc limit 1
    ) o on true
    where c.tenant_id='canonical'
  ), intake_proof as (
    select *,
      operation_status='VERIFIED'
        and nullif(btrim(remote_ref),'') is not null
        and operation_evidence->>'consumer_owner'=original_agent_id
        and operation_evidence->>'source_revision'=source_revision
        and operation_evidence->>'independent_consumer_readback'='true'
        as verified_ack
    from original_intake
  )
  select
    count(*)::integer,
    count(*) filter (where operation_status is not null)::integer,
    count(*) filter (where verified_ack is true)::integer,
    count(*) filter (where verified_ack is not true)::integer,
    count(*) filter (where verified_ack is not true
                     and created_at < now() - interval '24 hours')::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'candidate_id',candidate_id,
      'component_id',component_id,
      'original_owner',original_agent_id,
      'intake_status',coalesce(operation_status,'MISSING'),
      'consumer_ack_verified',coalesce(verified_ack,false),
      'age_days',floor(extract(epoch from now()-created_at)/86400),
      'next_action',case when verified_ack is true
        then 'Verify original protected release, independent observed effect, and learning'
        else 'Original agent: claim and evaluate candidate with source-bound evidence; retain review and protected delivery gates' end
    ) order by created_at,candidate_id),'[]'::jsonb)
  into v_intake_expected,v_intake_proven,v_consumer_proven,
       v_unclaimed,v_stale_unclaimed,v_owner_work
  from intake_proof;

  if v_intake_expected <> v_intake_proven
     or v_intake_expected <> v_handoffs_expected then
    raise exception 'INNOVATION_INTAKE_MISSING: source %, registered %',
      v_intake_expected,v_intake_proven;
  end if;

  select count(*)::integer into v_outcomes_verified
    from public.powerhouse_optimization_closure_truth_v1
    where observed_cycle_verified is true
      and tenant_id='canonical';



  -- Keep the canonical v1 daily observer and its authoritative snapshots.
  select to_jsonb(s) into v_control
    from public.powerhouse_self_improvement_control_v1 s;
  select jsonb_build_object(
    'companies',(select count(*) from public.powerhouse_compound_intelligence_v1),
    'learning_companies',(select count(*) from public.powerhouse_compound_intelligence_v1 where verified_outcomes>0),
    'verified_outcomes',(select coalesce(sum(verified_outcomes),0) from public.powerhouse_compound_intelligence_v1),
    'graph_nodes',(select count(*) from public.powerhouse_company_graph_nodes_v1),
    'graph_edges',(select count(*) from public.powerhouse_company_graph_edges_v1),
    'truth','read_current_canonical_projections_no_duplicate_company_cycle'
  ) into v_company_snapshot;

  v_result := jsonb_build_object(
    'contract','powerhouse-self-improvement-layer.v1',
    'run_date',p_run_date,
    'company_intelligence_snapshot',coalesce(v_company_snapshot,'{}'::jsonb),
    'self_improvement_control',coalesce(v_control,'{}'::jsonb),
    'innovation_delivery_handoff',jsonb_build_object(
      'expected_original_candidates',v_handoffs_expected,
      'producer_intents_readback',v_handoffs_verified,
      'registered_or_updated_this_run',v_handoffs_changed,
      'handoff_state','OPEN_UNTIL_CONSUMER_ACK',
      'verified_implementation_claim',false,
      'new_scheduler',false,
      'consumer','original ONE BRAIN/Heartbeat and existing protected delivery'
    ),
    'innovation_original_agent_intake',jsonb_build_object(
      'original_owners','existing agent-integration-engineer and agent-growth-market',
      'candidate_total',v_intake_expected,
      'durable_planned_intakes_readback',v_intake_proven,
      'consumer_acks_independently_verified',v_consumer_proven,
      'unclaimed',v_unclaimed,
      'older_than_24h_unclaimed',v_stale_unclaimed,
      'observed_cycles_verified',v_outcomes_verified,
      'health',case
         when v_intake_expected=0 then 'NO_SOURCE_CANDIDATES'
         when v_stale_unclaimed>0 then 'RECOVERY_DUE'
         when v_unclaimed>0 then 'CONSUMER_ACK_PENDING'
         when v_outcomes_verified < v_intake_expected then 'OUTCOME_PROOF_PENDING'
         else 'INDEPENDENTLY_VERIFIED' end,
      'original_agent_next_actions',v_owner_work,
      'planned_intake_is_not_execution',true,
      'zero_sources_never_green',true,
      'new_scheduler',false,
      'new_queue_or_registry',false
    ),
    'learning_to_candidate',jsonb_build_object(
      'created',v_candidates_created,
      'max_new_per_cycle',3,
      'source','public.powerhouse_learning_compiler_queue_v1',
      'destination','public.powerhouse_optimization_candidate_v1',
      'approval','REVIEW_REQUIRED',
      'provider_dispatch',false,
      'realized_outcome_claim',false
    ),
    'company_intelligence_authority','public.powerhouse_run_company_intelligence_os_v1(date)',
    'autonomous_improvement_authority','public.powerhouse_autonomous_improvement_cron_v1()',
    'protected_delivery_reused',true,
    'duplicate_orchestration',false,
    'uncontrolled_self_modification',false,
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,
    context,state,data_quality,confidence
  ) values (
    'self-improvement-layer:'||p_run_date::text,
    'self_improvement_cycle','powerhouse-self-improvement-layer.v1',
    'powerhouse-self-improvement',now(),v_result,
    jsonb_build_object('no_parallel_learning_store',true,
      'protected_delivery_reused',true,'duplicate_orchestration',false,
      'uncontrolled_self_modification',false,
      'candidate_only',true,'requires_independent_outcome_evidence',true),
    case when v_intake_expected=0 or v_unclaimed>0 or v_outcomes_verified<v_intake_expected
      then 'observed' else 'actioned' end,
    case when v_intake_expected=0 then 'NO_SOURCE_CANDIDATES'
         when v_unclaimed>0 or v_outcomes_verified<v_intake_expected
      then 'OWNER_HANDOFF_PENDING' else 'VERIFIED' end,1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return v_result;
end;
$function$;

-- Do not broaden the existing RPC permission boundary.
revoke execute on function public.powerhouse_run_self_improvement_layer_v1(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_run_self_improvement_layer_v1(date)
  to service_role;


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
  v_unresolved_unstarted_intake integer := 0;
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

  -- The original reconciliation worker escalated unstarted innovation intents
  -- before it had a typed handler. Reschedule AT MOST ONCE per exact original
  -- candidate+operation revision via the SAME existing reconciliation queue,
  -- only after immutable source/owner/binding/no-side-effect readback.
  for v_candidate in
    select o.id,o.payload_sha256,c.candidate_id,c.source_key,
           b.evidence->>'source_revision' source_revision
    from public.brain_operations o
    join public.powerhouse_optimization_candidate_v1 c
      on o.correlation_id='innovation-delivery:'||c.candidate_id::text
     and c.tenant_id='canonical'
    join public.brain_obligations b
      on b.obligation_type='INNOVATION_DELIVERY'
     and b.capability_id='powerhouse-self-improvement-layer-v1'
     and b.business_entity=c.candidate_id::text
     and b.change_id=c.source_key
    join public.brain_control_plane_bindings cp on cp.operation_id=o.id
    where o.operation_type='INNOVATION_INTAKE'
      and o.status='RESULT_UNKNOWN'
      and o.remote_ref is null
      and o.payload_sha256=b.payload_sha256
      and o.idempotency_key='innovation-delivery:'||c.candidate_id::text||
         ':'||left(b.payload_sha256,16)
      and o.change_id=c.source_key
      and o.capability_id=case when c.owner_agent='cro' then 'agent:agent-growth-market'
                               when c.owner_agent='engineering' then 'agent:agent-integration-engineer'
                               else null end
      and o.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
      and o.evidence->'execution_resilience'->>'interruption_class'='WORKER_LOST'
      and coalesce((o.evidence->'execution_resilience'->>'readback_before_replay')::boolean,false)=true
      and exists(
        select 1 from public.brain_reconciliation_jobs r
        where r.operation_id=o.id and r.reason='EXECUTION_RESILIENCE_RECOVERY'
          and r.state='ESCALATED'
      )
      and not exists(
        select 1 from public.brain_reconciliation_jobs r
        where r.job_key='innovation-intake-original-escalation-recovery:'||o.id::text||
          ':'||left(o.payload_sha256,16)
      )
    order by o.updated_at,o.id
    limit least(p_limit,25)
  loop
    v_job_key:='innovation-intake-original-escalation-recovery:'||v_candidate.id::text||
      ':'||left(v_candidate.payload_sha256,16);
    v_job:=public.brain_schedule_reconciliation(
      v_job_key,v_candidate.id,'EXECUTION_RESILIENCE_RECOVERY',3,
      jsonb_build_object(
        'source','public.powerhouse_optimization_candidate_v1',
        'source_key',v_candidate.source_key,
        'candidate_id',v_candidate.candidate_id,
        'source_revision',v_candidate.source_revision,
        'original_operation_id',v_candidate.id,
        'prior_escalation_verified',true,
        'independent_external_side_effect_verified',false,
        'exact_same_brain_queue',true,
        'no_parallel_scheduler',true
      )
    );
    if v_job.state='PENDING' then
      operation_id:=v_candidate.id;
      reconciliation_job_id:=v_job.id;
      action:='ORIGINAL_INTAKE_ESCALATION_RECOVERY_SCHEDULED';
      v_recovery_scheduled:=v_recovery_scheduled+1;
      return next;
    end if;
  end loop;

  -- The stage guard cannot claim pass while a typed never-started intake
  -- remains RESULT_UNKNOWN even if no regular stale PLANNED rows remain.
  select count(*) into v_unresolved_unstarted_intake
  from public.brain_operations o
  where o.operation_type='INNOVATION_INTAKE'
    and o.status='RESULT_UNKNOWN'
    and o.remote_ref is null
    and o.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
    and o.evidence->'execution_resilience'->>'interruption_class'='WORKER_LOST';

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
  v_guard_pass := v_stale_unreconciled=0 and v_unresolved_unstarted_intake=0;

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
        'unresolved_unstarted_innovation_intakes',v_unresolved_unstarted_intake,
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
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_reconciliation_worker_v2(p_worker_id text DEFAULT 'powerhouse-reconciliation-worker-v2'::text, p_limit integer DEFAULT 25)
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
  v_resilience jsonb;
  v_safe_replay boolean;
  v_side_effect_state text;
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

    v_resilience := coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb);
    v_safe_replay := coalesce((v_resilience->>'safe_replay')::boolean,false);
    v_side_effect_state := coalesce(nullif(v_resilience->>'side_effect_state',''),'UNKNOWN');

    -- Same original worker v2 (the function actually invoked by mux v1/v2/v3).
    -- A never-started innovation intake is a durable work intent, not a lost
    -- executable worker. Never mark it VERIFIED or replay a side effect.
    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.operation_type='INNOVATION_INTAKE'
       and v_operation.status='RESULT_UNKNOWN'
       and v_operation.remote_ref is null
       and v_side_effect_state='NOT_STARTED'
       and v_resilience->>'interruption_class'='WORKER_LOST'
       and coalesce((v_resilience->>'readback_before_replay')::boolean,false)=true
       and v_job.evidence->>'prior_escalation_verified'='true'
       and v_job.evidence->>'exact_same_brain_queue'='true'
       and v_job.evidence->>'original_operation_id'=v_operation.id::text
       and exists(
         select 1 from public.brain_reconciliation_jobs old
         where old.operation_id=v_operation.id
           and old.reason='EXECUTION_RESILIENCE_RECOVERY'
           and old.state='ESCALATED'
           and old.job_key like 'execution-resilience:'||v_operation.id::text||':v%'
       )
       and exists(
         select 1 from public.powerhouse_optimization_candidate_v1 c
         join public.brain_obligations b
           on b.obligation_type='INNOVATION_DELIVERY'
          and b.capability_id='powerhouse-self-improvement-layer-v1'
          and b.business_entity=c.candidate_id::text
          and b.change_id=c.source_key
          and b.state='OPEN'
         join public.brain_control_plane_bindings cp
           on cp.operation_id=v_operation.id
         where c.tenant_id='canonical'
           and v_operation.correlation_id='innovation-delivery:'||c.candidate_id::text
           and v_operation.idempotency_key='innovation-delivery:'||c.candidate_id::text||
                 ':'||left(b.payload_sha256,16)
           and v_operation.payload_sha256=b.payload_sha256
           and v_operation.change_id=c.source_key
           and v_operation.capability_id=case
             when c.owner_agent='cro' then 'agent:agent-growth-market'
             when c.owner_agent='engineering' then 'agent:agent-integration-engineer'
             else null end
       ) then
      v_evidence := v_operation.evidence || jsonb_build_object(
        'execution_resilience',v_resilience || jsonb_build_object(
          'state','WAITING_ORIGINAL_AGENT_INTAKE',
          'recovery_required',false,
          'recovery_worker',p_worker_id,
          'recovered_at',clock_timestamp(),
          'readback_result','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false,
          'safe_replay',false,
          'last_heartbeat_at',clock_timestamp()
        ),
        'innovation_intake_recovery',jsonb_build_object(
          'original_operation_id',v_operation.id,
          'original_correlation_id',v_operation.correlation_id,
          'reason','NOT_STARTED_IS_UNCLAIMED_NOT_WORKER_LOST',
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
      continue;
    end if;


    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.status='RESULT_UNKNOWN'
       and coalesce((v_resilience->>'readback_before_replay')::boolean,false)=true
       and v_safe_replay=true
       and v_side_effect_state='NOT_STARTED' then

      v_updated := public.brain_transition_operation(
        v_operation.id,
        v_operation.version,
        'PLANNED',
        v_operation.dispatch_generation + 1,
        null,
        v_operation.evidence || jsonb_build_object(
          'execution_resilience',
          v_resilience || jsonb_build_object(
            'state','REPLANNED_SAFE_REPLAY',
            'recovery_required',false,
            'recovery_worker',p_worker_id,
            'replanned_at',clock_timestamp(),
            'readback_result','NO_SIDE_EFFECT_STARTED',
            'replay_authorized',true
          )
        )
      );

      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status',v_updated.status,
          'dispatch_generation',v_updated.dispatch_generation,
          'readback','NO_SIDE_EFFECT_STARTED',
          'replay_authorized',true
        ),
        null,60,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'closure','SAFE_REPLAN_AFTER_NEGATIVE_READBACK',
          'resolved_at',clock_timestamp()
        )
      );

      job_key := v_job.job_key; action := 'REPLANNED_SAFE_REPLAY'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.status='RESULT_UNKNOWN'
       and coalesce((v_resilience->>'readback_before_replay')::boolean,false)=true
       and v_side_effect_state in ('STARTED','SUCCEEDED','UNKNOWN') then
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object(
          'operation_id',v_operation.id,
          'operation_status',v_operation.status,
          'reason','SIDE_EFFECT_STATE_NOT_SAFE_FOR_REPLAY',
          'side_effect_state',v_side_effect_state
        ),
        'SIDE_EFFECT_STATE_NOT_SAFE_FOR_REPLAY:'||v_side_effect_state,300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'fail_closed',true,
          'checked_at',clock_timestamp()
        )
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

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
  end loop;
end;
$function$;
