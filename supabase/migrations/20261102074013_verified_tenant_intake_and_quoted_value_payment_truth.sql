-- P0 #4198 / ONE BRAIN: original verified tenant claims must become canonical
-- lead/proposal outcomes exactly once; signed quotes cannot be paid revenue.
-- Generated migration version from project's UTC clock: 20261102074013.
-- No new tables, scheduler, privileges or second writer. No historical backfill.
BEGIN;

CREATE OR REPLACE FUNCTION intern.trg_scan_uitkomst()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Anonymous/demo/self-reported scores are not qualified customer leads.
  IF NEW.tenant_identity_status <> 'verified' OR NEW.organisatie_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- A repeat update of a proven identity is not a new conversion.
  IF TG_OP = 'UPDATE'
     AND OLD.tenant_identity_status = 'verified'
     AND OLD.organisatie_id IS NOT DISTINCT FROM NEW.organisatie_id THEN
    RETURN NEW;
  END IF;

  PERFORM intern.bg_uitkomst_eenmalig(
    'scan', NEW.id::text, 'lead', 0,
    'scan:' || NEW.organisatie_id::text || ':' || NEW.id::text,
    jsonb_build_object('bron_formulier', NEW.bron,
      'organisatie_id', NEW.organisatie_id,
      'tenant_identity_status', 'verified',
      'source_verification', 'tenant_identity_transition',
      'order_paid', false)
  );
  RETURN NEW;
END;
$$;

-- The trigger functions are private; browser roles must never EXECUTE privileged logic directly.
REVOKE ALL ON FUNCTION intern.trg_scan_uitkomst() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bg_scan_uitkomst ON public.scan_inzendingen;
CREATE TRIGGER bg_scan_uitkomst
AFTER INSERT OR UPDATE OF tenant_identity_status, organisatie_id
ON public.scan_inzendingen
FOR EACH ROW EXECUTE FUNCTION intern.trg_scan_uitkomst();

CREATE OR REPLACE FUNCTION intern.trg_offerte_uitkomst()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.tenant_identity_status <> 'verified' OR NEW.organisatie_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- A signed quote, even with a stated price, is NOT a settled payment.
  -- Preserve original proposal source identity; never mint a won_order or euro
  -- revenue from an unverified payment in this quote-origin trigger.
  PERFORM intern.bg_uitkomst_eenmalig(
    'offerte', NEW.id::text || ':voorstel', 'proposal', 0,
    'offerte:' || NEW.organisatie_id::text || ':' || NEW.id::text,
    jsonb_build_object('titel', NEW.titel,
      'bron_formulier', NEW.bron,
      'organisatie_id', NEW.organisatie_id,
      'tenant_identity_status', 'verified',
      'signature_state_at_first_receipt', coalesce(NEW.getekend, false),
      'quoted_contract_value_eur', NEW.totaal,
      'payment_status', 'NOT_VERIFIED',
      'revenue_verified', false)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION intern.trg_offerte_uitkomst() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bg_offerte_uitkomst ON public.offerte_inzendingen;
CREATE TRIGGER bg_offerte_uitkomst
AFTER INSERT OR UPDATE OF getekend, tenant_identity_status, organisatie_id
ON public.offerte_inzendingen
FOR EACH ROW EXECUTE FUNCTION intern.trg_offerte_uitkomst();

COMMENT ON FUNCTION intern.trg_scan_uitkomst() IS
'P0 #4198: only verified tenant scan identity at insert or subsequent claim creates one original lead outcome; unverified/demo ignored; same original dedupe key.';
COMMENT ON FUNCTION intern.trg_offerte_uitkomst() IS
'P0 #4198: verified tenant quote is one proposal; signature and nominal quote value are not a paid order or revenue; payment requires independent original provider receipt.';
COMMIT;
