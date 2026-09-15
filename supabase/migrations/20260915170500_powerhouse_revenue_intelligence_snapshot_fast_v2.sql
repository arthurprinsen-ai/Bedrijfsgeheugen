drop function if exists public.powerhouse_refresh_revenue_intelligence_snapshot_v1();
drop table if exists public.powerhouse_revenue_command_center_snapshot_v1;

create table public.powerhouse_revenue_command_center_snapshot_v1 (
  revenue_rank bigint,
  opportunity_key text,
  person_key text,
  company_key text,
  person_name text,
  role text,
  why_now text,
  account_thesis text,
  recommended_account_move text,
  recommended_action text,
  recommended_channel text,
  message_strategy text,
  effective_recommended_asset text,
  verified_asset_reference text,
  recommended_cta text,
  pressure_state text,
  cooldown_until timestamptz,
  next_follow_up_at timestamptz,
  prediction_reply numeric,
  prediction_meeting numeric,
  prediction_proposal numeric,
  prediction_win numeric,
  prediction_confidence numeric,
  prediction_model_version text,
  prediction_sample_size numeric,
  expected_commercial_value_eur numeric,
  action_confidence numeric,
  buying_window_score numeric,
  buying_window_confidence numeric,
  evidence_density numeric,
  research_reason text,
  missing_evidence text[],
  identity_conflict boolean,
  structural_lineage_gap boolean,
  command_evidence jsonb,
  refreshed_at timestamptz not null
);

create index powerhouse_revenue_command_center_snapshot_rank_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (revenue_rank);
create index powerhouse_revenue_command_center_snapshot_opportunity_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (opportunity_key);
create index powerhouse_revenue_command_center_snapshot_person_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (person_key);
create index powerhouse_revenue_command_center_snapshot_company_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (company_key);
create index powerhouse_revenue_command_center_snapshot_research_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (research_reason);
create index powerhouse_revenue_command_center_snapshot_refreshed_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (refreshed_at desc);

alter table public.powerhouse_revenue_command_center_snapshot_v1 enable row level security;
revoke all on table public.powerhouse_revenue_command_center_snapshot_v1 from public, anon, authenticated;
grant select on table public.powerhouse_revenue_command_center_snapshot_v1 to service_role;

create or replace function public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
returns table(row_count bigint, refreshed_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_refreshed_at timestamptz := clock_timestamp();
  v_row_count bigint := 0;
begin
  truncate table public.powerhouse_revenue_command_center_snapshot_v1;

  insert into public.powerhouse_revenue_command_center_snapshot_v1
  with base as materialized (
    select * from public.powerhouse_commercial_next_best_action_v2
  ),
  pressure as (
    select b.person_key,
      max(a.executed_at) as last_outbound_at,
      count(a.action_id) filter (where a.executed_at >= now()-interval '7 days')::int as outbound_7d,
      count(o.outcome_id) filter (where o.occurred_at >= now()-interval '30 days' and lower(o.outcome_type)='no_response')::int as no_response_30d,
      max(e.occurred_at) filter (where lower(e.event_type) in ('dm_inbound','linkedin_post_replied')) as last_inbound_at
    from (select distinct person_key from base where person_key is not null) b
    left join public.powerhouse_sales_actions a on a.person_key=b.person_key
    left join public.powerhouse_sales_outcomes o on o.person_key=b.person_key
    left join public.powerhouse_runtime_events e on e.person_key=b.person_key and e.occurred_at>=now()-interval '30 days'
    group by b.person_key
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
      case
        when ps.cooldown_until>now() then 'cooldown'
        when coalesce(ps.no_response_30d,0)>=2 then 'high'
        when coalesce(ps.outbound_7d,0)>=2 then 'medium'
        else 'low' end as pressure_state,
      ps.cooldown_until,
      case
        when ps.cooldown_until>now() then ps.cooldown_until
        when ps.last_outbound_at is not null and (ps.last_inbound_at is null or ps.last_inbound_at<ps.last_outbound_at) then ps.last_outbound_at+interval '5 days'
        else b.next_action_at end as next_follow_up_at_v3,
      case
        when b.person_evidence=0 then 'identity_or_person_context_missing'
        when b.company_evidence=0 then 'company_context_missing'
        when b.forecast_evidence=0 then 'forecast_missing'
        when coalesce(b.buying_window_confidence,0)<.55 then 'low_confidence'
        when coalesce(b.evidence_density,0)<.60 then 'evidence_density_low'
        else null end as research_reason,
      array_remove(array[
        case when b.person_evidence=0 then 'person_evidence' end,
        case when b.company_evidence=0 then 'company_evidence' end,
        case when b.forecast_evidence=0 then 'forecast_evidence' end,
        case when coalesce(b.buying_window_confidence,0)<.55 then 'prediction_confidence' end
      ],null)::text[] as missing_evidence,
      coalesce(cf.actions,0) as prediction_sample_size,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.positive,0)+2)/(coalesce(cf.actions,0)+8))) as empirical_reply_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.meetings,0)+1)/(coalesce(cf.actions,0)+12))) as empirical_meeting_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.proposals,0)+1)/(coalesce(cf.actions,0)+16))) as empirical_proposal_rate,
      least(1::numeric,greatest(0::numeric,(coalesce(cf.wins,0)+1)/(coalesce(cf.actions,0)+24))) as empirical_win_rate
    from base b
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
      case when e.pressure_state='cooldown' then 'wait'
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
    r.recommended_cta,r.pressure_state,r.cooldown_until,r.next_follow_up_at_v3,
    r.prediction_reply,r.prediction_meeting,r.prediction_proposal,r.prediction_win,r.prediction_confidence,
    'nba-v3-empirical-smoothed-snapshot-v2'::text,r.prediction_sample_size,r.expected_commercial_value_eur,r.action_confidence,
    r.buying_window_score,r.buying_window_confidence,r.evidence_density,r.research_reason,r.missing_evidence,
    (r.person_key is null or nullif(trim(r.person_key),'') is null) as identity_conflict,
    (r.recommended_action in ('linkedin_dm','email','warm_intro_request') and r.forecast_id is null) as structural_lineage_gap,
    jsonb_build_object(
      'source','powerhouse-revenue-intelligence-loop-v1',
      'forecast_id',r.forecast_id,
      'asset_ready',r.asset_ready,
      'pressure_state',r.pressure_state,
      'research_reason',r.research_reason,
      'prediction_basis','empirical-smoothed observed action/outcome lineage'
    ) as command_evidence,
    v_refreshed_at
  from ranked r;

  get diagnostics v_row_count = row_count;
  return query select v_row_count, v_refreshed_at;
end;
$$;

revoke all on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() to service_role;

-- The existing 15-minute cron job keeps calling this same function name.
