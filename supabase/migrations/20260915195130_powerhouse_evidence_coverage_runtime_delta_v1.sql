-- Runtime delta on top of canonical evidence coverage reconciliation.
-- Canonical repository base: merged PR #1645; this migration contains only the remaining runtime delta.
-- Adds automatic evidence heartbeats, Calendly provenance, and uncertainty projection.

create or replace function public.powerhouse_evidence_heartbeat_trigger_v1() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_source text := tg_argv[0];
  v_key text;
  v_ext text;
  v_when timestamptz := now();
  v_ev jsonb;
begin
  if tg_table_name='powerhouse_action_economics' then
    v_key := 'economics:'||new.economics_id::text;
    v_ext := new.action_id::text;
    v_when := coalesce(new.observed_at,now());
    v_ev := jsonb_build_object('action_id',new.action_id,'economics_id',new.economics_id);
  elsif tg_table_name='powerhouse_human_feedback_events' then
    v_key := 'human-feedback:'||new.feedback_id::text;
    v_ext := coalesce(new.action_id::text,new.feedback_id::text);
    v_when := coalesce(new.observed_at,now());
    v_ev := jsonb_build_object('action_id',new.action_id,'feedback_type',new.feedback_type,'feedback_id',new.feedback_id);
  elsif tg_table_name='powerhouse_sales_outcomes' then
    v_key := 'market-outcome:'||new.outcome_id::text;
    v_ext := coalesce(new.action_id::text,new.outcome_id::text);
    v_when := coalesce(new.occurred_at,now());
    v_ev := jsonb_build_object('action_id',new.action_id,'outcome_type',new.outcome_type,'channel',new.channel,'outcome_id',new.outcome_id);
  elsif tg_table_name='powerhouse_experiment_assignments' then
    v_key := 'assignment:'||new.assignment_id::text;
    v_ext := new.assignment_id::text;
    v_when := coalesce(new.assigned_at,now());
    v_ev := jsonb_build_object('experiment_key',new.experiment_key,'subject_key',new.subject_key,'assignment_arm',new.assignment_arm,'assignment_id',new.assignment_id);
  elsif tg_table_name='linkedin_engagement_events' then
    v_key := 'linkedin:'||new.event_id::text;
    v_ext := new.event_key;
    v_when := coalesce(new.occurred_at,now());
    v_ev := jsonb_build_object('event_key',new.event_key,'engagement_type',new.engagement_type,'actor_linkedin_url',new.actor_linkedin_url,'is_test',new.is_test);
  elsif tg_table_name='offertes' then
    v_key := 'offer:'||new.id::text||':'||coalesce(new.status,'unknown')||':'||coalesce(new.bijgewerkt_op::text,now()::text);
    v_ext := new.id::text;
    v_when := coalesce(new.bijgewerkt_op,new.aangemaakt_op,now());
    v_ev := jsonb_build_object('offerte_id',new.id,'status',new.status,'amount_eur',new.bedrag,'organisation_id',new.organisatie_id,'accepted_at',new.akkoord_op);
  else
    return new;
  end if;
  perform public.powerhouse_record_evidence_source_observation_v1(v_source,v_key,v_ext,v_when,v_ev);
  return new;
end $$;
revoke execute on function public.powerhouse_evidence_heartbeat_trigger_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_evidence_heartbeat_trigger_v1() to service_role;

drop trigger if exists powerhouse_evidence_heartbeat_action_economics_v1 on public.powerhouse_action_economics;
create trigger powerhouse_evidence_heartbeat_action_economics_v1 after insert or update on public.powerhouse_action_economics for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('action_economics');
drop trigger if exists powerhouse_evidence_heartbeat_human_feedback_v1 on public.powerhouse_human_feedback_events;
create trigger powerhouse_evidence_heartbeat_human_feedback_v1 after insert on public.powerhouse_human_feedback_events for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('human_feedback');
drop trigger if exists powerhouse_evidence_heartbeat_market_outcomes_v1 on public.powerhouse_sales_outcomes;
create trigger powerhouse_evidence_heartbeat_market_outcomes_v1 after insert on public.powerhouse_sales_outcomes for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('market_outcomes');
drop trigger if exists powerhouse_evidence_heartbeat_assignments_v1 on public.powerhouse_experiment_assignments;
create trigger powerhouse_evidence_heartbeat_assignments_v1 after insert on public.powerhouse_experiment_assignments for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('experiment_assignment');
drop trigger if exists powerhouse_evidence_heartbeat_linkedin_v1 on public.linkedin_engagement_events;
create trigger powerhouse_evidence_heartbeat_linkedin_v1 after insert on public.linkedin_engagement_events for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('linkedin');
drop trigger if exists powerhouse_evidence_heartbeat_offers_v1 on public.offertes;
create trigger powerhouse_evidence_heartbeat_offers_v1 after insert or update of status,bedrag,akkoord_op on public.offertes for each row execute function public.powerhouse_evidence_heartbeat_trigger_v1('offers');

create or replace function public.bg_calendly_uitkomst(p_event_id text,p_sessie text,p_extra jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform intern.bg_uitkomst_eenmalig('calendly',p_event_id,'appointment',0,coalesce(p_sessie,'calendly:'||p_event_id),coalesce(p_extra,'{}'::jsonb),p_extra->>'pagina');
  perform public.powerhouse_record_evidence_source_observation_v1('calendly','calendly:'||p_event_id,p_event_id,now(),jsonb_build_object('session',p_sessie,'extra',coalesce(p_extra,'{}'::jsonb)));
end $$;
revoke execute on function public.bg_calendly_uitkomst(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.bg_calendly_uitkomst(text,text,jsonb) to service_role;

create or replace view public.powerhouse_experiment_effect_uncertainty_v1 as
select e.*,
  case when e.matured_treatment>0 and e.matured_holdout>0 then
    sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout))
  end as outcome_rate_diff_se,
  case when e.matured_treatment>0 and e.matured_holdout>0 then
    (e.treatment_outcome_rate-e.holdout_outcome_rate) - 1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout))
  end as outcome_rate_diff_ci95_low,
  case when e.matured_treatment>0 and e.matured_holdout>0 then
    (e.treatment_outcome_rate-e.holdout_outcome_rate) + 1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout))
  end as outcome_rate_diff_ci95_high,
  case when e.matured_treatment>0 and e.matured_holdout>0 then
    1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout))
  end as observed_mde_approx_95,
  case when e.sample_floor_met and e.matured_treatment>0 and e.matured_holdout>0 and
    ((e.treatment_outcome_rate-e.holdout_outcome_rate) - 1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout))) > 0
  then true else false end as outcome_rate_uplift_statistically_clear_95
from public.powerhouse_experiment_effect_estimates_v1 e;
alter view public.powerhouse_experiment_effect_uncertainty_v1 set (security_invoker = true);
revoke all on table public.powerhouse_experiment_effect_uncertainty_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_effect_uncertainty_v1 to service_role;
