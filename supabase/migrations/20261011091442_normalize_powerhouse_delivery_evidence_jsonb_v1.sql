-- P0 #4198: keep channel cooldown and provider-proof metadata machine-readable.
-- The column is jsonb, but some writers persisted JSON serialized as JSON strings.
-- Normalize at the existing table boundary; never alter delivery state or issue a
-- duplicate external publication. The trigger runs with caller privileges.
CREATE OR REPLACE FUNCTION public.powerhouse_normalize_delivery_evidence_jsonb_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public, pg_catalog
AS $normalize$
DECLARE
  v jsonb := NEW.delivery_evidence;
  i integer;
BEGIN
  IF v IS NULL THEN
    RETURN NEW;
  END IF;
  FOR i IN 1..5 LOOP
    EXIT WHEN jsonb_typeof(v) = 'object';
    IF jsonb_typeof(v) = 'string' THEN
      -- A JSON string containing a JSON document may have been encoded twice.
      v := (v #>> '{}')::jsonb;
    ELSIF jsonb_typeof(v) = 'array'
      AND jsonb_array_length(v) = 2
      AND jsonb_typeof(v->0) = 'string'
      AND jsonb_typeof(v->1) = 'object' THEN
      v := ((v->>0)::jsonb) || (v->1);
    ELSE
      RAISE EXCEPTION 'POWERHOUSE_DELIVERY_EVIDENCE_NOT_OBJECT:%', jsonb_typeof(v);
    END IF;
  END LOOP;
  IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'POWERHOUSE_DELIVERY_EVIDENCE_UNNORMALIZABLE';
  END IF;
  NEW.delivery_evidence := v;
  RETURN NEW;
END
$normalize$;

DROP TRIGGER IF EXISTS powerhouse_normalize_delivery_evidence_jsonb_trg
  ON public.powerhouse_channel_decisions;
CREATE TRIGGER powerhouse_normalize_delivery_evidence_jsonb_trg
BEFORE INSERT OR UPDATE OF delivery_evidence
ON public.powerhouse_channel_decisions
FOR EACH ROW
EXECUTE FUNCTION public.powerhouse_normalize_delivery_evidence_jsonb_v1();

-- Restore only the current commercial day; older immutable history is preserved.
-- The trigger is responsible for parsing and makes repeated migration safe.
UPDATE public.powerhouse_channel_decisions
SET delivery_evidence = delivery_evidence
WHERE run_date = (now() AT TIME ZONE 'Europe/Amsterdam')::date
  AND jsonb_typeof(delivery_evidence) IN ('string', 'array');
