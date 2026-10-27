-- Sales action -> canonical decision cycle materializer v1
-- Every observed sales action becomes a traceable SIGNAL-stage decision cycle.
-- No execution, outcome, economics, value or human feedback is synthesized.

create or replace function public.powerhouse_open_cycle_from_sales_action_v1(p_action_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  a public.powerhouse_sales_actions%rowtype;
  v_subject text;
  v_evidence_ref text;
begin
  select * into a
  from public.powerhouse_sales_actions
  where action_id=p_action_id;

  if not found then
    return;
  end if;

  v_subject := coalesce(
    nullif(a.subject_key,''),
    nullif(a.opportunity_key,''),
    nullif(a.person_key,''),
    nullif(a.company_key,''),
    a.action_id::text
  );
  v_evidence_ref := 'powerhouse_sales_actions:' || a.action_id::text;

  insert into public.powerhouse_decision_cycles(
    tenant_id,cycle_id,subject_key,source_signal_ref,current_stage,status,opened_at,updated_at
  )
  values(
    'canonical',a.action_id,v_subject,v_evidence_ref,'signal','open',a.created_at,now()
  )
  on conflict (tenant_id,cycle_id) do update set
    subject_key=coalesce(public.powerhouse_decision_cycles.subject_key,excluded.subject_key),
    source_signal_ref=excluded.source_signal_ref,
    updated_at=now();

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,
    evidence_ref,idempotency_key,payload,occurred_at
  )
  values(
    'canonical',a.action_id,1,'signal','powerhouse_sales_actions',a.action_id::text,
    v_evidence_ref,'sales-action-signal:' || a.action_id::text,
    jsonb_build_object(
      'action_type',a.action_type,
      'channel',a.channel,
      'status',a.status,
      'opportunity_key',a.opportunity_key,
      'event_id',a.event_id,
      'truth','observed_sales_action'
    ),
    a.created_at
  )
  on conflict (tenant_id,idempotency_key) do nothing;
end
$$;

revoke execute on function public.powerhouse_open_cycle_from_sales_action_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_open_cycle_from_sales_action_v1(uuid) to service_role;

create or replace function public.powerhouse_sales_action_cycle_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.powerhouse_open_cycle_from_sales_action_v1(new.action_id);
  return new;
end
$$;

revoke execute on function public.powerhouse_sales_action_cycle_trigger_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_sales_action_cycle_trigger_v1() to service_role;

drop trigger if exists powerhouse_sales_action_cycle_materializer_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_sales_action_cycle_materializer_v1
after insert on public.powerhouse_sales_actions
for each row
execute function public.powerhouse_sales_action_cycle_trigger_v1();

select public.powerhouse_open_cycle_from_sales_action_v1(action_id)
from public.powerhouse_sales_actions
order by created_at,action_id;

comment on function public.powerhouse_open_cycle_from_sales_action_v1(uuid) is
'Idempotently materializes one observed powerhouse_sales_actions row into one canonical decision cycle at SIGNAL stage only. Later stages remain evidence-first and must be produced by their own observed authorities.';
