-- Isolated Supabase PREVIEW integration test only; never execute on production.
-- Run with ON_ERROR_STOP=1 on a branch after migration, same connection throughout.
-- Entire test rolls back and leaves no synthetic incidents or cron records.
BEGIN;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
DO $check$
DECLARE
 f text:='__regression__brain-observer-evidence-v1';
 fc text:='__regression__brain-observer-alias-v1';
 a public.brain_failure_registry;
 before_count bigint;
 after_count bigint;
 collision_error text;
BEGIN
 a:=public.brain_observe_failure('regression-brain-evidence:one',f,'sha-one',
   '{"first_write":"retained"}'::jsonb);
 a:=public.brain_promote_failure(f,a.version,'VALIDATED',
   'known diagnostic root cause',NULL,'preserve old proven proof',
   'supabase/tests/brain-observe-failure-lossless-dedupe-v1.sql',
   '{"verified_proof":"must-survive","first_write":"retained"}'::jsonb);
 a:=public.brain_observe_failure('regression-brain-evidence:two',f,'sha-two',
   '{"new_observation":"append"}'::jsonb);
 IF a.maturity <> 'VALIDATED' OR a.root_cause <> 'known diagnostic root cause'
     OR a.evidence->>'verified_proof'<>'must-survive'
     OR a.evidence->>'first_write'<>'retained'
     OR a.occurrence_count<>2
     OR jsonb_array_length(a.evidence->'_event_observations_v1')<>2 THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_PROMOTED_EVIDENCE_LOST';
 END IF;

 a:=public.brain_observe_failure('cron-998123:10000001',fc,'same-provider-hash',
   '{"jobid":998123,"runid":10000001}'::jsonb);
 before_count:=a.occurrence_count;
 a:=public.brain_observe_failure('supabase:cron:job998123:run:10000001',
   fc,'same-provider-hash','{"same":"event"}'::jsonb);
 after_count:=a.occurrence_count;
 IF before_count<>1 OR after_count<>1 THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_ALIAS_DUPLICATE_COUNTED';
 END IF;

 BEGIN
   PERFORM public.brain_observe_failure(
      'supabase:adhjwmvyoixzjtmiroln:cron:998123:run:10000001',
      fc,'MISMATCH_HASH','{"same":"event"}'::jsonb);
   RAISE EXCEPTION 'ALIAS_CONFLICT_NOT_REJECTED';
 EXCEPTION WHEN raise_exception THEN
   GET STACKED DIAGNOSTICS collision_error=MESSAGE_TEXT;
   IF collision_error<>'FAILURE_OCCURRENCE_ALIAS_HASH_CONFLICT' THEN RAISE; END IF;
 END;

 a:=public.brain_observe_failure('cron-998123:10000002',
   fc,'different-actual-run','{"runid":10000002}'::jsonb);
 IF a.occurrence_count<>2 THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_DISTINCT_EVENT_NOT_COUNTED';
 END IF;
 IF (SELECT count(*) FROM public.brain_failure_occurrences
     WHERE fingerprint=fc)<>2 THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_IMMUTABLE_RAW_DUPLICATED';
 END IF;
 IF has_function_privilege('anon','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_ACL_REGRESSION';
 END IF;
 RAISE NOTICE 'BRAIN_OBSERVE_LOSSLESS_INTEGRATION_ACCEPTED: 2 facts; aliases idempotent; mismatched SHA rejected; ACL intact; ROLLBACK_ONLY';
END $check$;
ROLLBACK;
