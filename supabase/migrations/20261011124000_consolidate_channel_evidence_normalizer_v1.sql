-- P0 #4198. Keep exactly one canonical evidence serializer on the existing
-- channel-decision table; preserve existing provider receipts and delivery gates.
-- An earlier production repair briefly introduced a second overlapping trigger.
-- Reuse the protected-main function/trigger rather than keeping two writers.
CREATE OR REPLACE FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  parsed jsonb := NEW.delivery_evidence;
  iteration int;
BEGIN
  IF parsed IS NULL THEN
    RAISE EXCEPTION 'CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED'
      USING ERRCODE = '22023';
  END IF;

  FOR iteration IN 1..5 LOOP
    EXIT WHEN jsonb_typeof(parsed) = 'object';
    IF jsonb_typeof(parsed) = 'string' THEN
      parsed := (parsed #>> '{}')::jsonb;
    ELSIF jsonb_typeof(parsed) = 'array'
      AND jsonb_array_length(parsed) = 2
      AND jsonb_typeof(parsed->0) = 'string'
      AND jsonb_typeof(parsed->1) = 'object' THEN
      parsed := ((parsed->>0)::jsonb) || (parsed->1);
    ELSE
      RAISE EXCEPTION 'CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  IF jsonb_typeof(parsed) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED'
      USING ERRCODE = '22023';
  END IF;
  NEW.delivery_evidence := parsed;
  RETURN NEW;
END
$function$;

-- Keep the same narrowly authorized execution boundary already in main.
REVOKE EXECUTE ON FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1()
  TO service_role;

-- The other repair's temporary normalization trigger/function is redundant
-- after the canonical function above handles all supported legacy encodings.
DROP TRIGGER IF EXISTS powerhouse_normalize_delivery_evidence_jsonb_trg
  ON public.powerhouse_channel_decisions;
DROP FUNCTION IF EXISTS public.powerhouse_normalize_delivery_evidence_jsonb_v1();

-- Retain exactly the original canonical trigger and keep the active day typed.
UPDATE public.powerhouse_channel_decisions
  SET delivery_evidence = delivery_evidence
WHERE run_date = (now() AT TIME ZONE 'Europe/Amsterdam')::date
  AND jsonb_typeof(delivery_evidence) <> 'object';
