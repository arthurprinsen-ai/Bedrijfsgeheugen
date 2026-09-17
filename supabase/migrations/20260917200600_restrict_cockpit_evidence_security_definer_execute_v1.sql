-- Forward-only production reconciliation for SECURITY DEFINER execute privileges.
-- Historical migrations above are hardened for deterministic replay; this migration
-- closes already-applied production functions without relying on migration replay.

revoke execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) from public, anon, authenticated;
grant execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) to service_role;

revoke execute on function public.powerhouse_offers_source_heartbeat_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_offers_source_heartbeat_v1() to service_role;

revoke execute on function public.powerhouse_full_cycle_production_proof(date) from public, anon, authenticated;
grant execute on function public.powerhouse_full_cycle_production_proof(date) to service_role;
