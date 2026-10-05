alter view public.powerhouse_scan_history_v1 set (security_invoker = true);
revoke all on table public.powerhouse_scan_history_v1 from public, anon, authenticated;
grant select on table public.powerhouse_scan_history_v1 to service_role;
