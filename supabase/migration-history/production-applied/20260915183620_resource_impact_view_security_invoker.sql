alter view public.powerhouse_resource_impact_v1 set (security_invoker = true); revoke all on public.powerhouse_resource_impact_v1 from anon, authenticated;
