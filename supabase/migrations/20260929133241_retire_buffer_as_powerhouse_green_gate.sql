
do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
  into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='bg_gezondheid_meten'
  limit 1;

  if v_def is null then
    raise exception 'bg_gezondheid_meten not found';
  end if;

  v_def := replace(
    v_def,
    '(''buffer-sync'',(select max(bs.uitgevoerd_op) from bg_buffer_sync bs where bs.status=''ok''),interval ''6 hours'',true)',
    '(''buffer-sync'',(select max(bs.uitgevoerd_op) from bg_buffer_sync bs where bs.status=''ok''),interval ''6 hours'',false)'
  );

  execute v_def;

  select pg_get_functiondef(p.oid)
  into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='powerhouse_full_cycle_production_proof'
  limit 1;

  if v_def is null then
    raise exception 'powerhouse_full_cycle_production_proof not found';
  end if;

  v_def := replace(
    v_def,
    'v_healthy := v_required_sources_healthy and v_buffer_healthy and v_ga4_healthy and v_gmail_healthy and v_execution_healthy and v_predictive_healthy and v_overdue_calibrations=0;',
    'v_healthy := v_required_sources_healthy and v_ga4_healthy and v_gmail_healthy and v_execution_healthy and v_predictive_healthy and v_overdue_calibrations=0;'
  );

  v_def := replace(
    v_def,
    '''buffer_healthy'',v_buffer_healthy,''buffer'',jsonb_build_object(''last_sync'',v_buffer_last_sync,''last_metrics'',v_buffer_last_metrics),',
    '''buffer_required'',false,''buffer_healthy'',v_buffer_healthy,''buffer'',jsonb_build_object(''role'',''legacy_telemetry_only'',''last_sync'',v_buffer_last_sync,''last_metrics'',v_buffer_last_metrics),'
  );

  execute v_def;
end
$migration$;
