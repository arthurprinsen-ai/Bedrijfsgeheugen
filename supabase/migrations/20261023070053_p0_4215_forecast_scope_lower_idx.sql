-- P0 #4215; same owner #4558. Compatible with immutable direct-forecast source.
-- Existing scope_key index does not cover lower(scope_key) used by the safe lookup.
-- Single small forward-only partial expression index, no data or RLS changes.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='20s';
DO $guard$
DECLARE existing_index text;
BEGIN
 IF to_regclass('public.powerhouse_forecasts') IS NULL THEN
  RAISE EXCEPTION 'P0_4215_FORECAST_TABLE_MISSING';
 END IF;
 SELECT pg_get_indexdef(c.oid) INTO existing_index
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='ph_forecasts_active_scope_lower_p0';
 IF existing_index IS NOT NULL AND
    (position('lower(scope_key)' in lower(existing_index))=0 OR position('WHERE' in existing_index)=0) THEN
  RAISE EXCEPTION 'P0_4215_LOWER_SCOPE_INDEX_NAME_DRIFT';
 END IF;
END
$guard$;
CREATE INDEX IF NOT EXISTS ph_forecasts_active_scope_lower_p0
 ON public.powerhouse_forecasts USING btree (lower(scope_key))
 WHERE status IN ('active','claimed') AND scope_key IS NOT NULL;
DO $readback$
DECLARE definition text;
BEGIN
 SELECT pg_get_indexdef(c.oid) INTO definition FROM pg_class c
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='ph_forecasts_active_scope_lower_p0';
 IF definition IS NULL
  OR position('lower(scope_key)' IN lower(definition))=0
  OR position('status' IN definition)=0
  OR position('active' IN definition)=0
  OR position('claimed' IN definition)=0 THEN
   RAISE EXCEPTION 'P0_4215_LOWER_SCOPE_INDEX_READBACK_FAILED';
 END IF;
END
$readback$;
COMMIT;
