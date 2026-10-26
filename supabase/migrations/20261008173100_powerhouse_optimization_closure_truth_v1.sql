-- Existing-state-first, read-only assurance. No parallel executor, approval store or cron.
-- Every candidate remains pending until independent evidence is present.
create or replace view public.powerhouse_optimization_closure_truth_v1
with (security_invoker = true) as
with candidate_proofs as (
 select c.candidate_id,c.tenant_id,c.source_key,c.component_id,c.status,c.safety_class,
   exists (
     select 1 from public.powerhouse_human_feedback_events h
     where h.subject_key=c.source_key and h.feedback_type='approve'
       and h.observed_at>=c.created_at
       and h.evidence->>'verified'='true'
       and nullif(btrim(h.evidence->>'review_receipt_ref'),'') is not null
   ) as review_proven,
   coalesce((
     c.status in ('measuring','kept','rolled_back')
     and nullif(btrim(c.outcome_evidence->>'production_readback_id'),'') is not null
     and nullif(btrim(c.outcome_evidence->>'release_revision'),'') is not null
     and c.outcome_evidence->>'quality_guard_passed'='true'
     and c.outcome_evidence->>'security_guard_passed'='true'
     and c.outcome_evidence->>'regression_guard_passed'='true'
     and exists (
       select 1 from public.brain_delivery_evidence d
       where d.change_id in (c.source_key,c.candidate_id::text)
         and d.component_id=c.component_id
         and d.status='VERIFIED'
         and d.candidate_identity=d.tested_identity
         and d.candidate_identity is not null
         and d.remote_ref=c.outcome_evidence->>'production_readback_id'
         and d.created_at>=c.created_at
     )
   ),false) as delivery_proven,
   exists (
     select 1 from public.brain_records b
     where b.tenant_id=c.tenant_id
       and b.record_id=c.outcome_evidence->>'learning_record_id'
       and b.record_kind='learning'
       and b.executed is true and b.verified is true
       and cardinality(b.evidence_ids)>0 and b.result is not null
       and b.observed_at>=c.created_at
   ) as learning_proven,
   (
     select count(*)::integer from public.powerhouse_realized_values v
     where v.tenant_id=c.tenant_id
       and v.source_entity_type='optimization_candidate'
       and v.source_entity_id=c.candidate_id::text
       and v.truth_class='realized'
       and v.numeric_value is not null
       and v.observed_at>=c.created_at
       and nullif(btrim(v.evidence_ref),'') is not null
       and v.provenance->>'verified'='true'
       and coalesce(v.provenance->>'synthetic','false')='false'
       and nullif(btrim(v.provenance->>'independent_readback_id'),'') is not null
       and v.unit is not null
       and v.unit not in ('not_executed','execution_completed','sent','no_response',
                         'no_reply_observed','reply_objection','reply_received')
       and (v.value_type not in ('revenue','cost_saving')
            or (v.currency='EUR' and v.unit='EUR'))
   ) as independent_observations
 from public.powerhouse_optimization_candidate_v1 c
)
select candidate_id,tenant_id,source_key,component_id,status,safety_class,
 review_proven,delivery_proven,learning_proven,independent_observations,
 (review_proven and delivery_proven and independent_observations>0
  and learning_proven and status='kept') as observed_cycle_verified,
 case
  when status='blocked' then 'BLOCKED'
  when status='rejected' then 'REJECTED'
  when status='rolled_back' then 'ROLLED_BACK'
  when not review_proven then 'REVIEW_REQUIRED'
  when status in ('candidate','approved_by_policy','executing') then 'EXECUTION_PENDING'
  when not delivery_proven then 'PRODUCTION_READBACK_REQUIRED'
  when independent_observations=0 then 'INDEPENDENT_MEASUREMENT_REQUIRED'
  when not learning_proven then 'LEARNING_WRITEBACK_REQUIRED'
  when status<>'kept' then 'PROMOTION_DECISION_PENDING'
  else 'OBSERVED_CYCLE_VERIFIED_NOT_CAUSAL_UPLIFT'
 end as evidence_stage,
 'Independent controlled comparison required for causal impact or incremental EUR claims'::text as attribution_boundary
from candidate_proofs;

revoke all on public.powerhouse_optimization_closure_truth_v1
 from public,anon,authenticated;
grant select on public.powerhouse_optimization_closure_truth_v1 to service_role;
comment on view public.powerhouse_optimization_closure_truth_v1 is
 'Server-only evidence-first candidate closure; no approval or value from status labels, transport acknowledgements or populated JSON.';

-- Preserve the existing canonical observer schema so all consumers keep working.
-- Only change candidate_measured to independent, separately corroborated proof.
create or replace view public.powerhouse_self_improvement_control_v1
with (security_invoker = true) as
with candidate_state as (
 select count(*)::int candidate_total,
  count(*) filter(where p.independent_observations>0 and p.delivery_proven and p.review_proven)::int candidate_measured
 from public.powerhouse_optimization_candidate_v1 c
 left join public.powerhouse_optimization_closure_truth_v1 p on p.candidate_id=c.candidate_id
),
compiler_state as (
 select count(*) filter(where compiler_state='READY')::int compiler_ready,
  count(*) filter(where compiler_state='EVIDENCE_PENDING')::int compiler_evidence_pending,
  count(*) filter(where compiler_state='REGRESSION_PENDING')::int compiler_regression_pending
 from public.powerhouse_learning_compiler_queue_v1
),
quality_state as (
 select count(*) filter(where escaped_to_production=true
   and nullif(trim(coalesce(regression_guard_ref,'')),'') is null)::int escaped_defects_without_regression
 from public.powerhouse_quality_events
),
model_state as (
 select count(*) filter(where lower(coalesce(model_health,'')) in ('degraded','red','failing','unhealthy'))::int model_health_degraded,
  count(*) filter(where model_health is null or lower(model_health) in ('unknown','unmeasured'))::int model_health_unknown
 from public.powerhouse_model_health_v1
),
auto_state as (
 select count(*) filter(where lower(coalesce(state,'')) not in
  ('done','completed','closed','terminal','live_bewezen'))::int autonomous_improvement_open
 from public.powerhouse_autonomous_improvement_control_v1
),
company_state as (
 select count(*) filter(where verified_outcomes>0)::int learning_companies,
  coalesce(sum(verified_outcomes),0)::bigint verified_outcomes
 from public.powerhouse_compound_intelligence_v1
)
select now() observed_at,c.candidate_total,c.candidate_measured,
 l.compiler_ready,l.compiler_evidence_pending,l.compiler_regression_pending,
 q.escaped_defects_without_regression,m.model_health_degraded,m.model_health_unknown,
 a.autonomous_improvement_open,co.learning_companies,co.verified_outcomes,
 case
  when q.escaped_defects_without_regression>0 or m.model_health_degraded>0 then 'GUARDRAIL_BLOCKED'
  when l.compiler_ready>0 then 'READY_FOR_CONTROLLED_PROMOTION'
  when c.candidate_total>0 or co.verified_outcomes>0 then 'LEARNING'
  else 'OBSERVE'
 end self_improvement_state,
 jsonb_build_object(
  'contract','powerhouse-self-improvement-layer.v1',
  'north_star','Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.',
  'loop',jsonb_build_array('observe','detect','hypothesize','build','test','evaluate','compare','promote','measure','learn'),
  'hard_rules',jsonb_build_array(
   'no_learning_without_evidence','no_change_without_evaluation',
   'no_deployment_without_regression_proof','no_intelligence_without_measurable_outcome',
   'no_uncontrolled_self_modification','unknown_is_not_green'),
  'protected_delivery_reused',true,'parallel_learning_store_created',false,
  'candidate_closure_truth_authority','public.powerhouse_optimization_closure_truth_v1',
  'measured_not_inferred_from_json',true
 ) contract
from candidate_state c cross join compiler_state l cross join quality_state q
 cross join model_state m cross join auto_state a cross join company_state co;

revoke all on public.powerhouse_self_improvement_control_v1
 from public,anon,authenticated;
grant select on public.powerhouse_self_improvement_control_v1 to service_role;
comment on view public.powerhouse_self_improvement_control_v1 is
 'Daily self-improvement status reads independent candidate evidence; JSON field population alone is not measured value.';
