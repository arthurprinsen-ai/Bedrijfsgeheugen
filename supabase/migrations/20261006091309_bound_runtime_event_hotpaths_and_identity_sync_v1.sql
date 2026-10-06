
create index if not exists powerhouse_runtime_events_source_occurred_idx
  on public.powerhouse_runtime_events(source, occurred_at desc);

create index if not exists powerhouse_runtime_events_updated_idx
  on public.powerhouse_runtime_events(updated_at desc);

create index if not exists powerhouse_runtime_events_event_source_occurred_idx
  on public.powerhouse_runtime_events(event_type, source, occurred_at, event_id);

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-identity-graph-v1';
  if v_jobid is null then raise exception 'CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1'; end if;
  perform cron.alter_job(
    job_id := v_jobid,
    command := 'select public.powerhouse_sync_identity_graph_batch_v1(500);'
  );
end $$;
