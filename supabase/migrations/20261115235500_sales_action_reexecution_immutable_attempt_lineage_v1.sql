-- P0 #4198. Preserve original monotonic decision cycle and its immutable writer.
-- An action may be executed again after a safe waiting/research replay.
-- Record each *later* executed_at as an original, attempt-scoped 5-stage cycle;
-- never rewrite/delete the first event or claim an external provider receipt.
-- Existing original caller stays authoritative; no new queue, job, scheduler,
-- privilege, or out-of-band writer. Concurrency is serialized on action row.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

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
  v_last_execution timestamptz;
  v_attempt_cycle uuid;
  v_attempt_ref text;
begin
  -- Original action row is the concurrency authority for a new attempt.
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
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


  -- A second actual action execution is NOT the same as the original first
  -- execution. The original cycle's monotonic 5-stage progression remains
  -- immutable. Create a fresh ORIGINAL decision cycle for each later executed_at
  -- after the existing protected writer has established a first event.
  if v_action.status='done' and v_action.executed_at is not null then
    select max((e.payload->>'executed_at')::timestamptz) into v_last_execution
    from public.powerhouse_cycle_events e
    where e.tenant_id='canonical'
      and e.entity_type='sales_action' and e.entity_id=p_action_id::text
      and e.stage='execution' and e.payload->>'status'='done'
      and e.payload->>'truth_class'='observed_action_state'
      and e.payload->>'writer_component'='public.powerhouse_advance_sales_action_v1'
      and e.payload ? 'executed_at';
    if v_last_execution is not null and v_action.executed_at>v_last_execution then
      if v_action.executed_at > now()+interval '5 minutes' then
        raise exception 'SALES_ACTION_EXECUTION_TIME_IN_FUTURE';
      end if;
      v_attempt_ref := v_ref||':reexecution:'||
        to_char(v_action.executed_at at time zone 'UTC','YYYYMMDD"T"HH24MISS.US');
      select cycle_id into v_attempt_cycle from public.powerhouse_decision_cycles
      where tenant_id='canonical' and source_signal_ref=v_attempt_ref
      order by opened_at,cycle_id limit 1;
      if v_attempt_cycle is null then
        insert into public.powerhouse_decision_cycles(
          tenant_id,subject_key,source_signal_ref,current_stage,status,opened_at
        ) values (
          'canonical',v_action.subject_key,v_attempt_ref,'signal','open',now()
        ) returning cycle_id into v_attempt_cycle;
      end if;
      perform public.powerhouse_append_cycle_event_v2(
        'canonical',v_attempt_cycle,'signal','sales_action',p_action_id::text,
        v_attempt_ref||':signal',v_attempt_ref||':signal',
        jsonb_build_object(
          'writer_component','public.powerhouse_advance_sales_action_v1',
          'writer_contract_version','v1','truth_class','observed_lineage',
          'agent_attribution','UNKNOWN_NOT_ATTESTED','reexecution_of',v_cycle,
          'action_type',v_action.action_type,'channel',v_action.channel
        ),false);
      perform public.powerhouse_append_cycle_event_v2(
        'canonical',v_attempt_cycle,'analysis','sales_action',p_action_id::text,
        v_attempt_ref||':analysis',v_attempt_ref||':analysis',
        jsonb_build_object(
          'writer_component','public.powerhouse_advance_sales_action_v1',
          'writer_contract_version','v1','truth_class','observed_lineage',
          'agent_attribution','UNKNOWN_NOT_ATTESTED','reexecution_of',v_cycle,
          'reason',v_action.reason
        ),false);
      perform public.powerhouse_append_cycle_event_v2(
        'canonical',v_attempt_cycle,'prediction','sales_action',p_action_id::text,
        v_attempt_ref||':prediction',v_attempt_ref||':prediction',
        jsonb_build_object(
          'writer_component','public.powerhouse_advance_sales_action_v1',
          'writer_contract_version','v1','truth_class','system_prediction',
          'agent_attribution','UNKNOWN_NOT_ATTESTED','reexecution_of',v_cycle,
          'expected_value_eur',v_action.expected_value_eur,
          'opportunity_key',v_action.opportunity_key
        ),false);
      perform public.powerhouse_append_cycle_event_v2(
        'canonical',v_attempt_cycle,'decision','sales_action',p_action_id::text,
        v_attempt_ref||':decision',v_attempt_ref||':decision',
        jsonb_build_object(
          'writer_component','public.powerhouse_advance_sales_action_v1',
          'writer_contract_version','v1',
          'agent_attribution','UNKNOWN_NOT_ATTESTED','reexecution_of',v_cycle,
          'action_type',v_action.action_type,'channel',v_action.channel,
          'priority',v_action.priority,'status',v_action.status
        ),false);
      perform public.powerhouse_append_cycle_event_v2(
        'canonical',v_attempt_cycle,'execution','sales_action',p_action_id::text,
        v_ref||':execution',v_attempt_ref||':execution',
        jsonb_build_object(
          'writer_component','public.powerhouse_advance_sales_action_v1',
          'writer_contract_version','v1',
          'agent_attribution','UNKNOWN_NOT_ATTESTED',
          'status','done','truth_class','observed_action_state',
          'reexecution_of',v_cycle,
          'executed_at',v_action.executed_at,
          'source_updated_at',v_action.updated_at,
          'late_registered',v_action.executed_at<now()-interval '5 minutes'
        ),false);
      update public.powerhouse_decision_cycles
      set status='outcome_pending',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_attempt_cycle and status<>'complete';
    end if;
  end if;

  return v_cycle;
end;
$function$

