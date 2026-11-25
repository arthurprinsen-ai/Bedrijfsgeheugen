-- Action learning production-truth classification v1
-- Keep test/demo fixtures and optional human evidence from distorting autonomous production health.

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
  v_nonproduction boolean := false;
  v_event_source text;
begin
  select * into a
  from public.powerhouse_sales_actions
  where action_id=p_action_id;

  if not found or a.executed_at is null then
    return;
  end if;

  select e.source into v_event_source
  from public.powerhouse_runtime_events e
  where e.event_id=a.event_id;

  v_nonproduction :=
    lower(coalesce(v_event_source,'')) like 'e2e-test%'
    or lower(coalesce(v_event_source,'')) like 'test-fixture%'
    or lower(coalesce(a.subject_key,'')) like '%/test-%';

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
    case when v_nonproduction or v_outcome then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'production_scope',case when v_nonproduction then 'non_production_test' else 'production' end,
      'obligation_class','system_evidence',
      'closure_reason',case
        when v_nonproduction then 'excluded_test_fixture'
        when v_outcome then 'observed_evidence_present'
        else null
      end,
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
    case when v_nonproduction or v_economics then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'production_scope',case when v_nonproduction then 'non_production_test' else 'production' end,
      'obligation_class','system_evidence',
      'closure_reason',case
        when v_nonproduction then 'excluded_test_fixture'
        when v_economics then 'observed_evidence_present'
        else null
      end,
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
    case when v_nonproduction or v_feedback then 'CLOSED' else 'OPEN' end,
    jsonb_build_object(
      'action_id',p_action_id,
      'action_type',a.action_type,
      'channel',a.channel,
      'production_scope',case when v_nonproduction then 'non_production_test' else 'production' end,
      'obligation_class','human_optional_evidence',
      'closure_reason',case
        when v_nonproduction then 'excluded_test_fixture'
        when v_feedback then 'explicit_human_feedback_present'
        else null
      end,
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

select public.powerhouse_reconcile_action_learning_obligations_v1(action_id)
from public.powerhouse_sales_actions
where executed_at is not null;

create or replace view public.powerhouse_action_learning_readiness_v1
with (security_invoker=true) as
select
  count(*) filter(
    where status='OPEN'
      and coalesce(payload->>'production_scope','production')='production'
  ) as open_obligations,
  count(*) filter(
    where status='OPEN'
      and due_at<=now()
      and coalesce(payload->>'production_scope','production')='production'
      and coalesce(payload->>'obligation_class','system_evidence')='system_evidence'
  ) as overdue_obligations,
  count(*) filter(
    where status='OPEN'
      and due_at>now()
      and coalesce(payload->>'production_scope','production')='production'
      and coalesce(payload->>'obligation_class','system_evidence')='system_evidence'
  ) as future_obligations,
  count(*) filter(
    where status='CLOSED'
      and coalesce(payload->>'production_scope','production')='production'
  ) as closed_obligations,
  count(*) filter(
    where type='ACTION_OUTCOME_EVIDENCE'
      and status='OPEN'
      and coalesce(payload->>'production_scope','production')='production'
  ) as missing_outcome_evidence,
  count(*) filter(
    where type='ACTION_ECONOMICS_EVIDENCE'
      and status='OPEN'
      and coalesce(payload->>'production_scope','production')='production'
  ) as missing_economics_evidence,
  count(*) filter(
    where type='ACTION_HUMAN_FEEDBACK_EVIDENCE'
      and status='OPEN'
      and coalesce(payload->>'production_scope','production')='production'
  ) as missing_feedback_evidence,
  now() observed_at,
  count(*) filter(
    where status='OPEN'
      and coalesce(payload->>'production_scope','production')='production'
      and payload->>'obligation_class'='human_optional_evidence'
  ) as awaiting_human_feedback,
  count(*) filter(
    where status='CLOSED'
      and payload->>'production_scope'='non_production_test'
  ) as excluded_test_obligations,
  count(*) filter(
    where status='OPEN'
      and due_at<=now()
      and coalesce(payload->>'production_scope','production')='production'
      and coalesce(payload->>'obligation_class','system_evidence')='system_evidence'
  ) as overdue_system_obligations
from public.revenue_learning_obligations
where type in ('ACTION_OUTCOME_EVIDENCE','ACTION_ECONOMICS_EVIDENCE','ACTION_HUMAN_FEEDBACK_EVIDENCE');
revoke all on public.powerhouse_action_learning_readiness_v1 from anon,authenticated;
grant select on public.powerhouse_action_learning_readiness_v1 to service_role;

comment on view public.powerhouse_action_learning_readiness_v1 is
'Production-truth learning readiness. Test fixtures are excluded from production debt; missing explicit human feedback is visible as awaiting human evidence, never as an autonomous system failure.';
