-- Revenue learning: preserve semantic updated_at when a repeated upsert changes nothing.
-- Deployment: standard protected Supabase migration lane; never via writer-patch-handoff
-- (that writer explicitly disallows supabase/migrations/).
-- No existing evidence rows are backfilled or rewritten by this DDL.
CREATE OR REPLACE FUNCTION public.revenue_learning_evidence_preserve_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $body$
BEGIN
  IF (to_jsonb(NEW) - 'updated_at' - 'created_at' - 'evaluated_at')
     IS NOT DISTINCT FROM
     (to_jsonb(OLD) - 'updated_at' - 'created_at' - 'evaluated_at') THEN
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW; -- Preserve RETURNING semantics of .upsert(...).select().single().
END;
$body$;

DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.revenue_learning_evidence'::regclass
      AND tgname = 'revenue_learning_evidence_preserve_updated_at_bu'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER revenue_learning_evidence_preserve_updated_at_bu
    BEFORE UPDATE ON public.revenue_learning_evidence
    FOR EACH ROW
    EXECUTE FUNCTION public.revenue_learning_evidence_preserve_updated_at();
  END IF;
END;
$body$;
