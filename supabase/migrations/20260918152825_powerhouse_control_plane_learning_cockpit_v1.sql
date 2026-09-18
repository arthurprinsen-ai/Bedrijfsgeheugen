-- Powerhouse generic learning compiler + obligation cockpit v1
-- Extends the canonical Brain state/evidence model; creates no parallel truth store.

create or replace function public.powerhouse_learning_compiler_v1(
  p_failure_class text,
  p_scope text default 'GENERAL',
  p_machine_enforceable boolean default true,
  p_repeat_count integer default 1,
  p_security_sensitive boolean default false
)
returns jsonb
language plpgsql
immutable
set search_path to 'public','pg_catalog'
as $function$
declare
  v_class text := upper(coalesce(nullif(btrim(p_failure_class),''),'UNKNOWN'));
  v_scope text := upper(coalesce(nullif(btrim(p_scope),''),'GENERAL'));
  v_enforcement text;
  v_eval text;
  v_shadow boolean := false;
  v_canary boolean := false;
begin
  if p_repeat_count < 1 then
    raise exception 'VALIDATION_ERROR';
  end if;

  if not p_machine_enforceable then
    v_enforcement := 'SKILL';
    v_eval := 'HISTORICAL_REPLAY';
  elsif p_security_sensitive or v_class in ('SECURITY','AUTH','RLS','SECRET_EXPOSURE') then
    v_enforcement := 'CI_SECURITY_GATE';
    v_eval := 'SHADOW_THEN_CANARY';
    v_shadow := true;
    v_canary := true;
  elsif v_scope='DATABASE' or v_class in ('DATABASE_INTEGRITY','DATA_INTEGRITY','SCHEMA_DRIFT') then
    v_enforcement := 'DATABASE_CONSTRAINT';
    v_eval := 'HISTORICAL_REPLAY';
  elsif v_class in ('PRODUCTION_READBACK','RUNTIME_INVARIANT','FALSE_GREEN','FALSE_SUCCESS') or v_scope='RUNTIME' then
    v_enforcement := 'RUNTIME_ASSERTION';
    v_eval := 'CANARY';
    v_canary := true;
  elsif v_class in ('TIMEOUT','WORKER_LOST','RECOVERY','CONNECTOR_FAILURE','QUEUE_STALL') then
    v_enforcement := 'WORKFLOW';
    v_eval := 'SHADOW';
    v_shadow := true;
  elsif v_class in ('MAIN_DRIFT','CI','GITHUB_DELIVERY','DELIVERY','CLASSIFIER_GAP','METADATA_DRIFT') or v_scope in ('GITHUB','CI') then
    v_enforcement := 'CI_GATE';
    v_eval := 'HISTORICAL_REPLAY';
  elsif p_repeat_count >= 2 then
    v_enforcement := 'TEST';
    v_eval := 'HISTORICAL_REPLAY';
  else
    v_enforcement := 'TEST';
    v_eval := 'HISTORICAL_REPLAY';
  end if;

  return jsonb_build_object(
    'contract','powerhouse-learning-compiler-v1',
    'failure_class',v_class,
    'scope',v_scope,
    'machine_enforceable',p_machine_enforceable,
    'repeat_count',p_repeat_count,
    'security_sensitive',p_security_sensitive,
    'enforcement_kind',v_enforcement,
    'evaluation_mode',v_eval,
    'shadow_required',v_shadow,
    'canary_required',v_canary,
    'canonical_eligible',false,
    'canonicalization_requirement','evaluation_evidence_required'
  );
end;
$function$;

revoke execute on function public.powerhouse_learning_compiler_v1(text,text,boolean,integer,boolean)
  from public, anon, authenticated;
grant execute on function public.powerhouse_learning_compiler_v1(text,text,boolean,integer,boolean)
  to service_role;

create or replace view public.powerhouse_obligation_cockpit_v1
with (security_invoker = true)
as
with latest_operation as (
  select distinct on (correlation_id)
    correlation_id,id,operation_type,status,version,dispatch_generation,remote_ref,evidence,created_at,updated_at
  from public.brain_operations
  where correlation_id is not null
  order by correlation_id,updated_at desc,created_at desc
),
evidence_rollup as (
  select
    evidence->>'obligation_id' as obligation_key,
    count(*) as evidence_count,
    count(*) filter (where status='RED') as red_evidence_count,
    max(created_at) as latest_evidence_at,
    max(evidence->>'policy_version') filter (where nullif(evidence->>'policy_version','') is not null) as policy_version,
    max(evidence->>'skill_version') filter (where nullif(evidence->>'skill_version','') is not null) as skill_version,
    bool_or(coalesce((evidence->>'outcome_verified')::boolean,false)) as outcome_verified,
    bool_or(coalesce((evidence->>'migration_readback_verified')::boolean,false)) as migration_readback_verified,
    max(evidence->>'production_observed_sha') filter (where nullif(evidence->>'production_observed_sha','') is not null) as production_observed_sha,
    max(remote_ref) filter (where remote_ref is not null) as latest_remote_ref
  from public.brain_delivery_evidence
  where nullif(evidence->>'obligation_id','') is not null
  group by evidence->>'obligation_id'
),
reconciliation_rollup as (
  select
    o.correlation_id as obligation_key,
    count(*) as reconciliation_jobs,
    coalesce(sum(j.attempt_count),0) as retry_count,
    count(*) filter (where j.state='ESCALATED') as escalated_jobs,
    max(j.updated_at) as latest_reconciliation_at,
    max(j.reason) filter (where j.state='ESCALATED') as latest_blocker
  from public.brain_reconciliation_jobs j
  join public.brain_operations o on o.id=j.operation_id
  where o.correlation_id is not null
  group by o.correlation_id
)
select
  bo.id as obligation_id,
  bo.business_entity as obligation_key,
  coalesce(
    nullif(bo.evidence#>>'{intent,goal}',''),
    nullif(bo.evidence->>'goal',''),
    nullif(bo.evidence->>'requested_goal',''),
    bo.business_entity
  ) as requested_goal,
  bo.state as current_state,
  bo.owner,
  bo.version,
  lo.id as operation_id,
  lo.operation_type,
  lo.status as operation_status,
  lo.dispatch_generation,
  na.next_action,
  coalesce(rr.latest_blocker,
    case when bo.state='BLOCKED' then coalesce(bo.evidence->>'blocker','BLOCKED_WITHOUT_MACHINE_BLOCKER') end
  ) as blocker,
  coalesce(er.evidence_count,0) as evidence_count,
  coalesce(er.red_evidence_count,0) as red_evidence_count,
  er.latest_evidence_at,
  er.policy_version,
  er.skill_version,
  er.production_observed_sha,
  er.latest_remote_ref,
  coalesce(er.outcome_verified,false) as outcome_verified,
  coalesce(er.migration_readback_verified,false) as migration_readback_verified,
  coalesce(rr.reconciliation_jobs,0) as reconciliation_jobs,
  coalesce(rr.retry_count,0) as retry_count,
  coalesce(rr.escalated_jobs,0) as escalated_jobs,
  case
    when bo.state='FULFILLED' and coalesce(er.outcome_verified,false) then 'VERIFIED_OUTCOME'
    when bo.state='FULFILLED' then 'FULFILLED_WITHOUT_OUTCOME_PROOF'
    when bo.state in ('BREACHED','CANCELLED') then bo.state
    else null
  end as actual_result,
  bo.created_at,
  bo.updated_at,
  case
    when bo.state in ('FULFILLED','BREACHED','CANCELLED')
      then extract(epoch from (bo.updated_at-bo.created_at))::bigint
    else null
  end as time_to_terminal_seconds
from public.brain_obligations bo
left join latest_operation lo on lo.correlation_id=bo.business_entity
left join public.powerhouse_control_plane_next_action_v1 na on na.obligation_id=bo.id
left join evidence_rollup er on er.obligation_key=bo.business_entity
left join reconciliation_rollup rr on rr.obligation_key=bo.business_entity;

revoke all on public.powerhouse_obligation_cockpit_v1 from public, anon, authenticated;
grant select on public.powerhouse_obligation_cockpit_v1 to service_role;

create or replace view public.powerhouse_control_plane_metrics_v1
with (security_invoker = true)
as
with per_obligation as (
  select
    c.*,
    case
      when c.current_state='FULFILLED'
       and c.retry_count=0
       and c.red_evidence_count=0
       and c.escalated_jobs=0
       and c.outcome_verified
      then true else false
    end as first_time_right,
    case
      when c.current_state='FULFILLED' and not c.outcome_verified
      then 1 else 0
    end as false_success_risk,
    case
      when coalesce((c.requested_goal is not null),false)
       and coalesce((c.blocker ilike '%HUMAN%' or c.blocker ilike '%MANUAL%'),false)
      then 1 else 0
    end as human_intervention
  from public.powerhouse_obligation_cockpit_v1 c
)
select
  count(*) as obligations_total,
  count(*) filter (where current_state='FULFILLED') as obligations_fulfilled,
  count(*) filter (where first_time_right) as first_time_right_count,
  round(
    100.0 * count(*) filter (where first_time_right) /
    nullif(count(*) filter (where current_state in ('FULFILLED','BREACHED','CANCELLED')),0),
    2
  ) as first_time_right_pct,
  coalesce(sum(retry_count),0)::bigint as retries_total,
  coalesce(sum(escalated_jobs),0)::bigint as escalations_total,
  coalesce(sum(false_success_risk),0)::bigint as false_success_risk_count,
  coalesce(sum(human_intervention),0)::bigint as human_intervention_count,
  count(*) filter (where red_evidence_count>0)::bigint as obligations_with_regression_evidence,
  percentile_cont(0.5) within group (order by time_to_terminal_seconds)
    filter (where time_to_terminal_seconds is not null) as median_time_to_terminal_seconds,
  percentile_cont(0.9) within group (order by time_to_terminal_seconds)
    filter (where time_to_terminal_seconds is not null) as p90_time_to_terminal_seconds
from per_obligation;

revoke all on public.powerhouse_control_plane_metrics_v1 from public, anon, authenticated;
grant select on public.powerhouse_control_plane_metrics_v1 to service_role;

comment on function public.powerhouse_learning_compiler_v1(text,text,boolean,integer,boolean) is
  'Deterministically routes canonical learnings to machine-enforceable prevention and requires evaluation evidence before canonicalization.';
comment on view public.powerhouse_obligation_cockpit_v1 is
  'Single-obligation cockpit projection over canonical Brain state, evidence, reconciliation and next-action truth.';
comment on view public.powerhouse_control_plane_metrics_v1 is
  'Derived control-plane metrics: first-time-right, retries, escalations, false-success risk, human intervention, regressions and time-to-terminal.';
