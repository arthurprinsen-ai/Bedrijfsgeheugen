-- Relationship public research single-scheduler recovery v1.
-- Remove the temporary dedicated cron; dispatch is owned by powerhouse-commercial-learning-v1.
do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-relationship-public-research-hourly') then
    perform cron.unschedule('powerhouse-relationship-public-research-hourly');
  end if;
end
$$;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;
