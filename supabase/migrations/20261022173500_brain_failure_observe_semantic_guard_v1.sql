-- Canonical P0 #4681. A new observation must never delete previously verified registry evidence.
-- Preserve every legacy raw occurrence (including cross-writer aliases with conflicting hashes).
-- Explicit provider project refs are part of semantic identity.
-- Unscoped legacy events cannot establish project ownership.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $guard$
BEGIN
  IF to_regprocedure('public.brain_observe_failure(text,text,text,jsonb)') IS NULL
     OR position('evidence=coalesce(p_evidence,evidence)' IN
       pg_get_functiondef('public.brain_observe_failure(text,text,text,jsonb)'::regprocedure)) = 0
  THEN RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT';
  END IF;
  IF to_regclass('public.brain_failure_occurrences') IS NULL
     OR to_regclass('public.brain_failure_registry') IS NULL
  THEN RAISE EXCEPTION 'BRAIN_FAILURE_CANONICAL_TABLE_MISSING';
  END IF;
END $guard$;

-- Pure identity normalizer; no new registry, scheduler, or consumer.
CREATE OR REPLACE FUNCTION powerhouse_ops.brain_failure_semantic_event_key(p_occurrence_id text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path = pg_catalog AS $key$
  SELECT CASE
    WHEN p_occurrence_id ~ '^cron-[0-9]+:[0-9]+$' THEN
      regexp_replace(p_occurrence_id, '^cron-([0-9]+):([0-9]+)$',
        'supabase:cron:job\1:run:\2')
    WHEN p_occurrence_id ~ '^supabase:cron:job[0-9]+:run:[0-9]+$' THEN
      p_occurrence_id
    WHEN p_occurrence_id ~ '^supabase:[a-z0-9]+:cron:(job)?[0-9]+:run:[0-9]+$' THEN
      regexp_replace(p_occurrence_id,
        '^supabase:([a-z0-9]+):cron:(job)?([0-9]+):run:([0-9]+)$',
        'supabase:\1:cron:job\3:run:\4')
    ELSE NULL
  END;
$key$;
REVOKE ALL ON FUNCTION powerhouse_ops.brain_failure_semantic_event_key(text)
  FROM PUBLIC, anon, authenticated;

-- Existing raw records are immutable. Non-unique index because 9 already duplicated
-- provider events must remain on disk for audit, not be force-deleted.
CREATE INDEX IF NOT EXISTS brain_failure_occurrences_semantic_event_v1_idx
  ON public.brain_failure_occurrences
    (powerhouse_ops.brain_failure_semantic_event_key(occurrence_id))
  WHERE powerhouse_ops.brain_failure_semantic_event_key(occurrence_id) IS NOT NULL;

CREATE OR REPLACE FUNCTION public.brain_observe_failure(
  p_occurrence_id text, p_fingerprint text, p_payload_sha256 text,
  p_evidence jsonb DEFAULT NULL::jsonb)
RETURNS public.brain_failure_registry
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $observe$
DECLARE
  o public.brain_failure_occurrences%ROWTYPE;
  r public.brain_failure_registry%ROWTYPE;
  v_semantic text;
  v_run_scope text;
BEGIN
  IF nullif(btrim(p_occurrence_id),'') IS NULL
     OR nullif(btrim(p_fingerprint),'') IS NULL
     OR nullif(btrim(p_payload_sha256),'') IS NULL
  THEN RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  v_semantic := powerhouse_ops.brain_failure_semantic_event_key(p_occurrence_id);
  v_run_scope := regexp_replace(v_semantic, '^supabase:[a-z0-9]+:cron:', 'supabase:cron:');
  -- Same real event must serialize across multiple agents and all alias formats.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    CASE WHEN v_semantic IS NULL THEN 'brain:raw:' || p_occurrence_id
         ELSE 'brain:semantic:' || v_run_scope END, 0));

  -- Serialize the ambiguity check with both arrival orders. Separate known
  -- projects may coexist; unknown project ownership must never silently merge.
  IF v_semantic IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.brain_failure_occurrences existing
    CROSS JOIN LATERAL (SELECT powerhouse_ops.brain_failure_semantic_event_key(existing.occurrence_id) AS key) identity
    WHERE regexp_replace(identity.key, '^supabase:[a-z0-9]+:cron:', 'supabase:cron:') = v_run_scope
      AND identity.key IS DISTINCT FROM v_semantic
      AND (identity.key = v_run_scope OR v_semantic = v_run_scope)
  ) THEN RAISE EXCEPTION 'FAILURE_SEMANTIC_EVENT_SCOPE_AMBIGUOUS';
  END IF;

  SELECT * INTO o
  FROM public.brain_failure_occurrences
  WHERE occurrence_id = p_occurrence_id
    OR (v_semantic IS NOT NULL
        AND powerhouse_ops.brain_failure_semantic_event_key(occurrence_id) = v_semantic)
  ORDER BY observed_at, occurrence_id
  LIMIT 1;

  IF FOUND THEN
    IF o.fingerprint IS DISTINCT FROM p_fingerprint
       OR o.payload_sha256 IS DISTINCT FROM p_payload_sha256
    THEN RAISE EXCEPTION 'FAILURE_SEMANTIC_EVENT_CONFLICT';
    END IF;
    -- Conflicting historical alias evidence is not silently reconciled.
    IF v_semantic IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.brain_failure_occurrences other
      WHERE powerhouse_ops.brain_failure_semantic_event_key(other.occurrence_id) = v_semantic
        AND (other.fingerprint IS DISTINCT FROM p_fingerprint
             OR other.payload_sha256 IS DISTINCT FROM p_payload_sha256)
    ) THEN RAISE EXCEPTION 'FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT';
    END IF;
    SELECT * INTO r FROM public.brain_failure_registry
      WHERE fingerprint=p_fingerprint;
    RETURN r;
  END IF;

  INSERT INTO public.brain_failure_registry(fingerprint,occurrence_count,evidence)
    VALUES(p_fingerprint,0,p_evidence) ON CONFLICT(fingerprint) DO NOTHING;
  INSERT INTO public.brain_failure_occurrences(
    occurrence_id,fingerprint,payload_sha256,evidence)
    VALUES(p_occurrence_id,p_fingerprint,p_payload_sha256,p_evidence);
  -- New evidence lives durably in append-only occurrences. The registry's
  -- promoted proof keys are NEVER replaced by a later observation.
  UPDATE public.brain_failure_registry
    SET occurrence_count=occurrence_count+1,
        last_seen_at=now(),
        evidence=coalesce(evidence,p_evidence)
    WHERE fingerprint=p_fingerprint RETURNING * INTO r;
  RETURN r;
END $observe$;
REVOKE ALL ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
  TO service_role;
COMMIT;
