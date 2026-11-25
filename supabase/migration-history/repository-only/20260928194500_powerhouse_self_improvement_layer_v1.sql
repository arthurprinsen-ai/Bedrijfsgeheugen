-- Powerhouse Self-Improvement Layer v1
-- Composes existing Company Intelligence, autonomous-improvement, quality, model-health and delivery authorities.
-- It creates no parallel learning store and never directly rewrites production code.

create or replace view public.powerhouse_agent_objective_registry_v1
with (security_invoker=true) as
select *
from (values
  ('revenue'::text,'realized_revenue_eur'::text,'max'::text,'["permission","brand","margin","contact_pressure"]'::jsonb),
  ('operations','verified_cycle_time_improvement','max','["quality","security","customer_impact"]'::jsonb),
  ('cfo','verified_economic_value_eur','max','["cash_truth","margin_truth","forecast_calibration"]'::jsonb),
  ('content','verified_pipeline_contribution_eur','max','["semantic_uniqueness","brand","consent"]'::jsonb),
  ('customer','verified_retention_or_expansion_value','max','["service_quality","privacy","contact_pressure"]'::jsonb),
  ('engineering','verified_quality_velocity_score','max','["security","regression","architecture_health","cost"]'::jsonb)
) v(agent_id,primary_metric,direction,guardrails);

revoke all on public.powerhouse_agent_objective_registry_v1 from public,anon,authenticated;
grant select on public.powerhouse_agent_objective_registry_v1 to service_role;

create or replace view public.powerhouse_learning_compiler_queue_v1
with (security_invoker=true) as
select
  'optimization_candidate'::text source_type,
  c.candidate_id::text source_key,
  c.component_id,
  c.owner_agent,
  coalesce(c.measured_outcome,'{}'::jsonb) <> '{}'::jsonb
    and coalesce(c.outcome_evidence,'{}'::jsonb) <> '{}'::jsonb as verified_evidence,
  lower(coalesce(c.proposed_action->>'regression_proven','false'))='true' as regression_proven,
  true as material,
  case
    when coalesce(c.measured_outcome,'{}'::jsonb) = '{}'::jsonb
      or coalesce(c.outcome_evidence,'{}'::jsonb) = '{}'::jsonb then 'EVIDENCE_PENDING'
    when lower(coalesce(c.proposed_action->>'regression_proven','false'))<>'true' then 'REGRESSION_PENDING'
    else 'READY'
  end compiler_state,
  jsonb_build_array(
    'regression_requirement','skill_projection','documentation_writeback',
    'system_map_writeback_if_topology_changed','bounded_optimization_candidate'
  ) required_outputs,
  coalesce(c.updated_at,c.created_at) observed_at
from public.powerhouse_optimization_candidate_v1 c

union all

select
  'quality_event',
  q.fingerprint,
  q.capability_id,
  'engineering'::text,
  nullif(trim(coalesce(q.production_evidence_ref,'')),'') is not null,
  nullif(trim(coalesce(q.regression_guard_ref,'')),'') is not null,
  true,
  case
    when nullif(trim(coalesce(q.production_evidence_ref,'')),'') is null then 'EVIDENCE_PENDING'
    when nullif(trim(coalesce(q.regression_guard_ref,'')),'') is null then 'REGRESSION_PENDING'
    else 'READY'
  end,
  jsonb_build_array(
    'regression_requirement','skill_projection','documentation_writeback',
    'bounded_optimization_candidate'
  ),
  coalesce(q.updated_at,q.first_seen_at)
from public.powerhouse_quality_events q;

revoke all on public.powerhouse_learning_compiler_queue_v1 from public,anon,authenticated;
grant select on public.powerhouse_learning_compiler_queue_v1 to service_role;

create or replace view public.powerhouse_self_improvement_control_v1
with (security_invoker=true) as
with
candidate_state as (
  select
    count(*)::int candidate_total,
    count(*) filter(where coalesce(measured_outcome,'{}'::jsonb)<>'{}'::jsonb
                         and coalesce(outcome_evidence,'{}'::jsonb)<>'{}'::jsonb)::int candidate_measured
  from public.powerhouse_optimization_candidate_v1
),
compiler_state as (
  select
    count(*) filter(where compiler_state='READY')::int compiler_ready,
    count(*) filter(where compiler_state='EVIDENCE_PENDING')::int compiler_evidence_pending,
    count(*) filter(where compiler_state='REGRESSION_PENDING')::int compiler_regression_pending
  from public.powerhouse_learning_compiler_queue_v1
),
quality_state as (
  select
    count(*) filter(
      where escaped_to_production=true
        and nullif(trim(coalesce(regression_guard_ref,'')),'') is null
    )::int escaped_defects_without_regression
  from public.powerhouse_quality_events
),
model_state as (
  select
    count(*) filter(where lower(coalesce(model_health,'')) in ('degraded','red','failing','unhealthy'))::int model_health_degraded,
    count(*) filter(where model_health is null or lower(model_health) in ('unknown','unmeasured'))::int model_health_unknown
  from public.powerhouse_model_health_v1
),
auto_state as (
  select
    count(*) filter(where lower(coalesce(state,'')) not in ('done','completed','closed','terminal','live_bewezen'))::int autonomous_improvement_open
  from public.powerhouse_autonomous_improvement_control_v1
),
company_state as (
  select
    count(*) filter(where verified_outcomes>0)::int learning_companies,
    coalesce(sum(verified_outcomes),0)::bigint verified_outcomes
  from public.powerhouse_compound_intelligence_v1
)
select
  now() observed_at,
  c.candidate_total,
  c.candidate_measured,
  l.compiler_ready,
  l.compiler_evidence_pending,
  l.compiler_regression_pending,
  q.escaped_defects_without_regression,
  m.model_health_degraded,
  m.model_health_unknown,
  a.autonomous_improvement_open,
  co.learning_companies,
  co.verified_outcomes,
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
      'no_learning_without_evidence',
      'no_change_without_evaluation',
      'no_deployment_without_regression_proof',
      'no_intelligence_without_measurable_outcome',
      'no_uncontrolled_self_modification',
      'unknown_is_not_green'
    ),
    'protected_delivery_reused',true,
    'parallel_learning_store_created',false
  ) contract
from candidate_state c
cross join compiler_state l
cross join quality_state q
cross join model_state m
cross join auto_state a
cross join company_state co;

revoke all on public.powerhouse_self_improvement_control_v1 from public,anon,authenticated;
grant select on public.powerhouse_self_improvement_control_v1 to service_role;

create or replace function public.powerhouse_run_self_improvement_layer_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_company jsonb;
  v_control jsonb;
  v_result jsonb;
begin
  -- Company intelligence refreshes context/outcomes. The existing hourly autonomous-improvement
  -- cron remains the sole improvement executor; this function does not create a second executor.
  v_company := public.powerhouse_run_company_intelligence_os_v1(p_run_date);

  select to_jsonb(s) into v_control
  from public.powerhouse_self_improvement_control_v1 s;

  v_result := jsonb_build_object(
    'contract','powerhouse-self-improvement-layer.v1',
    'run_date',p_run_date,
    'company_intelligence',v_company,
    'self_improvement_control',coalesce(v_control,'{}'::jsonb),
    'autonomous_improvement_authority','public.powerhouse_autonomous_improvement_cron_v1()',
    'protected_delivery_reused',true,
    'uncontrolled_self_modification',false,
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'self-improvement-layer:'||p_run_date::text,
    'self_improvement_cycle','powerhouse-self-improvement-layer.v1','powerhouse-self-improvement',
    now(),v_result,
    jsonb_build_object(
      'no_parallel_learning_store',true,
      'protected_delivery_reused',true,
      'uncontrolled_self_modification',false
    ),
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
$$;

revoke execute on function public.powerhouse_run_self_improvement_layer_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_run_self_improvement_layer_v1(date) to service_role;

comment on view public.powerhouse_agent_objective_registry_v1 is
'Canonical measurable objectives and guardrails for major Powerhouse agent domains.';
comment on view public.powerhouse_learning_compiler_queue_v1 is
'Evidence-first compilation queue over existing optimization and quality evidence; no parallel learning store.';
comment on view public.powerhouse_self_improvement_control_v1 is
'Cross-layer self-improvement control plane. Unknown or degraded safety evidence cannot become green.';
comment on function public.powerhouse_run_self_improvement_layer_v1(date) is
'Daily self-improvement orchestrator. Reuses Company Intelligence, existing hourly autonomous improvement and protected delivery; never performs uncontrolled production self-rewrite.';

-- One canonical pg_cron infrastructure, one daily composite observation/orchestration job.
select cron.schedule(
  'powerhouse-self-improvement-layer-v1',
  '7 3 * * *',
  $cron$select public.powerhouse_run_self_improvement_layer_v1((now() at time zone 'Europe/Amsterdam')::date);$cron$
);
