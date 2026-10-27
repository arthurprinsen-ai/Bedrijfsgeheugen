create table if not exists powerhouse_ops.connection_total_count_cache(singleton boolean primary key default true check(singleton),total_count integer not null check(total_count>=0),observed_at timestamptz not null); revoke all on powerhouse_ops.connection_total_count_cache from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.powerhouse_connection_daily_pulse_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date, p_batch_size integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_total integer;
  v_total_observed_at timestamptz;
  v_done integer;
  v_reviewed_batch integer := 0;
  v_reviewed_today integer := 0;
  v_refresh jsonb := '{}'::jsonb;
  v_size integer := greatest(1, least(coalesce(p_batch_size,500),500));
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse_connection_daily_pulse_v1',0)) then
    return jsonb_build_object('state','BUSY','run_date',p_run_date,'retriable',true);
  end if;

  select total_count,observed_at into v_total,v_total_observed_at from powerhouse_ops.connection_total_count_cache where singleton=true and observed_at>=clock_timestamp()-interval '15 minutes';
  if not found then
    select count(*) into v_total from public.bg_connecties c where coalesce(nullif(btrim(c.sleutel),''),nullif(btrim(c.linkedin_url),'')) is not null;
    insert into powerhouse_ops.connection_total_count_cache(singleton,total_count,observed_at) values(true,v_total,clock_timestamp()) on conflict(singleton) do update set total_count=excluded.total_count,observed_at=excluded.observed_at;
    v_total_observed_at:=clock_timestamp();
  end if;

  select count(*) into v_done
  from public.powerhouse_connection_enrichment_state_v1
  where enrichment_date=p_run_date;

  if v_done < v_total then
    v_refresh := public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,v_size);
  end if;

  -- Only facts already ingested from authorized/public sources are used here.
  -- The Brain's canonical NBA and provider gates decide whether any external action can execute.
  with todo as (
    select s.person_key,s.enrichment_date,
      case
        when lower(coalesce(s.source_snapshot #>> '{core,status}',''))='rust'
          then 'NO_ACTION_HOLD'
        when s.company_news_120d>0 and s.latest_external_at >= now()-interval '30 days'
          then 'COMPANY_SIGNAL_REVIEW'
        when s.external_signals_90d>0 and s.latest_external_at >= now()-interval '30 days'
          then 'EXTERNAL_SIGNAL_REVIEW'
        when s.linkedin_events_30d>0
          then 'LINKEDIN_ENGAGEMENT_REVIEW'
        when lower(coalesce(s.source_snapshot #>> '{core,status}',''))='in_gesprek'
          then 'FOLLOWUP_REVIEW'
        when s.data_completeness<0.60
          then 'CONTEXT_RESEARCH_REVIEW'
        else 'NO_ACTION'
      end as review_result,
      s.linkedin_events_30d,
      s.external_signals_90d,
      s.company_news_120d,
      s.latest_external_at
    from public.powerhouse_connection_enrichment_state_v1 s
    where s.source_snapshot #>> '{daily_decision,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc, s.person_key
    limit v_size
  ), updated as (
    update public.powerhouse_connection_enrichment_state_v1 s
    set source_snapshot=jsonb_set(
      coalesce(s.source_snapshot,'{}'::jsonb),
      '{daily_decision}',
      jsonb_build_object(
        'run_date',p_run_date::text,
        'source_enrichment_date',t.enrichment_date,
        'review_based_on_historical_snapshot',t.enrichment_date is distinct from p_run_date,
        'reviewed_at',now(),
        'result',t.review_result,
        'evidence',jsonb_build_object(
          'linkedin_events_30d',t.linkedin_events_30d,
          'external_signals_90d',t.external_signals_90d,
          'company_news_120d',t.company_news_120d,
          'latest_external_at',t.latest_external_at),
        'decision_authority','canonical_powerhouse_commercial_next_best_action',
        'execution_authority','existing_canonical_channel_and_consent_gates',
        'direct_provider_action_executed',false,
        'fresh_external_lookup_performed',false,
        'sensitive_inference_allowed',false
      ),true),
      updated_at=now()
    from todo t where s.person_key=t.person_key
    returning s.person_key
  )
  select count(*) into v_reviewed_batch from updated;

  select count(*) into v_done
  from public.powerhouse_connection_enrichment_state_v1 where enrichment_date=p_run_date;
  select count(*) into v_reviewed_today
  from public.powerhouse_connection_enrichment_state_v1
  where source_snapshot #>> '{daily_decision,run_date}'=p_run_date::text;

  return jsonb_build_object(
    'contract','powerhouse-connection-daily-pulse-v1',
    'run_date',p_run_date,
    'total_connections',v_total,
    'total_count_observed_at',v_total_observed_at,
    'enriched_today',v_done,
    'reviewed_today',v_reviewed_today,
    'reviewed_this_batch',v_reviewed_batch,
    'remaining_to_review',greatest(0,v_total-v_reviewed_today),
    'all_connections_reviewed',v_reviewed_today>=v_total,
    'refresh',v_refresh,
    'provider_messages_sent',0,
    'assurance','internal_facts_reviewed_not_external_delivery_proof'
  );
end;
$function$
