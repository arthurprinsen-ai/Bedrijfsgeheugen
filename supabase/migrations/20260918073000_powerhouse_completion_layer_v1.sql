-- Powerhouse Completion Layer v1
-- Closes forecast calibration obligations, provider evidence freshness and machine-readable completion readiness.
-- Existing authorities are reused; this migration creates no parallel queue or learning store.

create or replace function public.powerhouse_enqueue_forecast_calibration_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_due timestamptz;
  v_obligation_id text;
begin
  if new.status not in ('active','claimed') then
    return new;
  end if;

  v_due := ((coalesce(new.expected_by,new.horizon_end)::timestamp + interval '1 day') at time zone 'Europe/Amsterdam');
  v_obligation_id := 'FORECAST_CALIBRATION:' || new.forecast_id::text;

  insert into public.revenue_learning_obligations(
    tenant_id, obligation_id, type, status, payload, due_at, updated_at
  ) values (
    'canonical',
    v_obligation_id,
    'FORECAST_CALIBRATION',
    'OPEN',
    jsonb_build_object(
      'forecast_id', new.forecast_id,
      'forecast_key', new.forecast_key,
      'horizon_end', new.horizon_end,
      'expected_by', new.expected_by,
      'source', 'powerhouse_enqueue_forecast_calibration_v1'
    ),
    v_due,
    now()
  )
  on conflict (tenant_id,obligation_id) do update
    set payload = excluded.payload,
        due_at = excluded.due_at,
        updated_at = now()
  where public.revenue_learning_obligations.status = 'OPEN';

  return new;
end
$$;

drop trigger if exists powerhouse_forecast_calibration_obligation_v1 on public.powerhouse_forecasts;
create trigger powerhouse_forecast_calibration_obligation_v1
after insert or update of status, expected_by, horizon_end
on public.powerhouse_forecasts
for each row execute function public.powerhouse_enqueue_forecast_calibration_v1();

insert into public.revenue_learning_obligations(
  tenant_id, obligation_id, type, status, payload, due_at, updated_at
)
select
  'canonical',
  'FORECAST_CALIBRATION:' || f.forecast_id::text,
  'FORECAST_CALIBRATION',
  'OPEN',
  jsonb_build_object(
    'forecast_id',f.forecast_id,
    'forecast_key',f.forecast_key,
    'horizon_end',f.horizon_end,
    'expected_by',f.expected_by,
    'source','completion-layer-backfill-v1'
  ),
  ((coalesce(f.expected_by,f.horizon_end)::timestamp + interval '1 day') at time zone 'Europe/Amsterdam'),
  now()
from public.powerhouse_forecasts f
where f.status in ('active','claimed')
  and not exists (
    select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=f.forecast_id
  )
on conflict (tenant_id,obligation_id) do nothing;

insert into public.powerhouse_evidence_sources
  (source_key,source_class,required,max_age,writer_contract,owner_component,notes)
values
  ('github-delivery','delivery',true,interval '6 hours','protected-main-exact-sha-readback-v1','github-delivery','Protected source, checks and exact-head lineage'),
  ('netlify-production','production',true,interval '6 hours','exact-netlify-deploy-readback-v1','netlify-production','Immutable deploy identity plus public alias readback'),
  ('supabase-runtime','runtime',true,interval '2 hours','supabase-runtime-health-v1','supabase-runtime','Database, cron and Edge Function runtime health'),
  ('notion-projection','projection',true,interval '3 hours','notion-projection-parity-v1','bg-notion-sync','Human projection only; machine truth remains Supabase/GitHub'),
  ('tavily-intelligence','external_intelligence',true,interval '30 hours','tavily-signal-ingest-v1','bg-externe-signalen','External signals feeding predictive intelligence'),
  ('buffer-publication','provider',true,interval '3 hours','buffer-publication-readback-v1','bg-buffer-sync','Social provider delivery and metrics'),
  ('ga4-analytics','analytics',false,interval '30 hours','ga4-observed-metrics-v1','bg-ga4-sync','Optional observed analytics source'),
  ('gsc-search','analytics',false,interval '30 hours','gsc-observed-search-v1','bg-gsc-sync','Optional observed Search Console source')
on conflict (source_key) do update set
  source_class=excluded.source_class,
  required=excluded.required,
  max_age=excluded.max_age,
  writer_contract=excluded.writer_contract,
  owner_component=excluded.owner_component,
  notes=excluded.notes,
  updated_at=now();

create or replace function public.powerhouse_capture_completion_evidence_v1()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_written integer := 0;
begin
  with latest as (
    select distinct on (onderdeel)
      onderdeel,status,detail,gemeten_op
    from public.bg_gezondheid
    where onderdeel in (
      'bg-notion-sync','bg-externe-signalen','bg-buffer-sync','bg-ga4-sync','bg-gsc-sync',
      'powerhouse-predictive-engine','powerhouse-forecast-calibrator'
    )
    order by onderdeel,gemeten_op desc
  ),
  mapped as (
    select
      case onderdeel
        when 'bg-notion-sync' then 'notion-projection'
        when 'bg-externe-signalen' then 'tavily-intelligence'
        when 'bg-buffer-sync' then 'buffer-publication'
        when 'bg-ga4-sync' then 'ga4-analytics'
        when 'bg-gsc-sync' then 'gsc-search'
        when 'powerhouse-predictive-engine' then 'supabase-runtime'
        when 'powerhouse-forecast-calibrator' then 'supabase-runtime'
      end source_key,
      onderdeel,status,detail,gemeten_op
    from latest
  )
  insert into public.powerhouse_evidence_source_observations(
    source_key,dedupe_key,external_event_id,observed_at,evidence
  )
  select
    source_key,
    source_key || ':' || md5(onderdeel || ':' || gemeten_op::text || ':' || coalesce(status,'')),
    onderdeel || ':' || gemeten_op::text,
    gemeten_op,
    jsonb_build_object('component',onderdeel,'status',status,'detail',detail,'contract','powerhouse-completion-layer-v1')
  from mapped
  where source_key is not null
  on conflict (dedupe_key) do nothing;

  get diagnostics v_written = row_count;
  return v_written;
end
$$;

create or replace view public.powerhouse_tenant_identity_readiness_v1
with (security_invoker=true) as
select 'scan_inzendingen'::text as surface,
       count(*)::bigint as total_rows,
       count(organisatie_id)::bigint as linked_rows,
       count(*) filter (where organisatie_id is null)::bigint as unresolved_rows,
       count(*) filter (where tenant_identity_status='verified')::bigint as verified_rows
from public.scan_inzendingen
union all
select 'offerte_inzendingen',count(*),count(organisatie_id),
       count(*) filter (where organisatie_id is null),
       count(*) filter (where tenant_identity_status='verified')
from public.offerte_inzendingen
union all
select 'portaal_stand',count(*),count(organisatie_id),
       count(*) filter (where organisatie_id is null),
       count(organisatie_id)
from public.portaal_stand;

create or replace view public.powerhouse_completion_readiness_v1
with (security_invoker=true) as
with source_state as (
  select s.source_key,s.source_class,s.required,s.max_age,
         max(o.observed_at) last_observed_at,
         case
           when max(o.observed_at) is null then 'MISSING'
           when now()-max(o.observed_at) > s.max_age then 'STALE'
           else 'FRESH'
         end freshness
  from public.powerhouse_evidence_sources s
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by s.source_key,s.source_class,s.required,s.max_age
),
forecast as (
  select
    count(*) filter(where status in ('active','claimed')) active_forecasts,
    count(*) filter(where status in ('materialized','expired')) terminal_forecasts,
    (select count(*) from public.powerhouse_forecast_calibration) calibrations,
    (select count(*) from public.revenue_learning_obligations where type='FORECAST_CALIBRATION' and status='OPEN') open_calibration_obligations
  from public.powerhouse_forecasts
),
learning as (
  select
    (select count(*) from public.powerhouse_human_feedback_events) human_feedback_events,
    (select count(*) from public.powerhouse_realized_values) realized_values,
    (select count(*) from public.powerhouse_action_economics) action_economics,
    (select count(*) from public.powerhouse_decision_cycles) decision_cycles,
    (select count(*) from public.powerhouse_predictive_signals) predictive_signals
),
connectors as (
  select
    (select count(*) from public.connector_definitions) definitions,
    (select count(*) from public.connector_executions) executions,
    (select count(*) from public.connector_reviews where status='pending') pending_reviews
)
select jsonb_build_object(
  'contract','powerhouse-completion-layer-v1',
  'observed_at',now(),
  'evidence_sources',coalesce((select jsonb_agg(to_jsonb(source_state) order by required desc,source_key) from source_state),'[]'::jsonb),
  'required_sources_unhealthy',(select count(*) from source_state where required and freshness<>'FRESH'),
  'tenant_identity',coalesce((select jsonb_agg(to_jsonb(t) order by surface) from public.powerhouse_tenant_identity_readiness_v1 t),'[]'::jsonb),
  'forecast',to_jsonb(forecast),
  'learning',to_jsonb(learning),
  'connectors',to_jsonb(connectors)
) as snapshot
from forecast,learning,connectors;

create or replace function public.powerhouse_completion_snapshot_v1()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select snapshot from public.powerhouse_completion_readiness_v1 limit 1
$$;

revoke all on function public.powerhouse_enqueue_forecast_calibration_v1() from public, anon, authenticated;
revoke all on public.powerhouse_tenant_identity_readiness_v1 from anon, authenticated;
revoke all on public.powerhouse_completion_readiness_v1 from anon, authenticated;
revoke all on function public.powerhouse_capture_completion_evidence_v1() from public, anon, authenticated;
revoke all on function public.powerhouse_completion_snapshot_v1() from public, anon, authenticated;
grant select on public.powerhouse_tenant_identity_readiness_v1 to service_role;
grant select on public.powerhouse_completion_readiness_v1 to service_role;
grant execute on function public.powerhouse_capture_completion_evidence_v1() to service_role;
grant execute on function public.powerhouse_completion_snapshot_v1() to service_role;

do $$
begin
  perform cron.unschedule('powerhouse-completion-evidence-hourly-v1');
exception when others then
  null;
end
$$;

select cron.schedule(
  'powerhouse-completion-evidence-hourly-v1',
  '42 * * * *',
  $job$select public.powerhouse_capture_completion_evidence_v1();$job$
);

select public.powerhouse_capture_completion_evidence_v1();
