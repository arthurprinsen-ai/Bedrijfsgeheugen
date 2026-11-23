-- P0 2026-11-14: innovation producer->ONE BRAIN handoff continuity.
-- Extend ONLY the original daily Self-Improvement function. No new scheduler,
-- table, external sender, grant, budget, or authority. Old obligations retained.
-- Source: 14 original candidate records lacked corresponding execution duties.
-- Protected migration only; production readback required before live claim.
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
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    updated_at=now();

  return v_result;
end;
$function$;

-- Do not broaden the existing RPC permission boundary.
revoke execute on function public.powerhouse_run_self_improvement_layer_v1(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_run_self_improvement_layer_v1(date)
  to service_role;
