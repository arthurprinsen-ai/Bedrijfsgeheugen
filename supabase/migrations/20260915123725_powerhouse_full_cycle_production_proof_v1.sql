-- Powerhouse full-cycle production proof v1
-- Reuses canonical health, provider, execution, outcome and calibration lineage.

create or replace function public.powerhouse_reconcile_terminal_publication_state(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_live_count integer := 0;
  v_skipped_count integer := 0;
  v_live_channels jsonb := '[]'::jsonb;
  v_skipped_channels jsonb := '[]'::jsonb;
begin
  with matched as (
    select d.channel,
           o.status,
           coalesce(o.external_id, o.canonical_url, o.content_id) as proven_ref,
           o.evidence as obligation_evidence
    from public.powerhouse_channel_decisions d
    join public.content_publication_obligations o
      on o.tenant_id = 'canonical'
     and o.publication_date = d.run_date
     and o.channel = case d.channel
       when 'instagram_company' then 'instagram'
       else d.channel
     end
    where d.run_date = p_run_date
      and d.decision = 'publish'
      and d.delivery_ref is null
      and d.state not in ('published', 'measured', 'learned')
      and o.status = 'LIVE_PROVEN'
  ), updated as (
    update public.powerhouse_channel_decisions d
       set state = 'published',
           delivery_ref = m.proven_ref,
           delivery_evidence = coalesce(d.delivery_evidence, '{}'::jsonb) || jsonb_build_object(
             'terminal_reconciliation', true,
             'publication_obligation_status', 'LIVE_PROVEN',
             'reconciliation_contract', 'powerhouse-full-cycle-production-proof-v1',
             'reconciled_at', now(),
             'obligation_evidence', coalesce(m.obligation_evidence, '{}'::jsonb)
           ),
           updated_at = now()
      from matched m
     where d.run_date = p_run_date
       and d.channel = m.channel
       and d.delivery_ref is null
    returning d.channel
  )
  select count(*), coalesce(jsonb_agg(channel order by channel), '[]'::jsonb)
    into v_live_count, v_live_channels
    from updated;

  with matched as (
    select d.channel,
           o.status,
           o.evidence as obligation_evidence
    from public.powerhouse_channel_decisions d
    join public.content_publication_obligations o
      on o.tenant_id = 'canonical'
     and o.publication_date = d.run_date
     and o.channel = case d.channel
       when 'instagram_company' then 'instagram'
       else d.channel
     end
    where d.run_date = p_run_date
      and d.decision = 'publish'
      and d.delivery_ref is null
      and d.state not in ('published', 'measured', 'learned')
      and o.status = 'SKIPPED'
  ), updated as (
    update public.powerhouse_channel_decisions d
       set decision = 'hold',
           state = 'decided',
           scheduled_for = null,
           delivery_evidence = coalesce(d.delivery_evidence, '{}'::jsonb) || jsonb_build_object(
             'terminal_reconciliation', true,
             'publication_obligation_status', 'SKIPPED',
             'reconciliation_contract', 'powerhouse-full-cycle-production-proof-v1',
             'reconciled_at', now(),
             'obligation_evidence', coalesce(m.obligation_evidence, '{}'::jsonb)
           ),
           updated_at = now()
      from matched m
     where d.run_date = p_run_date
       and d.channel = m.channel
       and d.delivery_ref is null
    returning d.channel
  )
  select count(*), coalesce(jsonb_agg(channel order by channel), '[]'::jsonb)
    into v_skipped_count, v_skipped_channels
    from updated;

  return jsonb_build_object(
    'contract', 'powerhouse-full-cycle-production-proof-v1',
    'run_date', p_run_date,
    'live_proven_reconciled', v_live_count,
    'live_proven_channels', v_live_channels,
    'skipped_reconciled', v_skipped_count,
    'skipped_channels', v_skipped_channels
  );
end;
$$;

create or replace function public.powerhouse_full_cycle_production_proof(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_reconciliation jsonb;
  v_guard jsonb;
  v_required_sources_healthy boolean := false;
  v_required_failures jsonb := '[]'::jsonb;
  v_buffer_last_sync timestamptz;
  v_buffer_last_metrics timestamptz;
  v_buffer_healthy boolean := false;
  v_ga4_last_sync timestamptz;
  v_ga4_last_batch timestamptz;
  v_ga4_batch_rows integer := 0;
  v_ga4_healthy boolean := false;
  v_gmail_last_readback timestamptz;
  v_gmail_healthy boolean := false;
  v_execution_healthy boolean := false;
  v_predictive_healthy boolean := false;
  v_overdue_calibrations integer := 0;
  v_outcomes_90d integer := 0;
  v_revenue_90d numeric := 0;
  v_calibrations_90d integer := 0;
  v_last_calibration timestamptz;
  v_healthy boolean := false;
  v_proof jsonb;
begin
  perform public.bg_gezondheid_meten();
  v_reconciliation := public.powerhouse_reconcile_terminal_publication_state(p_run_date);
  v_guard := public.powerhouse_daily_execution_guard(p_run_date);

  select
    coalesce(bool_and(canonical_health_status = 'OK' and freshness_status = 'FRESH'), false),
    coalesce(jsonb_agg(jsonb_build_object('source_key', source_key,'health', canonical_health_status,'freshness', freshness_status,'evidence', evidence) order by source_key)
      filter (where canonical_health_status <> 'OK' or freshness_status <> 'FRESH'), '[]'::jsonb)
  into v_required_sources_healthy, v_required_failures
  from public.powerhouse_source_freshness_v1
  where required_for_daily_loop = true;

  select max(uitgevoerd_op) filter (where status = 'ok') into v_buffer_last_sync from public.bg_buffer_sync;
  select max(observed_at) into v_buffer_last_metrics from public.social_metric_snapshots;
  v_buffer_healthy := v_buffer_last_sync is not null and v_buffer_last_sync >= v_now - interval '6 hours' and v_buffer_last_metrics is not null and v_buffer_last_metrics >= v_now - interval '6 hours';

  select max(uitgevoerd_op) filter (where status in ('ok', 'partial')) into v_ga4_last_sync from public.bg_ga4_sync;
  select max(created_at), coalesce(sum(rows_total) filter (where created_at >= v_now - interval '48 hours'), 0)::integer into v_ga4_last_batch, v_ga4_batch_rows
  from public.bg_ga4_csv_batches where status in ('ok','complete','completed','partial') or status is null;
  v_ga4_healthy := v_ga4_last_sync is not null and v_ga4_last_sync >= v_now - interval '48 hours' and v_ga4_last_batch is not null and v_ga4_last_batch >= v_now - interval '48 hours' and v_ga4_batch_rows > 0;

  select max(occurred_at) into v_gmail_last_readback from public.powerhouse_runtime_events
  where event_type='provider_readback_verified' and source='gmail' and subject_key='gmail-outbound-replies' and state='observed' and data_quality='OBSERVED';
  v_gmail_healthy := v_gmail_last_readback is not null and v_gmail_last_readback >= v_now - interval '26 hours';

  v_execution_healthy := coalesce((v_guard ->> 'execution_complete')::boolean, false);
  v_predictive_healthy := coalesce((v_guard -> 'predictive' ->> 'healthy')::boolean, false);
  v_overdue_calibrations := coalesce((v_guard -> 'predictive' ->> 'overdue_calibrations')::integer, 0);

  select count(*) filter (where occurred_at >= v_now - interval '90 days'), coalesce(sum(revenue_eur) filter (where occurred_at >= v_now - interval '90 days'),0)
  into v_outcomes_90d,v_revenue_90d from public.powerhouse_sales_outcomes;
  select count(*) filter (where measured_at >= v_now - interval '90 days'), max(measured_at)
  into v_calibrations_90d,v_last_calibration from public.powerhouse_forecast_calibration;

  v_healthy := v_required_sources_healthy and v_buffer_healthy and v_ga4_healthy and v_gmail_healthy and v_execution_healthy and v_predictive_healthy and v_overdue_calibrations=0;

  v_proof := jsonb_build_object(
    'contract','powerhouse-full-cycle-production-proof-v1','run_date',p_run_date,'generated_at',v_now,'healthy',v_healthy,
    'required_sources_healthy',v_required_sources_healthy,'required_source_failures',v_required_failures,
    'buffer_healthy',v_buffer_healthy,'buffer',jsonb_build_object('last_sync',v_buffer_last_sync,'last_metrics',v_buffer_last_metrics),
    'ga4_healthy',v_ga4_healthy,'ga4',jsonb_build_object('provider_layer','composio','last_sync',v_ga4_last_sync,'last_batch',v_ga4_last_batch,'batch_rows_48h',v_ga4_batch_rows),
    'gmail_healthy',v_gmail_healthy,'gmail',jsonb_build_object('source_key','gmail-outbound-replies','last_provider_readback',v_gmail_last_readback),
    'execution_healthy',v_execution_healthy,'predictive_healthy',v_predictive_healthy,'overdue_calibrations',v_overdue_calibrations,
    'outcomes',jsonb_build_object('observed_sales_outcomes_90d',v_outcomes_90d,'observed_revenue_eur_90d',v_revenue_90d),
    'calibration',jsonb_build_object('rows_90d',v_calibrations_90d,'last_calibration',v_last_calibration),
    'publication_reconciliation',v_reconciliation,'daily_execution_guard',v_guard
  );

  insert into public.powerhouse_runtime_events (dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,created_at,updated_at)
  values ('full-cycle-proof:'||p_run_date::text,'full_cycle_production_proof','powerhouse_full_cycle_production_proof',p_run_date::text,'system',v_now,v_proof,jsonb_build_object('contract','powerhouse-full-cycle-production-proof-v1'),case when v_healthy then 'observed' else 'error' end,case when v_healthy then 'OBSERVED' else 'DEGRADED' end,1,v_now,v_now)
  on conflict (dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=excluded.updated_at;

  insert into public.bg_gezondheid (gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (v_now,'powerhouse-full-cycle-production-proof','closed-loop-production-proof',case when v_healthy then 'OK' else 'FOUT' end,case when v_healthy then 'Volledige Powerhouse productiecyclus bewezen.' else 'Volledige Powerhouse productiecyclus nog niet volledig bewezen.' end,v_proof);

  update public.powerhouse_daily_runs set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('full_cycle_production_proof',v_proof),updated_at=v_now where run_date=p_run_date;
  return v_proof;
end;
$$;

revoke execute on function public.powerhouse_reconcile_terminal_publication_state(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_terminal_publication_state(date) to service_role;
revoke execute on function public.powerhouse_full_cycle_production_proof(date) from public, anon, authenticated;
grant execute on function public.powerhouse_full_cycle_production_proof(date) to service_role;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-full-cycle-proof-hourly-v1' limit 1;
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
  perform cron.schedule('powerhouse-full-cycle-proof-hourly-v1','57 * * * *',$cron$select public.powerhouse_full_cycle_production_proof((now() at time zone 'Europe/Amsterdam')::date);$cron$);
end;
$$;
