create or replace function public.powerhouse_ensure_channel_cycle_v1(p_run_date date,p_channel text)
returns uuid
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_cycle uuid;
  v_dec public.powerhouse_channel_decisions%rowtype;
  v_ref text;
  v_id text;
begin
  select * into v_dec from public.powerhouse_channel_decisions
  where run_date=p_run_date and channel=p_channel;
  if not found then return null; end if;

  v_id := p_run_date::text || ':' || p_channel;
  v_ref := 'powerhouse_channel_decisions:' || v_id;

  select cycle_id into v_cycle
  from public.powerhouse_decision_cycles
  where tenant_id='canonical' and source_signal_ref=v_ref
  limit 1;

  if v_cycle is null then
    insert into public.powerhouse_decision_cycles(tenant_id,subject_key,source_signal_ref,current_stage,status,opened_at)
    values ('canonical',coalesce(v_dec.topic_key,p_channel),v_ref,'signal','open',coalesce(v_dec.created_at,now()))
    returning cycle_id into v_cycle;
  end if;

  if not exists(select 1 from public.powerhouse_cycle_events where tenant_id='canonical' and cycle_id=v_cycle) then
    perform public.powerhouse_append_cycle_event_v2(
      'canonical',v_cycle,'signal','channel_decision',v_id,
      v_ref||':signal',v_ref||':signal',
      jsonb_build_object('source_recommendation_ids',v_dec.source_recommendation_ids,'topic_key',v_dec.topic_key,'channel',v_dec.channel),false
    );
  end if;
  return v_cycle;
end;
$$;

create or replace function public.powerhouse_advance_channel_cycle_v1(p_run_date date,p_channel text)
returns uuid
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_cycle uuid;
  v_dec public.powerhouse_channel_decisions%rowtype;
  v_ref text;
  v_id text;
  v_rank integer;
  v_metric numeric;
  v_has_observed_value boolean := false;
begin
  select * into v_dec from public.powerhouse_channel_decisions where run_date=p_run_date and channel=p_channel;
  if not found then return null; end if;
  v_id := p_run_date::text||':'||p_channel;
  v_ref := 'powerhouse_channel_decisions:'||v_id;
  v_cycle := public.powerhouse_ensure_channel_cycle_v1(p_run_date,p_channel);

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('analysis') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'analysis','channel_decision',v_id,
      v_ref||':analysis',v_ref||':analysis',
      jsonb_build_object('rationale',v_dec.rationale,'priority',v_dec.priority,'confidence',v_dec.confidence),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('prediction') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'prediction','channel_decision',v_id,
      v_ref||':prediction',v_ref||':prediction',
      jsonb_build_object('confidence',v_dec.confidence,'priority',v_dec.priority,'truth_class','system_prediction'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'decision','channel_decision',v_id,
      v_ref||':decision',v_ref||':decision',
      jsonb_build_object('decision',v_dec.decision,'state',v_dec.state,'scheduled_for',v_dec.scheduled_for),false);
  end if;

  if v_dec.state in ('dispatching','scheduled','published','measured','learned') then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('execution') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'execution','channel_decision',v_id,
        v_ref||':execution',v_ref||':execution',
        jsonb_build_object('state',v_dec.state,'delivery_ref',v_dec.delivery_ref),false);
    end if;
  end if;

  if v_dec.state in ('published','measured','learned') and
     (v_dec.delivery_ref is not null or coalesce(v_dec.delivery_evidence,'{}'::jsonb) <> '{}'::jsonb) then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('provider_readback') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'provider_readback','channel_decision',v_id,
        v_ref||':provider_readback',v_ref||':provider_readback',
        jsonb_build_object('delivery_ref',v_dec.delivery_ref,'delivery_evidence',v_dec.delivery_evidence,'truth_class','observed_delivery'),false);
    end if;
    update public.powerhouse_decision_cycles set status='outcome_pending',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  if v_dec.state in ('measured','learned') and coalesce(v_dec.learning_evidence,'{}'::jsonb) <> '{}'::jsonb then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('outcome') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'outcome','channel_decision',v_id,
        v_ref||':outcome',v_ref||':outcome',
        jsonb_build_object('learning_evidence',v_dec.learning_evidence,'truth_class','observed_measurement'),false);
    end if;

    begin
      v_metric := coalesce(
        nullif(v_dec.learning_evidence->>'revenue_eur','')::numeric,
        nullif(v_dec.learning_evidence->>'actual_effect','')::numeric,
        nullif(v_dec.learning_evidence->>'conversions','')::numeric,
        nullif(v_dec.learning_evidence->>'leads','')::numeric
      );
      v_has_observed_value := v_metric is not null;
    exception when others then
      v_has_observed_value := false;
    end;

    if v_has_observed_value then
      insert into public.powerhouse_realized_values(
        tenant_id,cycle_id,value_type,truth_class,numeric_value,unit,currency,evidence_ref,
        source_entity_type,source_entity_id,observed_at,provenance
      )
      select 'canonical',v_cycle,
        case when v_dec.learning_evidence ? 'revenue_eur' then 'revenue' else 'conversion' end,
        'realized',v_metric,
        case when v_dec.learning_evidence ? 'revenue_eur' then 'EUR' else 'observed_metric' end,
        case when v_dec.learning_evidence ? 'revenue_eur' then 'EUR' else null end,
        v_ref||':learning_evidence','channel_decision',v_id,now(),
        jsonb_build_object('learning_evidence',v_dec.learning_evidence)
      where not exists (
        select 1 from public.powerhouse_realized_values
        where tenant_id='canonical' and cycle_id=v_cycle and source_entity_type='channel_decision' and source_entity_id=v_id
      );

      select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
       where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
      if v_rank < public.powerhouse_cycle_stage_rank_v1('realized_value') then
        perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'realized_value','channel_decision',v_id,
          v_ref||':realized_value',v_ref||':realized_value',
          jsonb_build_object('numeric_value',v_metric,'learning_evidence',v_dec.learning_evidence),false);
      end if;

      select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
       where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
      if v_rank < public.powerhouse_cycle_stage_rank_v1('calibration') then
        perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'calibration','channel_decision',v_id,
          v_ref||':calibration',v_ref||':calibration',
          jsonb_build_object('learning_evidence',v_dec.learning_evidence,'truth','observed'),false);
      end if;

      select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
       where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
      if v_rank < public.powerhouse_cycle_stage_rank_v1('next_decision') then
        perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'next_decision','channel_decision',v_id,
          v_ref||':next_decision',v_ref||':next_decision',
          jsonb_build_object('closed_loop',true,'future_policy_input',true),true);
      end if;
    end if;
  end if;

  if v_dec.state in ('blocked','failed') then
    update public.powerhouse_decision_cycles set status='blocked',updated_at=now()
    where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  return v_cycle;
end;
$$;

create or replace function public.powerhouse_channel_cycle_v2()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
begin
  perform public.powerhouse_advance_channel_cycle_v1(new.run_date,new.channel);
  return new;
end;
$$;

drop trigger if exists powerhouse_channel_cycle_trg on public.powerhouse_channel_decisions;
create trigger powerhouse_channel_cycle_trg
after insert or update of state,decision,delivery_ref,delivery_evidence,learning_evidence,confidence,priority
on public.powerhouse_channel_decisions
for each row execute function public.powerhouse_channel_cycle_v2();

-- Make direct social delivery canonical where it is actually active; Buffer remains legacy metric transport.
update public.powerhouse_evidence_sources
set required=false,
    notes='Legacy Buffer publication/metric transport only. Direct publication authority is Composio/Meta; Buffer must not satisfy direct provider-truth gates.',
    updated_at=now()
where source_key='buffer-publication';

insert into public.powerhouse_evidence_sources(source_key,source_class,required,max_age,writer_contract,owner_component,notes)
values
('composio-linkedin-publication','provider',true,interval '24 hours','social-publication-authority-v1','powerhouse-social-publisher',
 'Direct LinkedIn publication authority/readback through Composio. Engagement metrics require separate observed provider capability and may not be fabricated.'),
('meta-instagram-publication','provider',false,interval '24 hours','instagram-mira-reel-only-v3','powerhouse-social-publisher',
 'Direct Instagram publication authority when Meta provider path is active; only becomes required when governed direct credentials and verified readback are active.')
on conflict (source_key) do update
set source_class=excluded.source_class,required=excluded.required,max_age=excluded.max_age,
    writer_contract=excluded.writer_contract,owner_component=excluded.owner_component,notes=excluded.notes,updated_at=now();

-- Backfill channel cycles only to the highest stage already supported by observed evidence.
do $$
declare r record;
begin
  for r in select run_date,channel from public.powerhouse_channel_decisions loop
    perform public.powerhouse_advance_channel_cycle_v1(r.run_date,r.channel);
  end loop;
end $$;
