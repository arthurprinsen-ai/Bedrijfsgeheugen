-- Production corrective hardening for the evidence-first views.
-- Keeps repository migration history aligned with the already-applied runtime correction.
revoke all on public.powerhouse_market_evidence_maturity_v1 from public, anon, authenticated;
grant select on public.powerhouse_market_evidence_maturity_v1 to service_role;

revoke all on public.powerhouse_calibration_actionability_v1 from public, anon, authenticated;
grant select on public.powerhouse_calibration_actionability_v1 to service_role;
