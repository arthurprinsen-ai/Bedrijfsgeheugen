alter function public.powerhouse_autonomous_gap_closer_v1(date) set search_path = public, pg_catalog;
revoke execute on function public.powerhouse_autonomous_gap_closer_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_gap_closer_v1(date) to service_role;

alter function public.powerhouse_record_flywheel_health_v1() set search_path = public, pg_catalog;
revoke execute on function public.powerhouse_record_flywheel_health_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_record_flywheel_health_v1() to service_role;
