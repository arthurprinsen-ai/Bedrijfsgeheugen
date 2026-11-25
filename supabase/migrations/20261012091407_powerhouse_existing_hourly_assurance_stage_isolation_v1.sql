
select cron.schedule(
 'powerhouse-autonomous-outreach-assurance-hourly-v1',
 '52 * * * *',
 $job$
 do $hourly$
 declare
   v_a jsonb;
   v_b jsonb;
   v_c jsonb;
 begin
   -- Existing three assurance stages, but an error in one cannot stop the others.
   v_a := public.powerhouse_runtime_mux_task_v1(
      'autonomous-outreach-assurance',
      'select public.powerhouse_refresh_autonomous_outreach_assurance_v1(now())',15000);
   v_b := public.powerhouse_runtime_mux_task_v1(
      'loop-assurance',
      'select * from public.powerhouse_refresh_loop_assurance_v1(now()) where out_loop_key=''autonomous-outreach''',15000);
   v_c := public.powerhouse_runtime_mux_task_v1(
      'omnichannel-daily-proof',
      'select public.powerhouse_daily_omnichannel_assurance_v1(now())',15000);
   if not (coalesce((v_a->>'ok')::boolean,false)
           and coalesce((v_b->>'ok')::boolean,false)
           and coalesce((v_c->>'ok')::boolean,false)) then
     insert into public.powerhouse_runtime_events(
       dedupe_key,event_type,source,subject_key,occurred_at,
       evidence,context,state,data_quality,confidence,updated_at
     ) values (
       'hourly-assurance-stage-failure:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24'),
       'hourly_assurance_stage_failure',
       'powerhouse-autonomous-outreach-assurance-hourly-v1',
       'canonical',now(),
       jsonb_build_object('outreach',v_a,'loop',v_b,'omnichannel',v_c),
       jsonb_build_object('isolated',true,'auto_next_retry','next_existing_hourly_tick'),
       'error','PARTIAL',0,now()
     ) on conflict(dedupe_key) do update set
       evidence=excluded.evidence,updated_at=excluded.updated_at;
   end if;
 end
 $hourly$;
 $job$
);
