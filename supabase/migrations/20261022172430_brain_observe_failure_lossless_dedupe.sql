-- P0 #4681 | Repair existing canonical Brain failure event ingestion.
-- Preserve historic raw occurrences, previous promoted diagnostics and privilege boundary.
-- An occurrence is a provider EVENT, not an agent/request ID. No new scheduler/store.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
DO $source_guard$
BEGIN
 IF to_regprocedure('public.brain_observe_failure(text,text,text,jsonb)') IS NULL THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_CANONICAL_FUNCTION_MISSING';
 END IF;
 IF position('evidence=coalesce(p_evidence,evidence)' in
   pg_get_functiondef('public.brain_observe_failure(text,text,text,jsonb)'::regprocedure))=0 THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_SOURCE_DRIFT_STOP';
 END IF;
 IF has_function_privilege('anon','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE')
   OR has_function_privilege('authenticated','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'BRAIN_OBSERVE_EXISTING_ACL_DRIFT';
 END IF;
END
$source_guard$;

CREATE OR REPLACE FUNCTION public.brain_observe_failure(
 p_occurrence_id text,
 p_fingerprint text,
 p_payload_sha256 text,
 p_evidence jsonb DEFAULT NULL::jsonb
) RETURNS public.brain_failure_registry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
 v_id text:=btrim(p_occurrence_id);
 v_fingerprint text:=btrim(p_fingerprint);
 v_sha text:=btrim(p_payload_sha256);
 v_canonical text:=v_id;
 v_aliases text[];
 v_parts text[];
 v_count bigint;
 v_distinct_fingerprints bigint;
 v_distinct_hashes bigint;
 v_matching_fingerprint text;
 v_matching_hash text;
 v_record public.brain_failure_registry;
BEGIN
 IF nullif(v_id,'') IS NULL OR nullif(v_fingerprint,'') IS NULL
     OR nullif(v_sha,'') IS NULL THEN RAISE EXCEPTION 'VALIDATION_ERROR'; END IF;
 IF p_evidence IS NOT NULL AND jsonb_typeof(p_evidence)<>'object' THEN
   RAISE EXCEPTION 'BRAIN_OBSERVE_EVIDENCE_OBJECT_REQUIRED';
 END IF;
 IF coalesce(p_evidence ? '_event_observations_v1',false) THEN
   RAISE EXCEPTION 'BRAIN_OBSERVE_RESERVED_EVIDENCE_KEY';
 END IF;

 -- Only known cron aliases in THIS Supabase project are normalized.
 -- An event from another project is never conflated with this project's run.
 IF v_id ~ '^cron-[0-9]+:[0-9]+$' THEN
   v_parts:=regexp_match(v_id,'^cron-([0-9]+):([0-9]+)$');
 ELSIF v_id ~ '^supabase:cron:job[0-9]+:run:[0-9]+$' THEN
   v_parts:=regexp_match(v_id,'^supabase:cron:job([0-9]+):run:([0-9]+)$');
 ELSIF v_id ~ '^supabase:adhjwmvyoixzjtmiroln:cron:[0-9]+:run:[0-9]+$' THEN
   v_parts:=regexp_match(v_id,'^supabase:adhjwmvyoixzjtmiroln:cron:([0-9]+):run:([0-9]+)$');
 END IF;
 IF v_parts IS NOT NULL THEN
   v_canonical:='supabase:adhjwmvyoixzjtmiroln:cron:'||v_parts[1]||':run:'||v_parts[2];
   v_aliases:=ARRAY[
     v_canonical,
     'cron-'||v_parts[1]||':'||v_parts[2],
     'supabase:cron:job'||v_parts[1]||':run:'||v_parts[2]
   ];
 ELSE
   v_aliases:=ARRAY[v_canonical];
 END IF;

 -- All agent aliases of one provider event share one transactional lock.
 PERFORM pg_advisory_xact_lock(hashtextextended('brain-failure-event:'||v_canonical,0));
 SELECT count(*),count(DISTINCT fingerprint),count(DISTINCT payload_sha256),
        min(fingerprint),min(payload_sha256)
 INTO v_count,v_distinct_fingerprints,v_distinct_hashes,
      v_matching_fingerprint,v_matching_hash
 FROM public.brain_failure_occurrences
 WHERE occurrence_id=ANY(v_aliases);
 IF v_count>0 THEN
   IF v_distinct_fingerprints<>1 OR v_matching_fingerprint<>v_fingerprint
      OR v_distinct_hashes<>1 OR v_matching_hash<>v_sha THEN
     RAISE EXCEPTION 'FAILURE_OCCURRENCE_ALIAS_HASH_CONFLICT';
   END IF;
   SELECT * INTO v_record FROM public.brain_failure_registry
    WHERE fingerprint=v_fingerprint;
   RETURN v_record;
 END IF;

 INSERT INTO public.brain_failure_registry(fingerprint,occurrence_count,evidence)
 VALUES(v_fingerprint,0,p_evidence)
 ON CONFLICT(fingerprint) DO NOTHING;
 INSERT INTO public.brain_failure_occurrences(
   occurrence_id,fingerprint,payload_sha256,evidence
 ) VALUES(v_canonical,v_fingerprint,v_sha,p_evidence);

 -- Keep ALL prior promoted evidence keys. Individual source payloads remain
 -- immutable in brain_failure_occurrences; the registry stores compact pointers.
 -- Do not overwrite any existing analysis, proof, mitigation or prevention key.
 UPDATE public.brain_failure_registry
 SET occurrence_count=occurrence_count+1,
     last_seen_at=now(),
     evidence=coalesce(evidence,'{}'::jsonb)
       || jsonb_build_object('_event_observations_v1',
           coalesce(CASE WHEN jsonb_typeof(evidence->'_event_observations_v1')='array'
                    THEN evidence->'_event_observations_v1' END,'[]'::jsonb)
           || jsonb_build_array(jsonb_build_object(
               'event_id',v_canonical,'sha256',v_sha,'observed_at',now()
           )))
 WHERE fingerprint=v_fingerprint
 RETURNING * INTO v_record;
 RETURN v_record;
END
$function$;

-- Existing function authority retained; no new anonymous or customer execute.
REVOKE ALL ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
 TO service_role;
DO $readback$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_proc p WHERE p.oid='public.brain_observe_failure(text,text,text,jsonb)'::regprocedure
    AND p.prosecdef=true
    AND p.proconfig @> ARRAY['search_path=public']::text[]
 ) THEN RAISE EXCEPTION 'BRAIN_OBSERVE_DEFINER_OR_SEARCH_PATH_DRIFT'; END IF;
 IF has_function_privilege('anon','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE')
 OR has_function_privilege('authenticated','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'BRAIN_OBSERVE_BROWSER_EXECUTE_FORBIDDEN';
 END IF;
 IF NOT has_function_privilege('service_role','public.brain_observe_failure(text,text,text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'BRAIN_OBSERVE_SERVICE_EXECUTE_MISSING';
 END IF;
END
$readback$;
COMMIT;
