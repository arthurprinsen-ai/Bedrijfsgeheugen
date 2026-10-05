-- Forward-only security closure for immutable production migrations mirrored in this PR.
-- These SECURITY DEFINER routines are internal/server-side only. Browser roles must never execute them.
-- Database-owner pg_cron execution remains valid; service_role retains explicit runtime access.

revoke execute on function public.powerhouse_record_outcome(uuid, text, text, jsonb, numeric) from public, anon, authenticated;
grant execute on function public.powerhouse_record_outcome(uuid, text, text, jsonb, numeric) to service_role;

revoke execute on function public.powerhouse_offers_source_heartbeat_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_offers_source_heartbeat_v1() to service_role;

revoke execute on function public.powerhouse_full_cycle_production_proof(date) from public, anon, authenticated;
grant execute on function public.powerhouse_full_cycle_production_proof(date) to service_role;
