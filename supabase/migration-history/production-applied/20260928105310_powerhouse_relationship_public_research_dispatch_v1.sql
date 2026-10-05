-- Powerhouse relationship public research dispatch v1
-- Reuses the existing commercial-learning cron owner. No second scheduler is created.

create or replace function public.powerhouse_dispatch_relationship_public_research_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,
      'reason','scheduler_token_missing',
      'run_date',p_run_date
    );
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds := 120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,
    'request_id',v_request_id,
    'run_date',p_run_date
  );
end;
$$;

revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) to service_role;

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

comment on function public.powerhouse_dispatch_relationship_public_research_v1(date) is
'Asynchronously dispatches bounded public-web research for high-value existing relationships through the Powerhouse-owned Edge Function. Reuses the existing commercial cron; no parallel scheduler.';
