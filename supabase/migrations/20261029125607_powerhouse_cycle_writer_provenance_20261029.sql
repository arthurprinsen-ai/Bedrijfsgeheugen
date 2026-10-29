-- Canonical source-writer provenance for existing ONE BRAIN cycle materializers.
-- Version ordered strictly after protected 20261029125100 negative-terminal reconciliation.
-- Preserve status in (error,expired,skipped) as blocked.
-- No new scheduler, trigger, table, agent identity or metric. Idempotency and source guards unchanged.
-- Note: writer_component identifies the known PostgreSQL function, NOT the AI agent that originally acted.
-- agent_attribution stays UNKNOWN_NOT_ATTESTED until a separately verified producer writes true agent_id.
-- No rewrite/backfill of historical events. Existing grants/security modes preserved by CREATE OR REPLACE.
DO $guard$
BEGIN
 IF to_regprocedure('public.powerhouse_advance_sales_action_v1(uuid)') IS NULL THEN RAISE EXCEPTION 'missing original canonical sales action writer'; END IF;
 IF strpos(pg_get_functiondef('public.powerhouse_advance_sales_action_v1(uuid)'::regprocedure), 'v_action.status=''done'' and v_action.executed_at is not null')=0 THEN RAISE EXCEPTION 'canonical done/executed_at truth guard changed; review source before deployment'; END IF;
 IF strpos(pg_get_functiondef('public.powerhouse_advance_sales_action_v1(uuid)'::regprocedure), '''error'',''expired'',''skipped''')=0 THEN RAISE EXCEPTION 'negative terminal skipped block missing; abort source writer migration'; END IF;
END
$guard$;
CREATE OR REPLACE FUNCTION public.powerhouse_advance_channel_cycle_v1(p_run_date date, p_channel text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
      jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','rationale',v_dec.rationale,'priority',v_dec.priority,'confidence',v_dec.confidence),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('prediction') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'prediction','channel_decision',v_id,
      v_ref||':prediction',v_ref||':prediction',
      jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','confidence',v_dec.confidence,'priority',v_dec.priority,'truth_class','system_prediction'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'decision','channel_decision',v_id,
      v_ref||':decision',v_ref||':decision',
      jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','decision',v_dec.decision,'state',v_dec.state,'scheduled_for',v_dec.scheduled_for),false);
  end if;

  if v_dec.state in ('dispatching','scheduled','published','measured','learned') then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('execution') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'execution','channel_decision',v_id,
        v_ref||':execution',v_ref||':execution',
        jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','state',v_dec.state,'delivery_ref',v_dec.delivery_ref),false);
    end if;
  end if;

  if v_dec.state in ('published','measured','learned') and
     (v_dec.delivery_ref is not null or coalesce(v_dec.delivery_evidence,'{}'::jsonb) <> '{}'::jsonb) then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('provider_readback') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'provider_readback','channel_decision',v_id,
        v_ref||':provider_readback',v_ref||':provider_readback',
        jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','delivery_ref',v_dec.delivery_ref,'delivery_evidence',v_dec.delivery_evidence,'truth_class','observed_delivery'),false);
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
        jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','learning_evidence',v_dec.learning_evidence,'truth_class','observed_measurement'),false);
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
          jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','numeric_value',v_metric,'learning_evidence',v_dec.learning_evidence),false);
      end if;

      select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
       where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
      if v_rank < public.powerhouse_cycle_stage_rank_v1('calibration') then
        perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'calibration','channel_decision',v_id,
          v_ref||':calibration',v_ref||':calibration',
          jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','learning_evidence',v_dec.learning_evidence,'truth','observed'),false);
      end if;

      select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
       where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
      if v_rank < public.powerhouse_cycle_stage_rank_v1('next_decision') then
        perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'next_decision','channel_decision',v_id,
          v_ref||':next_decision',v_ref||':next_decision',
          jsonb_build_object('writer_component','public.powerhouse_advance_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','closed_loop',true,'future_policy_input',true),true);
      end if;
    end if;
  end if;

  if v_dec.state in ('blocked','failed') then
    update public.powerhouse_decision_cycles set status='blocked',updated_at=now()
    where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  return v_cycle;
end;
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_advance_sales_action_v1(p_action_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
      jsonb_build_object('writer_component','public.powerhouse_advance_sales_action_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','evidence',v_action.evidence,'reason',v_action.reason,'truth_class','observed_lineage'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('prediction') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'prediction','sales_action',p_action_id::text,
      v_ref||':prediction',v_ref||':prediction',
      jsonb_build_object('writer_component','public.powerhouse_advance_sales_action_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','expected_value_eur',v_action.expected_value_eur,'opportunity_key',v_action.opportunity_key,'truth_class','system_prediction'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'decision','sales_action',p_action_id::text,
      v_ref||':decision',v_ref||':decision',
      jsonb_build_object('writer_component','public.powerhouse_advance_sales_action_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','action_type',v_action.action_type,'channel',v_action.channel,'priority',v_action.priority,'status',v_action.status),false);
  end if;

  -- A negative or expired outcome is NOT execution proof.
  if v_action.status='done' and v_action.executed_at is not null then
    select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
     where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
    if v_rank < public.powerhouse_cycle_stage_rank_v1('execution') then
      perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'execution','sales_action',p_action_id::text,
        v_ref||':execution',v_ref||':execution',
        jsonb_build_object('writer_component','public.powerhouse_advance_sales_action_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','executed_at',v_action.executed_at,'status',v_action.status,'truth_class','observed_action_state'),false);
    end if;
    update public.powerhouse_decision_cycles set status='outcome_pending',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  elsif v_action.status in ('error','expired','skipped') then
    update public.powerhouse_decision_cycles set status='blocked',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  return v_cycle;
end;
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_ensure_channel_cycle_v1(p_run_date date, p_channel text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
      jsonb_build_object('writer_component','public.powerhouse_ensure_channel_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','source_recommendation_ids',v_dec.source_recommendation_ids,'topic_key',v_dec.topic_key,'channel',v_dec.channel),false
    );
  end if;
  return v_cycle;
end;
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_ensure_sales_cycle_v1(p_action_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
      jsonb_build_object('writer_component','public.powerhouse_ensure_sales_cycle_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','action_type',v_action.action_type,'channel',v_action.channel,'opportunity_key',v_action.opportunity_key),false
    );
  end if;

  return v_cycle;
end;
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_open_cycle_from_runtime_signal_v1(p_event_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  e public.powerhouse_runtime_events%rowtype;
  v_tenant constant text := 'canonical';
  v_subject text;
  v_evidence_ref text;
begin
  select * into e
  from public.powerhouse_runtime_events
  where event_id=p_event_id;

  if not found then return; end if;

  if e.event_type <> 'scan_submitted'
     or e.source not in ('website.frisse_blik','website.workshop_scan','website.bedrijfslek')
     or lower(coalesce(e.source,'')) like '%test%' then
    return;
  end if;

  v_subject := coalesce(
    nullif(e.subject_key,''),
    nullif(e.company_key,''),
    nullif(e.person_key,''),
    e.event_id::text
  );
  v_evidence_ref := 'powerhouse_runtime_events:' || e.event_id::text;

  insert into public.powerhouse_decision_cycles(
    tenant_id,cycle_id,subject_key,source_signal_ref,current_stage,status,opened_at,updated_at
  )
  values(
    v_tenant,e.event_id,v_subject,v_evidence_ref,'signal','open',e.occurred_at,now()
  )
  on conflict (tenant_id,cycle_id) do update set
    subject_key=coalesce(public.powerhouse_decision_cycles.subject_key,excluded.subject_key),
    source_signal_ref=excluded.source_signal_ref,
    updated_at=now();

  -- Important idempotency guard: do not attempt an already-recorded sequence-1 event.
  -- The cycle-event contiguity trigger runs before ON CONFLICT, so relying only on
  -- ON CONFLICT can falsely raise "cycle sequence must be contiguous" on replays.
  if exists (
    select 1
    from public.powerhouse_cycle_events ce
    where ce.tenant_id=v_tenant
      and ce.idempotency_key='runtime-signal:' || e.event_id::text
  ) then
    return;
  end if;

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,
    evidence_ref,idempotency_key,payload,occurred_at
  )
  values(
    v_tenant,e.event_id,1,'signal','powerhouse_runtime_events',e.event_id::text,
    v_evidence_ref,'runtime-signal:' || e.event_id::text,
    jsonb_build_object('writer_component','public.powerhouse_open_cycle_from_runtime_signal_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED',
      'event_type',e.event_type,
      'source',e.source,
      'data_quality',e.data_quality,
      'confidence',e.confidence,
      'truth','observed_runtime_signal'
    ),
    e.occurred_at
  );
end
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_open_cycle_from_sales_action_v1(p_action_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
    jsonb_build_object('writer_component','public.powerhouse_open_cycle_from_sales_action_v1','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED',
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
$function$;

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
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','outcome_id',new.outcome_id,'truth_class','execution_implied_by_observed_outcome'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('provider_readback') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'provider_readback','sales_outcome',new.outcome_id::text,
      'powerhouse_sales_outcomes:'||new.outcome_id::text||':readback',
      'sales_outcome:'||new.outcome_id::text||':readback',
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','evidence',new.evidence,'truth_class','observed_provider_or_channel_readback'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('outcome') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'outcome','sales_outcome',new.outcome_id::text,
      'powerhouse_sales_outcomes:'||new.outcome_id::text,
      'sales_outcome:'||new.outcome_id::text,
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','outcome_type',new.outcome_type,'revenue_eur',new.revenue_eur,'channel',new.channel,'opportunity_key',new.opportunity_key,'evidence',new.evidence),false);
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
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','value_type',v_value_type,'numeric_value',v_value,'truth_class','realized'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('calibration') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'calibration','sales_outcome',new.outcome_id::text,
      'calibration:sales_outcome:'||new.outcome_id::text,'calibration:'||new.outcome_id::text,
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','outcome_type',new.outcome_type,'truth','observed'),false);
  end if;

  select public.powerhouse_cycle_stage_rank_v1(stage) into v_rank from public.powerhouse_cycle_events
   where tenant_id='canonical' and cycle_id=v_cycle order by sequence_no desc limit 1;
  if v_rank < public.powerhouse_cycle_stage_rank_v1('next_decision') then
    perform public.powerhouse_append_cycle_event_v2('canonical',v_cycle,'next_decision','sales_outcome',new.outcome_id::text,
      'next_decision:sales_outcome:'||new.outcome_id::text,'next_decision:'||new.outcome_id::text,
      jsonb_build_object('writer_component','public.powerhouse_sales_outcome_close_loop_v2','writer_contract_version','v1','agent_attribution','UNKNOWN_NOT_ATTESTED','closed_loop',true,'future_policy_input',true),true);
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
$function$;
