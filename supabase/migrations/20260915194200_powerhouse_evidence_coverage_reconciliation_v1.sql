-- Canonical reconciliation for evidence-source coverage and full-cycle proof.
-- EXISTING-STATE-FIRST: reuses canonical Powerhouse assignments/actions/economics/feedback/outcomes/policy authority.

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

create table if not exists public.powerhouse_evidence_source_observations (
  observation_id uuid primary key default gen_random_uuid(),
  source_key text not null references public.powerhouse_evidence_sources(source_key) on delete restrict,
  dedupe_key text not null unique,
  external_event_id text,
  observed_at timestamptz not null default now(),
  evidence jsonb not null,
  created_at timestamptz not null default now(),
  check (evidence <> '{}'::jsonb)
);

alter table public.powerhouse_evidence_sources enable row level security;
alter table public.powerhouse_evidence_source_observations enable row level security;
revoke all on table public.powerhouse_evidence_sources from public, anon, authenticated;
revoke all on table public.powerhouse_evidence_source_observations from public, anon, authenticated;
grant select, insert, update, delete on table public.powerhouse_evidence_sources to service_role;
grant select, insert, update, delete on table public.powerhouse_evidence_source_observations to service_role;

insert into public.powerhouse_evidence_sources(source_key,source_class,required,max_age,writer_contract,owner_component,notes)
values
 ('gmail','market_response',true,interval '6 hours','powerhouse_record_market_outcome_v1','gmail-ingest','Inbound/outbound reply evidence; connected producer must write truthful readback heartbeats.'),
 ('calendly','meeting',true,interval '24 hours','bg_calendly_uitkomst','calendly-ingest','Meeting booked/cancelled/completed evidence; connected producer must write truthful readback heartbeats.'),
 ('linkedin','market_response',true,interval '24 hours','bg_linkedin_engagement_ingest','linkedin-ingest','LinkedIn engagement/reply evidence. Remains fail-closed without provider/readback heartbeat.'),
 ('offers','proposal',true,interval '24 hours','offerte_akkoord/offertes','offer-flow','Proposal created/sent/accepted/lost evidence.'),
 ('finance_revenue','revenue',true,interval '24 hours','powerhouse_record_market_outcome_v1','finance-ingest','Realized revenue from a hard financial source; no synthetic attribution.'),
 ('experiment_assignment','experiment',false,interval '24 hours','powerhouse_prepare_experiment_action_v1','experiment-orchestrator','Event-driven internal evidence; completeness is enforced conditionally by full-cycle lineage, not heartbeat.'),
 ('action_economics','economics',false,interval '24 hours','powerhouse_record_action_economics_v1','sales-execution','Observed provider/external cost and human minutes; conditionally required for executed treatment actions.'),
 ('human_feedback','human_feedback',false,interval '24 hours','powerhouse_record_human_feedback_v1','cockpit-portal','Observed approve/edit/skip/cancel/override/alternative action; event-driven, not periodic.'),
 ('market_outcomes','outcome',false,interval '24 hours','powerhouse_record_market_outcome_v1','sales-outcome-ingest','Canonical downstream outcome write; conditionally required by action lifecycle.')
on conflict(source_key) do update set
 source_class=excluded.source_class,
 required=excluded.required,
 max_age=excluded.max_age,
 writer_contract=excluded.writer_contract,
 owner_component=excluded.owner_component,
 notes=excluded.notes,
 updated_at=now();

create or replace function public.powerhouse_record_evidence_source_observation_v1(
  p_source_key text,
  p_dedupe_key text,
  p_external_event_id text default null,
  p_observed_at timestamptz default now(),
  p_evidence jsonb default '{}'::jsonb
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
 on conflict(dedupe_key) do update set
   observed_at=greatest(powerhouse_evidence_source_observations.observed_at,excluded.observed_at),
   evidence=powerhouse_evidence_source_observations.evidence||excluded.evidence
 returning observation_id into v_id;
 return v_id;
end $$;
revoke all on function public.powerhouse_record_evidence_source_observation_v1(text,text,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_record_evidence_source_observation_v1(text,text,text,timestamptz,jsonb) to service_role;

create or replace view public.powerhouse_evidence_source_coverage_v1
with (security_invoker = true) as
with last_seen as (
 select source_key,max(observed_at) as last_observed_at,count(*) as observation_count
 from public.powerhouse_evidence_source_observations group by source_key
)
select s.source_key,s.source_class,s.required,s.max_age,s.writer_contract,s.owner_component,
 l.last_observed_at,coalesce(l.observation_count,0)::bigint as observation_count,
 case when l.last_observed_at is null then 'missing'
      when now()-l.last_observed_at>s.max_age then 'stale' else 'fresh' end as coverage_state,
 case when s.required and (l.last_observed_at is null or now()-l.last_observed_at>s.max_age) then true else false end as blocks_full_cycle_proof,
 s.notes
from public.powerhouse_evidence_sources s left join last_seen l using(source_key);

create or replace view public.powerhouse_full_cycle_evidence_v2
with (security_invoker = true) as
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
 select treatment_action_id as action_id,assignment_id,experiment_key,assignment_arm,state,measurement_horizon_end
 from public.powerhouse_experiment_assignments where treatment_action_id is not null
), cfg as (
 select '2026-09-15 19:21:18+00'::timestamptz as evidence_contract_effective_at
)
select a.action_id,a.subject_key,a.opportunity_key,a.channel,a.action_type,a.status,a.executed_at,
 x.assignment_id,x.experiment_key,x.assignment_arm,x.state as assignment_state,x.measurement_horizon_end,
 e.action_id is not null as has_economics,
 exists(select 1 from public.powerhouse_human_feedback_events h where h.action_id=a.action_id) as has_human_feedback,
 coalesce(o.has_reply,false) as has_reply,coalesce(o.has_meeting,false) as has_meeting,
 coalesce(o.has_proposal,false) as has_proposal,coalesce(o.has_win,false) as has_win,
 coalesce(o.has_loss,false) as has_loss,coalesce(o.has_realized_revenue,false) as has_realized_revenue,
 coalesce(o.realized_revenue_eur,0) as realized_revenue_eur,
 case
  when a.executed_at is null then 'action_not_executed'
  when a.executed_at<cfg.evidence_contract_effective_at and x.assignment_id is null then 'legacy_pre_contract_unassigned'
  when x.assignment_id is null then 'missing_assignment'
  when e.action_id is null then 'missing_economics'
  when not (coalesce(o.has_win,false) or coalesce(o.has_loss,false) or (x.measurement_horizon_end is not null and x.measurement_horizon_end<=now())) then 'awaiting_mature_outcome'
  when coalesce(o.has_win,false) and not coalesce(o.has_realized_revenue,false) then 'win_without_realized_revenue'
  else 'matured_market_evidence' end as proof_state
from public.powerhouse_sales_actions a cross join cfg
left join assignment x on x.action_id=a.action_id
left join public.powerhouse_action_economics e on e.action_id=a.action_id
left join outcomes o on o.action_id=a.action_id;

create or replace view public.powerhouse_evidence_operating_health_v3
with (security_invoker = true) as
select now() as measured_at,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='missing') as required_sources_missing,
 (select count(*) from public.powerhouse_evidence_source_coverage_v1 where required and coverage_state='stale') as required_sources_stale,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_assignment') as executed_actions_missing_assignment,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='missing_economics') as executed_actions_missing_economics,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='win_without_realized_revenue') as wins_without_realized_revenue,
 (select count(*) from public.powerhouse_full_cycle_evidence_v2 where proof_state='legacy_pre_contract_unassigned') as legacy_pre_contract_unassigned,
 (select count(*) from public.powerhouse_next_action_policy_authority_v1) as promoted_nba_policies,
 case
  when exists(select 1 from public.powerhouse_evidence_source_coverage_v1 where required and blocks_full_cycle_proof) then 'source_coverage_incomplete'
  when exists(select 1 from public.powerhouse_full_cycle_evidence_v2 where proof_state in ('missing_assignment','missing_economics','win_without_realized_revenue')) then 'lineage_incomplete'
  else 'healthy_or_collecting' end as health_state;

revoke all on table public.powerhouse_evidence_source_coverage_v1 from public, anon, authenticated;
revoke all on table public.powerhouse_full_cycle_evidence_v2 from public, anon, authenticated;
revoke all on table public.powerhouse_evidence_operating_health_v3 from public, anon, authenticated;
grant select on table public.powerhouse_evidence_source_coverage_v1 to service_role;
grant select on table public.powerhouse_full_cycle_evidence_v2 to service_role;
grant select on table public.powerhouse_evidence_operating_health_v3 to service_role;
