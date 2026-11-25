
-- Reuse the existing Brein/Powerhouse/Heartbeat authorities.
-- This is a source-fact read model, not another autonomous decision engine.
create table if not exists public.powerhouse_growth_source_daily_v1 (
  tenant_id text not null default 'bedrijfsgeheugen',
  metric_date date not null,
  source_key text not null,
  metrics jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  source_observed_at timestamptz,
  checked_at timestamptz not null default now(),
  quality text not null,
  primary key (tenant_id, metric_date, source_key),
  constraint growth_source_daily_metrics_object check (jsonb_typeof(metrics)='object'),
  constraint growth_source_daily_evidence_object check (jsonb_typeof(evidence)='object')
);
alter table public.powerhouse_growth_source_daily_v1 enable row level security;
revoke all on public.powerhouse_growth_source_daily_v1 from public, anon, authenticated;
grant select, insert, update on public.powerhouse_growth_source_daily_v1 to service_role;

create or replace function public.powerhouse_capture_growth_source_daily_v1(
  p_day date default ((now() at time zone 'Europe/Amsterdam')::date - 1)
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $body$
declare
  v_start timestamptz := p_day::timestamp at time zone 'Europe/Amsterdam';
  v_end timestamptz := (p_day+1)::timestamp at time zone 'Europe/Amsterdam';
  v_now timestamptz := now();
  v_gsc_latest date;
  v_ga4_latest date;
  v_social_latest timestamptz;
  v_site_latest timestamptz;
  v_goal numeric := 1000000;
  v_actual numeric := 0;
  v_status text;
  v_bad text[] := array[]::text[];
  v_result jsonb;
begin
  if p_day < date '2025-01-01' or p_day > ((v_now at time zone 'Europe/Amsterdam')::date) then
    raise exception 'INVALID_MEASUREMENT_DATE';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('growth-source-measure:'||p_day::text,0)) then
    return jsonb_build_object('state','SKIPPED_OVERLAP','date',p_day);
  end if;

  select max(datum) into v_gsc_latest from public.bg_zoekprestaties;
  select max(period_end) filter (where status in ('IMPORTED','PARTIAL') and rows_total > 0)
    into v_ga4_latest from public.bg_ga4_csv_batches;
  select max(observed_at) into v_social_latest from public.social_metric_snapshots;
  select max(ontvangen_op) into v_site_latest from public.bg_interacties;

  -- Google Search Console reports search dates with normal provider latency.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'search_console',
    jsonb_build_object('clicks',coalesce(sum(klikken),0),'impressions',coalesce(sum(vertoningen),0),
       'rows',count(*),'page_count',count(distinct pagina),'search_terms',count(distinct zoekterm)),
    jsonb_build_object('authority','bg_zoekprestaties','latest_provider_date',v_gsc_latest,'provider_delay_allowed_days',4),
    max(opgehaald_op),v_now,
    case when count(*)>0 then 'OBSERVED'
         when p_day >= (v_now at time zone 'Europe/Amsterdam')::date-4 then 'AWAITING_PROVIDER'
         else 'MISSING' end
  from public.bg_zoekprestaties where datum=p_day
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- GA4 campaign batches preserve their full source CSV. A zero-row batch is
  -- not evidence of a measured zero-conversion customer journey.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'ga4',
    jsonb_build_object('provider_rows',coalesce(sum(rows_total),0),
      'attributed_rows',coalesce(sum(rows_attributed),0),
      'unmatched_rows',coalesce(sum(rows_unmatched),0),
      'batches',count(*)),
    jsonb_build_object('authority','bg_ga4_csv_batches','latest_nonempty_day',v_ga4_latest,
       'scope','campaign-attribution-batches-only','not_full_site_analytics',true),
    max(completed_at),v_now,
    case when count(*) filter(where rows_total>0 and status in ('IMPORTED','PARTIAL'))>0 then 'OBSERVED_PARTIAL_SCOPE'
         when count(*)>0 then 'EMPTY_SOURCE_BATCH'
         else 'MISSING' end
  from public.bg_ga4_csv_batches where period_start<=p_day and period_end>=p_day
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Site events: human and robot traffic are never merged.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'website_interactions',
    jsonb_build_object('human_events',count(*) filter(where is_robot is distinct from true),
       'robot_events',count(*) filter(where is_robot is true),
       'human_sessions',count(distinct sessie) filter(where is_robot is distinct from true),
       'human_clicks',count(*) filter(where is_robot is distinct from true and gebeurtenis ilike '%klik%')),
    jsonb_build_object('authority','bg_interacties','privacy','no identified personal tracking',
       'robot_events_excluded_from_learnings',true),
    max(ontvangen_op),v_now,
    case when v_site_latest>=v_now-interval '48 hours' then 'OBSERVED'
         else 'STALE' end
  from public.bg_interacties where ontvangen_op>=v_start and ontvangen_op<v_end
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Historical social snapshots must retain their actual observation times.
  -- Never translate a missing provider pull into 0 likes or 0 impressions.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,channels.platform,
    jsonb_build_object('post_snapshot_count',count(s.snapshot_id),
       'posts_with_snapshot',count(distinct s.post_id)),
    jsonb_build_object('authority','social_metric_snapshots',
       'legacy_buffer_is_not_authorized_new_collector',true),
    max(s.observed_at),v_now,
    case when count(s.snapshot_id)>0 then 'OBSERVED_LEGACY'
         when v_social_latest<v_now-interval '72 hours' or v_social_latest is null then 'STALE_PROVIDER'
         else 'NO_NEW_SNAPSHOT' end
  from (values ('linkedin'),('instagram')) as channels(platform)
  left join (
    select sm.snapshot_id,sm.post_id,sm.observed_at,lower(sp.platform) as platform
    from public.social_metric_snapshots sm
    join public.social_posts sp
      on sp.tenant_id=sm.tenant_id and sp.post_id=sm.post_id
    where sm.observed_at>=v_start and sm.observed_at<v_end
  ) s on s.platform=channels.platform
  group by channels.platform
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Revenue from canonical, observed outcomes only. No modeled € enters this sum.
  select coalesce(sum(revenue_eur),0) into v_actual
  from public.powerhouse_sales_outcomes
  where occurred_at>=(v_end-interval '365 days') and occurred_at<v_end
    and revenue_eur>0;

  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'revenue_goal',
    jsonb_build_object('rolling_365d_observed_revenue_eur',v_actual,
        'rolling_365d_goal_eur',v_goal,'unproven_gap_eur',greatest(0,v_goal-v_actual),
        'goal_progress_pct',round(100*v_actual/v_goal,4),
        'observed_positive_outcomes_365d',count(*)),
    jsonb_build_object('authority','powerhouse_sales_outcomes','horizon','rolling_365_days',
      'scope','revenue-recorded-in-system-only','modeled_revenue_excluded',true),
    max(occurred_at),v_now,
    case when v_actual>0 then 'PARTIAL_REVENUE_OBSERVED' else 'NO_REVENUE_VERIFIED' end
  from public.powerhouse_sales_outcomes
  where occurred_at>=(v_end-interval '365 days') and occurred_at<v_end
    and revenue_eur>0
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  if v_gsc_latest is null or v_gsc_latest < p_day-4 then
    v_bad:=array_append(v_bad,'search_console');
  end if;
  if v_ga4_latest is null or v_ga4_latest < p_day-3 then
    v_bad:=array_append(v_bad,'ga4_nonempty');
  end if;
  if v_social_latest is null or v_social_latest < v_now-interval '72 hours' then
    v_bad:=array_append(v_bad,'social_post_metrics');
  end if;
  if v_site_latest is null or v_site_latest < v_now-interval '48 hours' then
    v_bad:=array_append(v_bad,'website_interactions');
  end if;

  v_status:=case when cardinality(v_bad)=0 then 'MEASUREMENTS_CURRENT'
    else 'MEASUREMENT_GAPS' end;

  v_result:=jsonb_build_object('contract','growth-source-daily-v1',
    'day',p_day,'run_at',v_now,'status',v_status,'missing_or_stale_sources',to_jsonb(v_bad),
    'latest_gsc_date',v_gsc_latest,'latest_ga4_nonempty_day',v_ga4_latest,
    'latest_social_observed_at',v_social_latest,'latest_site_event_at',v_site_latest,
    'observed_revenue_365d_eur',v_actual,'goal_eur',v_goal,
    'safety','never infer revenue, reach or engagement from scheduled-run success');

  insert into public.powerhouse_runtime_events
  (dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at)
  values ('growth-daily-source-health:'||p_day::text,
     'growth_daily_source_health','powerhouse-growth-source-daily-v1','growth-revenue-os',
     'system',v_now,v_result,jsonb_build_object('existing_state_first',true,'source_facts_only',true),
     case when cardinality(v_bad)=0 then 'observed' else 'error' end,
     case when cardinality(v_bad)=0 then 'OBSERVED' else 'PARTIAL' end,1,v_now)
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,state=excluded.state,
    data_quality=excluded.data_quality,updated_at=v_now;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (v_now,'powerhouse-growth-source-daily-v1','growth-measurement',
     case when cardinality(v_bad)=0 then 'ok' else 'fout' end,
     case when cardinality(v_bad)=0 then 'Bronsnapshots actueel' else 'Ontbrekende of verouderde providerstatistieken' end,
     v_result);
  return v_result;
end;
$body$;
revoke all on function public.powerhouse_capture_growth_source_daily_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_capture_growth_source_daily_v1(date) to service_role;

-- Canonical Supabase cron. Idempotent daily facts, twice per day for late arrivals,
-- no provider side effects and no publication retries.
select cron.schedule(
  'powerhouse-growth-source-health-6h-v1',
  '46 */6 * * *',
  $$select public.powerhouse_capture_growth_source_daily_v1(((now() at time zone 'Europe/Amsterdam')::date - 1));
    select public.powerhouse_capture_growth_source_daily_v1((now() at time zone 'Europe/Amsterdam')::date);$$
);
