revoke all on function public.powerhouse_reconcile_content_outcomes_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_content_outcomes_v1(date) to service_role;

revoke all on function public.enforce_instagram_exact_final_media_gate_v1() from public, anon, authenticated;
grant execute on function public.enforce_instagram_exact_final_media_gate_v1() to service_role;

revoke all on function public.enforce_instagram_obligation_vision_v1() from public, anon, authenticated;
grant execute on function public.enforce_instagram_obligation_vision_v1() to service_role;
