-- P0 #4198: a single commercial stage must never starve independent
-- research, sales/outreach, and learning stages. Keep the same canonical
-- hourly cron owner and invoke each EXISTING authorized, idempotent stage
-- exactly once per scheduled cycle. No new scheduler and no extra sender.
CREATE OR REPLACE FUNCTION public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public'
AS $function$
DECLARE
  v_relationship_revenue jsonb := null;
  v_existing_evidence_research jsonb := null;
  v_public_research_dispatch jsonb := null;
  v_trigger_acquisition jsonb := null;
  v_linkedin_company_growth jsonb := null;
  v_growth_swarm jsonb := null;
  v_growth_swarm_activation jsonb := null;
  v_growth_plays_v2 jsonb := null;
  v_growth_play_executor jsonb := null;
  v_linkedin_sales_dispatch jsonb := null;
  v_autonomous_outreach_prepare jsonb := null;
  v_persuasion_optimizer jsonb := null;
  v_autonomous_outreach_dispatch jsonb := null;
  v_commercial_learning jsonb := null;
  v_failure_count integer := 0;
BEGIN
  BEGIN
    v_relationship_revenue := public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_relationship_revenue := jsonb_build_object(
      'ok',false,'stage','relationship_revenue','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:relationship_revenue:%',SQLSTATE;
  END;

  BEGIN
    v_existing_evidence_research := public.powerhouse_execute_relationship_research_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_existing_evidence_research := jsonb_build_object(
      'ok',false,'stage','existing_evidence_research','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:existing_evidence_research:%',SQLSTATE;
  END;

  BEGIN
    v_public_research_dispatch := public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_public_research_dispatch := jsonb_build_object(
      'ok',false,'stage','public_research_dispatch','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:public_research_dispatch:%',SQLSTATE;
  END;

  BEGIN
    v_trigger_acquisition := public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_trigger_acquisition := jsonb_build_object(
      'ok',false,'stage','trigger_acquisition','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:trigger_acquisition:%',SQLSTATE;
  END;

  BEGIN
    v_linkedin_company_growth := public.powerhouse_refresh_linkedin_company_growth_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_linkedin_company_growth := jsonb_build_object(
      'ok',false,'stage','linkedin_company_growth','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:linkedin_company_growth:%',SQLSTATE;
  END;

  BEGIN
    v_growth_swarm := public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_growth_swarm := jsonb_build_object(
      'ok',false,'stage','growth_swarm','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:growth_swarm:%',SQLSTATE;
  END;

  BEGIN
    v_growth_swarm_activation := public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_growth_swarm_activation := jsonb_build_object(
      'ok',false,'stage','growth_swarm_activation','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:growth_swarm_activation:%',SQLSTATE;
  END;

  BEGIN
    v_growth_plays_v2 := public.powerhouse_activate_all_growth_plays_v2(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_growth_plays_v2 := jsonb_build_object(
      'ok',false,'stage','growth_plays_v2','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:growth_plays_v2:%',SQLSTATE;
  END;

  BEGIN
    v_growth_play_executor := public.powerhouse_execute_growth_play_actions_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_growth_play_executor := jsonb_build_object(
      'ok',false,'stage','growth_play_executor','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:growth_play_executor:%',SQLSTATE;
  END;

  BEGIN
    v_linkedin_sales_dispatch := public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_linkedin_sales_dispatch := jsonb_build_object(
      'ok',false,'stage','linkedin_sales_dispatch','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:linkedin_sales_dispatch:%',SQLSTATE;
  END;

  BEGIN
    v_autonomous_outreach_prepare := public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_autonomous_outreach_prepare := jsonb_build_object(
      'ok',false,'stage','autonomous_outreach_prepare','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:autonomous_outreach_prepare:%',SQLSTATE;
  END;

  BEGIN
    v_persuasion_optimizer := public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_persuasion_optimizer := jsonb_build_object(
      'ok',false,'stage','persuasion_optimizer','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:persuasion_optimizer:%',SQLSTATE;
  END;

  BEGIN
    v_autonomous_outreach_dispatch := public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_autonomous_outreach_dispatch := jsonb_build_object(
      'ok',false,'stage','autonomous_outreach_dispatch','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:autonomous_outreach_dispatch:%',SQLSTATE;
  END;

  BEGIN
    v_commercial_learning := public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  EXCEPTION WHEN OTHERS THEN
    v_failure_count := v_failure_count + 1;
    v_commercial_learning := jsonb_build_object(
      'ok',false,'stage','commercial_learning','error_code',SQLSTATE,
      'error_message',left(SQLERRM,180));
    RAISE WARNING 'POWERHOUSE_COMMERCIAL_STAGE_ISOLATED:commercial_learning:%',SQLSTATE;
  END;

  -- No success may be inferred from a partial failure. Every error is typed
  -- in the exact stage result; downstream provider assurances remain binding.
  RETURN jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'stage_isolation','commercial-independent-stage-v1',
    'degraded',v_failure_count > 0,
    'failure_count',v_failure_count,
    'relationship_revenue',v_relationship_revenue,
    'existing_evidence_research',v_existing_evidence_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger_acquisition,
    'linkedin_company_growth',v_linkedin_company_growth,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_swarm_activation,
    'growth_plays_v2',v_growth_plays_v2,
    'growth_play_executor',v_growth_play_executor,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_autonomous_outreach_prepare,
    'persuasion_optimizer',v_persuasion_optimizer,
    'autonomous_outreach_dispatch',v_autonomous_outreach_dispatch,
    'commercial_learning',v_commercial_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
END;
$function$;

-- Preserve the original production restricted execute role.
REVOKE EXECUTE ON FUNCTION public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)
  TO service_role;
