-- Evidence-source coverage, provider readback and end-to-end commercial proof.
-- Reuses canonical Powerhouse assignments, actions, economics, feedback, outcomes and policy authority.

create table if not exists public.powerhouse_evidence_sources (
  source_key text primary key,
  source_class text not null,
  required boolean not null default true,
  max_age interval not null default interval '24 hours',
  writer_contract text not null,
  owner_component text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_evidence_sources enable row level security;
revoke all on table public.powerhouse_evidence_sources from public, anon, authenticated;
grant select, insert, update, delete on table public.powerhouse_evidence_sources to service_role;

create table if not exists public.powerhouse_evidence_source_observations (
  observation_id uuid primary key default gen_random_uuid(),
  source_key text not null references public.powerhouse_evidence_sources(source_key) on delete cascade,
  dedupe_key text not null unique,
  external_event_id text,
  observed_at timestamptz not null default now(),
  evidence jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.powerhouse_evidence_source_observations enable row level security;
revoke all on table public.powerhouse_evidence_source_observations from public, anon, authenticated;
grant select, insert on table public.powerhouse_evidence_source_observations to service_role;

insert into public.powerhouse_evidence_sources(source_key,source_class,required,max_age,writer_contract,owner_component,notes)
values
('linkedin','market_response',true,interval '24 hours','bg_linkedin_engagement_ingest','linkedin-ingest','Engagement and reply evidence from LinkedIn'),
('gmail','market_response',true,interval '6 hours','powerhouse_record_market_outcome_v1','gmail-ingest','Inbound/outbound reply evidence; source remains red until a connected producer writes heartbeats'),
('calendly','meeting',true,interval '24 hours','bg_calendly_uitkomst','calendly-ingest','Meeting booked/cancelled/completed evidence'),
('offers','proposal',true,interval '24 hours','offerte_akkoord/offertes','offer-flow','Proposal created/sent/accepted/lost evidence'),
('finance_revenue','revenue',true,interval '24 hours','powerhouse_record_market_outcome_v1','finance-ingest','Realized revenue from a hard financial source; no synthetic attribution'),
('action_economics','economics',true,interval '24 hours','powerhouse_record_action_economics_v1','sales-execution','Observed provider/external cost and human minutes'),
('human_feedback','human_feedback',true,interval '24 hours','powerhouse_record_human_feedback_v1','cockpit-portal','Observed approve/edit/skip/cancel/override/alternative action'),
('market_outcomes','outcome',true,interval '24 hours','powerhouse_record_market_outcome_v1','sales-outcome-ingest','Canonical downstream outcome write'),
('experiment_assignment','experiment',true,interval '24 hours','powerhouse_prepare_experiment_action_v1','experiment-orchestrator','Prospective assignment before treatment')
on conflict (source_key) do update set
 source_class=excluded.source_class,required=excluded.required,max_age=excluded.max_age,
 writer_contract=excluded.writer_contract,owner_component=excluded.owner_component,notes=excluded.notes,updated_at=now();

create or replace function public.powerhouse_record_evidence_source_observation_v1(
 p_source_key text,p_dedupe_key text,p_external_event_id text default null,p_observed_at timestamptz default now(),p_evidence jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.powerhouse_evidence_sources where source_key=p_source_key) then
   raise exception 'unknown evidence source: %',p_source_key;
 end if;
 if nullif(trim(p_dedupe_key),'') is null then raise exception 'dedupe_key required'; end if;
 if coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then raise exception 'evidence required'; end if;
 insert into public.powerhouse_evidence_source_observations(source_key,dedupe_key,external_event_id,observed_at,evidence)
 values(p_source_key,p_dedupe_key,p_external_event_id,coalesce(p_observed_at,now()),p_evidence)
 on conflict(dedupe_key) do update set observed_at=greatest(powerhouse_evidence_source_observations.observed_at,excluded.observed_at), evidence=powerhouse_evidence_source_observations.evidence||excluded.evidence
 returning observation_id into v_id;
 return v_id;
end $$;
revoke execute on function public.powerhouse_record_evidence_source_observation_v1(text,text,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_record_evidence_source_observation_v1(text,text,text,timestamptz,jsonb) to service_role;

create or replace function public.powerhouse_evidence_heartbeat_trigger_v1() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_source text := tg_argv[0]; v_key text; v_ext text; v_when timestamptz; v_ev jsonb;
begin
 v_when := now();
 if tg_table_name='powerhouse_action_economics' then
   v_key := 'economics:'||new.economics_id::text; v_ext:=new.action_id::text; v_when:=coalesce(new.observed_at,now()); v_ev:=jsonb_build_object('action_id',new.action_id,'economics_id',new.economics_id);
 elsif tg_table_name='powerhouse_human_feedback_events' then
   v_key := 'human-feedback:'||new.feedback_id::text; v_ext:=coalesce(new.action_id::text,new.feedback_id::text); v_when:=coalesce(new.observed_at,now()); v_ev:=jsonb_build_object('action_id',new.action_id,'feedback_type',new.feedback_type,'feedback_id',new.feedback_id);
 elsif tg_table_name='powerhouse_sales_outcomes' then
   v_key := 'market-outcome:'||new.outcome_id::text; v_ext:=coalesce(new.action_id::text,new.outcome_id::text); v_when:=coalesce(new.occurred_at,now()); v_ev:=jsonb_build_object('action_id',new.action_id,'outcome_type',new.outcome_type,'channel',new.channel,'outcome_id',new.outcome_id);
 elsif tg_table_name='powerhouse_experiment_assignments' then
   v_key := 'assignment:'||new.assignment_id::text; v_ext:=new.assignment_id::text; v_when:=coalesce(new.assigned_at,now()); v_ev:=jsonb_build_object('experiment_key',new.experiment_key,'subject_key',new.subject_key,'assignment_arm',new.assignment_arm,'assignment_id',new.assignment_id);
 elsif tg_table_name='linkedin_engagement_events' then
   v_key := 'linkedin:'||new.event_id::text; v_ext:=new.event_key; v_when:=coalesce(new.occurred_at,now()); v_ev:=jsonb_build_object('event_key',new.event_key,'engagement_type',new.engagement_type,'actor_linkedin_url',new.actor_linkedin_url,'is_test',new.is_test);
 elsif tg_table_name='offertes' then
   v_key := 'offer:'||new.id::text||':'||coalesce(new.status,'unknown')||':'||coalesce(new.bijgewerkt_op::text,now()::text); v_ext:=new.id::text; v_when:=coalesce(new.bijgewerkt_op,new.aangemaakt_op,now()); v_ev:=jsonb_build_object('offerte_id',new.id,'status',new.status,'amount_eur',new.bedrag,'organisation_id',new.organisatie_id,'accepted_at',new.akkoord_op);
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

create or replace view public.powerhouse_evidence_source_coverage_v1 as
with last_seen as (
 select source_key,max(observed_at) last_observed_at,count(*) observation_count
 from public.powerhouse_evidence_source_observations group by source_key
)
select s.source_key,s.source_class,s.required,s.max_age,s.writer_contract,s.owner_component,
 l.last_observed_at,coalesce(l.observation_count,0) observation_count,
 case when l.last_observed_at is null then 'missing'
      when now()-l.last_observed_at > s.max_age then 'stale'
      else 'fresh' end coverage_state,
 case when s.required and (l.last_observed_at is null or now()-l.last_observed_at>s.max_age) then true else false end blocks_full_cycle_proof,
 s.notes
from public.powerhouse_evidence_sources s left join last_seen l using(source_key);
alter view public.powerhouse_evidence_source_coverage_v1 set (security_invoker = true);
revoke all on table public.powerhouse_evidence_source_coverage_v1 from public, anon, authenticated;
grant select on table public.powerhouse_evidence_source_coverage_v1 to service_role;

create or replace view public.powerhouse_full_cycle_evidence_v2 as
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
  when x.assignment_id is null then 'missing_assignment'
  when e.action_id is null then 'missing_economics'
  when not (coalesce(o.has_win,false) or coalesce(o.has_loss,false) or (x.measurement_horizon_end is not null and x.measurement_horizon_end<=now())) then 'awaiting_mature_outcome'
  when coalesce(o.has_win,false) and not coalesce(o.has_realized_revenue,false) then 'win_without_realized_revenue'
  else 'matured_market_evidence' end proof_state
from public.powerhouse_sales_actions a
left join assignment x on x.action_id=a.action_id
left join public.powerhouse_action_economics e on e.action_id=a.action_id
left join outcomes o on o.action_id=a.action_id;
alter view public.powerhouse_full_cycle_evidence_v2 set (security_invoker = true);
revoke all on table public.powerhouse_full_cycle_evidence_v2 from public, anon, authenticated;
grant select on table public.powerhouse_full_cycle_evidence_v2 to service_role;

create or replace view public.powerhouse_experiment_effect_uncertainty_v1 as
select e.*,
 case when e.matured_treatment>0 and e.matured_holdout>0 then sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout)) end as outcome_rate_diff_se,
 case when e.matured_treatment>0 and e.matured_holdout>0 then (e.treatment_outcome_rate-e.holdout_outcome_rate)-1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout)) end as outcome_rate_diff_ci95_low,
 case when e.matured_treatment>0 and e.matured_holdout>0 then (e.treatment_outcome_rate-e.holdout_outcome_rate)+1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout)) end as outcome_rate_diff_ci95_high,
 case when e.matured_treatment>0 and e.matured_holdout>0 then 1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout)) end as observed_mde_approx_95,
 case when e.sample_floor_met and e.matured_treatment>0 and e.matured_holdout>0 and ((e.treatment_outcome_rate-e.holdout_outcome_rate)-1.96*sqrt(greatest(0,e.treatment_outcome_rate*(1-e.treatment_outcome_rate)/e.matured_treatment + e.holdout_outcome_rate*(1-e.holdout_outcome_rate)/e.matured_holdout)))>0 then true else false end as outcome_rate_uplift_statistically_clear_95
from public.powerhouse_experiment_effect_estimates_v1 e;
alter view public.powerhouse_experiment_effect_uncertainty_v1 set (security_invoker = true);
revoke all on table public.powerhouse_experiment_effect_uncertainty_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_effect_uncertainty_v1 to service_role;

create or replace view public.powerhouse_evidence_operating_health_v2 as
select now() measured_at,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='missing') required_sources_missing,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='stale') required_sources_stale,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_assignment') executed_actions_missing_assignment,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_economics') executed_actions_missing_economics,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='win_without_realized_revenue') wins_without_realized_revenue,
 (select count(*) from public.powerhouse_next_action_policy_authority_v1) promoted_nba_policies,
 case when exists(select 1 from public.powerhouse_evidence_source_coverage_v1 where required and blocks_full_cycle_proof) then 'source_coverage_incomplete'
      when exists(select 1 from public.powerhouse_full_cycle_evidence_v2 where proof_state in ('missing_assignment','missing_economics','win_without_realized_revenue')) then 'lineage_incomplete'
      else 'healthy_or_collecting' end health_state;
alter view public.powerhouse_evidence_operating_health_v2 set (security_invoker = true);
revoke all on table public.powerhouse_evidence_operating_health_v2 from public, anon, authenticated;
grant select on table public.powerhouse_evidence_operating_health_v2 to service_role;
