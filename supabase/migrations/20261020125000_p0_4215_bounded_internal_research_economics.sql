-- P0 #4215: bound the existing internal-research economics reconciliation.
-- Production pg_cron 57014 identified unbounded FOR over sales_actions.
-- Keep all original selection criteria and immutable economics evidence.
-- Migration is additive/idempotent; do not execute while production is saturated.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

-- Partial index for the exact stable predicates of the existing producer.
-- action_economics(action_id) already has a unique anti-join index.
CREATE INDEX IF NOT EXISTS powerhouse_sales_actions_internal_research_economics_candidates_p04215_idx
  ON public.powerhouse_sales_actions (action_id)
  WHERE status = 'done'
    AND executed_at IS NOT NULL
    AND action_type = 'research_enrichment'
    AND channel = 'internal';

-- Preserve signature, SECURITY DEFINER, row eligibility, unknown-cost truth,
-- anti-join, dedupe key, outcome timestamps and upstream scheduler authority.
-- A bounded batch is retried by the already-active canonical scheduler: no
-- separate job, checkpoint, fallback or synthetic economics rows are added.
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
COMMIT;
