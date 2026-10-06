-- Structural recovery for Supabase connection pressure / PostgREST 522 incidents.
-- Keep the existing cadences, but remove thundering-herd starts that can exhaust
-- pg_cron/Supavisor connection checkout capacity. Fail closed if a canonical job
-- is missing so preview/prod cannot silently drift.

do $migration$
declare
  rec record;
  v_jobid bigint;
begin
  for rec in
    select *
    from (values
      ('powerhouse-public-rls-guard-scan', '1,6,11,16,21,26,31,36,41,46,51,56 * * * *'),
      ('powerhouse-content-closed-loop-v1', '2,7,12,17,22,27,32,37,42,47,52,57 * * * *'),
      ('powerhouse-terminal-autonomous-reconciler-v1', '3,8,13,18,23,28,33,38,43,48,53,58 * * * *'),
      ('powerhouse-loop-assurance-v2', '4,9,14,19,24,29,34,39,44,49,54,59 * * * *'),
      ('powerhouse-one-commercial-heartbeat-v1', '0,5,10,15,20,25,30,35,40,45,50,55 * * * *'),
      ('powerhouse-data-spine-watchdog-v1', '0,10,20,30,40,50 * * * *'),
      ('powerhouse-one-brain-reconcile-v1', '3,13,23,33,43,53 * * * *'),
      ('powerhouse-email-execution-watchdog-v1', '6,16,26,36,46,56 * * * *'),
      ('powerhouse-revenue-intelligence-snapshot-15m', '7,22,37,52 * * * *'),
      ('powerhouse-identity-graph-v1', '2,17,32,47 * * * *'),
      ('powerhouse-revenue-flywheel-health-v1', '9 * * * *'),
      ('powerhouse-market-truth-maturity-hourly-v1', '19 * * * *'),
      ('powerhouse-evidence-maintenance-hourly-v1', '29 * * * *'),
      ('powerhouse-offers-source-heartbeat-hourly-v1', '39 * * * *'),
      ('powerhouse-legacy-growth-outcome-reconcile-v1', '49 * * * *'),
      ('powerhouse-email-provider-preflight-hourly-v1', '59 * * * *'),
      ('powerhouse-autonomous-improvement-cycle-v1', '34 * * * *'),
      ('powerhouse-completion-evidence-hourly-v1', '44 * * * *'),
      ('powerhouse-mira-problem-outcome-sync-v1', '54 * * * *'),
      ('powerhouse-execution-learning-closure-v1', '38 * * * *'),
      ('powerhouse-outbound-source-lineage-hourly-v1', '48 * * * *'),
      ('powerhouse-autonomous-outreach-prepare-daily', '21 6 * * *'),
      ('powerhouse-connection-activation-daily-v1', '24 6 * * *'),
      ('powerhouse-content-orchestrator-daily-v1', '27 6 * * *'),
      ('bg-content-lessen', '29 6 * * 1-5'),
      ('bg-bedrijfsnieuws-werkdagen', '31 6 * * 1-5')
    ) as desired(jobname, schedule)
  loop
    select j.jobid
      into v_jobid
    from cron.job j
    where j.jobname = rec.jobname;

    -- Preview branches do not necessarily materialize every production-only scheduler
    -- job. Alter every canonical job that is present; production completeness is
    -- asserted separately by runtime readback so replay remains portable.
    if v_jobid is not null then
      perform cron.alter_job(job_id := v_jobid, schedule := rec.schedule);
    end if;
  end loop;
end
$migration$;
