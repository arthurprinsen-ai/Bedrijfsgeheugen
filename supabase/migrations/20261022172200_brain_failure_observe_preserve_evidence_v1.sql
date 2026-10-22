-- P0 #4681: same canonical Brain registry. Do not overwrite verified evidence or
-- count a single provider cron run twice when agents use different legacy IDs.
-- No table reset, new scheduler, parallel store, publication, or customer-data copy.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
  IF to_regprocedure('public.brain_observe_failure(text,text,text,jsonb)') IS NULL
     OR to_regclass('public.brain_failure_registry') IS NULL
     OR to_regclass('public.brain_failure_occurrences') IS NULL THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_CANONICAL_SOURCE_MISSING';
  END IF;
  IF has_function_privilege('anon', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_PRIVILEGE_BASELINE_DRIFT';
  END IF;
  IF position('evidence=coalesce(p_evidence,evidence)' IN
    lower(regexp_replace(pg_get_functiondef('public.brain_observe_failure(text,text,text,jsonb)'::regprocedure),
                   '[[:space:]]+', '', 'g'))) = 0 THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_SOURCE_ALREADY_CHANGED_REVIEW_REQUIRED';
  END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.brain_observe_failure(
  p_occurrence_id text,
  p_fingerprint text,
  p_payload_sha256 text,
  p_evidence jsonb DEFAULT NULL
)
RETURNS public.brain_failure_registry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_existing public.brain_failure_occurrences;
  v_registry public.brain_failure_registry;
  v_parts text[];
  v_job text;
  v_run text;
  v_project text;
  v_alias_old text;
  v_alias_new text;
  v_project_old text;
  v_project_new text;
BEGIN
  IF NULLIF(btrim(p_occurrence_id), '') IS NULL
    OR NULLIF(btrim(p_fingerprint), '') IS NULL
    OR NULLIF(btrim(p_payload_sha256), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  -- Preserve the original exact-ID / payload collision contract first.
  SELECT * INTO v_existing
  FROM public.brain_failure_occurrences
  WHERE occurrence_id = p_occurrence_id;
  IF FOUND THEN
    IF v_existing.fingerprint IS DISTINCT FROM p_fingerprint
      OR v_existing.payload_sha256 IS DISTINCT FROM p_payload_sha256 THEN
      RAISE EXCEPTION 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT';
    END IF;
    SELECT * INTO v_registry FROM public.brain_failure_registry
    WHERE fingerprint = p_fingerprint;
    RETURN v_registry;
  END IF;

  -- One physical cron invocation can be reported under two legacy formats.
  -- Unknown ID formats deliberately keep the existing exact-ID behavior.
  v_parts := regexp_match(p_occurrence_id, '^cron-([0-9]+):([0-9]+)$');
  IF v_parts IS NOT NULL THEN
    v_job := v_parts[1]; v_run := v_parts[2];
  ELSE
    v_parts := regexp_match(p_occurrence_id, '^supabase:cron:job([0-9]+):run:([0-9]+)$');
    IF v_parts IS NOT NULL THEN
      v_job := v_parts[1]; v_run := v_parts[2];
    ELSE
      v_parts := regexp_match(p_occurrence_id, '^supabase:([a-z0-9]{15,30}):cron:job([0-9]+):run:([0-9]+)$');
      IF v_parts IS NOT NULL THEN
        v_project := v_parts[1]; v_job := v_parts[2]; v_run := v_parts[3];
      ELSE
        v_parts := regexp_match(p_occurrence_id, '^supabase:([a-z0-9]{15,30}):cron:([0-9]+):run:([0-9]+)$');
        IF v_parts IS NOT NULL THEN
          v_project := v_parts[1]; v_job := v_parts[2]; v_run := v_parts[3];
        END IF;
      END IF;
    END IF;
  END IF;

  IF v_job IS NOT NULL THEN
    -- Canonical decimal identity: '046:001' and '46:1' denote one run.
    IF length(v_job) > 18 OR length(v_run) > 18 THEN
      RAISE EXCEPTION 'FAILURE_CRON_EVENT_ID_INVALID';
    END IF;
    v_job := (v_job::bigint)::text;
    v_run := (v_run::bigint)::text;
    IF p_evidence ? 'jobid'
      AND (p_evidence->>'jobid') IS DISTINCT FROM v_job THEN
      RAISE EXCEPTION 'FAILURE_EVENT_ID_PAYLOAD_CONFLICT';
    END IF;
    IF p_evidence ? 'runid'
      AND (p_evidence->>'runid') IS DISTINCT FROM v_run THEN
      RAISE EXCEPTION 'FAILURE_EVENT_ID_PAYLOAD_CONFLICT';
    END IF;
    IF v_project IS NOT NULL
      AND p_evidence ? 'project_ref'
      AND (p_evidence->>'project_ref') IS DISTINCT FROM v_project THEN
      RAISE EXCEPTION 'FAILURE_EVENT_ID_PAYLOAD_CONFLICT';
    END IF;

    IF v_project IS NULL AND p_evidence ? 'project_ref' THEN
      v_project := p_evidence->>'project_ref';
    END IF;
    IF v_project IS NOT NULL AND v_project !~ '^[a-z0-9]{15,30}
    v_alias_old := 'cron-' || v_job || ':' || v_run;
    v_alias_new := 'supabase:cron:job' || v_job || ':run:' || v_run;
    v_project_old := 'supabase:' || v_project || ':cron:' || v_job || ':run:' || v_run;
    v_project_new := 'supabase:' || v_project || ':cron:job' || v_job || ':run:' || v_run;

    SELECT * INTO v_existing
    FROM public.brain_failure_occurrences
    WHERE fingerprint = p_fingerprint
      AND (
        occurrence_id IN (v_alias_old, v_alias_new)
        OR (v_project IS NOT NULL AND occurrence_id IN (v_project_old, v_project_new))
      )
    ORDER BY observed_at, occurrence_id
    LIMIT 1;
    IF FOUND THEN
      IF p_evidence ? 'status' AND v_existing.evidence ? 'status'
        AND p_evidence->>'status' IS DISTINCT FROM v_existing.evidence->>'status' THEN
        RAISE EXCEPTION 'FAILURE_SEMANTIC_PROVIDER_STATUS_CONFLICT';
      END IF;
      SELECT * INTO v_registry FROM public.brain_failure_registry
      WHERE fingerprint = p_fingerprint;
      RETURN v_registry;
    END IF;
  END IF;

  INSERT INTO public.brain_failure_registry
    (fingerprint, occurrence_count, evidence)
  VALUES (p_fingerprint, 0, p_evidence)
  ON CONFLICT (fingerprint) DO NOTHING;

  INSERT INTO public.brain_failure_occurrences
    (occurrence_id, fingerprint, payload_sha256, evidence)
  VALUES (p_occurrence_id, p_fingerprint, p_payload_sha256, p_evidence);

  -- New raw events live in append-only occurrences; older promoted/verified
  -- JSON fields in the registry are never replaced by a fresh observation.
  UPDATE public.brain_failure_registry
  SET occurrence_count = occurrence_count + 1,
      last_seen_at = now(),
      evidence = coalesce(evidence, p_evidence)
  WHERE fingerprint = p_fingerprint
  RETURNING * INTO v_registry;
  RETURN v_registry;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing FROM public.brain_failure_occurrences
  WHERE occurrence_id = p_occurrence_id;
  IF NOT FOUND THEN RAISE; END IF;
  IF v_existing.fingerprint IS DISTINCT FROM p_fingerprint
    OR v_existing.payload_sha256 IS DISTINCT FROM p_payload_sha256 THEN
    RAISE EXCEPTION 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT';
  END IF;
  SELECT * INTO v_registry FROM public.brain_failure_registry
  WHERE fingerprint = p_fingerprint;
  RETURN v_registry;
END
$function$;

-- Retain current restricted service-role-only authority of the definer RPC.
REVOKE ALL ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
TO service_role;

DO $readback$
BEGIN
  IF has_function_privilege('anon', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT (SELECT prosecdef FROM pg_proc
            WHERE oid = 'public.brain_observe_failure(text,text,text,jsonb)'::regprocedure)
  THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_POSTWRITE_SECURITY_DRIFT';
  END IF;
END
$readback$;
COMMIT;
 THEN
      RAISE EXCEPTION 'FAILURE_CRON_PROJECT_REF_INVALID';
    END IF;

    -- All writer aliases for one job/run serialize on the same advisory key.
    -- A project-aware source retains project-specific matching below.
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'brain-observe:' || p_fingerprint || ':cron:' || v_job || ':' || v_run, 0
      )
    );
    v_alias_old := 'cron-' || v_job || ':' || v_run;
    v_alias_new := 'supabase:cron:job' || v_job || ':run:' || v_run;
    v_project_old := 'supabase:' || v_project || ':cron:' || v_job || ':run:' || v_run;
    v_project_new := 'supabase:' || v_project || ':cron:job' || v_job || ':run:' || v_run;

    SELECT * INTO v_existing
    FROM public.brain_failure_occurrences
    WHERE fingerprint = p_fingerprint
      AND (
        occurrence_id IN (v_alias_old, v_alias_new)
        OR (v_project IS NOT NULL AND occurrence_id IN (v_project_old, v_project_new))
      )
    ORDER BY observed_at, occurrence_id
    LIMIT 1;
    IF FOUND THEN
      IF p_evidence ? 'status' AND v_existing.evidence ? 'status'
        AND p_evidence->>'status' IS DISTINCT FROM v_existing.evidence->>'status' THEN
        RAISE EXCEPTION 'FAILURE_SEMANTIC_PROVIDER_STATUS_CONFLICT';
      END IF;
      SELECT * INTO v_registry FROM public.brain_failure_registry
      WHERE fingerprint = p_fingerprint;
      RETURN v_registry;
    END IF;
  END IF;

  INSERT INTO public.brain_failure_registry
    (fingerprint, occurrence_count, evidence)
  VALUES (p_fingerprint, 0, p_evidence)
  ON CONFLICT (fingerprint) DO NOTHING;

  INSERT INTO public.brain_failure_occurrences
    (occurrence_id, fingerprint, payload_sha256, evidence)
  VALUES (p_occurrence_id, p_fingerprint, p_payload_sha256, p_evidence);

  -- New raw events live in append-only occurrences; older promoted/verified
  -- JSON fields in the registry are never replaced by a fresh observation.
  UPDATE public.brain_failure_registry
  SET occurrence_count = occurrence_count + 1,
      last_seen_at = now(),
      evidence = coalesce(evidence, p_evidence)
  WHERE fingerprint = p_fingerprint
  RETURNING * INTO v_registry;
  RETURN v_registry;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing FROM public.brain_failure_occurrences
  WHERE occurrence_id = p_occurrence_id;
  IF NOT FOUND THEN RAISE; END IF;
  IF v_existing.fingerprint IS DISTINCT FROM p_fingerprint
    OR v_existing.payload_sha256 IS DISTINCT FROM p_payload_sha256 THEN
    RAISE EXCEPTION 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT';
  END IF;
  SELECT * INTO v_registry FROM public.brain_failure_registry
  WHERE fingerprint = p_fingerprint;
  RETURN v_registry;
END
$function$;

-- Retain current restricted service-role-only authority of the definer RPC.
REVOKE ALL ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.brain_observe_failure(text,text,text,jsonb)
TO service_role;

DO $readback$
BEGIN
  IF has_function_privilege('anon', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'public.brain_observe_failure(text,text,text,jsonb)', 'EXECUTE')
    OR NOT (SELECT prosecdef FROM pg_proc
            WHERE oid = 'public.brain_observe_failure(text,text,text,jsonb)'::regprocedure)
  THEN
    RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_POSTWRITE_SECURITY_DRIFT';
  END IF;
END
$readback$;
COMMIT;
