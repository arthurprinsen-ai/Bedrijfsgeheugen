-- powerhouse-resource-business-value-v1 least-privilege follow-up
-- Canonical production migration identity: 20260915201346.
-- Existing/default service_role privileges can survive a SELECT grant. Revoke
-- them explicitly so these three read-only projections expose SELECT only.

revoke all on public.powerhouse_action_business_value_v1 from service_role;
revoke all on public.powerhouse_portal_resource_summary_v2 from service_role;
revoke all on public.powerhouse_commercial_next_best_action_v4 from service_role;

grant select on public.powerhouse_action_business_value_v1 to service_role;
grant select on public.powerhouse_portal_resource_summary_v2 to service_role;
grant select on public.powerhouse_commercial_next_best_action_v4 to service_role;
