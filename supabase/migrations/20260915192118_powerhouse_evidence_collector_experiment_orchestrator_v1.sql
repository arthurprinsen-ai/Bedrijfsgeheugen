-- Canonical evidence-first experiment orchestration for Bedrijfsgeheugen Powerhouse.
-- Production authority is Supabase; this migration mirrors the live runtime.

create table if not exists public.powerhouse_experiment_policies (
  experiment_key text primary key,
  experiment_class text not null default 'calibration_policy',
  policy_version text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  treatment_pct integer not null default 50 check (treatment_pct between 1 and 99),
  measurement_horizon_hours integer not null default 168 check (measurement_horizon_hours > 0),
  min_matured_per_arm integer not null default 20 check (min_matured_per_arm > 0),
  primary_metric text not null default 'realized_revenue_per_assignment',
  segmentation jsonb not null default '{}'::jsonb,
  guardrails jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_experiment_policies enable row level security;
revoke all on table public.powerhouse_experiment_policies from public, anon, authenticated;
grant select, insert, update, delete on table public.powerhouse_experiment_policies to service_role;

create table if not exists public.powerhouse_policy_versions (
  version_id uuid primary key default gen_random_uuid(),
  experiment_key text not null,
  policy_version text not null,
  decision_state text not null check (decision_state in ('baseline','candidate','promoted','demoted','retired')),
  promoted_at timestamptz,
  demoted_at timestamptz,
  effect_snapshot jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(experiment_key, policy_version)
);
alter table public.powerhouse_policy_versions enable row level security;
revoke all on table public.powerhouse_policy_versions from public, anon, authenticated;
grant select, insert, update, delete on table public.powerhouse_policy_versions to service_role;

create or replace function public.powerhouse_prepare_experiment_action_v1(
  p_experiment_key text,
  p_subject_key text,
  p_opportunity_key text default null,
  p_eligibility_snapshot jsonb default '{}'::jsonb,
  p_model_version text default null
) returns table(
  assignment_id uuid,
  assignment_arm text,
  may_execute_treatment boolean,
  measurement_horizon_end timestamptz,
  reason text
)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_policy public.powerhouse_experiment_policies%rowtype;
  v_existing public.powerhouse_experiment_assignments%rowtype;
  v_arm text;
  v_hash integer;
  v_id uuid;
  v_horizon timestamptz;
begin
  if nullif(trim(p_experiment_key),'') is null or nullif(trim(p_subject_key),'') is null then
    raise exception 'experiment_key and subject_key are required';
  end if;
  select * into v_policy
  from public.powerhouse_experiment_policies
  where experiment_key = p_experiment_key
    and status = 'active'
    and coalesce(effective_from, now()) <= now();
  if not found then raise exception 'active experiment policy not found: %', p_experiment_key; end if;
  select * into v_existing
  from public.powerhouse_experiment_assignments
  where experiment_key = p_experiment_key and subject_key = p_subject_key;
  if found then
    return query select v_existing.assignment_id, v_existing.assignment_arm,
      (v_existing.assignment_arm='treatment'), v_existing.measurement_horizon_end,
      'existing_assignment'::text;
    return;
  end if;
  v_hash := abs(hashtext(p_experiment_key||'|'||p_subject_key));
  v_arm := case when mod(v_hash,100) < v_policy.treatment_pct then 'treatment' else 'holdout' end;
  v_horizon := now() + make_interval(hours=>v_policy.measurement_horizon_hours);
  insert into public.powerhouse_experiment_assignments(
    dedupe_key, experiment_key, subject_key, opportunity_key, assignment_arm,
    eligibility_snapshot, assigned_at, measurement_horizon_end, model_version,
    assignment_hash, state
  ) values (
    'exp:'||p_experiment_key||':'||p_subject_key, p_experiment_key, p_subject_key,
    p_opportunity_key, v_arm,
    coalesce(p_eligibility_snapshot,'{}'::jsonb) || jsonb_build_object(
      'experiment_class',v_policy.experiment_class,
      'policy_version',v_policy.policy_version,
      'primary_metric',v_policy.primary_metric,
      'segmentation',v_policy.segmentation
    ),
    now(), v_horizon, p_model_version,
    md5(p_experiment_key||'|'||p_subject_key||'|'||v_policy.policy_version), 'assigned'
  ) returning powerhouse_experiment_assignments.assignment_id into v_id;
  return query select v_id, v_arm, (v_arm='treatment'), v_horizon,
    'new_prospective_assignment'::text;
end;$$;
revoke execute on function public.powerhouse_prepare_experiment_action_v1(text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.powerhouse_prepare_experiment_action_v1(text,text,text,jsonb,text) to service_role;

create or replace function public.powerhouse_attach_treatment_action_v1(p_assignment_id uuid, p_action_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare a public.powerhouse_experiment_assignments%rowtype; s public.powerhouse_sales_actions%rowtype;
begin
  select * into a from public.powerhouse_experiment_assignments where assignment_id=p_assignment_id for update;
  if not found then raise exception 'assignment not found'; end if;
  if a.assignment_arm <> 'treatment' then raise exception 'holdout assignment cannot receive treatment action'; end if;
  select * into s from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found then raise exception 'action not found'; end if;
  if s.created_at < a.assigned_at then raise exception 'treatment action predates prospective assignment'; end if;
  if a.subject_key <> s.subject_key then raise exception 'subject mismatch between assignment and action'; end if;
  if a.opportunity_key is not null and s.opportunity_key is distinct from a.opportunity_key then
    raise exception 'opportunity mismatch between assignment and action';
  end if;
  update public.powerhouse_experiment_assignments
  set treatment_action_id=p_action_id,
      state=case when s.status='done' then 'treated' else state end,
      updated_at=now()
  where assignment_id=p_assignment_id;
  return jsonb_build_object('ok',true,'assignment_id',p_assignment_id,'action_id',p_action_id);
end;$$;
revoke execute on function public.powerhouse_attach_treatment_action_v1(uuid,uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_attach_treatment_action_v1(uuid,uuid) to service_role;

create or replace function public.powerhouse_record_action_economics_v1(
  p_action_id uuid,
  p_provider_cost_eur numeric default null,
  p_external_cost_eur numeric default null,
  p_human_minutes numeric default null,
  p_evidence jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare s public.powerhouse_sales_actions%rowtype; v_id uuid;
begin
  select * into s from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found or s.status <> 'done' or s.executed_at is null then
    raise exception 'economics require an executed done action';
  end if;
  if p_provider_cost_eur is null and p_external_cost_eur is null and p_human_minutes is null then
    raise exception 'at least one observed economics value is required';
  end if;
  if coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then raise exception 'economics evidence is required'; end if;
  insert into public.powerhouse_action_economics(
    dedupe_key,action_id,provider_cost_eur,external_cost_eur,human_minutes,observed_at,evidence
  ) values (
    'economics:'||p_action_id,p_action_id,p_provider_cost_eur,p_external_cost_eur,p_human_minutes,now(),p_evidence
  ) on conflict(action_id) do update set
    provider_cost_eur=excluded.provider_cost_eur,
    external_cost_eur=excluded.external_cost_eur,
    human_minutes=excluded.human_minutes,
    observed_at=excluded.observed_at,
    evidence=excluded.evidence,
    updated_at=now()
  returning economics_id into v_id;
  return v_id;
end;$$;
revoke execute on function public.powerhouse_record_action_economics_v1(uuid,numeric,numeric,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_record_action_economics_v1(uuid,numeric,numeric,numeric,jsonb) to service_role;

create or replace function public.powerhouse_record_human_feedback_v1(
  p_action_id uuid,
  p_feedback_type text,
  p_reason text default null,
  p_recommended_variant text default null,
  p_actual_variant text default null,
  p_alternative_action text default null,
  p_evidence jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare s public.powerhouse_sales_actions%rowtype; v_id uuid; v_key text;
begin
  if p_feedback_type not in ('approve','edit','skip','cancel','override','alternative_action') then
    raise exception 'unsupported feedback_type';
  end if;
  select * into s from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found then raise exception 'action not found'; end if;
  if coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then raise exception 'human feedback evidence is required'; end if;
  v_key := 'feedback:'||p_action_id||':'||p_feedback_type||':'||md5(coalesce(p_reason,'')||'|'||coalesce(p_actual_variant,'')||'|'||coalesce(p_alternative_action,''));
  insert into public.powerhouse_human_feedback_events(
    dedupe_key,action_id,opportunity_key,subject_key,feedback_type,reason,
    recommended_variant,actual_variant,alternative_action,observed_at,evidence
  ) values (
    v_key,p_action_id,s.opportunity_key,s.subject_key,p_feedback_type,p_reason,
    p_recommended_variant,p_actual_variant,p_alternative_action,now(),p_evidence
  ) on conflict(dedupe_key) do update set
    reason=excluded.reason,
    recommended_variant=excluded.recommended_variant,
    actual_variant=excluded.actual_variant,
    alternative_action=excluded.alternative_action,
    observed_at=excluded.observed_at,
    evidence=excluded.evidence
  returning feedback_id into v_id;
  return v_id;
end;$$;
revoke execute on function public.powerhouse_record_human_feedback_v1(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_record_human_feedback_v1(uuid,text,text,text,text,text,jsonb) to service_role;

create or replace function public.powerhouse_record_market_outcome_v1(
  p_action_id uuid,
  p_outcome_type text,
  p_revenue_eur numeric default null,
  p_occurred_at timestamptz default now(),
  p_attribution_class text default 'observed',
  p_evidence jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare s public.powerhouse_sales_actions%rowtype; v_id uuid; v_key text;
begin
  if p_attribution_class not in ('observed','influenced','causal') then raise exception 'invalid attribution_class'; end if;
  select * into s from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found then raise exception 'action not found'; end if;
  if p_revenue_eur is not null and p_revenue_eur <> 0 and coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then
    raise exception 'revenue requires source evidence';
  end if;
  v_key := 'outcome:'||p_action_id||':'||lower(p_outcome_type)||':'||to_char(p_occurred_at,'YYYYMMDDHH24MISS');
  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,
    occurred_at,content_key,topic_key,campaign_key,opportunity_key,channel
  ) values (
    p_action_id,v_key,p_outcome_type,s.subject_key,s.person_key,s.company_key,p_revenue_eur,
    coalesce(p_evidence,'{}'::jsonb)||jsonb_build_object('attribution_class',p_attribution_class),
    p_occurred_at,s.content_key,s.topic_key,s.campaign_key,s.opportunity_key,s.channel
  ) on conflict(dedupe_key) do update set
    revenue_eur=excluded.revenue_eur,evidence=excluded.evidence,occurred_at=excluded.occurred_at
  returning outcome_id into v_id;
  update public.powerhouse_sales_actions set outcome_id=coalesce(outcome_id,v_id),updated_at=now() where action_id=p_action_id;
  return v_id;
end;$$;
revoke execute on function public.powerhouse_record_market_outcome_v1(uuid,text,numeric,timestamptz,text,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_record_market_outcome_v1(uuid,text,numeric,timestamptz,text,jsonb) to service_role;

create or replace function public.powerhouse_close_matured_no_response_v1()
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_inserted integer:=0; v_closed integer:=0;
begin
  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,revenue_eur,evidence,occurred_at,opportunity_key,channel
  )
  select a.treatment_action_id,'no-response:'||a.assignment_id,'no_response',a.subject_key,0,
    jsonb_build_object('source','measurement_horizon','assignment_id',a.assignment_id,'experiment_key',a.experiment_key,'assignment_arm',a.assignment_arm,'attribution_class','observed'),
    a.measurement_horizon_end,a.opportunity_key,sa.channel
  from public.powerhouse_experiment_assignments a
  left join public.powerhouse_sales_actions sa on sa.action_id=a.treatment_action_id
  where a.measurement_horizon_end<=now()
    and a.state not in ('closed','cancelled')
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where (o.action_id=a.treatment_action_id and a.treatment_action_id is not null)
         or (o.subject_key=a.subject_key and o.opportunity_key is not distinct from a.opportunity_key
             and o.occurred_at>=a.assigned_at and o.occurred_at<=a.measurement_horizon_end)
    )
  on conflict(dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;
  update public.powerhouse_experiment_assignments
  set state='closed',updated_at=now()
  where measurement_horizon_end<=now() and state not in ('closed','cancelled');
  get diagnostics v_closed=row_count;
  return jsonb_build_object('no_response_inserted',v_inserted,'assignments_closed',v_closed,'closed_at',now());
end;$$;
revoke execute on function public.powerhouse_close_matured_no_response_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_close_matured_no_response_v1() to service_role;

create or replace view public.powerhouse_experiment_collision_contamination_v1 as
with overlap_rows as (
  select a.assignment_id,a.experiment_key,a.subject_key,a.assignment_arm,a.assigned_at,a.measurement_horizon_end,
    count(*) over(partition by a.subject_key) as active_subject_experiments
  from public.powerhouse_experiment_assignments a
  where a.state not in ('closed','cancelled') and a.measurement_horizon_end>now()
)
select o.*,
  (o.active_subject_experiments>1) as experiment_collision,
  case when o.assignment_arm='holdout' and exists(
    select 1 from public.powerhouse_sales_actions s
    where s.subject_key=o.subject_key
      and s.created_at between o.assigned_at and o.measurement_horizon_end
      and s.status='done'
  ) then true else false end as holdout_contaminated
from overlap_rows o;
alter view public.powerhouse_experiment_collision_contamination_v1 set (security_invoker=true);
revoke all on table public.powerhouse_experiment_collision_contamination_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_collision_contamination_v1 to service_role;

create or replace view public.powerhouse_experiment_effect_estimates_v1 as
with base as (
  select a.experiment_key,a.assignment_arm,
    count(*) filter(where a.measurement_horizon_end<=now())::numeric as matured,
    count(distinct a.assignment_id) filter(where exists(
      select 1 from public.powerhouse_sales_outcomes o
      where (o.action_id=a.treatment_action_id and a.treatment_action_id is not null)
         or (o.subject_key=a.subject_key and o.opportunity_key is not distinct from a.opportunity_key
             and o.occurred_at between a.assigned_at and a.measurement_horizon_end)
    ))::numeric as with_outcome,
    coalesce(sum((select coalesce(sum(o.revenue_eur),0)
      from public.powerhouse_sales_outcomes o
      where (o.action_id=a.treatment_action_id and a.treatment_action_id is not null)
         or (o.subject_key=a.subject_key and o.opportunity_key is not distinct from a.opportunity_key
             and o.occurred_at between a.assigned_at and a.measurement_horizon_end))),0)::numeric as revenue
  from public.powerhouse_experiment_assignments a
  group by a.experiment_key,a.assignment_arm
), p as (select * from public.powerhouse_experiment_policies)
select p.experiment_key,p.policy_version,p.min_matured_per_arm,
  coalesce(t.matured,0) as matured_treatment,
  coalesce(h.matured,0) as matured_holdout,
  case when coalesce(t.matured,0)>0 then t.revenue/t.matured end as treatment_revenue_per_assignment,
  case when coalesce(h.matured,0)>0 then h.revenue/h.matured end as holdout_revenue_per_assignment,
  case when coalesce(t.matured,0)>0 and coalesce(h.matured,0)>0 then (t.revenue/t.matured)-(h.revenue/h.matured) end as revenue_uplift_per_assignment,
  case when coalesce(t.matured,0)>0 then t.with_outcome/t.matured end as treatment_outcome_rate,
  case when coalesce(h.matured,0)>0 then h.with_outcome/h.matured end as holdout_outcome_rate,
  (coalesce(t.matured,0)>=p.min_matured_per_arm and coalesce(h.matured,0)>=p.min_matured_per_arm) as sample_floor_met,
  case
    when coalesce(t.matured,0)<p.min_matured_per_arm or coalesce(h.matured,0)<p.min_matured_per_arm then 'insufficient_sample'
    when (t.revenue/nullif(t.matured,0))>(h.revenue/nullif(h.matured,0)) then 'observed_positive_uplift'
    when (t.revenue/nullif(t.matured,0))=(h.revenue/nullif(h.matured,0)) then 'observed_no_uplift'
    else 'observed_negative_uplift'
  end as observed_effect_state
from p
left join base t on t.experiment_key=p.experiment_key and t.assignment_arm='treatment'
left join base h on h.experiment_key=p.experiment_key and h.assignment_arm='holdout';
alter view public.powerhouse_experiment_effect_estimates_v1 set (security_invoker=true);
revoke all on table public.powerhouse_experiment_effect_estimates_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_effect_estimates_v1 to service_role;

create or replace view public.powerhouse_experiment_evidence_health_v1 as
select now() as measured_at,
  count(*) filter(where a.state not in ('closed','cancelled'))::bigint as open_assignments,
  count(*) filter(where a.measurement_horizon_end<=now() and a.state not in ('closed','cancelled'))::bigint as overdue_horizons,
  count(*) filter(where a.assignment_arm='treatment' and a.treatment_action_id is null)::bigint as treatment_without_action,
  count(*) filter(where a.assignment_arm='treatment' and a.treatment_action_id is not null and s.status='done' and e.economics_id is null)::bigint as executed_without_economics,
  count(*) filter(where a.assignment_arm='holdout' and c.holdout_contaminated)::bigint as contaminated_holdouts,
  count(*) filter(where c.experiment_collision)::bigint as collision_assignments,
  (select count(*) from public.powerhouse_human_feedback_events where coalesce(evidence,'{}'::jsonb)='{}'::jsonb)::bigint as feedback_without_evidence,
  (select count(*) from public.powerhouse_sales_outcomes where coalesce(revenue_eur,0)<>0 and coalesce(evidence,'{}'::jsonb)='{}'::jsonb)::bigint as revenue_without_evidence,
  case when count(*) filter(where a.measurement_horizon_end<=now() and a.state not in ('closed','cancelled'))=0
         and count(*) filter(where a.assignment_arm='holdout' and c.holdout_contaminated)=0
         and count(*) filter(where c.experiment_collision)=0
       then 'healthy_or_collecting' else 'attention_required' end as health_state
from public.powerhouse_experiment_assignments a
left join public.powerhouse_sales_actions s on s.action_id=a.treatment_action_id
left join public.powerhouse_action_economics e on e.action_id=a.treatment_action_id
left join public.powerhouse_experiment_collision_contamination_v1 c on c.assignment_id=a.assignment_id;
alter view public.powerhouse_experiment_evidence_health_v1 set (security_invoker=true);
revoke all on table public.powerhouse_experiment_evidence_health_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_evidence_health_v1 to service_role;

comment on table public.powerhouse_experiment_policies is 'Canonical experiment design policy registry for prospective treatment/holdout assignments, horizons, sample floors, segmentation and guardrails.';
comment on table public.powerhouse_policy_versions is 'Versioned decision-policy lifecycle and promotion/demotion evidence; not a parallel learning store.';
comment on function public.powerhouse_prepare_experiment_action_v1(text,text,text,jsonb,text) is 'Prospective assignment authority. Must run before any treatment action; returns holdout/treatment and may_execute_treatment.';
comment on function public.powerhouse_close_matured_no_response_v1() is 'Closes expired experiment horizons and writes explicit no_response negative market evidence when no observed outcome exists.';
comment on view public.powerhouse_experiment_collision_contamination_v1 is 'Detects overlapping active experiments and holdout contamination.';
comment on view public.powerhouse_experiment_effect_estimates_v1 is 'Observed treatment-vs-holdout effect projection with minimum sample floor. Does not claim causal confidence beyond observed evidence.';
comment on view public.powerhouse_experiment_evidence_health_v1 is 'Daily evidence completeness and contamination health for the Powerhouse experiment loop.';
