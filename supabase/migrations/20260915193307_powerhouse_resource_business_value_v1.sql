-- powerhouse-resource-business-value-v1
-- Close the existing resource -> economics -> outcome evidence chain without a parallel ledger.

create or replace view public.powerhouse_action_business_value_v1
with (security_invoker = true)
as
with attributed_usage as (
  select
    case
      when nullif(u.metadata ->> 'action_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (u.metadata ->> 'action_id')::uuid
      else null
    end as action_id,
    i.usage_id,
    i.tenant_id,
    i.resource_type,
    i.unit,
    i.amount,
    i.calculation_status,
    i.energy_kwh,
    i.co2e_kg,
    i.water_liters,
    i.occurred_at
  from public.brain_budget_usage u
  join public.powerhouse_resource_impact_v1 i on i.usage_id = u.usage_id
),
usage_by_action as (
  select
    action_id,
    count(*) as resource_observations,
    count(*) filter (where calculation_status = 'calculated') as calculated_impact_observations,
    sum(energy_kwh) filter (where energy_kwh is not null) as energy_kwh,
    sum(co2e_kg) filter (where co2e_kg is not null) as co2e_kg,
    sum(water_liters) filter (where water_liters is not null) as water_liters,
    array_agg(distinct tenant_id order by tenant_id) as tenant_ids,
    max(occurred_at) as latest_resource_observed_at
  from attributed_usage
  where action_id is not null
  group by action_id
),
economics_by_action as (
  select
    action_id,
    count(*) as economics_observations,
    sum(provider_cost_eur) filter (where provider_cost_eur is not null) as provider_cost_eur,
    sum(external_cost_eur) filter (where external_cost_eur is not null) as external_cost_eur,
    sum(human_minutes) filter (where human_minutes is not null) as human_minutes,
    max(observed_at) as latest_economics_observed_at
  from public.powerhouse_action_economics
  group by action_id
),
outcomes_by_action as (
  select
    action_id,
    count(*) as outcome_observations,
    sum(revenue_eur) as realized_revenue_eur,
    max(occurred_at) as latest_outcome_observed_at
  from public.powerhouse_sales_outcomes
  where action_id is not null
  group by action_id
),
base as (
  select
    a.action_id,
    a.dedupe_key,
    a.opportunity_key,
    a.subject_key,
    a.person_key,
    a.company_key,
    a.action_type,
    a.channel,
    a.status,
    a.expected_value_eur,
    o.expected_revenue_value as opportunity_expected_revenue_value,
    o.probability as opportunity_probability,
    o.confidence as opportunity_confidence,
    coalesce(r.resource_observations, 0) as resource_observations,
    coalesce(r.calculated_impact_observations, 0) as calculated_impact_observations,
    r.energy_kwh,
    r.co2e_kg,
    r.water_liters,
    r.tenant_ids,
    r.latest_resource_observed_at,
    coalesce(e.economics_observations, 0) as economics_observations,
    e.provider_cost_eur,
    e.external_cost_eur,
    e.human_minutes,
    e.latest_economics_observed_at,
    coalesce(y.outcome_observations, 0) as outcome_observations,
    y.realized_revenue_eur,
    y.latest_outcome_observed_at
  from public.powerhouse_sales_actions a
  left join public.powerhouse_opportunities o on o.opportunity_key = a.opportunity_key
  left join usage_by_action r on r.action_id = a.action_id
  left join economics_by_action e on e.action_id = a.action_id
  left join outcomes_by_action y on y.action_id = a.action_id
),
valued as (
  select
    b.*,
    case
      when economics_observations > 0 then
        case
          when provider_cost_eur is not null or external_cost_eur is not null
            then coalesce(provider_cost_eur, 0) + coalesce(external_cost_eur, 0)
          else null
        end
      else null
    end as observed_cost_eur,
    case
      when resource_observations > 0
        then calculated_impact_observations::numeric / resource_observations::numeric
      else null
    end as environmental_factor_coverage
  from base b
)
select
  v.*,
  case
    when realized_revenue_eur is not null and observed_cost_eur is not null
      then realized_revenue_eur - observed_cost_eur
    else null
  end as realized_net_value_eur,
  case
    when realized_revenue_eur is not null and observed_cost_eur > 0
      then (realized_revenue_eur - observed_cost_eur) / observed_cost_eur
    else null
  end as realized_roi,
  case
    when resource_observations = 0 then 'no_resource_evidence'
    when cardinality(tenant_ids) > 1 then 'ambiguous_tenant_attribution'
    when economics_observations = 0 then 'cost_unknown'
    when observed_cost_eur is null then 'cost_unknown'
    when outcome_observations = 0 then 'outcome_unobserved'
    else 'measured'
  end as business_value_status
from valued v;

create or replace view public.powerhouse_portal_resource_summary_v2
with (security_invoker = true)
as
with resource_base as (
  select
    i.tenant_id,
    i.usage_id,
    i.energy_kwh,
    i.co2e_kg,
    i.water_liters,
    i.calculation_status,
    i.occurred_at,
    case
      when nullif(u.metadata ->> 'action_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (u.metadata ->> 'action_id')::uuid
      else null
    end as action_id
  from public.powerhouse_resource_impact_v1 i
  join public.brain_budget_usage u on u.usage_id = i.usage_id
),
resource_summary as (
  select
    tenant_id,
    count(*) as observations,
    count(*) filter (where calculation_status = 'calculated') as calculated_impact_observations,
    count(*) filter (where action_id is not null) as attributed_action_observations,
    sum(energy_kwh) filter (where energy_kwh is not null) as energy_kwh,
    sum(co2e_kg) filter (where co2e_kg is not null) as co2e_kg,
    sum(water_liters) filter (where water_liters is not null) as water_liters,
    max(occurred_at) as latest_observed_at
  from resource_base
  group by tenant_id
),
tenant_action_candidates as (
  select
    action_id,
    min(tenant_id) as tenant_id
  from resource_base
  where action_id is not null
  group by action_id
  having count(distinct tenant_id) = 1
),
action_summary as (
  select
    t.tenant_id,
    count(*) as attributed_actions,
    count(*) filter (where v.observed_cost_eur is not null) as cost_observed_actions,
    count(*) filter (where v.realized_revenue_eur is not null) as revenue_observed_actions,
    sum(v.observed_cost_eur) filter (where v.observed_cost_eur is not null) as observed_cost_eur,
    sum(v.realized_revenue_eur) filter (where v.realized_revenue_eur is not null) as realized_revenue_eur
  from tenant_action_candidates t
  join public.powerhouse_action_business_value_v1 v on v.action_id = t.action_id
  group by t.tenant_id
)
select
  r.tenant_id,
  r.observations,
  r.calculated_impact_observations,
  r.attributed_action_observations,
  case when r.observations > 0
    then r.calculated_impact_observations::numeric / r.observations::numeric
    else null
  end as environmental_factor_coverage,
  case when r.observations > 0
    then r.attributed_action_observations::numeric / r.observations::numeric
    else null
  end as action_attribution_coverage,
  r.energy_kwh,
  r.co2e_kg,
  r.water_liters,
  a.attributed_actions,
  a.cost_observed_actions,
  a.revenue_observed_actions,
  a.observed_cost_eur,
  a.realized_revenue_eur,
  case
    when a.realized_revenue_eur is not null and a.observed_cost_eur > 0
      then (a.realized_revenue_eur - a.observed_cost_eur) / a.observed_cost_eur
    else null
  end as realized_roi,
  r.latest_observed_at
from resource_summary r
left join action_summary a on a.tenant_id = r.tenant_id;

create or replace view public.powerhouse_commercial_next_best_action_v4
with (security_invoker = true)
as
with channel_economics as (
  select
    channel,
    count(*) filter (
      where economics_observations > 0 or outcome_observations > 0 or resource_observations > 0
    ) as business_evidence_actions,
    count(*) filter (where observed_cost_eur is not null) as cost_observed_actions,
    count(*) filter (where realized_revenue_eur is not null) as revenue_observed_actions,
    sum(observed_cost_eur) filter (where observed_cost_eur is not null) as observed_cost_eur,
    sum(realized_revenue_eur) filter (where realized_revenue_eur is not null) as realized_revenue_eur,
    avg(environmental_factor_coverage) filter (where environmental_factor_coverage is not null) as environmental_factor_coverage
  from public.powerhouse_action_business_value_v1
  group by channel
),
efficiency as (
  select
    c.*,
    case
      when cost_observed_actions >= 3
       and revenue_observed_actions >= 3
       and observed_cost_eur > 0
       and realized_revenue_eur is not null
        then least(1::numeric, greatest(0::numeric,
          realized_revenue_eur / nullif(realized_revenue_eur + observed_cost_eur, 0)
        ))
      else null
    end as cost_efficiency_evidence
  from channel_economics c
)
select
  n.*,
  coalesce(e.business_evidence_actions, 0) as business_evidence_actions,
  coalesce(e.cost_observed_actions, 0) as cost_observed_actions,
  coalesce(e.revenue_observed_actions, 0) as revenue_observed_actions,
  e.observed_cost_eur as historical_observed_cost_eur,
  e.realized_revenue_eur as historical_realized_revenue_eur,
  e.environmental_factor_coverage as historical_environmental_factor_coverage,
  case
    when e.business_evidence_actions > 0 then e.cost_efficiency_evidence
    else null
  end as cost_efficiency_evidence,
  case
    when e.business_evidence_actions > 0 then 'observed'
    else 'unknown'
  end as business_efficiency_evidence_status
from public.powerhouse_commercial_next_best_action_v3 n
left join efficiency e on lower(e.channel) = lower(n.recommended_channel);

alter view public.powerhouse_action_business_value_v1 set (security_invoker = true);
alter view public.powerhouse_portal_resource_summary_v2 set (security_invoker = true);
alter view public.powerhouse_commercial_next_best_action_v4 set (security_invoker = true);

revoke all on public.powerhouse_action_business_value_v1 from public, anon, authenticated;
revoke all on public.powerhouse_portal_resource_summary_v2 from public, anon, authenticated;
revoke all on public.powerhouse_commercial_next_best_action_v4 from public, anon, authenticated;

grant select on public.powerhouse_action_business_value_v1 to service_role;
grant select on public.powerhouse_portal_resource_summary_v2 to service_role;
grant select on public.powerhouse_commercial_next_best_action_v4 to service_role;
