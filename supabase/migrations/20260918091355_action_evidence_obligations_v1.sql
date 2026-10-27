-- Action evidence obligations v1
-- Close the action -> outcome/economics/feedback learning loop without fabricating evidence.

create or replace function public.powerhouse_reconcile_action_learning_obligations_v1(p_action_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  a public.powerhouse_sales_actions%rowtype;
  v_outcome boolean;
  v_economics boolean;
  v_feedback boolean;
begin
  select * into a
  from public.powerhouse_sales_actions
  where action_id=p_action_id;

  if not found or a.executed_at is null then
    return;
  end if;

  select exists(select 1 from public.powerhouse_sales_outcomes so where so.action_id=p_action_id) into v_outcome;
  select exists(select 1 from public.powerhouse_action_economics e where e.action_id=p_action_id) into v_economics;
  select exists(select 1 from public.powerhouse_human_feedback_events f where f.action_id=p_action_id) into v_feedback;

  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at
  ) values (
    'canonical',
    'sales-action:'||p_action_id::text||':outcome',
    'ACTION_OUTCOME_EVIDENCE',
    p_action_id::text,
    72,
    case when v_outcome then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'required','observed outcome evidence only; no inferred commercial success',
      'truth_boundary','absence of an observed outcome is not converted into a synthetic negative outcome'
    ),
    a.executed_at+interval '72 hours',
    now()
  )
  on conflict (tenant_id,obligation_id) do update set
    status=excluded.status,
    payload=excluded.payload,
    due_at=excluded.due_at,
    updated_at=now();

  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at
  ) values (
    'canonical',
    'sales-action:'||p_action_id::text||':economics',
    'ACTION_ECONOMICS_EVIDENCE',
    p_action_id::text,
    24,
    case when v_economics then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'required','observed provider/external cost and/or human minutes; zero is allowed only when measured',
      'truth_boundary','costs and effort are never defaulted to zero'
    ),
    a.executed_at+interval '24 hours',
    now()
  )
  on conflict (tenant_id,obligation_id) do update set
    status=excluded.status,
    payload=excluded.payload,
    due_at=excluded.due_at,
    updated_at=now();

  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at
  ) values (
    'canonical',
    'sales-action:'||p_action_id::text||':feedback',
    'ACTION_HUMAN_FEEDBACK_EVIDENCE',
    p_action_id::text,
    24,
    case when v_feedback then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'required','explicit human feedback when available',
      'truth_boundary','no sentiment or preference is inferred from silence'
    ),
    a.executed_at+interval '24 hours',
    now()
  )
  on conflict (tenant_id,obligation_id) do update set
    status=excluded.status,
    payload=excluded.payload,
    due_at=excluded.due_at,
    updated_at=now();
end
$$;

revoke execute on function public.powerhouse_reconcile_action_learning_obligations_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_action_learning_obligations_v1(uuid) to service_role;

create or replace function public.powerhouse_action_learning_obligation_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.powerhouse_reconcile_action_learning_obligations_v1(coalesce(new.action_id,old.action_id));
  return coalesce(new,old);
end
$$;

revoke execute on function public.powerhouse_action_learning_obligation_trigger_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_action_learning_obligation_trigger_v1() to service_role;

drop trigger if exists powerhouse_sales_action_learning_obligation_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_sales_action_learning_obligation_v1
after insert or update of executed_at,status
on public.powerhouse_sales_actions
for each row execute function public.powerhouse_action_learning_obligation_trigger_v1();

drop trigger if exists powerhouse_sales_outcome_learning_obligation_v1 on public.powerhouse_sales_outcomes;
create trigger powerhouse_sales_outcome_learning_obligation_v1
after insert or update or delete
on public.powerhouse_sales_outcomes
for each row execute function public.powerhouse_action_learning_obligation_trigger_v1();

drop trigger if exists powerhouse_action_economics_learning_obligation_v1 on public.powerhouse_action_economics;
create trigger powerhouse_action_economics_learning_obligation_v1
after insert or update or delete
on public.powerhouse_action_economics
for each row execute function public.powerhouse_action_learning_obligation_trigger_v1();

drop trigger if exists powerhouse_human_feedback_learning_obligation_v1 on public.powerhouse_human_feedback_events;
create trigger powerhouse_human_feedback_learning_obligation_v1
after insert or update or delete
on public.powerhouse_human_feedback_events
for each row execute function public.powerhouse_action_learning_obligation_trigger_v1();

select public.powerhouse_reconcile_action_learning_obligations_v1(action_id)
from public.powerhouse_sales_actions
where executed_at is not null;

create or replace view public.powerhouse_action_learning_readiness_v1
with (security_invoker=true) as
select
  count(*) filter(where status='OPEN') open_obligations,
  count(*) filter(where status='OPEN' and due_at<=now()) overdue_obligations,
  count(*) filter(where status='OPEN' and due_at>now()) future_obligations,
  count(*) filter(where status='CLOSED') closed_obligations,
  count(*) filter(where type='ACTION_OUTCOME_EVIDENCE' and status='OPEN') missing_outcome_evidence,
  count(*) filter(where type='ACTION_ECONOMICS_EVIDENCE' and status='OPEN') missing_economics_evidence,
  count(*) filter(where type='ACTION_HUMAN_FEEDBACK_EVIDENCE' and status='OPEN') missing_feedback_evidence,
  now() observed_at
from public.revenue_learning_obligations
where type in ('ACTION_OUTCOME_EVIDENCE','ACTION_ECONOMICS_EVIDENCE','ACTION_HUMAN_FEEDBACK_EVIDENCE');

revoke all on public.powerhouse_action_learning_readiness_v1 from anon,authenticated;
grant select on public.powerhouse_action_learning_readiness_v1 to service_role;

comment on view public.powerhouse_action_learning_readiness_v1 is
'Truthful action-learning readiness: missing outcome, economics and explicit human feedback remain obligations until observed evidence exists.';
