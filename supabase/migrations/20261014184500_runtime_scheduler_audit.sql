-- Retain auditable per-run outcomes without replaying external actions.
create table if not exists powerhouse_ops.runtime_scheduler_run_evidence_v1(
  run_slot timestamptz primary key,
  state text not null check(state in ('COMPLETED','TASK_FAILURE','SKIPPED_OVERLAP')),
  healthy boolean not null,
  task_results jsonb not null default '[]'::jsonb,
  attempts integer not null default 1 check(attempts>0),
  recorded_at timestamptz not null default clock_timestamp()
);
revoke all on powerhouse_ops.runtime_scheduler_run_evidence_v1 from public,anon,authenticated;

do $guard$
declare
  v_current text;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron not installed in this environment';
    return;
  end if;
  select command into v_current from cron.job where jobid=171 and active=true;
  if v_current is null then
    raise notice 'job 171 absent or inactive; no schedule changed';
    return;
  end if;
  if v_current = $actual$SET statement_timeout = '30s';
do $mux$
declare
  v_slot timestamptz:=date_trunc('minute',clock_timestamp());
  v_result jsonb;
  v_state text;
  v_healthy boolean;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-runtime-scheduler-outer',0)) then
    insert into powerhouse_ops.runtime_scheduler_run_evidence_v1(run_slot,state,healthy,task_results)
    values(v_slot,'SKIPPED_OVERLAP',false,'[]'::jsonb)
    on conflict(run_slot) do update set attempts=powerhouse_ops.runtime_scheduler_run_evidence_v1.attempts+1,
      state=excluded.state,healthy=false,recorded_at=clock_timestamp();
    return;
  end if;
  v_result:=public.powerhouse_runtime_scheduler_mux_v3(now());
  v_healthy:=coalesce((v_result->>'healthy')::boolean,false);
  v_state:=case when v_result->>'state'='SKIPPED_OVERLAP' then 'SKIPPED_OVERLAP'
    when v_healthy then 'COMPLETED' else 'TASK_FAILURE' end;
  insert into powerhouse_ops.runtime_scheduler_run_evidence_v1(run_slot,state,healthy,task_results)
  values(v_slot,v_state,v_state='COMPLETED',coalesce(v_result->'tasks','[]'::jsonb))
  on conflict(run_slot) do update set attempts=powerhouse_ops.runtime_scheduler_run_evidence_v1.attempts+1,
    state=excluded.state,healthy=excluded.healthy,task_results=excluded.task_results,recorded_at=clock_timestamp();
end;
$mux$;$actual$ then
    return;
  end if;
  if v_current is distinct from $prior$SET statement_timeout = '30s';
do $mux$ begin if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-runtime-scheduler-outer',0)) then return; end if; perform public.powerhouse_runtime_scheduler_mux_v3(now()); end; $mux$;$prior$ then
    raise exception 'Unknown job 171 source; no update applied';
  end if;
  perform cron.alter_job(171,command=>$actual$SET statement_timeout = '30s';
do $mux$
declare
  v_slot timestamptz:=date_trunc('minute',clock_timestamp());
  v_result jsonb;
  v_state text;
  v_healthy boolean;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-runtime-scheduler-outer',0)) then
    insert into powerhouse_ops.runtime_scheduler_run_evidence_v1(run_slot,state,healthy,task_results)
    values(v_slot,'SKIPPED_OVERLAP',false,'[]'::jsonb)
    on conflict(run_slot) do update set attempts=powerhouse_ops.runtime_scheduler_run_evidence_v1.attempts+1,
      state=excluded.state,healthy=false,recorded_at=clock_timestamp();
    return;
  end if;
  v_result:=public.powerhouse_runtime_scheduler_mux_v3(now());
  v_healthy:=coalesce((v_result->>'healthy')::boolean,false);
  v_state:=case when v_result->>'state'='SKIPPED_OVERLAP' then 'SKIPPED_OVERLAP'
    when v_healthy then 'COMPLETED' else 'TASK_FAILURE' end;
  insert into powerhouse_ops.runtime_scheduler_run_evidence_v1(run_slot,state,healthy,task_results)
  values(v_slot,v_state,v_state='COMPLETED',coalesce(v_result->'tasks','[]'::jsonb))
  on conflict(run_slot) do update set attempts=powerhouse_ops.runtime_scheduler_run_evidence_v1.attempts+1,
    state=excluded.state,healthy=excluded.healthy,task_results=excluded.task_results,recorded_at=clock_timestamp();
end;
$mux$;$actual$);
end $guard$;
