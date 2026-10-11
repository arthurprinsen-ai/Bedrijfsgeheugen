-- P0 #4198: preserve typed channel evidence across canonical and legacy writers.
-- Previous inputs double-encoded JSONB documents as strings. A recovery gate
-- cannot read generation_retry_after from a JSON string; therefore a failing
-- high-priority personal post could starve unrelated commercial outputs.
CREATE OR REPLACE FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE parsed jsonb;
BEGIN
  IF jsonb_typeof(NEW.delivery_evidence) = 'string' THEN
    parsed := (NEW.delivery_evidence #>> '{}')::jsonb;
    IF jsonb_typeof(parsed) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED'
        USING ERRCODE = '22023';
    END IF;
    NEW.delivery_evidence := parsed;
  ELSIF jsonb_typeof(NEW.delivery_evidence) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS powerhouse_channel_decision_evidence_normalize_trg
  ON public.powerhouse_channel_decisions;

CREATE TRIGGER powerhouse_channel_decision_evidence_normalize_trg
BEFORE INSERT OR UPDATE OF delivery_evidence
ON public.powerhouse_channel_decisions
FOR EACH ROW
EXECUTE FUNCTION public.powerhouse_channel_decision_evidence_normalize_v1();

-- Repair only recent, confidently decodable legacy documents. No publisher
-- status, delivery_ref, provider receipt or publication permission is changed.
DO $repair$
DECLARE rec record; parsed jsonb;
BEGIN
  FOR rec IN
    SELECT run_date, channel, delivery_evidence
    FROM public.powerhouse_channel_decisions
    WHERE run_date >= (now() at time zone 'Europe/Amsterdam')::date - 14
      AND jsonb_typeof(delivery_evidence) = 'string'
    FOR UPDATE
  LOOP
    BEGIN
      parsed := (rec.delivery_evidence #>> '{}')::jsonb;
      IF jsonb_typeof(parsed) = 'object' THEN
        UPDATE public.powerhouse_channel_decisions
           SET delivery_evidence = parsed
         WHERE run_date = rec.run_date AND channel = rec.channel
           AND jsonb_typeof(delivery_evidence) = 'string';
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE WARNING 'CHANNEL_EVIDENCE_LEGACY_TEXT_INVALID:%:%',
        rec.run_date, rec.channel;
    END;
  END LOOP;
END
$repair$;
