-- Execution evidence obligations v1
-- Missing outcome/economics/feedback remains explicit evidence debt; test actions never contaminate production learning.

create or replace function public.powerhouse_materialize_execution_evidence_obligations_v1(p_action_id uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  a public.powerhouse_sales_actions%rowtype;
  v_is_test boolean;
  v_economics public.powerhouse_action_economics%rowtype;
  v_feedback public.powerhouse_human_feedback_events%rowtype;
begin
  select * into a from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found or a.executed_at is null then return; end if;

  v_is_test :=
    coalesce((a.evidence->>'is_test')::boolean,false)
    or lower(coalesce(a.subject_key,'')) ~ '(^|/)test[-/:0-9]'
    or lower(coalesce(a.person_key,'')) ~ '(^|/)test[-/:0-9]'
    or lower(coalesce(a.company_key,'')) ~ '(^|/)test[-/:0-9]';

  if v_is_test then
    update public.powerhouse_runtime_events
       set state='ignored',
           context=coalesce(context,'{}'::jsonb)||jsonb_build_object(
             'ignored_reason','explicit_test_action',
             'ignored_by','powerhouse-execution-evidence-obligations-v1',
             'truth_boundary','test execution is retained as history but excluded from production learning debt'
           ),
           updated_at=now()
     where evidence->>'action_id'=a.action_id::text
       and event_type in ('outcome_readback_required','action_economics_required','human_feedback_required')
       and state not in ('closed','ignored');
    return;
  end if;

  select * into v_economics
  from public.powerhouse_action_economics
  where action_id=a.action_id
  order by observed_at desc,economics_id desc
  limit 1;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,opportunity_key,
    occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'action-economics-required:'||a.action_id,
    'action_economics_required','powerhouse-execution-evidence-obligations-v1',
    a.subject_key,a.person_key,a.company_key,a.opportunity_key,a.executed_at,
    jsonb_build_object(
      'action_id',a.action_id,'action_type',a.action_type,'channel',a.channel,
      'executed_at',a.executed_at,
      'economics_id',case when v_economics.economics_id is null then null else v_economics.economics_id end
    ),
    jsonb_build_object(
      'required_evidence',jsonb_build_array('provider_cost_eur','external_cost_eur','human_minutes','source evidence'),
      'truth_boundary','unknown costs and effort remain missing; zero is never inferred from absence'
    ),
    case when v_economics.economics_id is null then 'decided' else 'closed' end,
    case when v_economics.economics_id is null then 'MISSING_EVIDENCE' else 'OBSERVED' end,
    1,now()
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    updated_at=now();

  select * into v_feedback
  from public.powerhouse_human_feedback_events
  where action_id=a.action_id
  order by observed_at desc,feedback_id desc
  limit 1;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,opportunity_key,
    occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'human-feedback-required:'||a.action_id,
    'human_feedback_required','powerhouse-execution-evidence-obligations-v1',
    a.subject_key,a.person_key,a.company_key,a.opportunity_key,a.executed_at,
    jsonb_build_object(
      'action_id',a.action_id,'action_type',a.action_type,'channel',a.channel,
      'executed_at',a.executed_at,
      'feedback_id',case when v_feedback.feedback_id is null then null else v_feedback.feedback_id end
    ),
    jsonb_build_object(
      'required_evidence','explicit observed human feedback or a canonical human-confirmed outcome',
      'truth_boundary','absence of feedback is not approval, rejection or no-response'
    ),
    case when v_feedback.feedback_id is null then 'decided' else 'closed' end,
    case when v_feedback.feedback_id is null then 'MISSING_EVIDENCE' else 'OBSERVED' end,
    1,now()
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    updated_at=now();
end
$$;

revoke execute on function public.powerhouse_materialize_execution_evidence_obligations_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_execution_evidence_obligations_v1(uuid) to service_role;

create or replace function public.powerhouse_sales_action_execution_evidence_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if new.executed_at is not null then
    perform public.powerhouse_materialize_execution_evidence_obligations_v1(new.action_id);
  end if;
  return new;
end
$$;

revoke execute on function public.powerhouse_sales_action_execution_evidence_trigger_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_sales_action_execution_evidence_trigger_v1() to service_role;

drop trigger if exists powerhouse_sales_action_execution_evidence_materializer_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_sales_action_execution_evidence_materializer_v1
after insert or update of executed_at,status on public.powerhouse_sales_actions
for each row
when (new.executed_at is not null)
execute function public.powerhouse_sales_action_execution_evidence_trigger_v1();

create or replace function public.powerhouse_economics_evidence_close_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  perform public.powerhouse_materialize_execution_evidence_obligations_v1(new.action_id);
  return new;
end
$$;

revoke execute on function public.powerhouse_economics_evidence_close_trigger_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_economics_evidence_close_trigger_v1() to service_role;

drop trigger if exists powerhouse_economics_evidence_close_v1 on public.powerhouse_action_economics;
create trigger powerhouse_economics_evidence_close_v1
after insert or update on public.powerhouse_action_economics
for each row execute function public.powerhouse_economics_evidence_close_trigger_v1();

create or replace function public.powerhouse_feedback_evidence_close_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if new.action_id is not null then
    perform public.powerhouse_materialize_execution_evidence_obligations_v1(new.action_id);
  end if;
  return new;
end
$$;

revoke execute on function public.powerhouse_feedback_evidence_close_trigger_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_feedback_evidence_close_trigger_v1() to service_role;

drop trigger if exists powerhouse_feedback_evidence_close_v1 on public.powerhouse_human_feedback_events;
create trigger powerhouse_feedback_evidence_close_v1
after insert on public.powerhouse_human_feedback_events
for each row execute function public.powerhouse_feedback_evidence_close_trigger_v1();

select public.powerhouse_materialize_execution_evidence_obligations_v1(action_id)
from public.powerhouse_sales_actions
where executed_at is not null
order by executed_at,action_id;

create or replace view public.powerhouse_execution_evidence_gap_v1
with (security_invoker=true) as
select
  a.action_id,a.action_type,a.channel,a.status,a.executed_at,a.subject_key,a.person_key,a.company_key,a.opportunity_key,
  false as is_test,
  exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id) as has_outcome,
  exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id) as has_economics,
  exists(select 1 from public.powerhouse_human_feedback_events f where f.action_id=a.action_id) as has_feedback,
  not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id) as outcome_missing,
  not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id) as economics_missing,
  not exists(select 1 from public.powerhouse_human_feedback_events f where f.action_id=a.action_id) as feedback_missing
from public.powerhouse_sales_actions a
where a.executed_at is not null
  and not (
    coalesce((a.evidence->>'is_test')::boolean,false)
    or lower(coalesce(a.subject_key,'')) ~ '(^|/)test[-/:0-9]'
    or lower(coalesce(a.person_key,'')) ~ '(^|/)test[-/:0-9]'
    or lower(coalesce(a.company_key,'')) ~ '(^|/)test[-/:0-9]'
  );

revoke all on public.powerhouse_execution_evidence_gap_v1 from anon,authenticated;
grant select on public.powerhouse_execution_evidence_gap_v1 to service_role;

comment on view public.powerhouse_execution_evidence_gap_v1 is
'Production-only executed action evidence debt. Explicit test actions are preserved in source history but excluded from production learning gaps. Missing outcome/economics/feedback stays explicit and never becomes inferred zero or implicit feedback.';
