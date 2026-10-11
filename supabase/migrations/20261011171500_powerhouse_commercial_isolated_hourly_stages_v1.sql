-- P0 #4198: isolate the original fourteen commercial stages into separate transactions.
-- Keep cron job #116 and every existing authorized stage/provider/consent guard.
-- The original contact-enrichment owner is cron #138; do not refresh 23k
-- contacts inside the shared commercial dispatch statement.
-- Each stage executes at most once per hour and is separated by 3 minutes.
-- Errors remain visible as individual failed pg_cron runs and cannot starve
-- the remaining stage invocations.
create or replace function public.powerhouse_commercial_hourly_stage_v1(
  p_stage integer,
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security invoker
set search_path=pg_catalog,public
as $body$
declare
 v_names constant text[] := array[
  'powerhouse_refresh_relationship_revenue_v1',
  'powerhouse_execute_relationship_research_v1',
  'powerhouse_dispatch_relationship_public_research_v1',
  'powerhouse_refresh_trigger_based_mkb_acquisition_v1',
  'powerhouse_refresh_linkedin_company_growth_v1',
  'powerhouse_refresh_growth_swarm_v1',
  'powerhouse_materialize_growth_swarm_v1',
  'powerhouse_activate_all_growth_plays_v2',
  'powerhouse_execute_growth_play_actions_v1',
  'powerhouse_dispatch_linkedin_sales_machine_v1',
  'powerhouse_prepare_autonomous_outreach_v1',
  'powerhouse_optimize_prepared_outreach_v1',
  'powerhouse_dispatch_autonomous_outreach_v1',
  'powerhouse_commercial_learning_cycle_v1'
 ];
 v_fn text;
 v_result jsonb;
 v_bad boolean;
 v_state text;
 v_hour text := to_char(now() at time zone 'UTC','YYYYMMDDHH24');
begin
 if p_stage is null or p_stage<1 or p_stage>array_length(v_names,1) then
   raise exception 'INVALID_CANONICAL_COMMERCIAL_STAGE: %',p_stage;
 end if;
 v_fn := v_names[p_stage];
 if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-commercial-stage:'||v_fn,0)) then
   return jsonb_build_object('stage',v_fn,'state','BUSY','retriable',true);
 end if;
 -- Names are taken only from the closed, constant catalogue above.
 execute format('select public.%I($1)',v_fn) into v_result using p_run_date;
 v_bad := (coalesce(v_result->>'degraded','false')='true' or
           coalesce(v_result->>'healthy','true')='false' or
           coalesce((v_result->>'failure_count')::int,0)>0);
 v_state := case when v_bad then 'error' else 'actioned' end;
 -- INTERNAL stage receipt, never external provider delivery or realized revenue.
 insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,occurred_at,
  evidence,context,state,data_quality,confidence,updated_at
 ) values (
  'commercial-stage:'||v_hour||':'||v_fn,
  'commercial_stage_execution',
  'powerhouse-commercial-learning-v1',
  v_fn,now(),
  jsonb_build_object(
    'run_date',p_run_date,'stage',v_fn,'stage_number',p_stage,
    'result_contract',v_result->>'contract',
    'reported_degraded',v_bad,
    'failure_count',v_result->>'failure_count',
    'truth_boundary','Internal stage completion does not prove any provider send, reply, conversion or sale'
  ),
  jsonb_build_object(
    'canonical_job_id',116,
    'single_existing_scheduler',true,
    'contact_source_refresh_owner','powerhouse-identity-graph-v1',
    'independent_transaction_per_stage',true
  ),v_state,'INTERNAL_STAGE_RECEIPT',1,now()
 )
 on conflict(dedupe_key) do update set
  occurred_at=excluded.occurred_at,
  evidence=excluded.evidence,context=excluded.context,
  state=excluded.state,updated_at=now();
 return jsonb_build_object('contract','powerhouse-commercial-stage-isolation-v1',
   'run_date',p_run_date,'stage',v_fn,'stage_number',p_stage,
   'degraded',v_bad,'state',v_state,
   'provider_delivery_proven',false,
   'result_contract',v_result->>'contract');
end;
$body$;

revoke all on function public.powerhouse_commercial_hourly_stage_v1(integer,date)
  from public,anon,authenticated;

do $rewire$
declare v_jobid bigint; v_command text;
begin
 select jobid,command into v_jobid,v_command
 from cron.job where jobname='powerhouse-commercial-learning-v1' and active=true
 order by jobid limit 1;
 if v_jobid is null then
   raise notice 'No canonical commercial job in preview; no new cron job created';
 else
   if v_command not like '%powerhouse_trigger_based_mkb_acquisition_cycle_v1%'
      and v_command not like '%powerhouse_commercial_hourly_stage_v1%' then
     raise exception 'UNEXPECTED_COMMERCIAL_CRON_OWNER_COMMAND: job %',v_jobid;
   end if;
   perform cron.alter_job(
     job_id=>v_jobid,
     schedule=>'3,6,9,12,15,18,21,24,27,30,33,36,39,42 * * * *',
     command=>$cron$
select public.powerhouse_commercial_hourly_stage_v1(
  array_position(array[3,6,9,12,15,18,21,24,27,30,33,36,39,42]::integer[],extract(minute from now())::integer)
);
$cron$
   );
 end if;
end $rewire$;
