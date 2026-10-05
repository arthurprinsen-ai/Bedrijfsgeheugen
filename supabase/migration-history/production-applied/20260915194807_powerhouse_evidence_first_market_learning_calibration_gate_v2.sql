-- Powerhouse Evidence-First Market Learning Calibration Gate v2
-- Prevent legacy experiment/action observations from being promoted to proven
-- until prospective assignment, matured treatment/holdout, observed economics,
-- observed market outcomes and calibration evidence are all present.

create or replace view public.powerhouse_experiment_learning_v2 as
with action_rollup as (
  select
    a.campaign_key,
    count(distinct a.action_id)::integer as executed_actions,
    count(distinct o.outcome_id)::integer as observed_outcomes,
    count(distinct o.outcome_id) filter (
      where lower(o.outcome_type) ~ '(meeting|appointment|proposal|offerte|won|order|revenue)'
    )::integer as commercial_outcomes,
    coalesce(sum(o.revenue_eur), 0::numeric) as realized_revenue_eur
  from public.powerhouse_sales_actions a
  left join public.powerhouse_sales_outcomes o on o.action_id = a.action_id
  where a.campaign_key is not null
  group by a.campaign_key
), assignment_rollup as (
  select
    a.experiment_key,
    count(*)::integer as prospective_assignment_count,
    count(*) filter (where a.assignment_arm = 'treatment')::integer as treatment_assignments,
    count(*) filter (where a.assignment_arm = 'holdout')::integer as holdout_assignments,
    count(*) filter (where a.assignment_arm = 'treatment' and a.measurement_horizon_end <= now())::integer as matured_treatment,
    count(*) filter (where a.assignment_arm = 'holdout' and a.measurement_horizon_end <= now())::integer as matured_holdout,
    count(*) filter (where a.treatment_action_id is not null)::integer as linked_treatment_actions,
    count(*) filter (
      where a.treatment_action_id is not null
        and (ae.provider_cost_eur is not null or ae.external_cost_eur is not null or ae.human_minutes is not null)
    )::integer as actions_with_observed_economics,
    case
      when count(*) filter (where a.treatment_action_id is not null) = 0 then 0::numeric
      else round(
        count(*) filter (
          where a.treatment_action_id is not null
            and (ae.provider_cost_eur is not null or ae.external_cost_eur is not null or ae.human_minutes is not null)
        )::numeric
        / count(*) filter (where a.treatment_action_id is not null)::numeric,
        4
      )
    end as economics_coverage,
    count(distinct o.outcome_id) filter (
      where a.measurement_horizon_end <= now()
        and o.occurred_at >= a.assigned_at
        and o.occurred_at <= a.measurement_horizon_end
    )::integer as matured_market_outcomes,
    count(distinct fc.calibration_id)::integer as calibration_samples
  from public.powerhouse_experiment_assignments a
  left join public.powerhouse_action_economics ae
    on ae.action_id = a.treatment_action_id
  left join public.powerhouse_sales_outcomes o
    on o.opportunity_key is not distinct from a.opportunity_key
   and o.occurred_at >= a.assigned_at
   and o.occurred_at <= a.measurement_horizon_end
  left join public.powerhouse_forecasts f
    on f.scope_key is not distinct from a.opportunity_key
   and f.created_at >= a.assigned_at
   and f.created_at <= a.measurement_horizon_end
  left join public.powerhouse_forecast_calibration fc
    on fc.forecast_id = f.forecast_id
  group by a.experiment_key
), evidence_gate as (
  select
    r.experiment_key,
    r.treatment_assignments,
    r.holdout_assignments,
    r.matured_treatment,
    r.matured_holdout,
    r.assignment_before_treatment,
    r.causal_status,
    r.readiness_reason,
    coalesce(ar.prospective_assignment_count, 0) as prospective_assignment_count,
    coalesce(ar.linked_treatment_actions, 0) as linked_treatment_actions,
    coalesce(ar.actions_with_observed_economics, 0) as actions_with_observed_economics,
    coalesce(ar.economics_coverage, 0::numeric) as economics_coverage,
    coalesce(ar.matured_market_outcomes, 0) as matured_market_outcomes,
    coalesce(ar.calibration_samples, 0) as calibration_samples,
    (
      r.assignment_before_treatment is true
      and r.causal_status = 'ready_for_estimation'
      and r.matured_treatment >= 10
      and r.matured_holdout >= 10
      and coalesce(ar.linked_treatment_actions, 0) > 0
      and coalesce(ar.economics_coverage, 0::numeric) = 1::numeric
      and coalesce(ar.matured_market_outcomes, 0) > 0
      and coalesce(ar.calibration_samples, 0) > 0
    ) as promotion_eligible
  from public.powerhouse_causal_experiment_readiness_v1 r
  left join assignment_rollup ar on ar.experiment_key = r.experiment_key
)
select
  e.tenant_id,
  e.experiment_id,
  e.hypothesis,
  e.primary_metric,
  e.comparison_scope,
  e.started_at,
  e.ended_at,
  e.status,
  e.created_at,
  e.updated_at,
  e.recipe,
  e.source_signals,
  e.commercial_hypothesis,
  e.target_channels,
  e.calendar_date,
  e.onderdeel,
  e.pagina,
  e.controle,
  e.variant,
  e.meetpunt,
  e.min_steekproef,
  e.looptijd_dagen,
  e.beslisdatum,
  e.basislijn,
  e.resultaat,
  e.advies,
  e.besluit,
  e.besloten_op,
  e.learning_id,
  e.voorgesteld_door,
  e.onderbouwing,
  coalesce(a.executed_actions, 0) as executed_actions,
  coalesce(a.observed_outcomes, 0) as observed_outcomes,
  coalesce(a.commercial_outcomes, 0) as commercial_outcomes,
  coalesce(a.realized_revenue_eur, 0::numeric) as realized_revenue_eur,
  case
    when coalesce(g.promotion_eligible, false)
      and coalesce(a.commercial_outcomes, 0) >= 2
      and coalesce(a.executed_actions, 0) >= greatest(coalesce(e.min_steekproef, 10), 10)
      then 'proven'
    when coalesce(g.promotion_eligible, false)
      and coalesce(a.commercial_outcomes, 0) = 0
      then 'not_proven'
    when coalesce(g.promotion_eligible, false)
      then 'testing'
    else 'insufficient_evidence'
  end as promotion_status,
  coalesce(g.prospective_assignment_count, 0) as prospective_assignment_count,
  coalesce(g.treatment_assignments, 0) as treatment_assignments,
  coalesce(g.holdout_assignments, 0) as holdout_assignments,
  coalesce(g.matured_treatment, 0) as matured_treatment,
  coalesce(g.matured_holdout, 0) as matured_holdout,
  coalesce(g.assignment_before_treatment, false) as assignment_before_treatment,
  coalesce(g.causal_status, 'insufficient_evidence') as causal_status,
  coalesce(g.readiness_reason, 'no_persisted_prospective_assignment') as readiness_reason,
  coalesce(g.linked_treatment_actions, 0) as linked_treatment_actions,
  coalesce(g.actions_with_observed_economics, 0) as actions_with_observed_economics,
  coalesce(g.economics_coverage, 0::numeric) as economics_coverage,
  coalesce(g.matured_market_outcomes, 0) as matured_market_outcomes,
  coalesce(g.calibration_samples, 0) as calibration_samples,
  coalesce(g.promotion_eligible, false) as promotion_eligible
from public.social_experiments e
left join action_rollup a on a.campaign_key = e.experiment_id
left join evidence_gate g on g.experiment_key = e.experiment_id;

alter view public.powerhouse_experiment_learning_v2 set (security_invoker = true);
revoke all on public.powerhouse_experiment_learning_v2 from anon, authenticated;
grant select on public.powerhouse_experiment_learning_v2 to service_role;

comment on view public.powerhouse_experiment_learning_v2 is
  'Evidence-first experiment learning. Proven promotion requires prospective assignment, matured treatment/holdout, complete observed economics for linked treatment actions, matured market outcomes and forecast calibration. Legacy action/outcome counts alone never qualify.';
