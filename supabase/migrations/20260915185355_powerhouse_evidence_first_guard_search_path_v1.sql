-- Production corrective hardening for the SECURITY DEFINER learning guard.
alter function public.powerhouse_guard_self_improvement_learning_v1() set search_path = public, pg_catalog;
revoke execute on function public.powerhouse_guard_self_improvement_learning_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_guard_self_improvement_learning_v1() to service_role;
