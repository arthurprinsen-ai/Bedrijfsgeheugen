-- Powerhouse forecast-lineage sequencing v1
-- Reuse existing commercial progression forecast bridge and existing scheduler owners.
-- No new cron, forecast store, CRM, brain, queue, or learning system.

do $$
declare
  v_gap_job bigint;
  v_snapshot_job bigint;
begin
  select jobid into strict v_gap_job
  from cron.job
  where jobname='powerhouse-autonomous-gap-closer-v1' and active=true;

  select jobid into strict v_snapshot_job
  from cron.job
  where jobname='powerhouse-revenue-intelligence-snapshot-15m' and active=true;

  perform cron.alter_job(
    v_gap_job,
    command => $cmd$
      select public.powerhouse_ensure_commercial_progression_forecasts_v1((now() at time zone 'Europe/Amsterdam')::date);
      select public.powerhouse_autonomous_gap_closer_v1((now() at time zone 'Europe/Amsterdam')::date);
    $cmd$
  );

  perform cron.alter_job(
    v_snapshot_job,
    command => $cmd$
      select public.powerhouse_ensure_commercial_progression_forecasts_v1((now() at time zone 'Europe/Amsterdam')::date);
      select public.powerhouse_refresh_revenue_intelligence_snapshot_v1();
    $cmd$
  );
end $$;

insert into public.powerhouse_sales_learnings(
  fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,
  content_key,topic_key,channel,sample_size,expires_at
) values (
  'forecast-lineage-sequencing-gap-v1','growth-revenue-os','revenue_intelligence',
  'Asynchronous connection activation can materialize eligible sales actions after forecast generation; canonical health must repair commercial progression lineage before gap closure and command-center refresh.',
  jsonb_build_object(
    'observed_at',now(),
    'observed_forecast_lineage_gaps',28,
    'observed_identity_gaps',0,
    'observed_runtime_errors',0,
    'repair_function','powerhouse_ensure_commercial_progression_forecasts_v1',
    'scheduler_owners',jsonb_build_array('powerhouse-autonomous-gap-closer-v1','powerhouse-revenue-intelligence-snapshot-15m'),
    'truth_boundary','forecast lineage is predictive evidence only; no response, conversion, winner or realized revenue is synthesized'
  ),
  jsonb_build_object(
    'root_cause','connection_activated is delivered asynchronously through pg_net, so action materialization can occur after an earlier forecast pass',
    'prevention_rule','Before canonical gap closure or revenue-intelligence snapshot refresh, run the existing commercial-progression forecast bridge and fail closed on any remaining structural lineage gap.',
    'reuse_first',true,
    'new_scheduler_created',false,
    'new_store_created',false
  ),
  1.0,'proven',null,null,null,28,now()+interval '90 days'
)
on conflict(fingerprint) do update set
  evidence=excluded.evidence,
  effect=excluded.effect,
  confidence=excluded.confidence,
  status='proven',
  sample_size=greatest(public.powerhouse_sales_learnings.sample_size,excluded.sample_size),
  expires_at=excluded.expires_at,
  updated_at=now();

insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
) values (
  'forecast-lineage-sequencing-v1:activation',
  'forecast_lineage_sequencing_activated',
  'powerhouse-forecast-lineage-sequencing-v1',
  'growth-revenue-os',now(),
  jsonb_build_object(
    'observed_gap_count_before_repair',28,
    'repair_function','powerhouse_ensure_commercial_progression_forecasts_v1',
    'gap_closer_job','powerhouse-autonomous-gap-closer-v1',
    'snapshot_job','powerhouse-revenue-intelligence-snapshot-15m'
  ),
  jsonb_build_object('existing_state_first',true,'reuse_first',true,'no_parallel_system',true),
  'actioned','verified',1,now()
)
on conflict(dedupe_key) do update set
  evidence=excluded.evidence,context=excluded.context,state=excluded.state,
  data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();
