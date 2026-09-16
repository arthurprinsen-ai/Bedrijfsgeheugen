-- powerhouse-observability-outcome-calibration-closure-v1
-- Evidence-only projections and truth hardening. Existing stores remain authoritative.

create or replace function public.powerhouse_record_outcome(
  p_action_id uuid,
  p_dedupe_key text,
  p_outcome_type text,
  p_evidence jsonb default '{}'::jsonb,
  p_revenue_eur numeric default null
)
returns public.powerhouse_sales_outcomes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_action public.powerhouse_sales_actions;
  v_outcome public.powerhouse_sales_outcomes;
  v_type text := lower(btrim(coalesce(p_outcome_type,'')));
begin
  if nullif(btrim(p_dedupe_key),'') is null then raise exception 'DEDUPE_KEY_REQUIRED'; end if;
  if v_type = '' then raise exception 'OUTCOME_TYPE_REQUIRED'; end if;
  if p_revenue_eur is not null and p_revenue_eur < 0 then raise exception 'REVENUE_MUST_BE_NONNEGATIVE'; end if;
  if p_revenue_eur is not null and v_type not in ('won','closed_won','order','won_order','realized_revenue') then
    raise exception 'revenue not allowed for proposal or non-realized outcome';
  end if;
  if p_revenue_eur is not null and coalesce(p_evidence,'{}'::jsonb) = '{}'::jsonb then
    raise exception 'REVENUE_SOURCE_EVIDENCE_REQUIRED';
  end if;
  if v_type in ('no_response','no_reply') and coalesce((p_evidence->>'observation_window_closed')::boolean,false) is not true then
    raise exception 'NO_RESPONSE_REQUIRES_CLOSED_OBSERVATION_WINDOW';
  end if;

  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
  if not found then raise exception 'ACTION_NOT_FOUND'; end if;

  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,
    content_key,topic_key,campaign_key,opportunity_key,channel,revenue_eur,evidence
  ) values(
    v_action.action_id,p_dedupe_key,v_type,v_action.subject_key,v_action.person_key,v_action.company_key,
    v_action.content_key,v_action.topic_key,v_action.campaign_key,v_action.opportunity_key,v_action.channel,
    p_revenue_eur,coalesce(p_evidence,'{}'::jsonb)
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,
    revenue_eur=excluded.revenue_eur,
    outcome_type=excluded.outcome_type
  returning * into v_outcome;

  update public.powerhouse_sales_actions
  set outcome_id=v_outcome.outcome_id,
      status=case when v_type in ('waiting','no_response','no_reply') then 'waiting' else 'done' end,
      executed_at=coalesce(executed_at,now()),
      updated_at=now()
  where action_id=v_action.action_id;

  if v_action.opportunity_key is not null then
    update public.powerhouse_opportunities
    set evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
          'last_sales_outcome', jsonb_build_object(
            'outcome_id',v_outcome.outcome_id,
            'action_id',v_action.action_id,
            'outcome_type',v_type,
            'channel',v_action.channel,
            'revenue_eur',p_revenue_eur,
            'occurred_at',v_outcome.occurred_at,
            'evidence',coalesce(p_evidence,'{}'::jsonb)
          )
        ),
        last_action_at=coalesce(v_outcome.occurred_at,now()),
        last_evidence_at=coalesce(v_outcome.occurred_at,now()),
        updated_at=now()
    where opportunity_key=v_action.opportunity_key;
  end if;

  if v_action.event_id is not null then
    update public.powerhouse_runtime_events set state='closed',updated_at=now() where event_id=v_action.event_id;
  end if;

  return v_outcome;
end;
$function$;

revoke all on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) from public, anon, authenticated;
grant execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) to service_role;

create or replace view public.powerhouse_action_evidence_maturity_v1
with (security_invoker = true)
as
with constants as (
  select 5::bigint as minimum_comparable_outcomes
),
forecast_calibration as (
  select
    fc.forecast_id,
    count(*)::bigint as calibration_observations,
    max(fc.measured_at) as latest_calibration_at,
    avg(abs(fc.probability_error)) filter (where fc.probability_error is not null) as mean_absolute_probability_error
  from public.powerhouse_forecast_calibration fc
  group by fc.forecast_id
),
human_feedback as (
  select
    hf.action_id,
    count(*)::bigint as human_feedback_observations,
    max(hf.observed_at) as latest_human_feedback_at,
    array_agg(distinct hf.feedback_type order by hf.feedback_type) as human_feedback_types
  from public.powerhouse_human_feedback_events hf
  where hf.action_id is not null
  group by hf.action_id
),
base as (
  select
    bv.*,
    nba.forecast_id,
    coalesce(cal.calibration_observations, 0::bigint) as calibration_observations,
    cal.latest_calibration_at,
    cal.mean_absolute_probability_error,
    coalesce(hf.human_feedback_observations, 0::bigint) as human_feedback_observations,
    hf.latest_human_feedback_at,
    coalesce(hf.human_feedback_types, array[]::text[]) as human_feedback_types,
    case
      when coalesce(bv.resource_observations, 0) = 0 then 'unknown'
      when cardinality(coalesce(bv.tenant_ids, array[]::text[])) = 1 then 'measured'
      else 'partial'
    end as resource_evidence_status,
    case
      when coalesce(bv.economics_observations, 0) = 0 then 'unknown'
      when bv.observed_cost_eur is not null then 'measured'
      else 'partial'
    end as economics_evidence_status,
    case
      when coalesce(bv.outcome_observations, 0) = 0 then 'unknown'
      else 'measured'
    end as outcome_evidence_status,
    case
      when nba.forecast_id is null then 'unknown'
      when coalesce(cal.calibration_observations, 0) > 0 then 'measured'
      else 'partial'
    end as forecast_evidence_status
  from public.powerhouse_action_business_value_v1 bv
  left join public.powerhouse_commercial_next_best_action_v4 nba
    on nba.opportunity_key = bv.opportunity_key
  left join forecast_calibration cal
    on cal.forecast_id = nba.forecast_id
  left join human_feedback hf
    on hf.action_id = bv.action_id
),
channel_counts as (
  select
    channel,
    count(*) filter (
      where forecast_evidence_status = 'measured'
        and outcome_evidence_status = 'measured'
    )::bigint as comparable_outcomes
  from base
  group by channel
)
select
  b.*,
  c.minimum_comparable_outcomes,
  coalesce(cc.comparable_outcomes, 0::bigint) as comparable_outcomes,
  case
    when b.resource_evidence_status = 'measured'
     and b.economics_evidence_status = 'measured'
     and b.outcome_evidence_status = 'measured'
     and b.forecast_evidence_status = 'measured' then 'measured'
    when b.resource_evidence_status <> 'unknown'
      or b.economics_evidence_status <> 'unknown'
      or b.outcome_evidence_status <> 'unknown'
      or b.forecast_evidence_status <> 'unknown'
      or b.human_feedback_observations > 0 then 'partial'
    else 'unknown'
  end as evidence_maturity,
  case
    when b.forecast_evidence_status <> 'measured' then false
    when b.outcome_evidence_status <> 'measured' then false
    when coalesce(cc.comparable_outcomes, 0) < c.minimum_comparable_outcomes then false
    else true
  end as calibration_eligible,
  case
    when b.forecast_evidence_status = 'unknown' then 'missing_pre_action_forecast'
    when b.forecast_evidence_status = 'partial' then 'forecast_not_calibrated'
    when b.outcome_evidence_status <> 'measured' then 'missing_observed_outcome'
    when coalesce(cc.comparable_outcomes, 0) < c.minimum_comparable_outcomes then 'insufficient_comparable_outcomes'
    else 'eligible'
  end as calibration_eligibility_reason,
  case
    when b.observed_cost_eur is null then null
    when b.realized_revenue_eur is null then null
    else b.realized_revenue_eur - b.observed_cost_eur
  end as verified_net_realized_value_eur,
  case
    when b.observed_cost_eur is null or b.observed_cost_eur <= 0 then null
    when b.realized_revenue_eur is null then null
    else (b.realized_revenue_eur - b.observed_cost_eur) / b.observed_cost_eur
  end as verified_roi_ratio
from base b
cross join constants c
left join channel_counts cc on cc.channel = b.channel;

alter view public.powerhouse_action_evidence_maturity_v1 set (security_invoker = true);
revoke all on public.powerhouse_action_evidence_maturity_v1 from public, anon, authenticated;
grant select on public.powerhouse_action_evidence_maturity_v1 to service_role;

create or replace view public.powerhouse_commercial_next_best_action_v5
with (security_invoker = true)
as
with constants as (
  select 5::bigint as minimum_comparable_outcomes
),
channel_evidence as (
  select
    channel,
    count(*) filter (where calibration_eligible)::bigint as calibration_eligible_actions,
    count(*) filter (where forecast_evidence_status = 'measured' and outcome_evidence_status = 'measured')::bigint as comparable_outcomes,
    count(*) filter (where resource_evidence_status = 'measured')::bigint as measured_resource_actions,
    count(*) filter (where economics_evidence_status = 'measured')::bigint as measured_economics_actions,
    count(*) filter (where outcome_evidence_status = 'measured')::bigint as measured_outcome_actions,
    sum(human_feedback_observations)::bigint as human_feedback_observations
  from public.powerhouse_action_evidence_maturity_v1
  group by channel
)
select
  nba.*,
  c.minimum_comparable_outcomes,
  coalesce(e.comparable_outcomes, 0::bigint) as comparable_outcomes,
  coalesce(e.calibration_eligible_actions, 0::bigint) as calibration_eligible_actions,
  coalesce(e.measured_resource_actions, 0::bigint) as measured_resource_actions,
  coalesce(e.measured_economics_actions, 0::bigint) as measured_economics_actions,
  coalesce(e.measured_outcome_actions, 0::bigint) as measured_outcome_actions,
  coalesce(e.human_feedback_observations, 0::bigint) as human_feedback_observations,
  case
    when coalesce(e.comparable_outcomes, 0) < c.minimum_comparable_outcomes then null
    when coalesce(e.measured_resource_actions, 0) < c.minimum_comparable_outcomes then null
    else nba.cost_efficiency_evidence
  end as cost_resource_efficiency_evidence,
  case
    when coalesce(e.comparable_outcomes, 0) < c.minimum_comparable_outcomes then 'insufficient_comparable_outcomes'
    when coalesce(e.measured_resource_actions, 0) < c.minimum_comparable_outcomes then 'insufficient_resource_evidence'
    when nba.business_efficiency_evidence_status <> 'observed' then nba.business_efficiency_evidence_status
    else 'observed_evidence_ready'
  end as evidence_gated_business_efficiency_status
from public.powerhouse_commercial_next_best_action_v4 nba
cross join constants c
left join channel_evidence e on e.channel = nba.recommended_channel;

alter view public.powerhouse_commercial_next_best_action_v5 set (security_invoker = true);
revoke all on public.powerhouse_commercial_next_best_action_v5 from public, anon, authenticated;
grant select on public.powerhouse_commercial_next_best_action_v5 to service_role;
