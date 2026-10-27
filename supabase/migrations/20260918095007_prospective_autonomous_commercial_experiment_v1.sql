-- Prospective autonomous commercial experiment v1
-- Activates evidence-first treatment/holdout learning only when a genuinely eligible
-- autonomous commercial action with positive expected value first appears.
-- Existing actions are never retroactively assigned.

create or replace function public.powerhouse_autonomous_commercial_experiment_before_insert_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_experiment_key constant text := 'autonomous-commercial-action-v1';
  v_policy public.powerhouse_experiment_policies%rowtype;
  v_assignment record;
  v_conflict public.powerhouse_experiment_assignments%rowtype;
begin
  -- Only prospective Powerhouse-autonomous commercial actions are eligible.
  if new.dedupe_key not like 'autonomy:%'
     or coalesce(new.expected_value_eur,0) <= 0
     or nullif(btrim(new.subject_key),'') is null
     or nullif(btrim(new.opportunity_key),'') is null
     or lower(coalesce(new.channel,'')) in ('internal','internal_research','content')
     or lower(coalesce(new.action_type,'')) ~ '(research|review|cost)'
  then
    return new;
  end if;

  -- Never contaminate another active experiment on the same subject.
  select * into v_conflict
  from public.powerhouse_experiment_assignments
  where subject_key=new.subject_key
    and experiment_key<>v_experiment_key
    and state not in ('closed','cancelled')
    and measurement_horizon_end>now()
  order by assigned_at
  limit 1;

  if found then
    -- An existing holdout remains a holdout. A treatment assignment keeps its own
    -- experiment authority; this new action is not enrolled in a second experiment.
    if v_conflict.assignment_arm='holdout' then
      return null;
    end if;
    return new;
  end if;

  -- Latent activation: no policy exists until the first eligible prospective action.
  insert into public.powerhouse_experiment_policies(
    experiment_key,experiment_class,policy_version,status,treatment_pct,
    measurement_horizon_hours,min_matured_per_arm,primary_metric,
    segmentation,guardrails,evidence,effective_from,updated_at
  ) values (
    v_experiment_key,
    'autonomous_commercial_action',
    'v1',
    'active',
    80,
    168,
    20,
    'realized_revenue_per_assignment',
    jsonb_build_object(
      'source','powerhouse_sales_actions',
      'prospective_only',true,
      'requires_positive_expected_value',true
    ),
    jsonb_build_object(
      'no_retroactive_assignment',true,
      'holdout_has_no_treatment_action',true,
      'existing_contact_pressure_identity_truth_and_provider_gates_remain_mandatory',true,
      'promotion_requires_sample_floor_calibration_actionability_no_contamination_and_positive_uplift',true
    ),
    jsonb_build_object(
      'activation','first_eligible_autonomous_commercial_action',
      'authority','powerhouse_prepare_experiment_action_v1',
      'promotion_authority','powerhouse_promote_policy_if_proven_v1'
    ),
    now(),
    now()
  )
  on conflict (experiment_key) do nothing;

  select * into v_policy
  from public.powerhouse_experiment_policies
  where experiment_key=v_experiment_key;

  -- A deliberately paused/retired policy must never be silently reactivated.
  if not found or v_policy.status<>'active' then
    return new;
  end if;

  insert into public.powerhouse_policy_versions(
    experiment_key,policy_version,decision_state,effect_snapshot,evidence
  ) values (
    v_experiment_key,
    v_policy.policy_version,
    'baseline',
    '{}'::jsonb,
    jsonb_build_object(
      'source','prospective_autonomous_commercial_experiment_v1',
      'activated_at',now(),
      'truth_boundary','baseline records policy existence only; it is not proof of uplift'
    )
  )
  on conflict (experiment_key,policy_version) do nothing;

  select *
  into v_assignment
  from public.powerhouse_prepare_experiment_action_v1(
    v_experiment_key,
    new.subject_key,
    new.opportunity_key,
    jsonb_build_object(
      'source_action_dedupe_key',new.dedupe_key,
      'action_type',new.action_type,
      'channel',new.channel,
      'expected_value_eur',new.expected_value_eur,
      'prospective',true
    ),
    'powerhouse-autonomous-growth-revenue-v1'
  );

  if v_assignment.assignment_arm='holdout' then
    return null;
  end if;

  new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
    'experiment_assignment',
    jsonb_build_object(
      'experiment_key',v_experiment_key,
      'policy_version',v_policy.policy_version,
      'assignment_id',v_assignment.assignment_id,
      'assignment_arm',v_assignment.assignment_arm,
      'assigned_before_action',true,
      'measurement_horizon_end',v_assignment.measurement_horizon_end
    )
  );

  return new;
end
$$;

revoke execute on function public.powerhouse_autonomous_commercial_experiment_before_insert_v1()
from public,anon,authenticated;
grant execute on function public.powerhouse_autonomous_commercial_experiment_before_insert_v1()
to service_role;

create or replace function public.powerhouse_autonomous_commercial_experiment_after_insert_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_assignment_id uuid;
begin
  v_assignment_id := nullif(new.evidence#>>'{experiment_assignment,assignment_id}','')::uuid;
  if v_assignment_id is not null then
    perform public.powerhouse_attach_treatment_action_v1(v_assignment_id,new.action_id);
  end if;
  return new;
end
$$;

revoke execute on function public.powerhouse_autonomous_commercial_experiment_after_insert_v1()
from public,anon,authenticated;
grant execute on function public.powerhouse_autonomous_commercial_experiment_after_insert_v1()
to service_role;

drop trigger if exists powerhouse_autonomous_commercial_experiment_before_insert_v1
on public.powerhouse_sales_actions;
create trigger powerhouse_autonomous_commercial_experiment_before_insert_v1
before insert on public.powerhouse_sales_actions
for each row execute function public.powerhouse_autonomous_commercial_experiment_before_insert_v1();

drop trigger if exists powerhouse_autonomous_commercial_experiment_after_insert_v1
on public.powerhouse_sales_actions;
create trigger powerhouse_autonomous_commercial_experiment_after_insert_v1
after insert on public.powerhouse_sales_actions
for each row execute function public.powerhouse_autonomous_commercial_experiment_after_insert_v1();

create or replace view public.powerhouse_autonomous_experiment_readiness_v1
with (security_invoker=true) as
with policy as (
  select *
  from public.powerhouse_experiment_policies
  where experiment_key='autonomous-commercial-action-v1'
), assignments as (
  select *
  from public.powerhouse_experiment_assignments
  where experiment_key='autonomous-commercial-action-v1'
)
select
  case
    when not exists(select 1 from policy) then 'LATENT_WAITING_FOR_ELIGIBLE_ACTION'
    when exists(select 1 from policy where status='active') and not exists(select 1 from assignments) then 'ACTIVE_WAITING_FOR_FIRST_ASSIGNMENT'
    when exists(select 1 from assignments where state not in ('closed','cancelled')) then 'COLLECTING'
    else 'MATURED_OR_CLOSED'
  end readiness_state,
  (select status from policy limit 1) policy_status,
  (select policy_version from policy limit 1) policy_version,
  (select count(*) from assignments) assignments,
  (select count(*) from assignments where assignment_arm='treatment') treatment_assignments,
  (select count(*) from assignments where assignment_arm='holdout') holdout_assignments,
  (select count(*) from assignments where assignment_arm='treatment' and treatment_action_id is not null) linked_treatments,
  (select count(*) from public.powerhouse_experiment_collision_contamination_v1
    where experiment_key='autonomous-commercial-action-v1'
      and (experiment_collision or holdout_contaminated)) contaminated_or_colliding_assignments,
  now() observed_at;

revoke all on public.powerhouse_autonomous_experiment_readiness_v1 from anon,authenticated;
grant select on public.powerhouse_autonomous_experiment_readiness_v1 to service_role;

comment on view public.powerhouse_autonomous_experiment_readiness_v1 is
'Prospective autonomous commercial experiment readiness. No policy or assignment is created until the first eligible positive-value autonomous action; historical actions are never backfilled.';
