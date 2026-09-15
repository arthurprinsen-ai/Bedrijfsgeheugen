-- Preserve legacy executed actions as historical evidence without retrospective experiment assignment.
-- Contract cutover equals first live evidence-orchestrator deployment.

create or replace view public.powerhouse_full_cycle_evidence_v2 with (security_invoker = true) as
with outcomes as (
 select action_id,
  bool_or(outcome_type in ('reply','response')) as has_reply,
  bool_or(outcome_type in ('meeting','appointment')) as has_meeting,
  bool_or(outcome_type='proposal') as has_proposal,
  bool_or(outcome_type in ('win','order')) as has_win,
  bool_or(outcome_type='loss') as has_loss,
  bool_or(coalesce(revenue_eur,0)>0) as has_realized_revenue,
  sum(coalesce(revenue_eur,0)) as realized_revenue_eur
 from public.powerhouse_sales_outcomes where action_id is not null group by action_id
), assignment as (
 select treatment_action_id action_id,assignment_id,experiment_key,assignment_arm,state,measurement_horizon_end
 from public.powerhouse_experiment_assignments where treatment_action_id is not null
), cfg as (
 select timestamptz '2026-09-15 19:21:18+00' as evidence_contract_effective_at
)
select a.action_id,a.subject_key,a.opportunity_key,a.channel,a.action_type,a.status,a.executed_at,
 x.assignment_id,x.experiment_key,x.assignment_arm,x.state as assignment_state,x.measurement_horizon_end,
 (e.action_id is not null) has_economics,
 exists(select 1 from public.powerhouse_human_feedback_events h where h.action_id=a.action_id) has_human_feedback,
 coalesce(o.has_reply,false) has_reply,coalesce(o.has_meeting,false) has_meeting,coalesce(o.has_proposal,false) has_proposal,
 coalesce(o.has_win,false) has_win,coalesce(o.has_loss,false) has_loss,coalesce(o.has_realized_revenue,false) has_realized_revenue,
 coalesce(o.realized_revenue_eur,0) realized_revenue_eur,
 case
  when a.executed_at is null then 'action_not_executed'
  when a.executed_at < cfg.evidence_contract_effective_at and x.assignment_id is null then 'legacy_pre_contract_unassigned'
  when x.assignment_id is null then 'missing_assignment'
  when e.action_id is null then 'missing_economics'
  when not (coalesce(o.has_win,false) or coalesce(o.has_loss,false) or (x.measurement_horizon_end is not null and x.measurement_horizon_end<=now())) then 'awaiting_mature_outcome'
  when coalesce(o.has_win,false) and not coalesce(o.has_realized_revenue,false) then 'win_without_realized_revenue'
  else 'matured_market_evidence' end proof_state
from public.powerhouse_sales_actions a
cross join cfg
left join assignment x on x.action_id=a.action_id
left join public.powerhouse_action_economics e on e.action_id=a.action_id
left join outcomes o on o.action_id=a.action_id;
revoke all on table public.powerhouse_full_cycle_evidence_v2 from public, anon, authenticated;
grant select on table public.powerhouse_full_cycle_evidence_v2 to service_role;

create or replace view public.powerhouse_evidence_operating_health_v3 with (security_invoker = true) as
select now() measured_at,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='missing') required_sources_missing,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='stale') required_sources_stale,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_assignment') executed_actions_missing_assignment,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_economics') executed_actions_missing_economics,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='win_without_realized_revenue') wins_without_realized_revenue,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='legacy_pre_contract_unassigned') legacy_pre_contract_unassigned,
 (select count(*) from public.powerhouse_next_action_policy_authority_v1) promoted_nba_policies,
 case when exists(select 1 from public.powerhouse_evidence_source_coverage_v1 where required and blocks_full_cycle_proof) then 'source_coverage_incomplete'
      when exists(select 1 from public.powerhouse_full_cycle_evidence_v2 where proof_state in ('missing_assignment','missing_economics','win_without_realized_revenue')) then 'lineage_incomplete'
      else 'healthy_or_collecting' end health_state;
revoke all on table public.powerhouse_evidence_operating_health_v3 from public, anon, authenticated;
grant select on table public.powerhouse_evidence_operating_health_v3 to service_role;
