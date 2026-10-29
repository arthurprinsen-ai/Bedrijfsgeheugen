-- Incident #5141: Edge v11 accepts 17 consent-aware CRO event types, but the
-- original PostgreSQL CHECK still accepts 7, making real new events fail 23514.
-- This is a deliberate widening of the allowlist, never DISABLE/DROP CHECK.
-- Existing 709k+ rows were already validated by the narrower original check.
-- Keep ACCESS EXCLUSIVE short; add NOT VALID and validate in a later migration.
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '25s';

ALTER TABLE public.bg_interacties
  DROP CONSTRAINT bg_interacties_gebeurtenis_check,
  ADD CONSTRAINT bg_interacties_gebeurtenis_check
  CHECK (gebeurtenis IN (
    'pagina','klik','scroll','formulier_start','formulier_verzonden',
    'tijd_op_pagina','zichtbaar','sectie_zichtbaar','formulier_fout',
    'formulier_verlaten','whatsapp_klik','frustratie_klik',
    'popup_getoond','popup_gesloten','popup_conversie',
    'experiment_blootstelling','pagina_verlaten'
  )) NOT VALID;

COMMENT ON CONSTRAINT bg_interacties_gebeurtenis_check ON public.bg_interacties IS
  'Explicit 17-type allowlist synchronized with canonical bg-interactie GEBEURTENISSEN; keeps consent and RLS checks intact.';
