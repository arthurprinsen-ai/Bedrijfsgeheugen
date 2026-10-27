-- P0 #4215: deploy the already approved economics function before index DDL.
-- The original protected #4540 migration remains the authoritative index path.
-- This migration never creates an index, edits cron, deletes rows or invents costs.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '12s';

DO $guard$
DECLARE v_def text;
BEGIN
  SELECT lower(pg_get_functiondef('public.powerhouse_backfill_internal_research_economics_v1(timestamptz)'::regprocedure)) INTO v_def;
  IF v_def IS NULL
     OR strpos(v_def,'powerhouse_sales_actions')=0
     OR strpos(v_def,'powerhouse_record_action_economics_v1')=0
     OR strpos(v_def,'research_enrichment')=0
     OR strpos(v_def,'evidence_only')=0
     OR strpos(v_def,'human_approved')=0
     OR strpos(v_def,'not exists')=0
     THEN RAISE EXCEPTION 'ECONOMICS_ORIGINAL_SOURCE_DRIFT'; END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.powerhouse_backfill_internal_research_economics_v1(
  p_now timestamp with time zone DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select a.action_id,a.executed_at,a.evidence
    from public.powerhouse_sales_actions a
    where a.status='done'
      and a.executed_at is not null
      and a.action_type='research_enrichment'
      and a.channel='internal'
      and coalesce((a.evidence->>'human_approved')::boolean,false)=false
      and coalesce((a.evidence->'public_research_execution'->>'evidence_only')::boolean,false)=true
      and not exists (
        select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id
      )
    limit 50
  loop
    perform public.powerhouse_record_action_economics_v1(
      'economics:'||r.action_id::text,
      r.action_id,
      null,
      null,
      0,
      jsonb_build_object(
        'contract','powerhouse-internal-research-economics-v1',
        'human_minutes',0,
        'human_minutes_basis','action executed by automated internal research path with human_approved=false',
        'provider_cost_eur','UNOBSERVED',
        'external_cost_eur','UNOBSERVED',
        'no_zero_cost_claim',true,
        'truth_boundary','human time is observed as zero for this automated path; provider/external monetary cost remains unknown and is not fabricated',
        'source_evidence',coalesce(r.evidence->'public_research_execution','{}'::jsonb),
        'recorded_at',p_now
      ),
      r.executed_at
    );
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$function$;
-- The production function is only invoked by the server-side canonical mux.
-- SECURITY DEFINER must never be directly executable by browser roles.
REVOKE ALL ON FUNCTION public.powerhouse_backfill_internal_research_economics_v1(timestamp with time zone)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_backfill_internal_research_economics_v1(timestamp with time zone)
  TO service_role;
COMMIT;
