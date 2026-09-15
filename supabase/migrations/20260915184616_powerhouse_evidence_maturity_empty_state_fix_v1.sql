-- Regression fix: evidence maturity must expose one fail-closed status row even when there are zero experiment assignments.
create or replace view public.powerhouse_market_evidence_maturity_v1 as
with assignment_facts as (
  select a.assignment_id,a.experiment_key,a.assignment_arm,a.opportunity_key,a.assigned_at,a.measurement_horizon_end,a.eligibility_snapshot,a.treatment_action_id,
    sa.created_at as action_created_at,sa.executed_at,sa.status as action_status,
    ae.economics_id,ae.provider_cost_eur,ae.external_cost_eur,ae.human_minutes,ae.evidence as economics_evidence,
    (a.treatment_action_id is null or sa.created_at>=a.assigned_at) as prospective_assignment_ok,
    (sa.action_id is not null and sa.executed_at is not null and sa.status='done') as treatment_executed,
    (ae.economics_id is not null and (ae.provider_cost_eur is not null or ae.external_cost_eur is not null or ae.human_minutes is not null) and coalesce(ae.evidence,'{}'::jsonb)<>'{}'::jsonb) as economics_observed_ok
  from public.powerhouse_experiment_assignments a
  left join public.powerhouse_sales_actions sa on sa.action_id=a.treatment_action_id
  left join public.powerhouse_action_economics ae on ae.action_id=a.treatment_action_id
), assignment_agg as (
  select count(*)::bigint as assignment_count,
    count(*) filter(where assignment_arm='treatment')::bigint as treatment_assignments,
    count(*) filter(where assignment_arm='holdout')::bigint as holdout_assignments,
    count(*) filter(where measurement_horizon_end<=now())::bigint as matured_assignments,
    case when count(*)=0 then false else bool_and(prospective_assignment_ok) end as all_assignments_prospective,
    count(*) filter(where treatment_executed)::bigint as executed_treatment_actions,
    count(*) filter(where treatment_executed and economics_observed_ok)::bigint as executed_actions_with_observed_economics,
    case when count(*) filter(where treatment_executed)=0 then false else count(*) filter(where treatment_executed and economics_observed_ok)=count(*) filter(where treatment_executed) end as executed_economics_complete,
    coalesce(sum(case when economics_observed_ok then coalesce(provider_cost_eur,0)+coalesce(external_cost_eur,0) else 0 end),0)::numeric as observed_execution_cost_eur,
    coalesce(sum(case when economics_observed_ok then coalesce(human_minutes,0) else 0 end),0)::numeric as observed_human_minutes
  from assignment_facts
), feedback as (
  select count(*) filter(where feedback_type='edit')::bigint as edits,count(*) filter(where feedback_type='skip')::bigint as skips,count(*) filter(where feedback_type='override')::bigint as overrides,
    count(*) filter(where feedback_type='alternative_action')::bigint as alternative_actions,count(*) filter(where feedback_type='cancel')::bigint as cancels,count(*) filter(where feedback_type='approve')::bigint as approvals,
    count(*) filter(where feedback_type in ('edit','skip','override','alternative_action','cancel') and coalesce(evidence,'{}'::jsonb)<>'{}'::jsonb)::bigint as evidenced_interventions
  from public.powerhouse_human_feedback_events
), downstream as (
  select count(*) filter(where lower(outcome_type)~'(reply|response|reactie)')::bigint as replies,
    count(*) filter(where lower(outcome_type)~'(meeting|appointment|afspraak)')::bigint as meetings,
    count(*) filter(where lower(outcome_type)~'(proposal|offer|offerte)')::bigint as proposals,
    count(*) filter(where lower(outcome_type)~'(won|order|win)')::bigint as wins,
    count(*) filter(where lower(outcome_type)~'(lost|loss|verloren)')::bigint as losses,
    coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur,count(*)::bigint as observed_outcomes
  from public.powerhouse_sales_outcomes
), causal as (
  select count(*) filter(where causal_status='ready_for_estimation')::bigint as causal_ready_experiments,count(*)::bigint as tracked_experiments
  from public.powerhouse_causal_experiment_readiness_v1
)
select now() as measured_at,a.assignment_count,a.treatment_assignments,a.holdout_assignments,a.matured_assignments,a.all_assignments_prospective,
  a.executed_treatment_actions,a.executed_actions_with_observed_economics,a.executed_economics_complete,a.observed_execution_cost_eur,a.observed_human_minutes,
  f.edits as human_edits,f.skips as human_skips,f.overrides as human_overrides,f.alternative_actions as human_alternative_actions,f.cancels as human_cancels,f.approvals as human_approvals,f.evidenced_interventions as evidenced_human_interventions,
  d.replies as downstream_replies,d.meetings as downstream_meetings,d.proposals as downstream_proposals,d.wins as downstream_wins,d.losses as downstream_losses,d.observed_outcomes,d.realized_revenue_eur,
  c.tracked_experiments,c.causal_ready_experiments,
  case when a.assignment_count=0 then 'collecting_evidence' when not a.all_assignments_prospective then 'blocked_non_prospective_assignment' when a.treatment_assignments=0 or a.holdout_assignments=0 then 'collecting_both_arms' when a.executed_treatment_actions>0 and a.executed_actions_with_observed_economics<>a.executed_treatment_actions then 'collecting_execution_economics' when c.causal_ready_experiments=0 then 'collecting_matured_market_evidence' else 'ready_for_effect_estimation' end as evidence_status,
  'Counts are observation volume only. Calibration may not influence next actions until a prospective calibration-policy experiment proves improvement against holdout on observed downstream outcomes.'::text as evidence_boundary
from assignment_agg a cross join feedback f cross join downstream d cross join causal c;

alter view public.powerhouse_market_evidence_maturity_v1 set (security_invoker=true);
revoke all on public.powerhouse_market_evidence_maturity_v1 from anon,authenticated;
grant select on public.powerhouse_market_evidence_maturity_v1 to service_role;
