-- Powerhouse Market-Truth Learning v1
-- Prospective experiments, observed action economics, human feedback and causal-readiness.

create table if not exists public.powerhouse_experiment_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  experiment_key text not null,
  subject_key text not null,
  opportunity_key text,
  assignment_arm text not null check (assignment_arm in ('treatment','holdout')),
  eligibility_snapshot jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  measurement_horizon_end timestamptz not null,
  model_version text not null,
  assignment_hash text not null,
  treatment_action_id uuid references public.powerhouse_sales_actions(action_id) on delete set null,
  state text not null default 'assigned' check (state in ('assigned','treated','matured','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experiment_key, subject_key)
);

create index if not exists powerhouse_experiment_assignments_opportunity_idx on public.powerhouse_experiment_assignments(opportunity_key, assigned_at desc);
create index if not exists powerhouse_experiment_assignments_horizon_idx on public.powerhouse_experiment_assignments(measurement_horizon_end, assignment_arm);

create table if not exists public.powerhouse_action_economics (
  economics_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  action_id uuid not null unique references public.powerhouse_sales_actions(action_id) on delete cascade,
  provider_cost_eur numeric,
  external_cost_eur numeric,
  human_minutes numeric,
  observed_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (provider_cost_eur is null or provider_cost_eur >= 0),
  check (external_cost_eur is null or external_cost_eur >= 0),
  check (human_minutes is null or human_minutes >= 0)
);

create table if not exists public.powerhouse_human_feedback_events (
  feedback_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  action_id uuid references public.powerhouse_sales_actions(action_id) on delete set null,
  opportunity_key text,
  subject_key text,
  feedback_type text not null check (feedback_type in ('approve','edit','skip','cancel','override','alternative_action')),
  reason text,
  recommended_variant text,
  actual_variant text,
  alternative_action text,
  observed_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.powerhouse_experiment_assignments enable row level security;
alter table public.powerhouse_action_economics enable row level security;
alter table public.powerhouse_human_feedback_events enable row level security;

revoke all on public.powerhouse_experiment_assignments from anon, authenticated;
revoke all on public.powerhouse_action_economics from anon, authenticated;
revoke all on public.powerhouse_human_feedback_events from anon, authenticated;

grant select, insert, update on public.powerhouse_experiment_assignments to service_role;
grant select, insert, update on public.powerhouse_action_economics to service_role;
grant select, insert on public.powerhouse_human_feedback_events to service_role;

comment on table public.powerhouse_experiment_assignments is 'Canonical pre-treatment assignment authority. Stable candidate hashing is not causal proof; assignment must be persisted before treatment.';
comment on table public.powerhouse_action_economics is 'Observed action cost and human effort only. Missing cost/effort stays NULL and is never synthesized.';
comment on table public.powerhouse_human_feedback_events is 'First-class human approval/edit/skip/cancel/override/alternative-action evidence linked to the canonical sales lineage.';

create or replace function public.powerhouse_assign_experiment_v1(
  p_experiment_key text,
  p_subject_key text,
  p_opportunity_key text,
  p_eligibility_snapshot jsonb,
  p_measurement_horizon_end timestamptz,
  p_model_version text,
  p_assignment_arm text default null,
  p_dedupe_key text default null
) returns public.powerhouse_experiment_assignments
language plpgsql security definer set search_path = public
as $$
declare
  v_existing public.powerhouse_experiment_assignments%rowtype;
  v_arm text;
  v_dedupe text;
  v_hash text;
begin
  if nullif(btrim(p_experiment_key),'') is null or nullif(btrim(p_subject_key),'') is null then raise exception 'experiment_key and subject_key are required'; end if;
  if p_measurement_horizon_end is null or p_measurement_horizon_end <= now() then raise exception 'measurement_horizon_end must be in the future at assignment time'; end if;
  if p_assignment_arm is not null and p_assignment_arm not in ('treatment','holdout') then raise exception 'assignment_arm must be treatment or holdout'; end if;

  select * into v_existing from public.powerhouse_experiment_assignments where experiment_key = p_experiment_key and subject_key = p_subject_key;
  if found then
    if p_assignment_arm is not null and v_existing.assignment_arm <> p_assignment_arm then raise exception 'existing assignment arm is immutable'; end if;
    return v_existing;
  end if;

  v_hash := md5(p_experiment_key || '|' || p_subject_key || '|' || coalesce(p_model_version,''));
  v_arm := coalesce(p_assignment_arm, case when mod(abs(hashtextextended(p_experiment_key || '|' || p_subject_key, 0)::numeric), 5) = 0 then 'holdout' else 'treatment' end);
  v_dedupe := coalesce(nullif(btrim(p_dedupe_key),''), 'experiment-assignment:' || v_hash);

  insert into public.powerhouse_experiment_assignments (dedupe_key, experiment_key, subject_key, opportunity_key, assignment_arm, eligibility_snapshot, assigned_at, measurement_horizon_end, model_version, assignment_hash)
  values (v_dedupe, p_experiment_key, p_subject_key, p_opportunity_key, v_arm, coalesce(p_eligibility_snapshot,'{}'::jsonb), now(), p_measurement_horizon_end, p_model_version, v_hash)
  returning * into v_existing;
  return v_existing;
end;
$$;

create or replace function public.powerhouse_link_experiment_action_v1(p_assignment_id uuid, p_action_id uuid)
returns public.powerhouse_experiment_assignments
language plpgsql security definer set search_path = public
as $$
declare
  v_assignment public.powerhouse_experiment_assignments%rowtype;
  v_action public.powerhouse_sales_actions%rowtype;
begin
  select * into v_assignment from public.powerhouse_experiment_assignments where assignment_id = p_assignment_id for update;
  if not found then raise exception 'assignment not found'; end if;
  if v_assignment.assignment_arm <> 'treatment' then raise exception 'holdout assignments cannot be linked to treatment actions'; end if;

  select * into v_action from public.powerhouse_sales_actions where action_id = p_action_id;
  if not found then raise exception 'action not found'; end if;
  if v_action.created_at < v_assignment.assigned_at then raise exception 'assignment must exist before treatment action'; end if;
  if v_assignment.opportunity_key is not null and v_action.opportunity_key is distinct from v_assignment.opportunity_key then raise exception 'action opportunity does not match assignment'; end if;
  if v_assignment.treatment_action_id is not null and v_assignment.treatment_action_id <> p_action_id then raise exception 'treatment action linkage is immutable'; end if;

  update public.powerhouse_experiment_assignments set treatment_action_id = p_action_id, state = case when state = 'assigned' then 'treated' else state end, updated_at = now() where assignment_id = p_assignment_id returning * into v_assignment;
  return v_assignment;
end;
$$;

create or replace function public.powerhouse_record_action_economics_v1(
  p_dedupe_key text,
  p_action_id uuid,
  p_provider_cost_eur numeric default null,
  p_external_cost_eur numeric default null,
  p_human_minutes numeric default null,
  p_evidence jsonb default '{}'::jsonb,
  p_observed_at timestamptz default now()
) returns public.powerhouse_action_economics
language plpgsql security definer set search_path = public
as $$
declare v_row public.powerhouse_action_economics%rowtype;
begin
  if nullif(btrim(p_dedupe_key),'') is null then raise exception 'dedupe_key required'; end if;
  if p_provider_cost_eur < 0 or p_external_cost_eur < 0 or p_human_minutes < 0 then raise exception 'economics values must be nonnegative'; end if;
  insert into public.powerhouse_action_economics (dedupe_key, action_id, provider_cost_eur, external_cost_eur, human_minutes, observed_at, evidence)
  values (p_dedupe_key, p_action_id, p_provider_cost_eur, p_external_cost_eur, p_human_minutes, coalesce(p_observed_at,now()), coalesce(p_evidence,'{}'::jsonb))
  on conflict (action_id) do update set
    provider_cost_eur = coalesce(excluded.provider_cost_eur, public.powerhouse_action_economics.provider_cost_eur),
    external_cost_eur = coalesce(excluded.external_cost_eur, public.powerhouse_action_economics.external_cost_eur),
    human_minutes = coalesce(excluded.human_minutes, public.powerhouse_action_economics.human_minutes),
    observed_at = greatest(public.powerhouse_action_economics.observed_at, excluded.observed_at),
    evidence = public.powerhouse_action_economics.evidence || excluded.evidence,
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.powerhouse_record_human_feedback_v1(
  p_dedupe_key text,
  p_feedback_type text,
  p_action_id uuid default null,
  p_opportunity_key text default null,
  p_subject_key text default null,
  p_reason text default null,
  p_recommended_variant text default null,
  p_actual_variant text default null,
  p_alternative_action text default null,
  p_evidence jsonb default '{}'::jsonb,
  p_observed_at timestamptz default now()
) returns public.powerhouse_human_feedback_events
language plpgsql security definer set search_path = public
as $$
declare v_row public.powerhouse_human_feedback_events%rowtype;
begin
  if nullif(btrim(p_dedupe_key),'') is null then raise exception 'dedupe_key required'; end if;
  if p_feedback_type not in ('approve','edit','skip','cancel','override','alternative_action') then raise exception 'invalid feedback_type'; end if;
  if p_action_id is null and nullif(btrim(p_opportunity_key),'') is null then raise exception 'action_id or opportunity_key required'; end if;
  if p_feedback_type = 'edit' and p_actual_variant is null then raise exception 'actual_variant required for edit feedback'; end if;
  insert into public.powerhouse_human_feedback_events (dedupe_key, action_id, opportunity_key, subject_key, feedback_type, reason, recommended_variant, actual_variant, alternative_action, observed_at, evidence)
  values (p_dedupe_key, p_action_id, p_opportunity_key, p_subject_key, p_feedback_type, p_reason, p_recommended_variant, p_actual_variant, p_alternative_action, coalesce(p_observed_at,now()), coalesce(p_evidence,'{}'::jsonb))
  on conflict (dedupe_key) do nothing returning * into v_row;
  if v_row.feedback_id is null then select * into v_row from public.powerhouse_human_feedback_events where dedupe_key = p_dedupe_key; end if;
  return v_row;
end;
$$;

revoke execute on function public.powerhouse_assign_experiment_v1(text,text,text,jsonb,timestamptz,text,text,text) from public, anon, authenticated;
revoke execute on function public.powerhouse_link_experiment_action_v1(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.powerhouse_record_action_economics_v1(text,uuid,numeric,numeric,numeric,jsonb,timestamptz) from public, anon, authenticated;
revoke execute on function public.powerhouse_record_human_feedback_v1(text,text,uuid,text,text,text,text,text,text,jsonb,timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_assign_experiment_v1(text,text,text,jsonb,timestamptz,text,text,text) to service_role;
grant execute on function public.powerhouse_link_experiment_action_v1(uuid,uuid) to service_role;
grant execute on function public.powerhouse_record_action_economics_v1(text,uuid,numeric,numeric,numeric,jsonb,timestamptz) to service_role;
grant execute on function public.powerhouse_record_human_feedback_v1(text,text,uuid,text,text,text,text,text,text,jsonb,timestamptz) to service_role;

create or replace view public.powerhouse_causal_experiment_readiness_v1 as
with assignment_facts as (
  select a.*, sa.created_at as treatment_created_at,
    (a.treatment_action_id is null or sa.created_at >= a.assigned_at) as assignment_before_treatment,
    exists (select 1 from public.powerhouse_sales_outcomes o where o.opportunity_key is not distinct from a.opportunity_key and o.occurred_at >= a.assigned_at and o.occurred_at <= a.measurement_horizon_end) as observed_outcome,
    coalesce((select sum(o.revenue_eur) from public.powerhouse_sales_outcomes o where o.opportunity_key is not distinct from a.opportunity_key and o.occurred_at >= a.assigned_at and o.occurred_at <= a.measurement_horizon_end),0) as observed_revenue_eur
  from public.powerhouse_experiment_assignments a
  left join public.powerhouse_sales_actions sa on sa.action_id = a.treatment_action_id
), grouped as (
  select experiment_key,
    count(*) filter (where assignment_arm='treatment') as treatment_assignments,
    count(*) filter (where assignment_arm='holdout') as holdout_assignments,
    count(*) filter (where measurement_horizon_end <= now() and assignment_arm='treatment') as matured_treatment,
    count(*) filter (where measurement_horizon_end <= now() and assignment_arm='holdout') as matured_holdout,
    count(*) filter (where measurement_horizon_end <= now() and assignment_arm='treatment' and observed_outcome) as treatment_outcomes,
    count(*) filter (where measurement_horizon_end <= now() and assignment_arm='holdout' and observed_outcome) as holdout_outcomes,
    sum(observed_revenue_eur) filter (where measurement_horizon_end <= now() and assignment_arm='treatment') as treatment_revenue_eur,
    sum(observed_revenue_eur) filter (where measurement_horizon_end <= now() and assignment_arm='holdout') as holdout_revenue_eur,
    bool_and(assignment_before_treatment) as assignment_before_treatment,
    min(assigned_at) as first_assigned_at,
    max(measurement_horizon_end) as latest_horizon_end
  from assignment_facts group by experiment_key
)
select g.*,
  case when not coalesce(g.assignment_before_treatment,false) then 'not_proven' when g.matured_treatment < 10 or g.matured_holdout < 10 then 'insufficient_evidence' else 'ready_for_estimation' end as causal_status,
  case when not coalesce(g.assignment_before_treatment,false) then 'assignment_after_treatment_detected' when g.matured_treatment < 10 or g.matured_holdout < 10 then 'minimum_10_matured_per_arm_not_met' else 'comparable_estimation_may_begin_but_is_not_itself_causal_proof' end as readiness_reason
from grouped g;

alter view public.powerhouse_causal_experiment_readiness_v1 set (security_invoker = true);
revoke all on public.powerhouse_causal_experiment_readiness_v1 from anon, authenticated;
grant select on public.powerhouse_causal_experiment_readiness_v1 to service_role;

create or replace view public.powerhouse_market_truth_unit_economics_v1 as
select a.action_id, a.opportunity_key, a.action_type, a.channel, a.status, a.executed_at,
  e.provider_cost_eur, e.external_cost_eur, e.human_minutes,
  case when e.provider_cost_eur is null and e.external_cost_eur is null then null else coalesce(e.provider_cost_eur,0) + coalesce(e.external_cost_eur,0) end as observed_cost_eur,
  coalesce(sum(o.revenue_eur),0) as realized_revenue_eur,
  count(o.outcome_id) filter (where lower(o.outcome_type) like '%reply%') as replies_observed,
  count(o.outcome_id) filter (where lower(o.outcome_type) like '%meeting%' or lower(o.outcome_type) like '%appointment%') as meetings_observed,
  count(o.outcome_id) filter (where lower(o.outcome_type) like '%proposal%' or lower(o.outcome_type) like '%offer%') as proposals_observed,
  count(o.outcome_id) filter (where lower(o.outcome_type) like '%won%' or lower(o.outcome_type) like '%order%') as wins_observed,
  case when (coalesce(e.provider_cost_eur,0)+coalesce(e.external_cost_eur,0)) > 0 then coalesce(sum(o.revenue_eur),0) / (coalesce(e.provider_cost_eur,0)+coalesce(e.external_cost_eur,0)) else null end as realized_revenue_to_cost_ratio,
  case when e.economics_id is null then 'insufficient_evidence' else 'observed' end as economics_state
from public.powerhouse_sales_actions a
left join public.powerhouse_action_economics e on e.action_id = a.action_id
left join public.powerhouse_sales_outcomes o on o.action_id = a.action_id
group by a.action_id,a.opportunity_key,a.action_type,a.channel,a.status,a.executed_at,e.economics_id,e.provider_cost_eur,e.external_cost_eur,e.human_minutes;

alter view public.powerhouse_market_truth_unit_economics_v1 set (security_invoker = true);
revoke all on public.powerhouse_market_truth_unit_economics_v1 from anon, authenticated;
grant select on public.powerhouse_market_truth_unit_economics_v1 to service_role;

create or replace view public.powerhouse_human_feedback_effectiveness_v1 as
select f.feedback_type, count(*) as feedback_count,
  count(distinct f.action_id) filter (where f.action_id is not null) as actions_affected,
  count(o.outcome_id) as subsequent_outcomes,
  coalesce(sum(o.revenue_eur),0) as subsequent_realized_revenue_eur,
  min(f.observed_at) as first_observed_at, max(f.observed_at) as last_observed_at,
  'feedback_is_operational_evidence_not_market_outcome'::text as truth_boundary
from public.powerhouse_human_feedback_events f
left join public.powerhouse_sales_outcomes o on o.action_id = f.action_id and o.occurred_at >= f.observed_at
group by f.feedback_type;

alter view public.powerhouse_human_feedback_effectiveness_v1 set (security_invoker = true);
revoke all on public.powerhouse_human_feedback_effectiveness_v1 from anon, authenticated;
grant select on public.powerhouse_human_feedback_effectiveness_v1 to service_role;

create or replace view public.powerhouse_market_truth_health_v1 as
select now() as measured_at,
  (select count(*) from public.powerhouse_experiment_assignments) as assignment_count,
  (select count(*) from public.powerhouse_experiment_assignments where measurement_horizon_end <= now()) as matured_assignment_count,
  (select count(*) from public.powerhouse_causal_experiment_readiness_v1 where causal_status='ready_for_estimation') as causal_ready_experiment_count,
  (select count(*) from public.powerhouse_action_economics) as actions_with_economics,
  (select count(*) from public.powerhouse_human_feedback_events) as human_feedback_rows,
  (select count(*) from public.powerhouse_forecast_calibration) as calibration_samples,
  (select coalesce(sum(revenue_eur),0) from public.powerhouse_sales_outcomes) as realized_revenue_eur,
  jsonb_build_object(
    'assignments_sparse', (select count(*)=0 from public.powerhouse_experiment_assignments),
    'economics_sparse', (select count(*)=0 from public.powerhouse_action_economics),
    'human_feedback_sparse', (select count(*)=0 from public.powerhouse_human_feedback_events),
    'causal_estimation_sparse', (select count(*)=0 from public.powerhouse_causal_experiment_readiness_v1 where causal_status='ready_for_estimation')
  ) as sparse_evidence,
  'sparse evidence must collect more observed market truth and must not increase autonomy'::text as truth_boundary;

alter view public.powerhouse_market_truth_health_v1 set (security_invoker = true);
revoke all on public.powerhouse_market_truth_health_v1 from anon, authenticated;
grant select on public.powerhouse_market_truth_health_v1 to service_role;

create or replace function public.powerhouse_market_truth_daily_v1(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_health jsonb;
  v_ga4_ok boolean := false;
  v_error_time timestamptz;
begin
  select to_jsonb(h) into v_health from public.powerhouse_market_truth_health_v1 h;
  update public.powerhouse_daily_runs set evidence = jsonb_set(coalesce(evidence,'{}'::jsonb), '{market_truth_learning}', coalesce(v_health,'{}'::jsonb), true), updated_at = now() where run_date = p_run_date;

  select exists(
    select 1 from public.bg_gezondheid g
    where g.onderdeel='ga4-analytics' and g.status='ok'
      and g.gemeten_op = (select max(g2.gemeten_op) from public.bg_gezondheid g2 where g2.onderdeel='ga4-analytics')
  ) into v_ga4_ok;

  select max(occurred_at) into v_error_time from public.powerhouse_runtime_events where event_type='source_health_evaluated' and subject_key='ga4-analytics' and state='error';

  if v_ga4_ok and v_error_time is not null then
    insert into public.powerhouse_runtime_events (dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence)
    values (
      'market-truth:ga4-freshness:resolved:' || to_char(v_error_time at time zone 'UTC','YYYYMMDDHH24MISS'),
      'source_health_resolved','powerhouse_market_truth_daily_v1','ga4-analytics','system',now(),
      jsonb_build_object('historical_error_at',v_error_time,'current_health','ok','resolution','fresh canonical GA4 health observed'),
      jsonb_build_object('contract','powerhouse-market-truth-learning-v1','preserves_history',true),
      'closed','VERIFIED',1
    ) on conflict (dedupe_key) do nothing;
  end if;

  return coalesce(v_health,'{}'::jsonb) || jsonb_build_object('ga4_resolution_written',v_ga4_ok and v_error_time is not null);
end;
$$;

revoke execute on function public.powerhouse_market_truth_daily_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_market_truth_daily_v1(date) to service_role;