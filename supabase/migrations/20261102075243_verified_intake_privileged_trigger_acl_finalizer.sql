-- P0 #4198 / original ONE BRAIN: enforce privileged trigger ACL after the
-- source-migration snapshot was first consumed by Supabase Preview.
-- Separate version is required: a once-applied original version is immutable.
-- Scope: permission tightening ONLY; no data, trigger, RLS or scheduler mutation.
BEGIN;
REVOKE ALL ON FUNCTION intern.trg_scan_uitkomst() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION intern.trg_offerte_uitkomst() FROM PUBLIC, anon, authenticated;
COMMIT;
