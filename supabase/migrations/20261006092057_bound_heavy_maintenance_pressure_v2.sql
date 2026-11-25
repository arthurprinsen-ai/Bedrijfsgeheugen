-- Bound the heavy Supabase maintenance lane so one slow refresh cannot cascade
-- into pg_cron startup timeouts and PostgREST/Supavisor pressure.

create index if not exists bg_connecties_bijgewerkt_op_desc_idx
  on public.bg_connecties (bijgewerkt_op desc nulls last)
  where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''),nullif(trim(email),'')) is not null;

CREATE OR REPLACE FUNCTION public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_contacts int:=0; v_opps int:=0; v_events int:=0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-identity-graph-maintenance-v1',0)) then
    return jsonb_build_object(
      'contract','powerhouse-identity-graph-batch-v1',
      'batch_size',p_batch_size,
      'skipped',true,
      'reason','maintenance_lock_busy',
      'executed_at',v_now
    );
  end if;

  with candidates as (
    select *
    from public.bg_connecties
    where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''),nullif(trim(email),'')) is not null
    order by bijgewerkt_op desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      coalesce(nullif(trim(sleutel),''),'person:'||md5(coalesce(nullif(lower(trim(linkedin_url)),''),nullif(lower(trim(email)),''),nullif(lower(trim(naam)),''),'unknown'))) entity_key,
      nullif(trim(sleutel),'') person_key,
      nullif(lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g')),'') company_key,
      x.identifier_type,md5(lower(trim(x.identifier_value))) identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) evidence,
      bijgewerkt_op source_updated_at
    from candidates
    cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),('email',nullif(email,'')),('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value)
    where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash)
      entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from raw order by identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select 'person',entity_key,person_key,company_key,identifier_type,identifier_hash,'bg_connecties',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_contacts=row_count;

  with recent as (
    select *
    from public.powerhouse_opportunities
    where coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) is not null
    order by updated_at desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from (
      select case when nullif(trim(person_key),'') is not null then 'person' else 'company' end entity_type,
        coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) entity_key,
        nullif(trim(person_key),'') person_key,nullif(trim(company_key),'') company_key,
        case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end identifier_type,
        md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) identifier_hash,
        least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) confidence,
        jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) evidence,
        updated_at source_updated_at
      from recent
    ) q
    order by entity_type,identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'powerhouse_opportunities',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_opps=row_count;

  with recent as (
    select *
    from public.growth_events
    where is_robot is not true
      and occurred_at>=v_now-interval '30 days'
      and coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) is not null
    order by occurred_at desc
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      case when nullif(trim(payload->>'person_key'),'') is not null then 'person' else 'company' end entity_type,
      coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) entity_key,
      nullif(trim(payload->>'person_key'),'') person_key,nullif(trim(payload->>'company_key'),'') company_key,
      case when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
           when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key' else 'attribution_root_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(payload->>'person_key',''),nullif(payload->>'company_key',''),nullif(canonical,''),attribution_root_key)))) identifier_hash,
      occurred_at,jsonb_build_object('source','growth_events','event_type',event_type) evidence
    from recent
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at,evidence
    from raw order by entity_type,identifier_type,identifier_hash,occurred_at desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'growth_events',.60,v_now,occurred_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_events=row_count;

  return jsonb_build_object('contract','powerhouse-identity-graph-batch-v1','batch_size',p_batch_size,
    'contacts_touched',v_contacts,'opportunities_touched',v_opps,'events_touched',v_events,
    'nodes',(select count(distinct entity_type||':'||entity_key) from public.powerhouse_identity_graph_v1),
    'identifiers',(select count(*) from public.powerhouse_identity_graph_v1),
    'bounded_incremental',true,'executed_at',v_now);
end $function$;

revoke all on function public.powerhouse_sync_identity_graph_batch_v1(integer) from public, anon, authenticated;
grant execute on function public.powerhouse_sync_identity_graph_batch_v1(integer) to service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
 RETURNS TABLE(row_count bigint, refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_refreshed_at timestamptz := clock_timestamp();
  v_row_count bigint := 0;
begin
  truncate table public.powerhouse_revenue_command_center_snapshot_v1;

  insert into public.powerhouse_revenue_command_center_snapshot_v1
  with base as materialized (
    select * from public.powerhouse_commercial_next_best_action_v5
  ),
  forecast_truth as (
    select b.forecast_id,
      count(f.forecast_id)::int as canonical_forecast_evidence
    from (select distinct forecast_id from base where forecast_id is not null) b
    left join public.powerhouse_forecasts f on f.forecast_id=b.forecast_id
    group by b.forecast_id
  ),
  pressure_actions as (
    select b.person_key,
      max(a.executed_at) as last_outbound_at,
      count(a.action_id) filter (where a.executed_at >= now()-interval '7 days')::int as outbound_7d
    from (select distinct person_key from base where person_key is not null) b
    left join public.powerhouse_sales_actions a on a.person_key=b.person_key
    group by b.person_key
  ),
  pressure_outcomes as (
    select b.person_key,
      count(o.outcome_id) filter (where o.occurred_at >= now()-interval '30 days' and lower(o.outcome_type)='no_response')::int as no_response_30d
    from (select distinct person_key from base where person_key is not null) b
    left join public.powerhouse_sales_outcomes o on o.person_key=b.person_key
    group by b.person_key
  ),
  pressure_inbound as (
    select b.person_key,
      max(e.occurred_at) filter (where lower(e.event_type) in ('dm_inbound','linkedin_post_replied')) as last_inbound_at
    from (select distinct person_key from base where person_key is not null) b
    left join public.powerhouse_runtime_events e on e.person_key=b.person_key and e.occurred_at>=now()-interval '30 days'
    group by b.person_key
  ),
  pressure as (
    select b.person_key,pa.last_outbound_at,coalesce(pa.outbound_7d,0) outbound_7d,coalesce(po.no_response_30d,0) no_response_30d,pi.last_inbound_at
    from (select distinct person_key from base where person_key is not null) b
    left join pressure_actions pa using(person_key)
    left join pressure_outcomes po using(person_key)
    left join pressure_inbound pi using(person_key)
  ),
  pressure_scored as (
    select p.*,
      case
        when no_response_30d>=2 and last_outbound_at is not null then last_outbound_at+interval '14 days'
        when outbound_7d>=3 and last_outbound_at is not null then last_outbound_at+interval '7 days'
        when outbound_7d>=2 and last_outbound_at is not null then last_outbound_at+interval '3 days'
        else null end as cooldown_until
    from pressure p
  ),
  channel_funnel as (
    select lower(regexp_replace(coalesce(a.channel,'unknown'),'[^a-zA-Z0-9]+','_','g')) channel_key,
      count(distinct a.action_id)::numeric actions,
      count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|offerte|qualified|won|order|revenue)')::numeric positive,
      count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(meeting|appointment)')::numeric meetings,
      count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(proposal|offerte)')::numeric proposals,
      count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(won|order|revenue)')::numeric wins
    from public.powerhouse_sales_actions a
    left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
    where a.created_at>=now()-interval '180 days'
    group by 1
  ),
  enriched as (
    select b.*,
      coalesce(ft.canonical_forecast_evidence,0) as canonical_forecast_evidence,
      case
        when coalesce(b.pending_response,false) then 'wait'
        when ps.cooldown_until>now() then 'cooldown'
        when coalesce(ps.no_response_30d,0)>=2 then 'high'
        when coalesce(ps.outbound_7d,0)>=2 then 'medium'
        else 'low' end as pressure_state_v3,
      ps.cooldown_until,
      case
        when ps.cooldown_until>now() then ps.cooldown_until
        when ps.last_outbound_at is not null and (ps.last_inbound_at is null or ps.last_inbound_at<ps.last_outbound_at) then ps.last_outbound_at+interval '5 days'
        else b.next_action_at end as next_follow_up_at_v3,
      case
        when b.person_evidence=0 then 'identity_or_person_context_missing'
        when b.company_evidence=0 then 'company_context_missing'
        when coalesce(ft.canonical_forecast_evidence,0)=0 then 'forecast_missing'
        when coalesce(b.buying_window_confidence,0)<.55 then 'low_confidence'
        when coalesce(b.evidence_density,0)<.60 then 'evidence_density_low'
        else null end as research_reason,
      array_remove(array[
        case when b.person_evidence=0 then 'person_evidence' end,
        case when b.company_evidence=0 then 'company_evidence' end,
        case when coalesce(ft.canonical_forecast_evidence,0)=0 then 'forecast_evidence' end,
        case when coalesce(b.buying_window_confidence,0)<.55 then 'prediction_confidence' end
      ],null)::text[] as missing_evidence,
      coalesce(cf.actions,0) as prediction_sample_size,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.positive,0)+2)/(coalesce(cf.actions,0)+8))) as empirical_reply_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.meetings,0)+1)/(coalesce(cf.actions,0)+12))) as empirical_meeting_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.proposals,0)+1)/(coalesce(cf.actions,0)+16))) as empirical_proposal_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.wins,0)+1)/(coalesce(cf.actions,0)+24))) as empirical_win_rate
    from base b
    left join forecast_truth ft on ft.forecast_id=b.forecast_id
    left join pressure_scored ps on ps.person_key=b.person_key
    left join channel_funnel cf on cf.channel_key=lower(regexp_replace(coalesce(b.recommended_channel,'unknown'),'[^a-zA-Z0-9]+','_','g'))
  ),
  scored as (
    select e.*,
      case when nullif(trim(e.best_context),'') is not null then concat('Actuele accountthese op basis van geobserveerde context: ',e.best_context)
           else 'Onvoldoende bewijs voor een specifieke accountthese; aanvullende research nodig.' end as account_thesis,
      case when e.buying_window_score>=.65 and e.decision_influence>=.85 then 'engage_economic_buyer'
           when e.buying_window_score>=.55 and e.relationship_warmth>=.55 then 'warm_intro_or_champion'
           when e.decision_influence<.68 then 'map_economic_buyer'
           when e.company_intent_score<.30 then 'research'
           else 'nurture' end as recommended_account_move,
      case when e.pressure_state_v3='cooldown' then 'wait'
           when e.research_reason is not null then 'research'
           when e.buying_window_score>=.55 and e.relationship_warmth>=.55 and e.known_people>1 then 'warm_intro_request'
           when e.recommended_channel='linkedin_dm' then 'linkedin_dm'
           when e.recommended_channel='email' then 'email'
           when e.recommended_channel='linkedin_comment' then 'linkedin_comment'
           else 'research' end as recommended_action,
      least(.98::numeric,greatest(.01::numeric,e.empirical_reply_rate*(.60+.40*e.commercial_progression_probability))) as prediction_reply,
      least(.98::numeric,greatest(.005::numeric,least(e.empirical_reply_rate,e.empirical_meeting_rate*(.65+.35*e.commercial_progression_probability)))) as prediction_meeting,
      least(.95::numeric,greatest(.002::numeric,least(e.empirical_meeting_rate,e.empirical_proposal_rate*(.65+.35*e.commercial_progression_probability)))) as prediction_proposal,
      least(.90::numeric,greatest(.001::numeric,least(e.empirical_proposal_rate,e.empirical_win_rate*(.65+.35*e.commercial_progression_probability)))) as prediction_win,
      least(1::numeric,greatest(.15::numeric,coalesce(e.buying_window_confidence,0)*least(1::numeric,(e.prediction_sample_size+5)/25))) as prediction_confidence
    from enriched e
  ),
  ranked as (
    select row_number() over(order by (coalesce(s.expected_commercial_value_eur,0)*coalesce(s.action_confidence,.25)) desc, coalesce(s.buying_window_score,0) desc) as revenue_rank,
      s.*
    from scored s
  )
  select
    r.revenue_rank,r.opportunity_key,r.person_key,r.company_key,r.person_name,r.role,r.best_context as why_now,
    r.account_thesis,r.recommended_account_move,r.recommended_action,r.recommended_channel,r.message_strategy,
    case when r.asset_ready then r.recommended_asset else 'none' end as effective_recommended_asset,
    case when r.asset_ready then r.recommended_asset_reference else null end as verified_asset_reference,
    r.recommended_cta,r.pressure_state_v3 as pressure_state,r.cooldown_until,r.next_follow_up_at_v3,
    r.prediction_reply,r.prediction_meeting,r.prediction_proposal,r.prediction_win,r.prediction_confidence,
    'nba-v3-empirical-smoothed-snapshot-v2'::text,r.prediction_sample_size,r.expected_commercial_value_eur,r.action_confidence,
    r.buying_window_score,r.buying_window_confidence,r.evidence_density,r.research_reason,r.missing_evidence,
    (r.person_key is null or nullif(trim(r.person_key),'') is null) as identity_conflict,
    (r.recommended_action in ('linkedin_dm','email','warm_intro_request') and r.forecast_id is null) as structural_lineage_gap,
    jsonb_build_object(
      'source','powerhouse-revenue-intelligence-loop-v1',
      'forecast_id',r.forecast_id,
      'canonical_forecast_evidence',r.canonical_forecast_evidence,
      'asset_ready',r.asset_ready,
      'pressure_state',r.pressure_state_v3,
      'pending_response',coalesce(r.pending_response,false),
      'research_reason',r.research_reason,
      'prediction_basis','empirical-smoothed observed action/outcome lineage'
    ) as command_evidence,
    v_refreshed_at
  from ranked r;

  get diagnostics v_row_count = row_count;
  return query select v_row_count, v_refreshed_at;
end;
$function$;

revoke all on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() to service_role;

do $scheduler$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-identity-graph-v1';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid, schedule := '2,32 * * * *', command := 'select public.powerhouse_sync_identity_graph_batch_v1(100);');
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-revenue-intelligence-snapshot-15m';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid, schedule := '7,22,37,52 * * * *');
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-one-brain-reconcile-v1';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid, schedule := '12,42 * * * *');
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-loop-assurance-v2';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid, schedule := '17,47 * * * *');
  end if;
end
$scheduler$;
