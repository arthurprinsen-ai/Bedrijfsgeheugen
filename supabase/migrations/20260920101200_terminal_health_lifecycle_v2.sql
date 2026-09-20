-- terminal-health-lifecycle-v2
-- Distinguish active runtime truth from explicitly retired historical proof/test artifacts.
-- Keep real blocked obligations fail-closed.

create or replace view public.powerhouse_terminal_control_plane_health_v1
with (security_invoker = true)
as
with active_truth as (
  select pt.*
  from public.brain_production_truth pt
  join public.brain_desired_states ds on ds.id=pt.desired_state_id
  where coalesce(ds.desired_state->>'lifecycle','ACTIVE') <> 'RETIRED'
),
retired_truth as (
  select pt.*
  from public.brain_production_truth pt
  join public.brain_desired_states ds on ds.id=pt.desired_state_id
  where coalesce(ds.desired_state->>'lifecycle','ACTIVE') = 'RETIRED'
)
select
  now() as observed_at,
  (select count(*) from public.brain_obligations where state in ('OPEN','READY','RUNNING','BLOCKED')) as nonterminal_obligations,
  (select count(*) from public.brain_obligations where state='BLOCKED') as blocked_obligations,
  (select count(*) from public.brain_operations where status='PLANNED' and updated_at < now() - interval '15 minutes') as stale_planned_operations,
  (select count(*) from public.brain_reconciliation_jobs where state='ESCALATED') as escalated_reconciliation_jobs,
  (select count(*) from active_truth where status='GREEN_STALE') as stale_green_truths,
  (select count(*) from active_truth where status in ('DRIFTED','UNKNOWN')) as non_green_active_truths,
  (select count(*) from retired_truth) as retired_truths,
  (
    (select count(*) from public.brain_obligations where state='BLOCKED') = 0
    and (select count(*) from public.brain_reconciliation_jobs where state='ESCALATED') = 0
    and (select count(*) from public.brain_operations where status='PLANNED' and updated_at < now() - interval '15 minutes') = 0
    and (select count(*) from active_truth where status='GREEN_STALE') = 0
    and (select count(*) from active_truth where status in ('DRIFTED','UNKNOWN')) = 0
  ) as control_plane_healthy;

revoke all on public.powerhouse_terminal_control_plane_health_v1 from public, anon, authenticated;
grant select on public.powerhouse_terminal_control_plane_health_v1 to service_role;

create or replace function public.powerhouse_terminal_autonomous_reconcile_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_op public.brain_operations;
  v_truth record;
  v_job record;
  v_requeued integer := 0;
  v_truth_reconciled integer := 0;
  v_jobs_resolved integer := 0;
  v_terminal_jobs integer := 0;
  v_selftests_compensated integer := 0;
  v_health jsonb;
begin
  -- Re-offer only internal work that is explicitly side-effect-free and not started.
  for v_op in
    select *
    from public.brain_operations
    where status='PLANNED'
      and updated_at < p_now - interval '15 minutes'
      and operation_type in ('SELFTEST','IDEMPOTENCY_REGRESSION','COST_PROOF','security-closure-probe','replay_learning_writeback')
      and coalesce(evidence->'execution_resilience'->>'side_effect_state','NOT_STARTED')='NOT_STARTED'
    order by updated_at, id
    for update skip locked
  loop
    perform public.brain_transition_operation(
      v_op.id,
      v_op.version,
      'PLANNED',
      v_op.dispatch_generation + 1,
      v_op.remote_ref,
      coalesce(v_op.evidence,'{}'::jsonb) ||
      jsonb_build_object(
        'terminal_autonomous_reconcile',
        jsonb_build_object(
          'contract','terminal-autonomous-reconciler-v2',
          'requeued_at',p_now,
          'reason','STALE_SIDE_EFFECT_FREE_PLANNED_OPERATION',
          'previous_dispatch_generation',v_op.dispatch_generation
        )
      )
    );
    v_requeued := v_requeued + 1;
  end loop;

  -- Historical self-test reconciliation that never dispatched externally is safe to compensate,
  -- not to pretend succeeded.
  for v_job in
    select j.id as job_id,j.job_key,j.operation_id,o.version,o.dispatch_generation,o.remote_ref,o.evidence
    from public.brain_reconciliation_jobs j
    join public.brain_operations o on o.id=j.operation_id
    where j.state='ESCALATED'
      and j.job_key like 'selftest-%'
      and o.status='PLANNED'
      and o.dispatch_generation=0
      and o.remote_ref is null
      and o.updated_at < p_now - interval '24 hours'
    order by j.updated_at,j.id
    for update of j,o skip locked
  loop
    perform public.brain_transition_operation(
      v_job.operation_id,
      v_job.version,
      'COMPENSATED',
      v_job.dispatch_generation,
      null,
      coalesce(v_job.evidence,'{}'::jsonb) ||
      jsonb_build_object(
        'terminal_autonomous_reconcile',
        jsonb_build_object(
          'contract','terminal-autonomous-reconciler-v2',
          'classification','HISTORICAL_SELFTEST_NEVER_DISPATCHED',
          'compensated_at',p_now,
          'external_remote_ref',null
        )
      )
    );
    update public.brain_reconciliation_jobs
       set state='RESOLVED',
           resolved_at=p_now,
           claimed_by=null,
           claim_until=null,
           last_observation=jsonb_build_object(
             'classification','HISTORICAL_SELFTEST_NEVER_DISPATCHED',
             'operation_terminal_state','COMPENSATED'
           ),
           evidence=coalesce(evidence,'{}'::jsonb) ||
             jsonb_build_object('terminal_autonomous_reconcile',
               jsonb_build_object('contract','terminal-autonomous-reconciler-v2','resolved_at',p_now)),
           updated_at=p_now
     where id=v_job.job_id;
    v_selftests_compensated := v_selftests_compensated + 1;
    v_jobs_resolved := v_jobs_resolved + 1;
  end loop;

  -- If an underlying operation is already terminal, its escalated reconciliation is no longer open.
  update public.brain_reconciliation_jobs j
     set state='RESOLVED',
         resolved_at=coalesce(j.resolved_at,p_now),
         claimed_by=null,
         claim_until=null,
         last_observation=coalesce(j.last_observation,'{}'::jsonb) ||
           jsonb_build_object('operation_terminal_state',o.status),
         evidence=coalesce(j.evidence,'{}'::jsonb) ||
           jsonb_build_object('terminal_autonomous_reconcile',
             jsonb_build_object('contract','terminal-autonomous-reconciler-v2','resolved_at',p_now)),
         updated_at=p_now
    from public.brain_operations o
   where j.operation_id=o.id
     and j.state='ESCALATED'
     and o.status in ('VERIFIED','COMPENSATED');
  get diagnostics v_terminal_jobs = row_count;
  v_jobs_resolved := v_jobs_resolved + v_terminal_jobs;

  -- Only active desired states require fresh production truth. Retired proofs remain historical evidence.
  for v_truth in
    select pt.subject_type,pt.subject_id,pt.environment
    from public.brain_production_truth pt
    join public.brain_desired_states ds on ds.id=pt.desired_state_id
    where pt.status='GREEN_STALE'
      and coalesce(ds.desired_state->>'lifecycle','ACTIVE') <> 'RETIRED'
    order by pt.reconciled_at nulls first,pt.id
  loop
    perform public.brain_reconcile_production_truth(
      v_truth.subject_type,
      v_truth.subject_id,
      v_truth.environment,
      p_now
    );
    v_truth_reconciled := v_truth_reconciled + 1;
  end loop;

  select to_jsonb(h) into v_health
  from public.powerhouse_terminal_control_plane_health_v1 h
  limit 1;

  return jsonb_build_object(
    'contract','terminal-autonomous-reconciler-v2',
    'reconciled_at',p_now,
    'side_effect_free_operations_requeued',v_requeued,
    'historical_selftests_compensated',v_selftests_compensated,
    'escalated_terminal_jobs_resolved',v_jobs_resolved,
    'active_stale_green_truths_reconciled',v_truth_reconciled,
    'health',v_health,
    'truth_boundary','Retired historical proof never becomes fresh by invention. Real blocked obligations, active stale truth and drift remain fail-closed.'
  );
end
$function$;

revoke execute on function public.powerhouse_terminal_autonomous_reconcile_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_terminal_autonomous_reconcile_v1(timestamptz) to service_role;

-- Explicitly retire the expired 31-August P0 proof. Preserve its stale truth as historical evidence.
select public.brain_register_desired_state(
  'P0_PROOF',
  'production-truth-proof-20260831-v1',
  'production',
  jsonb_build_object(
    'mode','ACTIVE',
    'healthy',true,
    'lifecycle','RETIRED',
    'retired_reason','HISTORICAL_TIMEBOXED_PROOF_EXPIRED',
    'retired_at','2026-09-20T08:10:00Z'
  ),
  'production-truth-proof-20260831-v1-retired',
  1
);

comment on view public.powerhouse_terminal_control_plane_health_v1 is
'Fail-closed current control-plane health. Explicitly retired historical proof is counted separately and cannot make current runtime green or red.';
