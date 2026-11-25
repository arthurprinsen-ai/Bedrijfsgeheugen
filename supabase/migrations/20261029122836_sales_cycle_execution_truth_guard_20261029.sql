-- Safeguard canonical execution evidence; no parallel writer, scheduler or table.
-- Verified 7-day baseline: 1959 expired + 131 skipped events recorded execution erroneously.
-- Preserve historical immutable evidence. Never infer actual provider sends.
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

  -- A negative or expired outcome is NOT execution proof.
  if v_action.status='done' and v_action.executed_at is not null then
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
$function$;
COMMENT ON FUNCTION public.powerhouse_advance_sales_action_v1(uuid) IS 'Only completed actions with recorded execution timestamp advance to execution; a negative outcome ID alone is insufficient.';
