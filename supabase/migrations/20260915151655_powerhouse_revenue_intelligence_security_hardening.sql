alter view public.powerhouse_contact_pressure_v1 set (security_invoker = true);
revoke all on table public.powerhouse_contact_pressure_v1 from public, anon, authenticated;
grant select on table public.powerhouse_contact_pressure_v1 to service_role;

alter view public.powerhouse_account_strategy_v1 set (security_invoker = true);
revoke all on table public.powerhouse_account_strategy_v1 from public, anon, authenticated;
grant select on table public.powerhouse_account_strategy_v1 to service_role;

alter view public.powerhouse_research_queue_v1 set (security_invoker = true);
revoke all on table public.powerhouse_research_queue_v1 from public, anon, authenticated;
grant select on table public.powerhouse_research_queue_v1 to service_role;

alter view public.powerhouse_commercial_next_best_action_v3 set (security_invoker = true);
revoke all on table public.powerhouse_commercial_next_best_action_v3 from public, anon, authenticated;
grant select on table public.powerhouse_commercial_next_best_action_v3 to service_role;

alter view public.powerhouse_revenue_attribution_v1 set (security_invoker = true);
revoke all on table public.powerhouse_revenue_attribution_v1 from public, anon, authenticated;
grant select on table public.powerhouse_revenue_attribution_v1 to service_role;

alter view public.powerhouse_model_health_v1 set (security_invoker = true);
revoke all on table public.powerhouse_model_health_v1 from public, anon, authenticated;
grant select on table public.powerhouse_model_health_v1 to service_role;

alter view public.powerhouse_experiment_learning_v2 set (security_invoker = true);
revoke all on table public.powerhouse_experiment_learning_v2 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_learning_v2 to service_role;

alter view public.powerhouse_revenue_command_center_v2 set (security_invoker = true);
revoke all on table public.powerhouse_revenue_command_center_v2 from public, anon, authenticated;
grant select on table public.powerhouse_revenue_command_center_v2 to service_role;

revoke execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() to service_role;
