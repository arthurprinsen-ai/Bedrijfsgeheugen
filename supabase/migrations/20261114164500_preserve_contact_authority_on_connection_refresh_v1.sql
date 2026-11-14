-- P0 #4198: prevent the canonical daily enrichment refresh from erasing
-- the original email-authority review performed by cron #138.
-- No new table, external lookup, sender, permission, scheduler or manual bypass.
DO $preserve_email_authority$
DECLARE
  v_name text;
  v_oid oid;
  v_source text;
  v_needle constant text := 'source_snapshot=excluded.source_snapshot || jsonb_build_object(';
  v_patch constant text := 'source_snapshot=excluded.source_snapshot || (case when powerhouse_connection_enrichment_state_v1.source_snapshot ? ''email_authority'' then jsonb_build_object(''email_authority'', powerhouse_connection_enrichment_state_v1.source_snapshot->''email_authority'') else ''{}''::jsonb end) || jsonb_build_object(';
  v_matches integer;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'powerhouse_refresh_all_connection_enrichment_v1',
    'powerhouse_refresh_connection_enrichment_batch_v1'
  ] LOOP
    SELECT to_regprocedure(format('public.%I(date,integer)',v_name))::oid INTO v_oid;
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'CONTACT_AUTHORITY_CANONICAL_FUNCTION_MISSING: %',v_name;
    END IF;
    SELECT pg_get_functiondef(v_oid) INTO v_source;
    IF strpos(v_source,v_patch)>0 THEN
      CONTINUE; -- safe replay; never regress a function that already preserves authority
    END IF;
    v_matches := (length(v_source)-length(replace(v_source,v_needle,'')))/length(v_needle);
    IF v_matches<>1 THEN
      RAISE EXCEPTION 'CONTACT_AUTHORITY_SOURCE_DRIFT: % (matched %)',v_name,v_matches;
    END IF;
    -- Preserve the previously reviewed authority only; keep the live core/metrics fresh.
    -- The stored review's run_date remains authoritative; stale review != permission.
    EXECUTE replace(v_source,v_needle,v_patch);
  END LOOP;
END;
$preserve_email_authority$;
