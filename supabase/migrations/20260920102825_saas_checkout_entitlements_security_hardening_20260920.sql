alter view public.saas_active_entitlements set (security_invoker = true);
revoke all on table public.saas_plans from anon, authenticated;
revoke all on table public.saas_plan_entitlements from anon, authenticated;
revoke all on table public.saas_checkout_intents from anon, authenticated;
revoke all on table public.saas_subscriptions from anon, authenticated;
revoke all on table public.saas_usage_counters from anon, authenticated;
revoke all on table public.saas_active_entitlements from public, anon, authenticated;
grant select on table public.saas_active_entitlements to service_role;
