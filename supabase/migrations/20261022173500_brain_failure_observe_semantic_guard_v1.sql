-- Canonical P0 #4681. A new observation must never delete previously verified registry evidence.
-- Preserve every legacy raw occurrence (including cross-writer aliases with conflicting hashes).
-- Explicit source projects remain part of semantic identity. Projectless legacy
-- aliases stay legacy-only; mixing scoped and unscoped records fails closed.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

-- Replay-safe guard: on fresh baselines we expect the legacy function, but
-- a reseeded branch may already contain this *same* promoted-evidence-safe
-- postcondition. Never reject the stronger verified end state as source drift.
-- This alters only a replay precondition; the migration's DDL/function body,
-- existing migration identity and production provider history stay untouched.
DO $guard$
DECLARE
  v_observe regprocedure := to_regprocedure('public.brain_observe_failure(text,text,text,jsonb)');
  v_definition text;
  v_legacy boolean;
  v_safe_postcondition boolean;
BEGIN
  IF v_observe IS NULL THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT';
  END IF;
  v_definition := pg_get_functiondef(v_observe);
  v_legacy := position('evidence=coalesce(p_evidence,evidence)' IN v_definition) > 0;
  v_safe_postcondition :=
    position('evidence=coalesce(evidence,p_evidence)' IN v_definition) > 0
    AND position('FAILURE_SEMANTIC_EVENT_CONFLICT' IN v_definition) > 0
    AND position('FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT' IN v_definition) > 0
    AND position('pg_advisory_xact_lock' IN v_definition) > 0
    AND position('brain_failure_semantic_event_key' IN v_definition) > 0
    AND NOT coalesce(has_function_privilege('anon',v_observe,'EXECUTE'),true)
    AND NOT coalesce(has_function_privilege('authenticated',v_observe,'EXECUTE'),true)
    AND coalesce(has_function_privilege('service_role',v_observe,'EXECUTE'),false);
  IF NOT (v_legacy OR v_safe_postcondition) THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT';
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

-- Supports bounded ambiguity detection across legacy and explicit project keys.
CREATE INDEX IF NOT EXISTS brain_failure_occurrences_cron_tail_v1_idx
  ON public.brain_failure_occurrences
    (substring(powerhouse_ops.brain_failure_semantic_event_key(occurrence_id)
      from 'cron:job[0-9]+:run:[0-9]+$'));

CREATE OR REPLACE FUNCTION public.brain_observe_failure(
  p_occurrence_id text, p_fingerprint text, p_payload_sha256 text,
  p_evidence jsonb DEFAULT NULL::jsonb)
RETURNS public.brain_failure_registry
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $observe$
DECLARE
  o public.brain_failure_occurrences%ROWTYPE;
  r public.brain_failure_registry%ROWTYPE;
  v_semantic text;
  v_cron_tail text;
  v_project_scoped boolean;
BEGIN
  IF nullif(btrim(p_occurrence_id),'') IS NULL
     OR nullif(btrim(p_fingerprint),'') IS NULL
     OR nullif(btrim(p_payload_sha256),'') IS NULL
  THEN RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  v_semantic := powerhouse_ops.brain_failure_semantic_event_key(p_occurrence_id);
  v_cron_tail := substring(v_semantic from 'cron:job[0-9]+:run:[0-9]+$');
  v_project_scoped := v_semantic ~ '^supabase:[a-z0-9]+:cron:';
  IF v_cron_tail IS NOT NULL THEN
    -- Cross-scope lock closes the legacy/scoped race; the normal event lock
    -- below still includes the full explicit source-project identity.
    PERFORM pg_advisory_xact_lock(hashtextextended('brain:cron-scope:' || v_cron_tail,0));
    IF EXISTS (
      SELECT 1 FROM public.brain_failure_occurrences prior
      WHERE substring(powerhouse_ops.brain_failure_semantic_event_key(prior.occurrence_id)
              from 'cron:job[0-9]+:run:[0-9]+$') = v_cron_tail
        AND (powerhouse_ops.brain_failure_semantic_event_key(prior.occurrence_id)
              ~ '^supabase:[a-z0-9]+:cron:') IS DISTINCT FROM v_project_scoped
    ) THEN RAISE EXCEPTION 'FAILURE_AMBIGUOUS_LEGACY_PROJECT_SCOPE';
    END IF;
  END IF;
  -- Same real event must serialize across multiple agents and all alias formats.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    CASE WHEN v_semantic IS NULL THEN 'brain:raw:' || p_occurrence_id
         ELSE 'brain:semantic:' || v_semantic END, 0));

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

