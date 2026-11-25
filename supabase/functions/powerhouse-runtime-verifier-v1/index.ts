// Retired endpoint: no database probes, no release-status claims and no parallel executor.
// Direct callers to the existing provider-backed operational proof instead of false GREEN.
Deno.serve(()=>Response.json({
  ok:false,retired:true,status:"RETIRED_DIAGNOSTIC",database_probe_performed:false,
  replacement:"commercial-heartbeat-and-runtime-readback",
  migration_recovery:"provider-managed-only",
  provider_preview_required_for_supabase_changes:true
},{status:410,headers:{"cache-control":"no-store"}}));
