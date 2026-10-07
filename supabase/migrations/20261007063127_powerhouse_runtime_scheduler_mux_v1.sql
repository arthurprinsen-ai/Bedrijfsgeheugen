create or replace function public.powerhouse_runtime_mux_task_v1(
  p_task text,
  p_sql text,
  p_timeout_ms integer default 10000
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_started timestamptz:=clock_timestamp();
begin
  if p_timeout_ms < 1000 or p_timeout_ms > 30000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  perform set_config('statement_timeout',p_timeout_ms::text,true);
  execute p_sql;
  perform set_config('statement_timeout','0',true);

  return jsonb_build_object(
    'task',p_task,
    'ok',true,
    'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
  );
exception
  when query_canceled then
    perform set_config('statement_timeout','0',true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','TIMEOUT',
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  when others then
    perform set_config('statement_timeout','0',true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','ERROR',
      'sqlstate',sqlstate,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
end
$function$;

revoke execute on function public.powerhouse_runtime_mux_task_v1(text,text,integer)
  from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_mux_task_v1(text,text,integer)
  to service_role;

create or replace function public.powerhouse_runtime_scheduler_mux_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  m integer := extract(minute from p_now)::integer;
  v_locked boolean := false;
  v_results jsonb := '[]'::jsonb;
  v_task jsonb;
begin
  v_locked := pg_try_advisory_xact_lock(hashtextextended('powerhouse-runtime-scheduler-mux-v1',0));
  if not v_locked then
    return jsonb_build_object(
      'contract','powerhouse-runtime-scheduler-mux-v1',
      'healthy',true,
      'state','SKIPPED_OVERLAP',
      'executed_at',p_now
    );
  end if;

  v_task := public.powerhouse_runtime_mux_task_v1(
    'execution-resilience-watchdog',
    'select public.powerhouse_execution_resilience_watchdog_v1()',
    8000
  );
  v_results := v_results || jsonb_build_array(v_task);

  if (m % 5) <> 0 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'reconciliation-worker',
      'select public.powerhouse_reconciliation_worker_v2()',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 5) = 1 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'public-rls-guard',
      'select public.powerhouse_public_rls_guard_scan()',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (11,26,41,56) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'daily-action-set-reconcile',
      $$select public.powerhouse_reconcile_daily_sales_action_set_v1((now() at time zone 'Europe/Amsterdam')::date)$$,
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 5) = 2 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'content-closed-loop',
      'select public.powerhouse_content_closed_loop_tick_v1()',
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 10) = 0 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'data-spine-watchdog',
      'select public.powerhouse_data_spine_watchdog_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 5) = 3 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'terminal-autonomous-reconcile',
      'select public.powerhouse_terminal_autonomous_reconcile_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 15) = 14 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'loop-assurance',
      'select public.powerhouse_refresh_loop_assurance_v1(now())',
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 10) = 6 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'email-execution-watchdog',
      'select public.powerhouse_email_execution_watchdog_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (13,43) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'one-brain-reconcile',
      'select public.powerhouse_one_brain_reconcile_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (7,22,37,52) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'revenue-attribution-snapshot',
      'select public.powerhouse_refresh_revenue_attribution_snapshot_v1()',
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (18,48) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'linkedin-oauth-resume-reconcile',
      'select public.powerhouse_linkedin_oauth_resume_reconcile_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (23,53) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'regression-stage-evidence',
      'select public.powerhouse_refresh_regression_stage_evidence_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (28,58) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'seo-assurance',
      'select public.powerhouse_refresh_seo_assurance_v1(now())',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if m in (6,21,36,51) then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'freshness-contradiction-cache',
      'select public.powerhouse_refresh_freshness_contradiction_cache_v1()',
      8000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  return jsonb_build_object(
    'contract','powerhouse-runtime-scheduler-mux-v1',
    'healthy',not exists (
      select 1
      from jsonb_array_elements(v_results) e
      where coalesce((e->>'ok')::boolean,false)=false
    ),
    'minute',m,
    'tasks',v_results,
    'executed_at',p_now
  );
end
$function$;

revoke execute on function public.powerhouse_runtime_scheduler_mux_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_scheduler_mux_v1(timestamptz)
  to service_role;

do $block$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname in (
      'powerhouse-runtime-maintenance-v1',
      'powerhouse-public-rls-guard-scan',
      'powerhouse-daily-action-set-reconcile-v1',
      'powerhouse-content-closed-loop-v1',
      'powerhouse-data-spine-watchdog-v1',
      'powerhouse-terminal-autonomous-reconciler-v1',
      'powerhouse-loop-assurance-v2',
      'powerhouse-email-execution-watchdog-v1',
      'powerhouse-one-brain-reconcile-v1',
      'powerhouse-revenue-attribution-snapshot-v1',
      'powerhouse-linkedin-oauth-resume-reconcile-v1',
      'powerhouse-regression-stage-evidence-v1',
      'powerhouse-seo-assurance-v1',
      'powerhouse-freshness-contradiction-cache-v1',
      'powerhouse-runtime-scheduler-mux-v1'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-runtime-scheduler-mux-v1',
    '* * * * *',
    'select public.powerhouse_runtime_scheduler_mux_v1(now());'
  );
end
$block$;;
