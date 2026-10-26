-- P0 #4198: prevent internal operational events becoming fake realized conversions.
-- Source powerhouse_sales_outcomes, cycle events, original provider messages and learning history retained.
-- Only scoped derived projections are reconciled; safe/idempotent on replay.
CREATE OR REPLACE FUNCTION public.powerhouse_sales_outcome_close_loop_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_cycle uuid;
  v_action public.powerhouse_sales_actions%rowtype;
  v_rank integer;
  v_value numeric;
  v_value_type text;
begin
  if new.action_id is null then return new; end if;
  -- Fail closed on operational activity and unqualified responses.
  -- Raw sales outcomes and message-learning triggers remain unchanged and auditable.
  -- Only a genuinely qualified external step or positive realized revenue may become a realized commercial value.
  if coalesce(new.revenue_eur,0)<=0 and coalesce(lower(new.outcome_type),'') not in
    ('scan_submitted','qualified_lead','appointment_booked','meeting_booked',
     'proposal_requested','quote_requested','proposal','won_order','order_won',
     'invoice_paid','revenue')
  then
    return new;
  end if;
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
$function$
;

DO $reconcile$
DECLARE
  v_growth_removed integer := 0;
  v_realized_removed integer := 0;
BEGIN
  DELETE FROM public.growth_outcomes go
  USING public.powerhouse_sales_outcomes so
  WHERE go.outcome_id='sales:'||so.outcome_id::text
    AND go.source='powerhouse_sales_outcomes'
    AND go.stage='lead'
    AND go.canonical IS NULL
    AND coalesce(go.revenue_eur,0)=0
    AND coalesce(so.revenue_eur,0)=0
    AND coalesce(lower(so.outcome_type),'') NOT IN ('scan_submitted','qualified_lead','appointment_booked','meeting_booked',
      'proposal_requested','quote_requested','proposal','won_order','order_won',
      'invoice_paid','revenue');
  GET DIAGNOSTICS v_growth_removed = ROW_COUNT;

  DELETE FROM public.powerhouse_realized_values rv
  USING public.powerhouse_sales_outcomes so
  WHERE rv.source_entity_type='sales_outcome'
    AND rv.source_entity_id=so.outcome_id::text
    AND rv.tenant_id='canonical'
    AND rv.value_type='conversion'
    AND coalesce(so.revenue_eur,0)=0
    AND coalesce(lower(so.outcome_type),'') NOT IN ('scan_submitted','qualified_lead','appointment_booked','meeting_booked',
      'proposal_requested','quote_requested','proposal','won_order','order_won',
      'invoice_paid','revenue');
  GET DIAGNOSTICS v_realized_removed = ROW_COUNT;

  INSERT INTO public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  VALUES(now(),'powerhouse-commercial-conversion-truth','reconciliation','ok',
         'Removed false derived sales leads and conversion counts; raw outcomes and cycle events preserved',
         jsonb_build_object('contract','commercial-conversion-truth-v1',
            'removed_false_growth_leads',v_growth_removed,
            'removed_false_realized_conversions',v_realized_removed,
            'raw_sales_outcomes_preserved',true,
            'cycle_history_preserved',true,
            'source','powerhouse_sales_outcome_close_loop_v2'));
END $reconcile$;
