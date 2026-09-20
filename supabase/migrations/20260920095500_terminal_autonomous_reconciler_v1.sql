-- terminal-autonomous-reconciler-v1
-- Purpose: make incomplete/stale control-plane state self-detecting and safely self-recovering.
-- Safety: never fabricates success; only requeues side-effect-free internal work and re-runs canonical production-truth reconciliation.

create or replace view public.powerhouse_terminal_control_plane_health_v1
with (security_invoker = true)
as
select
  now() as observed_at,
  (select count(*) from public.brain_obligations where state in ('OPEN','READY','RUNNING','BLOCKED')) as nonterminal_obligations,
  (select count(*) from public.brain_operations where status='PLANNED' and updated_at < now() - interval '15 minutes') as stale_planned_operations,
  (select count(*) from public.brain_reconciliation_jobs where state='ESCALATED') as escalated_reconciliation_jobs,
  (select count(*) from public.brain_production_truth where status='GREEN_STALE') as stale_green_truths,
  (
    (select count(*) from public.brain_reconciliation_jobs where state='ESCALATED') = 0
    and (select count(*) from public.brain_production_truth where status='GREEN_STALE') = 0
    and (select count(*) from public.brain_operations where status='PLANNED' and updated_at < now() - interval '15 minutes') = 0
  ) as control_plane_healthy;

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
  v_requeued integer := 0;
  v_truth_reconciled integer := 0;
  v_health jsonb;
begin
  -- Safely re-offer only internal, side-effect-free work that explicitly says no side effect started.
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
          'contract','terminal-autonomous-reconciler-v1',
          'requeued_at',p_now,
          'reason','STALE_SIDE_EFFECT_FREE_PLANNED_OPERATION',
          'previous_dispatch_generation',v_op.dispatch_generation
        )
      )
    );
    v_requeued := v_requeued + 1;
  end loop;

  -- A stale green is never terminal. Re-run the existing canonical truth reconciler.
  for v_truth in
    select subject_type, subject_id, environment
    from public.brain_production_truth
    where status='GREEN_STALE'
    order by reconciled_at nulls first, id
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
    'contract','terminal-autonomous-reconciler-v1',
    'reconciled_at',p_now,
    'side_effect_free_operations_requeued',v_requeued,
    'stale_green_truths_reconciled',v_truth_reconciled,
    'health',v_health,
    'truth_boundary','Never auto-fulfil obligations without outcome evidence; external/hard-boundary work remains visible and fail-closed.'
  );
end
$function$;

revoke all on function public.powerhouse_terminal_autonomous_reconcile_v1(timestamptz) from public;
grant execute on function public.powerhouse_terminal_autonomous_reconcile_v1(timestamptz) to service_role;

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-terminal-autonomous-reconciler-v1';
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
  perform cron.schedule(
    'powerhouse-terminal-autonomous-reconciler-v1',
    '*/5 * * * *',
    'select public.powerhouse_terminal_autonomous_reconcile_v1(now());'
  );
end
$$;

comment on view public.powerhouse_terminal_control_plane_health_v1 is
'Fail-closed terminal control-plane health. Stale planned work, escalated reconciliation, or stale green truth prevents healthy=true.';

comment on function public.powerhouse_terminal_autonomous_reconcile_v1(timestamptz) is
'Requeues only side-effect-free stale internal operations and re-runs canonical stale production-truth reconciliation. Never invents terminal success.';
