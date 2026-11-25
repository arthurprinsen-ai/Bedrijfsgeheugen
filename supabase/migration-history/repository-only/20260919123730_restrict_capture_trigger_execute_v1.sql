-- Security hardening: capture functions are trigger-only and must not be callable as RPCs
-- Provider migration name: restrict_capture_trigger_execute_v1

revoke execute on function public.powerhouse_capture_external_signal_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_external_signal_v1() to service_role;

revoke execute on function public.powerhouse_capture_ga4_batch_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_ga4_batch_v1() to service_role;

revoke execute on function public.powerhouse_capture_gsc_row_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_gsc_row_v1() to service_role;

revoke execute on function public.powerhouse_capture_legacy_portal_state_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_legacy_portal_state_v1() to service_role;

revoke execute on function public.powerhouse_capture_linkedin_engagement_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_linkedin_engagement_v1() to service_role;

revoke execute on function public.powerhouse_capture_portal_layer_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_portal_layer_v1() to service_role;

revoke execute on function public.powerhouse_capture_social_metric_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_capture_social_metric_v1() to service_role;