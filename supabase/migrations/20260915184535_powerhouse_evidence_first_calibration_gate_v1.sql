-- Evidence-first Powerhouse calibration gate.
-- No synthetic backfill: derives truth only from observed canonical records.

create or replace view public.powerhouse_market_evidence_maturity_v1 as
with assignment_facts as (
  select a.assignment_id,a.experiment_key,a.assignment_arm,a.opportunity_key,a.assigned_at,a.measurement_horizon_end,a.eligibility_snapshot,a.treatment_action_id,
    sa.created_at as action_created_at,sa.executed_at,sa.status as action_status,
    ae.economics_id,ae.provider_cost_eur,ae.external_cost_eur,ae.human_minutes,ae.evidence as economics_evidence,
    (a.treatment_action_id is null or sa.created_at >= a.assigned_at) as prospective_assignment_ok,
    (sa.action_id is not null and sa.executed_at is not null and sa.status='done') as treatment_executed,
    (ae.economics_id is not null and (ae.provider_cost_eur is not null or ae.external_cost_eur is not null or ae.human_minutes is not null) and coalesce(ae.evidence,'{}'::jsonb)<>'{}'::jsonb) as economics_observed_ok
  from public.powerhouse_experiment_assignments a
  left join public.powerhouse_sales_actions sa on sa.action_id=a.treatment_action_id
  left join public.powerhouse_action_economics ae on ae.action_id=a.treatment_action_id
), feedback as (
  select count(*) filter(where feedback_type='edit') as edits,count(*) filter(where feedback_type='skip') as skips,count(*) filter(where feedback_type='override') as overrides,
    count(*) filter(where feedback_type='alternative_action') as alternative_actions,count(*) filter(where feedback_type='cancel') as cancels,count(*) filter(where feedback_type='approve') as approvals,
    count(*) filter(where feedback_type in ('edit','skip','override','alternative_action','cancel') and coalesce(evidence,'{}'::jsonb)<>'{}'::jsonb) as evidenced_interventions
  from public.powerhouse_human_feedback_events
), downstream as (
  select count(*) filter(where lower(outcome_type) ~ '(reply|response|reactie)') as replies,
    count(*) filter(where lower(outcome_type) ~ '(meeting|appointment|afspraak)') as meetings,
    count(*) filter(where lower(outcome_type) ~ '(proposal|offer|offerte)') as proposals,
    count(*) filter(where lower(outcome_type) ~ '(won|order|win)') as wins,
    count(*) filter(where lower(outcome_type) ~ '(lost|loss|verloren)') as losses,
    coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur,count(*) as observed_outcomes
  from public.powerhouse_sales_outcomes
), causal as (
  select count(*) filter(where causal_status='ready_for_estimation') as causal_ready_experiments,count(*) as tracked_experiments
  from public.powerhouse_causal_experiment_readiness_v1
)
select now() as measured_at,count(*)::bigint as assignment_count,
  count(*) filter(where assignment_arm='treatment')::bigint as treatment_assignments,
  count(*) filter(where assignment_arm='holdout')::bigint as holdout_assignments,
  count(*) filter(where measurement_horizon_end<=now())::bigint as matured_assignments,
  coalesce(bool_and(prospective_assignment_ok),false) as all_assignments_prospective,
  count(*) filter(where treatment_executed)::bigint as executed_treatment_actions,
  count(*) filter(where treatment_executed and economics_observed_ok)::bigint as executed_actions_with_observed_economics,
  case when count(*) filter(where treatment_executed)=0 then false else count(*) filter(where treatment_executed and economics_observed_ok)=count(*) filter(where treatment_executed) end as executed_economics_complete,
  coalesce(sum(case when economics_observed_ok then coalesce(provider_cost_eur,0)+coalesce(external_cost_eur,0) else 0 end),0)::numeric as observed_execution_cost_eur,
  coalesce(sum(case when economics_observed_ok then coalesce(human_minutes,0) else 0 end),0)::numeric as observed_human_minutes,
  f.edits::bigint as human_edits,f.skips::bigint as human_skips,f.overrides::bigint as human_overrides,f.alternative_actions::bigint as human_alternative_actions,f.cancels::bigint as human_cancels,f.approvals::bigint as human_approvals,f.evidenced_interventions::bigint as evidenced_human_interventions,
  d.replies::bigint as downstream_replies,d.meetings::bigint as downstream_meetings,d.proposals::bigint as downstream_proposals,d.wins::bigint as downstream_wins,d.losses::bigint as downstream_losses,d.observed_outcomes::bigint as observed_outcomes,d.realized_revenue_eur,
  c.tracked_experiments::bigint as tracked_experiments,c.causal_ready_experiments::bigint as causal_ready_experiments,
  case when count(*)=0 then 'collecting_evidence' when not coalesce(bool_and(prospective_assignment_ok),false) then 'blocked_non_prospective_assignment' when count(*) filter(where assignment_arm='treatment')=0 or count(*) filter(where assignment_arm='holdout')=0 then 'collecting_both_arms' when count(*) filter(where treatment_executed)>0 and count(*) filter(where treatment_executed and economics_observed_ok)<>count(*) filter(where treatment_executed) then 'collecting_execution_economics' when c.causal_ready_experiments=0 then 'collecting_matured_market_evidence' else 'ready_for_effect_estimation' end as evidence_status,
  'Counts are observation volume only. Calibration may not influence next actions until a prospective calibration-policy experiment proves improvement against holdout on observed downstream outcomes.'::text as evidence_boundary
from assignment_facts cross join feedback f cross join downstream d cross join causal c
group by f.edits,f.skips,f.overrides,f.alternative_actions,f.cancels,f.approvals,f.evidenced_interventions,d.replies,d.meetings,d.proposals,d.wins,d.losses,d.realized_revenue_eur,d.observed_outcomes,c.tracked_experiments,c.causal_ready_experiments;

alter view public.powerhouse_market_evidence_maturity_v1 set (security_invoker=true);
revoke all on public.powerhouse_market_evidence_maturity_v1 from anon,authenticated;
grant select on public.powerhouse_market_evidence_maturity_v1 to service_role;

create or replace view public.powerhouse_calibration_actionability_v1 as
with calibration_experiments as (
  select distinct experiment_key from public.powerhouse_experiment_assignments where eligibility_snapshot->>'experiment_class'='calibration_policy'
), economics_by_experiment as (
  select a.experiment_key,
    count(*) filter(where a.assignment_arm='treatment' and sa.status='done' and sa.executed_at is not null) as executed_treatment_actions,
    count(*) filter(where a.assignment_arm='treatment' and sa.status='done' and sa.executed_at is not null and ae.economics_id is not null and (ae.provider_cost_eur is not null or ae.external_cost_eur is not null or ae.human_minutes is not null) and coalesce(ae.evidence,'{}'::jsonb)<>'{}'::jsonb) as economics_complete_actions
  from public.powerhouse_experiment_assignments a left join public.powerhouse_sales_actions sa on sa.action_id=a.treatment_action_id left join public.powerhouse_action_economics ae on ae.action_id=a.treatment_action_id group by a.experiment_key
)
select r.experiment_key,r.matured_treatment,r.matured_holdout,r.treatment_outcomes,r.holdout_outcomes,
  coalesce(r.treatment_revenue_eur,0)::numeric as treatment_revenue_eur,coalesce(r.holdout_revenue_eur,0)::numeric as holdout_revenue_eur,
  case when r.matured_treatment>0 then coalesce(r.treatment_revenue_eur,0)/r.matured_treatment else null end as treatment_revenue_per_assignment,
  case when r.matured_holdout>0 then coalesce(r.holdout_revenue_eur,0)/r.matured_holdout else null end as holdout_revenue_per_assignment,
  r.assignment_before_treatment,r.causal_status,r.readiness_reason,coalesce(e.executed_treatment_actions,0)::bigint as executed_treatment_actions,coalesce(e.economics_complete_actions,0)::bigint as economics_complete_actions,
  case when r.causal_status<>'ready_for_estimation' then false when coalesce(e.executed_treatment_actions,0)=0 then false when coalesce(e.executed_treatment_actions,0)<>coalesce(e.economics_complete_actions,0) then false when coalesce(r.treatment_revenue_eur,0)<=coalesce(r.holdout_revenue_eur,0) then false when (coalesce(r.treatment_revenue_eur,0)/nullif(r.matured_treatment,0))<=(coalesce(r.holdout_revenue_eur,0)/nullif(r.matured_holdout,0)) then false else true end as calibration_may_influence_next_actions,
  case when r.causal_status<>'ready_for_estimation' then 'insufficient_matured_prospective_evidence' when coalesce(e.executed_treatment_actions,0)=0 then 'no_executed_treatment_actions' when coalesce(e.executed_treatment_actions,0)<>coalesce(e.economics_complete_actions,0) then 'execution_economics_incomplete' when coalesce(r.treatment_revenue_eur,0)<=coalesce(r.holdout_revenue_eur,0) then 'no_observed_revenue_improvement' when (coalesce(r.treatment_revenue_eur,0)/nullif(r.matured_treatment,0))<=(coalesce(r.holdout_revenue_eur,0)/nullif(r.matured_holdout,0)) then 'no_per_assignment_revenue_improvement' else 'observed_better_than_holdout' end as actionability_reason
from calibration_experiments c join public.powerhouse_causal_experiment_readiness_v1 r on r.experiment_key=c.experiment_key left join economics_by_experiment e on e.experiment_key=c.experiment_key;

alter view public.powerhouse_calibration_actionability_v1 set (security_invoker=true);
revoke all on public.powerhouse_calibration_actionability_v1 from anon,authenticated;
grant select on public.powerhouse_calibration_actionability_v1 to service_role;

create or replace function public.powerhouse_guard_self_improvement_learning_v1() returns trigger language plpgsql security definer set search_path=public as $$
declare v_actionable boolean;
begin
  if new.fingerprint='autonomous-growth-revenue-self-improvement-v1' then
    select coalesce(bool_or(calibration_may_influence_next_actions),false) into v_actionable from public.powerhouse_calibration_actionability_v1;
    if not v_actionable or coalesce(new.evidence->>'confidence_source','')<>'observed_calibration_policy_proof' then
      new.status:='hypothesis'; new.confidence:=0;
      new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object('evidence_first_gate','blocked','gate_contract','powerhouse-evidence-first-calibration-gate-v1','reason',case when not v_actionable then 'no_prospective_calibration_policy_experiment_has_proven_better_next_actions' else 'confidence_source_not_observed_proof' end,'truth_boundary','observation volume never promotes autonomous learning confidence');
    end if;
  end if;
  return new;
end;$$;
revoke execute on function public.powerhouse_guard_self_improvement_learning_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_guard_self_improvement_learning_v1() to service_role;
drop trigger if exists powerhouse_guard_self_improvement_learning_v1 on public.powerhouse_sales_learnings;
create trigger powerhouse_guard_self_improvement_learning_v1 before insert or update on public.powerhouse_sales_learnings for each row execute function public.powerhouse_guard_self_improvement_learning_v1();

update public.powerhouse_sales_learnings set status='hypothesis',confidence=0,evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('evidence_first_gate','blocked','gate_contract','powerhouse-evidence-first-calibration-gate-v1','reason','existing aggregate-count confidence invalidated pending prospective market proof'),updated_at=now()
where fingerprint='autonomous-growth-revenue-self-improvement-v1' and not exists(select 1 from public.powerhouse_calibration_actionability_v1 where calibration_may_influence_next_actions);

comment on view public.powerhouse_market_evidence_maturity_v1 is 'Evidence-first market truth readback: prospective assignment, observed execution economics, human interventions and downstream commercial outcomes. Counts never imply causal improvement.';
comment on view public.powerhouse_calibration_actionability_v1 is 'Fail-closed calibration promotion gate. Only prospective calibration_policy treatment-vs-holdout evidence with complete observed execution economics and better realized revenue per matured assignment may influence next actions.';
comment on function public.powerhouse_guard_self_improvement_learning_v1() is 'Prevents aggregate counts or synthetic confidence formulas from promoting autonomous self-improvement. Requires observed calibration-policy proof provenance.';
