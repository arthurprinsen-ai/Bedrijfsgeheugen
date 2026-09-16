-- powerhouse-observability-outcome-calibration-closure-v1 least-privilege correction
-- Existing default privileges can leave service_role with ALL on newly created views.
-- Fail closed to read-only access for the two evidence projections.

revoke all on public.powerhouse_action_evidence_maturity_v1 from service_role;
grant select on public.powerhouse_action_evidence_maturity_v1 to service_role;

revoke all on public.powerhouse_commercial_next_best_action_v5 from service_role;
grant select on public.powerhouse_commercial_next_best_action_v5 to service_role;
