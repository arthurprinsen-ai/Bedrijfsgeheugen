-- P0 #4215 | Optimize only the two observed timeout-prone portal sort paths.
-- Source: portal-state-eu entrepreneur_intelligence PUBLICATIONS/EXTERNAL_SIGNALS.
-- PostgreSQL indexes support reads; they do not prove pool/call-stack recovery.
-- Fail rather than queue indefinitely for DDL locks under degraded production load.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

-- The existing (bron_id, publicatiedatum DESC) index cannot satisfy a
-- global ORDER BY publicatiedatum DESC NULLS LAST LIMIT 350 efficiently.
CREATE INDEX IF NOT EXISTS bronpublicaties_portal_latest_p04215_idx
  ON public.bronpublicaties (publicatiedatum DESC NULLS LAST);

-- Only authorised external signals reach the portal:
-- eq(toegestaan,true), ORDER BY gepubliceerd_op DESC NULLS LAST LIMIT 250.
CREATE INDEX IF NOT EXISTS bg_externe_signalen_portal_allowed_latest_p04215_idx
  ON public.bg_externe_signalen (gepubliceerd_op DESC NULLS LAST)
  WHERE toegestaan IS TRUE;
COMMIT;
