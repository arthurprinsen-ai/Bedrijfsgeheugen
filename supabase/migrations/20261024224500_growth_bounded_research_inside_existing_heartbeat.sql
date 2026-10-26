-- Root cause: 837 open opportunities, none eligible for paid/outbound actions.
-- Keep the canonical commercial threshold; feed it only bounded INTERNAL source validation.
-- No new scheduler, prospect message, self-approval, revenue claim or duplicate store.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

CREATE OR REPLACE FUNCTION public.powerhouse_growth_bounded_research_v1(
  p_run_date date DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $research$
DECLARE v_inserted integer := 0;
BEGIN
  WITH distinct_topic AS (
    SELECT DISTINCT ON (o.topic_key)
      o.opportunity_key, o.subject_key, o.company_key, o.topic_key,
      o.confidence, o.last_evidence_at
    FROM public.powerhouse_opportunities o
    WHERE o.status='open'
      AND o.stage='signal'
      AND o.last_evidence_at>=now()-interval '72 hours'
      AND o.last_evidence_at<=now()
      AND o.confidence>=0.70
      AND o.topic_key LIKE 'mkb-trigger:%'
      AND nullif(btrim(o.opportunity_key),'') IS NOT NULL
      AND o.evidence->>'contract'='powerhouse-trigger-based-mkb-acquisition-runtime-v1'
      AND o.evidence->'trigger_evidence'->>'contract'='powerhouse-trigger-based-mkb-acquisition-runtime-v1'
    ORDER BY o.topic_key,o.confidence DESC,o.last_evidence_at DESC
  ), selected AS (
    SELECT * FROM distinct_topic
    ORDER BY confidence DESC,last_evidence_at DESC,topic_key ASC
    LIMIT 3
  ), inserted AS (
    INSERT INTO public.powerhouse_sales_actions(
      dedupe_key,subject_key,company_key,action_type,channel,priority,
      reason,evidence,message_draft,status,due_at,topic_key,opportunity_key,expected_value_eur
    )
    SELECT
      'autonomy:source-research:'||p_run_date::text||':'||r.topic_key,
      r.subject_key,r.company_key,'research_enrichment','internal',
      least(100,greatest(0,round(r.confidence*100,2))),
      'Verify source and relevance, then qualify or decline; no outreach without independent buyer intent.',
      jsonb_build_object(
        'contract','powerhouse-growth-bounded-internal-research-v1',
        'hypothesis_only',true,
        'provider_contact_authorized',false,
        'publication_authorized',false,
        'commercial_outcome_verified',false,
        'source_contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
        'source_opportunity_key',r.opportunity_key,
        'source_observed_at',r.last_evidence_at,
        'source_confidence',r.confidence,
        'expected_revenue_status','UNKNOWN_NOT_REVENUE_EVIDENCE',
        'next_safe_action','verify_public_source_and_qualification_in_existing_growth_pipeline'
      ),'','suggested',now(),r.topic_key,r.opportunity_key,0
    FROM selected r
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING action_id
  )
  SELECT count(*) INTO v_inserted FROM inserted;
  RETURN v_inserted;
END
$research$;
REVOKE ALL ON FUNCTION public.powerhouse_growth_bounded_research_v1(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_growth_bounded_research_v1(date) TO service_role;

-- Modify the existing daily growth function, never create a new cron lane.
-- Explicit anchored rewrite fails closed on structural drift.
DO $bridge$
DECLARE
  source_def text;
  changed_def text;
  anchor_counter constant text := '  v_actions int := 0;';
  anchor_step constant text := '  get diagnostics v_actions = row_count;';
  anchor_receipt constant text := '''actions_materialized'',v_actions,';
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_autonomous_growth_revenue_cycle(date)'::regprocedure)
    INTO source_def;
  IF source_def IS NULL OR
     (length(source_def)-length(replace(source_def,anchor_counter,'')))/length(anchor_counter)<>1 OR
     (length(source_def)-length(replace(source_def,anchor_step,'')))/length(anchor_step)<>1 OR
     (length(source_def)-length(replace(source_def,anchor_receipt,'')))/length(anchor_receipt)<>3 OR
     position('internal_research_tasks_materialized' IN source_def)>0 THEN
    RAISE EXCEPTION 'CANONICAL_GROWTH_FUNCTION_DRIFT_ABORT';
  END IF;
  changed_def:=replace(source_def,anchor_counter,
    anchor_counter||E'\n'||'  v_research_tasks int := 0;');
  changed_def:=replace(changed_def,anchor_step,
    anchor_step||E'\n'||'  -- Research only, after original commercial decision gate.'||
    E'\n'||'  select public.powerhouse_growth_bounded_research_v1(p_run_date) into v_research_tasks;');
  changed_def:=replace(changed_def,anchor_receipt,
    anchor_receipt||E'\n'||'      ''internal_research_tasks_materialized'',v_research_tasks,');
  EXECUTE changed_def;
END
$bridge$;
COMMIT;
