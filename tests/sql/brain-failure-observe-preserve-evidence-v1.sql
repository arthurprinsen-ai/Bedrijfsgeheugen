-- Transaction-only provider-preview replay for P0 #4681.
-- The code intentionally uses the real canonical RPC and rolls every row back.
-- Never execute without current protected migration / service-role authorization.
BEGIN;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';

DO $replay$
DECLARE
  v_fingerprint text := 'brain|test-replay|evidence-preservation-' || txid_current()::text;
  v_run bigint := 900000000000 + txid_current();
  v_prev public.brain_failure_registry;
  v_after public.brain_failure_registry;
  v_duplicate public.brain_failure_registry;
  v_latest public.brain_failure_registry;
  v_raw bigint;
BEGIN
  v_prev := public.brain_observe_failure(
    'cron-46:' || v_run::text,
    v_fingerprint,
    repeat('a',64),
    jsonb_build_object('jobid','46','runid',v_run::text,'status','failed','initial_raw','retained')
  );
  IF v_prev.occurrence_count <> 1 THEN RAISE EXCEPTION 'FIRST_PROVIDER_RUN_MUST_COUNT_ONCE'; END IF;

  v_prev := public.brain_promote_failure(
    v_fingerprint, v_prev.version, 'VALIDATED',
    'known technical cause','provider check recovered',
    'preserve prior evidence','tests/sql/brain-failure-observe-preserve-evidence-v1.sql',
    jsonb_build_object('verified_prior_analysis','persistent','protected_receipt','proof-123')
  );

  v_after := public.brain_observe_failure(
    'supabase:cron:job46:run:' || (v_run+1)::text,
    v_fingerprint,
    repeat('b',64),
    jsonb_build_object('jobid','46','runid',(v_run+1)::text,'status','failed','new_raw','append_only')
  );
  IF v_after.evidence->>'verified_prior_analysis' IS DISTINCT FROM 'persistent'
     OR v_after.evidence->>'protected_receipt' IS DISTINCT FROM 'proof-123' THEN
    RAISE EXCEPTION 'VERIFIED_PRIOR_ANALYSIS_MUST_SURVIVE_NEXT_OBSERVATION';
  END IF;
  IF v_after.occurrence_count <> 2 THEN RAISE EXCEPTION 'SECOND_UNIQUE_PROVIDER_RUN_MISSING'; END IF;

  v_duplicate := public.brain_observe_failure(
    'cron-46:' || (v_run+1)::text,
    v_fingerprint,
    repeat('c',64),
    jsonb_build_object('jobid','46','runid',(v_run+1)::text,'status','failed','alias','different_writer')
  );
  IF v_duplicate.occurrence_count <> 2 THEN
    RAISE EXCEPTION 'SAME_CRON_RUN_ALIASES_MUST_COUNT_ONCE';
  END IF;

  v_latest := public.brain_observe_failure(
    'cron-46:' || (v_run+2)::text,
    v_fingerprint,
    repeat('d',64),
    jsonb_build_object('jobid','46','runid',(v_run+2)::text,'status','failed')
  );
  IF v_latest.occurrence_count <> 3 THEN
    RAISE EXCEPTION 'DIFFERENT_CRON_RUNS_MUST_COUNT_SEPARATELY';
  END IF;

  v_latest := public.brain_observe_failure(
    'supabase:adhjwmvyoixzjtmiroln:cron:46:run:' || (v_run+3)::text,
    v_fingerprint, repeat('e',64),
    jsonb_build_object('jobid','46','runid',(v_run+3)::text,
                       'project_ref','adhjwmvyoixzjtmiroln','status','failed')
  );
  v_duplicate := public.brain_observe_failure(
    'cron-46:' || (v_run+3)::text,
    v_fingerprint, repeat('f',64),
    jsonb_build_object('jobid','46','runid',(v_run+3)::text,'status','failed')
  );
  IF v_duplicate.occurrence_count <> 4 THEN
    RAISE EXCEPTION 'PROJECT_SCOPED_THEN_LEGACY_RUN_MUST_COUNT_ONCE';
  END IF;

  SELECT count(*) INTO v_raw FROM public.brain_failure_occurrences
  WHERE fingerprint=v_fingerprint;
  IF v_raw<>4 THEN RAISE EXCEPTION 'RAW_APPEND_ONLY_OBSERVATION_HISTORY_LOST_OR_DUPLICATED'; END IF;

  BEGIN
    PERFORM public.brain_observe_failure(
      'cron-46:' || v_run::text, v_fingerprint, repeat('z',64),
      jsonb_build_object('jobid','46','runid',v_run::text,'status','failed')
    );
    RAISE EXCEPTION 'DIFFERENT_PAYLOAD_SAME_ID_MUST_FAIL_CLOSED';
  EXCEPTION WHEN others THEN
    IF SQLERRM <> 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.brain_observe_failure(
      'supabase:cron:job46:run:' || (v_run+1)::text,
      v_fingerprint, repeat('b',64),
      jsonb_build_object('jobid','46','runid',(v_run+1)::text,'status','succeeded')
    );
    RAISE EXCEPTION 'CONFLICTING_PROVIDER_STATUS_MUST_FAIL_CLOSED';
  EXCEPTION WHEN others THEN
    IF SQLERRM <> 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT'
       AND SQLERRM <> 'FAILURE_SEMANTIC_PROVIDER_STATUS_CONFLICT' THEN
      RAISE;
    END IF;
  END;

  IF has_function_privilege('anon',
      'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated',
      'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT has_function_privilege('service_role',
      'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'REPLAY_SECURITY_BOUNDARY_MUST_REMAIN';
  END IF;

  RAISE NOTICE 'BRAIN_FAILURE_REPLAY_PASSED: distinct-run-count=4, alias-dedupe, verified-proof-retained, privileges-intact';
END
$replay$;

ROLLBACK;
