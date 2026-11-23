-- Obligation: powerhouse|mira|pristine-waiting-asset-original-claim|20261106-v1
-- Protected in-place patch of the ONE original exclusive RPC only.
-- No new publisher/scheduler, no OpenArt spending or Meta side effects.
DO $migration$
DECLARE
  v_before text;
  v_after text;
  v_old text := $old$status in ('QUEUED','RETRY')$old$;
  v_new text := $new$(status in ('QUEUED','RETRY') or (
    status='WAITING_ASSET'
    and coalesce(attempts,0)=0
    and last_error is null
    and selected_provider='openart'
    and required_provider='openart'
    and 'openart'=any(allowed_providers)
    and coalesce(proof_manifest,'{}'::jsonb)='{}'::jsonb
    and nullif(asset_manifest->>'asset_url','') is null
    and nullif(asset_manifest->>'openart_history_id','') is null
    and nullif(asset_manifest->>'openart_resource_id','') is null
    and exists (
      select 1 from public.content_publication_obligations o
      join public.powerhouse_instagram_daily_winners_v1 w on w.run_date=o.publication_date
      where o.tenant_id=public.powerhouse_instagram_media_jobs_v1.tenant_id
        and o.publication_date=public.powerhouse_instagram_media_jobs_v1.publication_date
        and o.channel=public.powerhouse_instagram_media_jobs_v1.channel
        and o.channel='instagram'
        and o.status='BLOCKED'
        and o.last_error='MEDIA_ASSET_REQUIRED'
        and o.external_id is null
        and o.live_proven_at is null
        and coalesce(o.evidence #>> '{veto,active}','false')<>'true'
        and o.evidence->>'daily_winner_recommendation_id' =
            public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'daily_winner_recommendation_id'
        and w.recommendation_id::text =
            public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'daily_winner_recommendation_id'
    )
  ))$new$;
BEGIN
  IF to_regprocedure('public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)') IS NULL THEN
    RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_RPC_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid=to_regprocedure('public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)')
      AND p.prosecdef
      AND 'search_path=public, pg_catalog'=any(p.proconfig)
      AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
      AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
      AND has_function_privilege('service_role',p.oid,'EXECUTE')
  ) THEN RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_SECURITY_DRIFT'; END IF;
  SELECT pg_get_functiondef('public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)'::regprocedure)
    INTO v_before;
  IF position(v_new IN v_before)>0 THEN RETURN; END IF;
  IF position(v_old IN v_before)=0 OR
    length(v_before)-length(replace(v_before,v_old,''))<>length(v_old) THEN
    RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_SOURCE_DRIFT';
  END IF;
  IF position($guard$where tenant_id='canonical'$guard$ IN v_before)=0
     OR position($guard$and publication_date >= (p_now at time zone 'Europe/Amsterdam')::date$guard$ IN v_before)=0
     OR position($guard$and republish_forbidden=false$guard$ IN v_before)=0
     OR position($guard$for update skip locked$guard$ IN v_before)=0
     OR position($guard$set status='CLAIMED'$guard$ IN v_before)=0 THEN
     RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_LINEAGE_OR_LOCK_DRIFT';
  END IF;
  EXECUTE replace(v_before,v_old,v_new);
  SELECT pg_get_functiondef('public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)'::regprocedure)
    INTO v_after;
  IF position(v_new IN v_after)=0 OR
    position($guard$for update skip locked$guard$ IN v_after)=0 THEN
    RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_POSTWRITE_READBACK_FAILED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid=to_regprocedure('public.powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)')
      AND p.prosecdef
      AND 'search_path=public, pg_catalog'=any(p.proconfig)
      AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
      AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
      AND has_function_privilege('service_role',p.oid,'EXECUTE')
  ) THEN RAISE EXCEPTION 'MIRA_ORIGINAL_CLAIM_POSTWRITE_SECURITY_DRIFT'; END IF;
END
$migration$;
