-- Reuse the existing Brain, connection store, evidence aggregation and identity-graph cron.
-- A daily review is not proof of live LinkedIn access or a fresh public web lookup.
-- The existing enrichment batch queries normalized company evidence for every contact.
-- Support those lookups without changing the canonical matching semantics.
create index if not exists powerhouse_runtime_events_company_norm_pulse_idx
  on public.powerhouse_runtime_events
  (lower(regexp_replace(trim(coalesce(company_key,'')), '\\s+', ' ', 'g')))
  where company_key is not null;

create index if not exists powerhouse_predictive_signals_company_norm_pulse_idx
  on public.powerhouse_predictive_signals
  (lower(regexp_replace(trim(entity_key), '\\s+', ' ', 'g')))
  where entity_scope='company';

create or replace function public.powerhouse_connection_daily_pulse_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_batch_size integer default 500
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $pulse$
declare
  v_total integer;
  v_done integer;
  v_reviewed_batch integer := 0;
  v_reviewed_today integer := 0;
  v_refresh jsonb := '{}'::jsonb;
  v_size integer := greatest(1, least(coalesce(p_batch_size,500),500));
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse_connection_daily_pulse_v1',0)) then
    return jsonb_build_object('state','BUSY','run_date',p_run_date,'retriable',true);
  end if;

  select count(*) into v_total
  from public.bg_connecties c
  where coalesce(nullif(btrim(c.sleutel),''),nullif(btrim(c.linkedin_url),'')) is not null;

  select count(*) into v_done
  from public.powerhouse_connection_enrichment_state_v1
  where enrichment_date=p_run_date;

  if v_done < v_total then
    v_refresh := public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,v_size);
  end if;

  -- Only facts already ingested from authorized/public sources are used here.
  -- The Brain's canonical NBA and provider gates decide whether any external action can execute.
  with todo as (
    select s.person_key,
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
    where s.enrichment_date=p_run_date
      and s.source_snapshot #>> '{daily_decision,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc, s.person_key
    limit v_size
  ), updated as (
    update public.powerhouse_connection_enrichment_state_v1 s
    set source_snapshot=jsonb_set(
      coalesce(s.source_snapshot,'{}'::jsonb),
      '{daily_decision}',
      jsonb_build_object(
        'run_date',p_run_date::text,
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
  where enrichment_date=p_run_date
    and source_snapshot #>> '{daily_decision,run_date}'=p_run_date::text;

  return jsonb_build_object(
    'contract','powerhouse-connection-daily-pulse-v1',
    'run_date',p_run_date,
    'total_connections',v_total,
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
$pulse$;

revoke all on function public.powerhouse_connection_daily_pulse_v1(date,integer)
  from public, anon, authenticated;

-- Reuse the existing identity-graph job (id 138), not a new scheduler.
-- Keep graph sync at its existing minute (:32) while assessing all contacts in bounded
-- 500-contact batches four times per hour. At 1,000 per tick, ~24K complete in ~6h.
do $configure_canonical_owner$
declare v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname='powerhouse-identity-graph-v1' and active=true
  order by jobid limit 1;

  -- Branch previews may not have the production cron numeric ID.
  if v_jobid is null then
    raise notice 'existing identity-graph scheduler unavailable in preview; no parallel job created';
  else
    perform cron.alter_job(
      v_jobid,
      schedule => '2,17,32,47 * * * *',
      command => $job$
do $runner$
declare v_date date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if extract(minute from now())::integer=32 then
    begin
      perform public.powerhouse_sync_identity_graph_batch_v1(100);
    exception when others then
      raise warning 'identity graph isolated: % %', sqlstate,sqlerrm;
    end;
  end if;
  begin
    perform public.powerhouse_connection_daily_pulse_v1(v_date,500);
    perform public.powerhouse_connection_daily_pulse_v1(v_date,500);
  exception when others then
    raise warning 'connection daily pulse retriable: % %', sqlstate,sqlerrm;
  end;
end;
$runner$;
$job$
    );
  end if;
end;
$configure_canonical_owner$;
