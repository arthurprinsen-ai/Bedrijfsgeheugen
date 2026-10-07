alter view public.powerhouse_sales_machine_decision_context_v1 set (security_invoker = true);
alter view public.powerhouse_intelligence_fabric_v1 set (security_invoker = true);
alter view public.powerhouse_intelligence_fabric_health_v1 set (security_invoker = true);
alter view public.powerhouse_company_signal_resolution_v1 set (security_invoker = true);
alter view public.powerhouse_company_signal_people_v1 set (security_invoker = true);
alter view public.powerhouse_predictive_commercial_brief_v1 set (security_invoker = true);
alter view public.powerhouse_revenue_learning_provenance_v1 set (security_invoker = true);
alter view public.powerhouse_commercial_memory_v1 set (security_invoker = true);

revoke all on table public.powerhouse_sales_machine_decision_context_v1 from anon, authenticated;
revoke all on table public.powerhouse_intelligence_fabric_v1 from anon, authenticated;
revoke all on table public.powerhouse_intelligence_fabric_health_v1 from anon, authenticated;
revoke all on table public.powerhouse_company_signal_resolution_v1 from anon, authenticated;
revoke all on table public.powerhouse_company_signal_people_v1 from anon, authenticated;
revoke all on table public.powerhouse_predictive_commercial_brief_v1 from anon, authenticated;
revoke all on table public.powerhouse_revenue_learning_provenance_v1 from anon, authenticated;
revoke all on table public.powerhouse_commercial_memory_v1 from anon, authenticated;
revoke all on table public.powerhouse_predictive_commercial_brief_cache_v1 from anon, authenticated;

grant select on table public.powerhouse_sales_machine_decision_context_v1 to service_role;
grant select on table public.powerhouse_intelligence_fabric_v1 to service_role;
grant select on table public.powerhouse_intelligence_fabric_health_v1 to service_role;
grant select on table public.powerhouse_company_signal_resolution_v1 to service_role;
grant select on table public.powerhouse_company_signal_people_v1 to service_role;
grant select on table public.powerhouse_predictive_commercial_brief_v1 to service_role;
grant select on table public.powerhouse_revenue_learning_provenance_v1 to service_role;
grant select on table public.powerhouse_commercial_memory_v1 to service_role;
grant select on table public.powerhouse_predictive_commercial_brief_cache_v1 to service_role;
