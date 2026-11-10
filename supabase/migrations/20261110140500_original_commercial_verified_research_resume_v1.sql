-- P0 ONE BRAIN: resume the ORIGINAL research-held commercial message after
-- verified source research, even if the previous draft already passed quality.
-- Scope: existing candidate RPC only. No scheduler, sender, table, new queue,
-- contact authorization, provider side effect or synthetic experiment result.
-- The existing composer still independently verifies company-news identity,
-- source provenance, source relevance, quality, suppression, and provider gates.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_message_candidates_v1(
  p_limit integer DEFAULT 10,
  p_channels text[] DEFAULT NULL::text[],
  p_action_ids uuid[] DEFAULT NULL::uuid[]
)
RETURNS SETOF public.powerhouse_commercial_message_plan_v1
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public','pg_catalog'
AS $function$
  SELECT p.*
  FROM public.powerhouse_commercial_message_plan_v1 p
  WHERE p.status IN ('prepared','suggested','waiting')
    AND (p_channels IS NULL OR cardinality(p_channels)=0 OR p.channel_norm=ANY(p_channels))
    AND (p_action_ids IS NULL OR cardinality(p_action_ids)=0 OR p.action_id=ANY(p_action_ids))
    AND (
      coalesce(p.evidence#>>'{commercial_intelligence,composer,contract}','')
        <> 'powerhouse-human-commercial-message-composer-v2'
      OR coalesce(p.evidence#>>'{commercial_intelligence,quality_passed}','false') <> 'true'
      OR coalesce(p.message_draft,'')=''
      OR (
        -- Previously quality-passed drafts are not terminal if the source was
        -- missing. Re-evaluate only after completed same-action research and
        -- a recent independently vetted canonical company-news source.
        p.status='waiting'
        AND p.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
        AND EXISTS (
          SELECT 1
          FROM public.powerhouse_sales_actions r
          WHERE r.dedupe_key='relationship-research:outreach-source:'||p.action_id::text
            AND r.action_type='research_enrichment'
            AND r.channel='internal'
            AND r.status='done'
            AND r.person_key=p.person_key
            AND r.company_key=p.company_key
            AND r.executed_at>=now()-interval '14 days'
            AND r.evidence#>>'{original_outreach_action_id}'=p.action_id::text
            AND r.evidence#>>'{public_research_execution,contract}'
              ='powerhouse-relationship-research-auto-enrichment-v1'
            AND EXISTS (
              SELECT 1 FROM public.bg_bedrijfsnieuws n
              WHERE n.url=r.evidence#>>'{public_research_execution,source_url}'
                AND n.over_dit_bedrijf=true
                AND n.afgewezen_reden IS NULL
                AND n.zekerheid>=70
                AND n.opgehaald_op>=now()-interval '30 days'
            )
        )
      )
    )
  ORDER BY p.priority DESC,p.action_id
  LIMIT greatest(1,least(coalesce(p_limit,10),50));
$function$;

-- Preserve pre-existing privileges: CREATE OR REPLACE retains the function's
-- grants. Explicitly restrict execution to the original privileged consumer.
REVOKE ALL ON FUNCTION public.powerhouse_commercial_message_candidates_v1(
  integer,text[],uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_message_candidates_v1(
  integer,text[],uuid[]) TO service_role;
