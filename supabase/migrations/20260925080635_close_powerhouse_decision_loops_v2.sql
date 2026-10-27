
create unique index if not exists powerhouse_cycle_events_idempotency_uq
on public.powerhouse_cycle_events(tenant_id,idempotency_key);

create unique index if not exists powerhouse_cycle_events_sequence_uq
on public.powerhouse_cycle_events(tenant_id,cycle_id,sequence_no);

create or replace function public.powerhouse_append_cycle_event_v2(
  p_tenant_id text,
  p_cycle_id uuid,
  p_stage text,
  p_entity_type text,
  p_entity_id text,
  p_evidence_ref text,
  p_idempotency_key text,
  p_payload jsonb default '{}'::jsonb,
  p_complete boolean default false
) returns boolean
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_seq integer;
  v_inserted_count integer;
  v_current_stage text;
  v_current_rank integer;
  v_target_rank integer;
begin
  if p_evidence_ref is null or btrim(p_evidence_ref) = '' then
    raise exception 'evidence_ref required';
  end if;

  if exists (
    select 1 from public.powerhouse_cycle_events
    where tenant_id=p_tenant_id and idempotency_key=p_idempotency_key
  ) then
    return false;
  end if;

  select current_stage into v_current_stage
  from public.powerhouse_decision_cycles
  where tenant_id=p_tenant_id and cycle_id=p_cycle_id
  for update;

  v_current_rank := public.powerhouse_cycle_stage_rank_v1(v_current_stage);
  v_target_rank := public.powerhouse_cycle_stage_rank_v1(p_stage);

  if v_target_rank is null then
    raise exception 'unknown stage %', p_stage;
  end if;

  if exists(select 1 from public.powerhouse_cycle_events where tenant_id=p_tenant_id and cycle_id=p_cycle_id) then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_current_rank
    from public.powerhouse_cycle_events
    where tenant_id=p_tenant_id and cycle_id=p_cycle_id
    order by sequence_no desc limit 1;

    if v_target_rank <= v_current_rank then
      return false;
    end if;
    if v_target_rank <> v_current_rank + 1 then
      raise exception 'target stage % must be exactly one step after current stage', p_stage;
    end if;
  else
    if p_stage <> 'signal' then
      raise exception 'first stage must be signal';
    end if;
  end if;

  select coalesce(max(sequence_no),0)+1 into v_seq
  from public.powerhouse_cycle_events
  where tenant_id=p_tenant_id and cycle_id=p_cycle_id;

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,evidence_ref,idempotency_key,payload,occurred_at
  ) values (
    p_tenant_id,p_cycle_id,v_seq,p_stage,p_entity_type,p_entity_id,p_evidence_ref,p_idempotency_key,coalesce(p_payload,'{}'::jsonb),now()
  )
  on conflict (tenant_id,idempotency_key) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count=1 then
    update public.powerhouse_decision_cycles
    set current_stage=p_stage,
        status=case
          when p_complete then 'complete'
          when p_stage='outcome' then 'outcome_pending'
          when p_stage in ('calibration','next_decision') then 'calibration_pending'
          else status
        end,
        closed_at=case when p_complete then now() else closed_at end,
        updated_at=now()
    where tenant_id=p_tenant_id and cycle_id=p_cycle_id;
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.powerhouse_ensure_sales_cycle_v1(p_action_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_cycle uuid;
  v_action public.powerhouse_sales_actions%rowtype;
  v_ref text;
begin
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found then return null; end if;

  v_ref := 'powerhouse_sales_actions:' || p_action_id::text;
  select cycle_id into v_cycle
  from public.powerhouse_decision_cycles
  where tenant_id='canonical' and source_signal_ref=v_ref
  limit 1;

  if v_cycle is null then
    insert into public.powerhouse_decision_cycles(tenant_id,subject_key,source_signal_ref,current_stage,status,opened_at)
    values ('canonical',v_action.subject_key,v_ref,'signal','open',coalesce(v_action.created_at,now()))
    returning cycle_id into v_cycle;
  end if;

  if not exists(select 1 from public.powerhouse_cycle_events where tenant_id='canonical' and cycle_id=v_cycle) then
    perform public.powerhouse_append_cycle_event_v2(
      'canonical',v_cycle,'signal','sales_action',p_action_id::text,
      v_ref || ':signal',v_ref || ':signal',
      jsonb_build_object('action_type',v_action.action_type,'channel',v_action.channel,'opportunity_key',v_action.opportunity_key),false
    );
  end if;

  return v_cycle;
end;
$$;

create or replace function public.powerhouse_advance_sales_action_v1(p_action_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_cycle uuid;
  v_action public.powerhouse_sales_actions%rowtype;
  v_ref text;
  v_rank integer;
begin
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id;
  if not found then return null; end if;
  v_cycle := public.powerhouse_ensure_sales_cycle_v1(p_action_id);
  v_ref := 'powerhouse_sales_actions:' || p_action_id::text;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank
  from public.powerhouse_cycle_events where tenant_id='canonical' and cycle_id=v_cycle
  order by sequence_no desc limit 1;

  if v_rank < public.powerhouse_cycle_stage_rank_v1('analysis') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'analysis','sales_action',p_action_id::text,
      v_ref||':analysis',v_ref||':analysis',
      jsonb_build_object('evidence',v_action.evidence,'reason',v_action.reason,'truth_class','observed_lineage'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('prediction') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'prediction','sales_action',p_action_id::text,
      v_ref||':prediction',v_ref||':prediction',
      jsonb_build_object('expected_value_eur',v_action.expected_value_eur,'opportunity_key',v_action.opportunity_key,'truth_class','system_prediction'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'decision','sales_action',p_action_id::text,
      v_ref||':decision',v_ref||':decision',
      jsonb_build_object('action_type',v_action.action_type,'channel',v_action.channel,'priority',v_action.priority,'status',v_action.status),false);
  end if;

  if v_action.status='done' or v_action.outcome_id is not null then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('execution') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'execution','sales_action',p_action_id::text,
        v_ref||':execution',v_ref||':execution',
        jsonb_build_object('executed_at',v_action.executed_at,'status',v_action.status,'truth_class','observed_action_state'),false);
    end if;
    update public.powerhouse_decision_cycles set status='outcome_pending',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  elsif v_action.status in ('error','expired') then
    update public.powerhouse_decision_cycles set status='blocked',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  return v_cycle;
end;
$$;

create or replace function public.powerhouse_sales_action_cycle_v2()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
begin
  perform public.powerhouse_advance_sales_action_v1(new.action_id);
  return new;
end;
$$;

drop trigger if exists powerhouse_sales_action_cycle_trg on public.powerhouse_sales_actions;
create trigger powerhouse_sales_action_cycle_trg
after insert or update of status,executed_at,outcome_id,evidence,priority on public.powerhouse_sales_actions
for each row execute function public.powerhouse_sales_action_cycle_v2();

create or replace function public.powerhouse_sales_outcome_close_loop_v2()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_cycle uuid;
  v_action public.powerhouse_sales_actions%rowtype;
  v_rank integer;
  v_value numeric;
  v_value_type text;
begin
  if new.action_id is null then return new; end if;
  select * into v_action from public.powerhouse_sales_actions where action_id=new.action_id;
  v_cycle := public.powerhouse_advance_sales_action_v1(new.action_id);
  if v_cycle is null then return new; end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank
  from public.powerhouse_cycle_events where tenant_id='canonical' and cycle_id=v_cycle
  order by sequence_no desc limit 1;

  if v_rank < public.powerhouse_cycle_stage_rank_v1('execution') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'execution','sales_action',new.action_id::text,
      'powerhouse_sales_actions:'||new.action_id::text||':execution:outcome_proven',
      'sales_action:'||new.action_id::text||':execution:outcome_proven',
      jsonb_build_object('outcome_id',new.outcome_id,'truth_class','execution_implied_by_observed_outcome'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('provider_readback') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'provider_readback','sales_outcome',new.outcome_id::text,
      'powerhouse_sales_outcomes:'||new.outcome_id::text||':readback',
      'sales_outcome:'||new.outcome_id::text||':readback',
      jsonb_build_object('evidence',new.evidence,'truth_class','observed_provider_or_channel_readback'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('outcome') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'outcome','sales_outcome',new.outcome_id::text,
      'powerhouse_sales_outcomes:'||new.outcome_id::text,
      'sales_outcome:'||new.outcome_id::text,
      jsonb_build_object('outcome_type',new.outcome_type,'revenue_eur',new.revenue_eur,'channel',new.channel,'opportunity_key',new.opportunity_key,'evidence',new.evidence),false);
  end if;

  v_value := case when coalesce(new.revenue_eur,0)>0 then new.revenue_eur else 1 end;
  v_value_type := case when coalesce(new.revenue_eur,0)>0 then 'revenue' else 'conversion' end;

  insert into public.powerhouse_realized_values(
    tenant_id,cycle_id,value_type,truth_class,numeric_value,unit,currency,evidence_ref,
    source_entity_type,source_entity_id,observed_at,provenance
  )
  select 'canonical',v_cycle,v_value_type,'realized',v_value,
    case when v_value_type='conversion' then new.outcome_type else 'EUR' end,
    case when v_value_type='revenue' then 'EUR' else null end,
    'powerhouse_sales_outcomes:'||new.outcome_id::text,'sales_outcome',new.outcome_id::text,new.occurred_at,
    jsonb_build_object('attribution_class',coalesce(new.evidence->>'attribution_class','observed'),'source',new.evidence->>'source')
  where not exists (
    select 1 from public.powerhouse_realized_values
    where tenant_id='canonical' and cycle_id=v_cycle and source_entity_type='sales_outcome' and source_entity_id=new.outcome_id::text
  );

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('realized_value') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'realized_value','sales_outcome',new.outcome_id::text,
      'powerhouse_realized_values:sales_outcome:'||new.outcome_id::text,
      'realized_value:'||new.outcome_id::text,
      jsonb_build_object('value_type',v_value_type,'numeric_value',v_value,'truth_class','realized'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('calibration') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'calibration','sales_outcome',new.outcome_id::text,
      'calibration:sales_outcome:'||new.outcome_id::text,'calibration:'||new.outcome_id::text,
      jsonb_build_object('outcome_type',new.outcome_type,'truth','observed'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('next_decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'next_decision','sales_outcome',new.outcome_id::text,
      'next_decision:sales_outcome:'||new.outcome_id::text,'next_decision:'||new.outcome_id::text,
      jsonb_build_object('closed_loop',true,'future_policy_input',true),true);
  end if;

  insert into public.growth_outcomes(
    outcome_id,stage,attribution_root_key,canonical,intent_owner,occurred_at,revenue_eur,source,payload
  )
  select 'sales:'||new.outcome_id::text,
    case
      when coalesce(new.revenue_eur,0)>0 then 'revenue'
      when new.outcome_type ilike '%meeting%' or new.outcome_type ilike '%appointment%' then 'appointment'
      when new.outcome_type ilike '%proposal%' or new.outcome_type ilike '%offer%' then 'proposal'
      when new.outcome_type ilike '%order%' or new.outcome_type ilike '%won%' then 'won_order'
      when new.outcome_type ilike '%qualified%' then 'qualified_lead'
      else 'lead'
    end,
    coalesce(new.opportunity_key,new.campaign_key,new.subject_key,new.outcome_id::text),
    null,new.topic_key,new.occurred_at,coalesce(new.revenue_eur,0),'powerhouse_sales_outcomes',
    jsonb_build_object('sales_outcome_id',new.outcome_id,'action_id',new.action_id,'outcome_type',new.outcome_type,'channel',new.channel)
  where not exists (select 1 from public.growth_outcomes where outcome_id='sales:'||new.outcome_id::text);

  return new;
end;
$$;

drop trigger if exists powerhouse_sales_outcome_close_loop_trg on public.powerhouse_sales_outcomes;
create trigger powerhouse_sales_outcome_close_loop_trg
after insert or update of outcome_type,revenue_eur,evidence on public.powerhouse_sales_outcomes
for each row execute function public.powerhouse_sales_outcome_close_loop_v2();

create or replace view public.powerhouse_closed_loop_health_v1
with (security_invoker=true)
as
select
  count(*) as total_cycles,
  count(*) filter (where status='complete') as complete_cycles,
  count(*) filter (where status='outcome_pending') as outcome_pending_cycles,
  count(*) filter (where status='calibration_pending') as calibration_pending_cycles,
  count(*) filter (where status='blocked') as blocked_cycles,
  count(*) filter (where status='open') as open_cycles,
  round(100.0*count(*) filter(where status='complete')/nullif(count(*),0),2) as closure_pct,
  max(updated_at) as last_cycle_update
from public.powerhouse_decision_cycles;

-- Existing actions: materialize signal→analysis→prediction→decision and execution where observed.
do $$
declare r record;
begin
  for r in select action_id from public.powerhouse_sales_actions loop
    perform public.powerhouse_advance_sales_action_v1(r.action_id);
  end loop;
end $$;

-- Existing outcomes: close through provider readback→outcome→realized value→calibration→next decision.
update public.powerhouse_sales_outcomes set evidence=evidence;
