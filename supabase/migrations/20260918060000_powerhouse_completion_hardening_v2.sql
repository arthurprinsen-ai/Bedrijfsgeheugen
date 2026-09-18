-- Powerhouse Completion Hardening v2
-- Reuses existing authorities. No synthetic feedback, economics, outcomes or connector rows.

create or replace view public.powerhouse_tenant_identity_readiness_v1
with (security_invoker=true) as
select
  'scan_inzendingen'::text as surface,
  count(*)::bigint as total_rows,
  count(organisatie_id)::bigint as linked_rows,
  count(*) filter (
    where organisatie_id is null
      and coalesce(tenant_identity_status,'') not in ('demo','unverified')
  )::bigint as unresolved_rows,
  count(*) filter (where tenant_identity_status='verified')::bigint as verified_rows,
  count(*) filter (where tenant_identity_status='demo')::bigint as demo_rows,
  count(*) filter (
    where organisatie_id is null and tenant_identity_status='unverified'
  )::bigint as pending_claim_rows,
  count(*) filter (
    where organisatie_id is null
      and coalesce(tenant_identity_status,'') not in ('demo','unverified')
  )::bigint as unresolved_error_rows
from public.scan_inzendingen
union all
select
  'offerte_inzendingen',
  count(*),
  count(organisatie_id),
  count(*) filter (
    where organisatie_id is null
      and coalesce(tenant_identity_status,'') not in ('demo','unverified')
  ),
  count(*) filter (where tenant_identity_status='verified'),
  count(*) filter (where tenant_identity_status='demo'),
  count(*) filter (
    where organisatie_id is null and tenant_identity_status='unverified'
  ),
  count(*) filter (
    where organisatie_id is null
      and coalesce(tenant_identity_status,'') not in ('demo','unverified')
  )
from public.offerte_inzendingen
union all
select
  'portaal_stand',
  count(*),
  count(organisatie_id),
  count(*) filter (where organisatie_id is null),
  count(organisatie_id),
  0::bigint,
  0::bigint,
  count(*) filter (where organisatie_id is null)
from public.portaal_stand;

create or replace function public.powerhouse_capture_completion_evidence_v1()
returns integer
language plpgsql
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
      'bg-notion-sync',
      'bg-externe-signalen',
      'bg-buffer-sync',
      'buffer-sync',
      'bg-analytics-sync-composio',
      'bg-ga4-sync',
      'bg-gsc-sync',
      'powerhouse-predictive-engine',
      'powerhouse-forecast-calibrator'
    )
    order by onderdeel,gemeten_op desc
  ),
  mapped as (
    select
      case onderdeel
        when 'bg-notion-sync' then 'notion-projection'
        when 'bg-externe-signalen' then 'tavily-intelligence'
        when 'bg-buffer-sync' then 'buffer-publication'
        when 'buffer-sync' then 'buffer-publication'
        when 'bg-analytics-sync-composio' then 'ga4-analytics'
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
    jsonb_build_object(
      'component',onderdeel,
      'status',status,
      'detail',detail,
      'contract','powerhouse-completion-hardening-v2'
    )
  from mapped
  where source_key is not null
  on conflict (dedupe_key) do nothing;

  get diagnostics v_written = row_count;
  return v_written;
end
$$;

create or replace view public.powerhouse_completion_readiness_v1
with (security_invoker=true) as
with source_state as (
  select
    s.source_key,
    s.source_class,
    s.required,
    s.max_age,
    max(o.observed_at) as last_observed_at,
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
    count(*) filter(where status in ('active','claimed')) as active_forecasts,
    count(*) filter(where status in ('materialized','expired')) as terminal_forecasts,
    (select count(*) from public.powerhouse_forecast_calibration) as calibrations,
    (select count(*) from public.revenue_learning_obligations
      where type='FORECAST_CALIBRATION' and status='OPEN') as open_calibration_obligations,
    (select count(*) from public.revenue_learning_obligations
      where type='FORECAST_CALIBRATION' and status='OPEN' and due_at<=now()) as due_calibration_obligations
  from public.powerhouse_forecasts
),
learning as (
  select
    (select count(*) from public.powerhouse_human_feedback_events) as human_feedback_events,
    (select count(*) from public.powerhouse_realized_values) as realized_values,
    (select count(*) from public.powerhouse_action_economics) as action_economics,
    (select count(*) from public.powerhouse_decision_cycles) as decision_cycles,
    (select count(*) from public.powerhouse_predictive_signals) as predictive_signals
),
capabilities as (
  select
    exists(
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='powerhouse_record_human_feedback_v1'
    ) as human_feedback_ingest_available,
    exists(
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='powerhouse_record_action_economics_v1'
    ) as action_economics_ingest_available,
    exists(
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='powerhouse_realized_value_event_v1'
    ) as realized_value_event_available,
    exists(
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='powerhouse_advance_cycle_v1'
    ) as decision_cycle_runtime_available
),
tenant_connectors as (
  select
    (select count(*) from public.connector_definitions) as definitions,
    (select count(*) from public.connector_executions) as executions,
    (select count(*) from public.connector_reviews where status='pending') as pending_reviews
)
select jsonb_build_object(
  'contract','powerhouse-completion-hardening-v2',
  'observed_at',now(),
  'evidence_sources',coalesce(
    (select jsonb_agg(to_jsonb(source_state) order by required desc,source_key) from source_state),
    '[]'::jsonb
  ),
  'required_sources_unhealthy',
    (select count(*) from source_state where required and freshness<>'FRESH'),
  'tenant_identity',coalesce(
    (select jsonb_agg(to_jsonb(t) order by surface)
       from public.powerhouse_tenant_identity_readiness_v1 t),
    '[]'::jsonb
  ),
  'forecast',to_jsonb(forecast),
  'learning',jsonb_build_object(
    'observed_events',to_jsonb(learning),
    'capabilities',to_jsonb(capabilities)
  ),
  'tenant_connector_builder',to_jsonb(tenant_connectors)
) as snapshot
from forecast,learning,capabilities,tenant_connectors;

revoke all on public.powerhouse_tenant_identity_readiness_v1 from anon, authenticated;
revoke all on public.powerhouse_completion_readiness_v1 from anon, authenticated;
grant select on public.powerhouse_tenant_identity_readiness_v1 to service_role;
grant select on public.powerhouse_completion_readiness_v1 to service_role;

do $$
begin
  perform cron.unschedule('powerhouse-release-evidence-sync-hourly-v1');
exception when others then
  null;
end
$$;

select cron.schedule(
  'powerhouse-release-evidence-sync-hourly-v1',
  '12 * * * *',
  $job$select public.bg_roep_functie('powerhouse-release-evidence-sync','{}'::jsonb);$job$
);

select public.powerhouse_capture_completion_evidence_v1();
