insert into public.brain_observed_states(observation_id,subject_type,subject_id,environment,observed_state,artifact_version,evidence,observed_at,valid_until)
values (
 'portal-unified-state-v1:20260915T190647Z',
 'powerhouse_component',
 'powerhouse-portal-unified-state-v1',
 'production',
 '{"status":"LIVE","contract":"powerhouse-portal-unified-state-v1","demo_scan_count":2,"evidence_status":"collecting_evidence","client_execute":"blocked","service_execute":"enabled"}'::jsonb,
 'powerhouse_portal_unified_projection_v1',
 '{"migration_base":"powerhouse_portal_unified_projection_v1_base","migration_rpc":"powerhouse_portal_unified_projection_v1_rpc","migration_privileges":"powerhouse_portal_unified_projection_v1_privileges","readback_tenant":"demo","privilege_grantees":["postgres","service_role"]}'::jsonb,
 '2026-09-15T19:06:47.929422+00'::timestamptz,
 '2026-09-22T19:06:47.929422+00'::timestamptz
)
on conflict (observation_id) do nothing;