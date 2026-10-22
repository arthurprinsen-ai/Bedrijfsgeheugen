-- Execute only in a nonproduction isolated preview. Explicit ROLLBACK is mandatory.
-- This transaction tests the already-applied candidate migration; it must never modify prod.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='30s';

DO $assert$
DECLARE r public.brain_failure_registry; v_fingerprint text := 'test|brain-observe-semantic|4681|rollback';
BEGIN
  PERFORM public.brain_observe_failure('cron-46:987654312',v_fingerprint,repeat('a',64),'{"first":"raw"}'::jsonb);
  SELECT * INTO r FROM public.brain_failure_registry WHERE fingerprint=v_fingerprint;
  IF r.occurrence_count IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FIRST_OCCURRENCE_FAILED'; END IF;
  PERFORM public.brain_promote_failure(v_fingerprint,r.version,'VALIDATED',
    'verified root cause',NULL,'verified prevention','sql-rollback-proof',
    '{"verified_marker":"must_survive"}'::jsonb);
  PERFORM public.brain_observe_failure(
    'supabase:cron:job46:run:987654312',v_fingerprint,repeat('a',64),'{"alias":"same"}'::jsonb);
  PERFORM public.brain_observe_failure(
    'cron-46:987654313',v_fingerprint,repeat('b',64),'{"second":"new"}'::jsonb);
  SELECT * INTO r FROM public.brain_failure_registry WHERE fingerprint=v_fingerprint;
  IF r.occurrence_count IS DISTINCT FROM 2 OR (r.evidence->>'verified_marker') IS DISTINCT FROM 'must_survive' THEN
    RAISE EXCEPTION 'EVIDENCE_PRESERVATION_OR_DEDUP_FAILED';
  END IF;
  BEGIN
    PERFORM public.brain_observe_failure(
      'supabase:cron:job46:run:987654312',v_fingerprint,repeat('c',64),NULL);
    RAISE EXCEPTION 'CONFLICT_NOT_REJECTED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'FAILURE_SEMANTIC_EVENT_CONFLICT' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.brain_failure_occurrences
       WHERE fingerprint=v_fingerprint)<>2 THEN
    RAISE EXCEPTION 'RAW_OCCURRENCE_WRONG_COUNT';
  END IF;
END $assert$;
DO $scope$
DECLARE r public.brain_failure_registry; f text := 'test|brain-project-scope|4681|rollback';
BEGIN
  IF powerhouse_ops.brain_failure_semantic_event_key('supabase:aaaaaaaaaaaaaaaaaaaa:cron:46:run:987654321')
     IS NOT DISTINCT FROM powerhouse_ops.brain_failure_semantic_event_key('supabase:bbbbbbbbbbbbbbbbbbbb:cron:46:run:987654321')
  THEN RAISE EXCEPTION 'CROSS_PROJECT_EVENT_COLLISION'; END IF;
  PERFORM public.brain_observe_failure('supabase:aaaaaaaaaaaaaaaaaaaa:cron:46:run:987654321',f,repeat('d',64),NULL);
  PERFORM public.brain_observe_failure('supabase:aaaaaaaaaaaaaaaaaaaa:cron:job46:run:987654321',f,repeat('d',64),NULL);
  SELECT * INTO r FROM public.brain_failure_registry WHERE fingerprint=f;
  IF r.occurrence_count IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'SCOPED_ALIAS_DEDUPE_FAILED'; END IF;
  PERFORM public.brain_observe_failure('supabase:bbbbbbbbbbbbbbbbbbbb:cron:46:run:987654321',f,repeat('d',64),NULL);
  SELECT * INTO r FROM public.brain_failure_registry WHERE fingerprint=f;
  IF r.occurrence_count IS DISTINCT FROM 2 THEN RAISE EXCEPTION 'CROSS_PROJECT_EVENT_COLLISION'; END IF;
  BEGIN
    PERFORM public.brain_observe_failure('cron-46:987654321',f,repeat('d',64),NULL);
    RAISE EXCEPTION 'PROJECT_FIRST_SCOPE_NOT_REJECTED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'FAILURE_AMBIGUOUS_LEGACY_PROJECT_SCOPE' THEN RAISE; END IF;
  END;
  PERFORM public.brain_observe_failure('cron-46:987654322',f,repeat('e',64),NULL);
  BEGIN
    PERFORM public.brain_observe_failure('supabase:aaaaaaaaaaaaaaaaaaaa:cron:46:run:987654322',f,repeat('e',64),NULL);
    RAISE EXCEPTION 'LEGACY_FIRST_SCOPE_NOT_REJECTED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'FAILURE_AMBIGUOUS_LEGACY_PROJECT_SCOPE' THEN RAISE; END IF;
  END;
  r.occurrence_count := 2; r.evidence := '{}'::jsonb;
  BEGIN
    IF r.occurrence_count IS DISTINCT FROM 2 OR (r.evidence->>'verified_marker') IS DISTINCT FROM 'must_survive'
    THEN RAISE EXCEPTION 'EVIDENCE_PRESERVATION_OR_DEDUP_FAILED'; END IF;
    RAISE EXCEPTION 'MISSING_MARKER_NOT_REJECTED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IS DISTINCT FROM 'EVIDENCE_PRESERVATION_OR_DEDUP_FAILED' THEN RAISE; END IF;
  END;
END $scope$;
SELECT 'PASS: rollback-only evidence preservation, alias dedupe, conflict' AS receipt;
ROLLBACK;

