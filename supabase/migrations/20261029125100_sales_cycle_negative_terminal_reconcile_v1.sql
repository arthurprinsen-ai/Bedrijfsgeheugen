-- Canonical terminal cycle truth reconciliation. No new scheduler/writer/table or synthetic sends.
-- 2026-10-29 readback: exactly 5190 outcome_pending canonical cycles from
-- 4879 expired + 311 skipped source actions, all executed_at NULL, outcome not_executed,
-- outcome.action_id matches source action and revenue_eur is zero.
-- Immutable powerhouse_cycle_events stay untouched.
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
  elsif v_action.status in ('error','expired','skipped') then
    update public.powerhouse_decision_cycles set status='blocked',updated_at=now()
      where tenant_id='canonical' and cycle_id=v_cycle and status<>'complete';
  end if;

  return v_cycle;
end;
$function$;

-- Only correct mutable cycle-state projection of independently verified negative outcomes.
-- The source event log (including historical wrong EXECUTION-stage event) remains immutable.
DO $reconcile$
DECLARE v_corrected integer;
BEGIN
 UPDATE public.powerhouse_decision_cycles c
 SET status='blocked', updated_at=now()
 FROM public.powerhouse_sales_actions a
 JOIN public.powerhouse_sales_outcomes o
  ON o.outcome_id=a.outcome_id AND o.action_id=a.action_id
 WHERE c.tenant_id='canonical'
   AND c.source_signal_ref='powerhouse_sales_actions:'||a.action_id::text
   AND c.status IN ('open','outcome_pending')
   AND a.status IN ('expired','skipped')
   AND a.executed_at IS NULL
   AND o.outcome_type='not_executed'
   AND COALESCE(o.revenue_eur,0)=0;
 GET DIAGNOSTICS v_corrected = ROW_COUNT;
 RAISE NOTICE 'POWERHOUSE_NEGATIVE_TERMINAL_CYCLES_RECONCILED:%',v_corrected;
END
$reconcile$;

COMMENT ON FUNCTION public.powerhouse_advance_sales_action_v1(uuid)
IS 'Advance only actually done+timestamp sales executions, mark negative error/expired/skipped as blocked; never infer provider send from outcome_id.';
