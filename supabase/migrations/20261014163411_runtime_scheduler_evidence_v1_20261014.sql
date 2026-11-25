create table if not exists powerhouse_ops.runtime_scheduler_run_evidence_v1(
  run_slot timestamptz primary key,
  state text not null check(state in ('COMPLETED','TASK_FAILURE','SKIPPED_OVERLAP')),
  healthy boolean not null,
  task_results jsonb not null default '[]'::jsonb,
  attempts integer not null default 1 check(attempts>0),
  recorded_at timestamptz not null default clock_timestamp()
);
revoke all on powerhouse_ops.runtime_scheduler_run_evidence_v1 from public,anon,authenticated;
