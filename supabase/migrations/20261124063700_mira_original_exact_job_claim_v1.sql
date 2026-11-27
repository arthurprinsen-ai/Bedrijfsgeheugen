-- Same original claim RPC, exact-job overload. Existing callers are unchanged.
-- The original authenticated router is the only new caller; both paths lock the same row.
BEGIN;
CREATE FUNCTION public.powerhouse_claim_instagram_media_job_v1(
 p_worker text, p_now timestamp with time zone, p_job_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_job public.powerhouse_instagram_media_jobs_v1%rowtype;
BEGIN
 IF p_worker IS DISTINCT FROM 'powerhouse-daily-publisher-openart-original'
    OR p_job_id IS NULL OR p_now IS NULL
    OR (p_now AT TIME ZONE 'Europe/Amsterdam')::date IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Amsterdam')::date
 THEN RAISE EXCEPTION 'ORIGINAL_EXACT_CLAIM_SCOPE_REQUIRED'; END IF;
 SELECT * INTO v_job FROM public.powerhouse_instagram_media_jobs_v1 j
 WHERE j.id=p_job_id AND j.tenant_id='canonical' AND j.channel='instagram'
 AND j.publication_date=(now() AT TIME ZONE 'Europe/Amsterdam')::date
 AND j.status='WAITING_ASSET' AND j.attempts=0 AND j.last_error IS NULL
 AND j.post_type='reel' AND j.provider_connection_state='READY'
 AND j.selected_provider='openart' AND j.required_provider='openart'
 AND 'openart'=ANY(j.allowed_providers) AND j.republish_forbidden=false
 AND coalesce(j.proof_manifest,'{}'::jsonb)='{}'::jsonb
 AND nullif(j.asset_manifest->>'asset_url','') IS NULL
 AND nullif(j.asset_manifest->>'openart_history_id','') IS NULL
 AND nullif(j.asset_manifest->>'openart_resource_id','') IS NULL
 AND j.asset_manifest->>'openart_project_id'='rUF5anXD47gVokckYjf9'
 AND coalesce(j.asset_manifest->>'automatic_generation_budget_exhausted','false')<>'true'
 AND EXISTS (
  SELECT 1 FROM public.content_publication_obligations o
  JOIN public.powerhouse_instagram_daily_winners_v1 w ON w.run_date=o.publication_date
  JOIN public.powerhouse_mira_problem_lineage_v1 l ON l.run_date=o.publication_date AND l.winner_recommendation_id=w.recommendation_id
  WHERE o.tenant_id=j.tenant_id AND o.publication_date=j.publication_date AND o.channel=j.channel
  AND o.status='BLOCKED' AND o.last_error='MEDIA_ASSET_REQUIRED'
  AND o.external_id IS NULL AND o.live_proven_at IS NULL
  AND coalesce(o.evidence#>>'{veto,active}','false')<>'true'
  AND coalesce(o.evidence->>'mira_source_veto_active','false')<>'true'
  AND coalesce(o.evidence->>'republish_forbidden','false')<>'true'
  AND l.state='WINNER_FROZEN'
  AND o.evidence->>'daily_winner_recommendation_id'=w.recommendation_id::text
  AND j.asset_manifest->>'daily_winner_recommendation_id'=w.recommendation_id::text
  AND j.asset_manifest->>'recommendation_id'=w.recommendation_id::text
 )
 FOR UPDATE OF j SKIP LOCKED;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',true,'state','NO_CLAIMABLE_JOB'); END IF;
 UPDATE public.powerhouse_instagram_media_jobs_v1
 SET status='CLAIMED',attempts=attempts+1,
 asset_manifest=coalesce(asset_manifest,'{}'::jsonb)||jsonb_build_object('claimed_by',p_worker,'claimed_at',now()),
 last_error=NULL,next_action='GENERATE_EXACT_ASSET',updated_at=now()
 WHERE id=v_job.id;
 RETURN jsonb_build_object('ok',true,'state','CLAIMED','job_id',v_job.id,
 'publication_date',v_job.publication_date,'attempt',v_job.attempts+1);
END
$function$;
REVOKE ALL ON FUNCTION public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone,uuid) TO service_role;
COMMIT;
