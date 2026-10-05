-- Security closure: exposed SECURITY DEFINER routines must not be callable by PUBLIC/anon/authenticated.
-- Internal pg_cron execution remains valid under database ownership; service_role retains explicit access.

revoke execute on function public.enforce_instagram_exact_final_media_gate_v1() from public, anon, authenticated;
grant execute on function public.enforce_instagram_exact_final_media_gate_v1() to service_role;

revoke execute on function public.powerhouse_reconciliation_worker_v1(text, integer) from public, anon, authenticated;
grant execute on function public.powerhouse_reconciliation_worker_v1(text, integer) to service_role;
