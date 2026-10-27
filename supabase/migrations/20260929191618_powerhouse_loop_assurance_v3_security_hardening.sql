
create or replace view public.powerhouse_loop_integrity_health_v1
with (security_invoker=true)
as
select
  now() as observed_at,
  count(*)::integer as total_loops,
  count(*) filter (where status='GREEN')::integer as green_loops,
  count(*) filter (where status='AMBER')::integer as amber_loops,
  count(*) filter (where status='RED')::integer as red_loops,
  count(*) filter (where fresh_stage_count=required_stage_count)::integer as fully_evidenced_loops,
  count(*) filter (where fresh_stage_count=0)::integer as zero_stage_evidence_loops,
  min(next_expected_at) as next_expected_at,
  max(checked_at) as last_assurance_check_at,
  case
    when count(*) filter (where status='RED')>0 then 'RED'
    when count(*) filter (where status='AMBER')>0 then 'AMBER'
    else 'GREEN'
  end as overall_status
from public.powerhouse_loop_assurance_state_v1;

revoke all on public.powerhouse_loop_integrity_health_v1 from public, anon, authenticated;
revoke execute on function public.powerhouse_sync_loop_assurance_receipts_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_sync_loop_assurance_receipts_v1(timestamptz) to service_role;
revoke execute on function public.powerhouse_refresh_loop_assurance_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_loop_assurance_v1(timestamptz) to service_role;
