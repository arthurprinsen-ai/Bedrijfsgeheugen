create table if not exists public.powerhouse_revenue_attribution_snapshot_v1(
  outcome_id uuid not null,
  touch_type text not null,
  touch_id text not null,
  touch_at timestamptz not null,
  conversion_at timestamptz not null,
  channel text,
  campaign_key text,
  content_key text,
  opportunity_key text,
  person_key text,
  company_key text,
  revenue_eur numeric not null default 0,
  attribution_weight numeric not null,
  attributed_revenue_eur numeric not null,
  is_first_touch boolean not null,
  is_conversion_touch boolean not null,
  attribution_model text not null,
  attribution_confidence numeric not null,
  evidence jsonb not null default '{}'::jsonb,
  refreshed_at timestamptz not null default now(),
  constraint powerhouse_revenue_attribution_snapshot_v1_pkey
    primary key(outcome_id,touch_type,touch_id)
);

create index if not exists idx_revenue_attribution_snapshot_company_v1
on public.powerhouse_revenue_attribution_snapshot_v1(company_key,conversion_at desc);

create index if not exists idx_revenue_attribution_snapshot_conversion_v1
on public.powerhouse_revenue_attribution_snapshot_v1(conversion_at desc);

alter table public.powerhouse_revenue_attribution_snapshot_v1 enable row level security;

revoke all on table public.powerhouse_revenue_attribution_snapshot_v1
  from public, anon, authenticated;
grant select,insert,update,delete on table public.powerhouse_revenue_attribution_snapshot_v1
  to service_role;

drop policy if exists powerhouse_revenue_attribution_snapshot_service_v1
  on public.powerhouse_revenue_attribution_snapshot_v1;
create policy powerhouse_revenue_attribution_snapshot_service_v1
  on public.powerhouse_revenue_attribution_snapshot_v1
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists powerhouse_revenue_attribution_snapshot_refreshed_at_idx
on public.powerhouse_revenue_attribution_snapshot_v1 (refreshed_at desc);

create or replace function public.powerhouse_revenue_attribution_cached_status_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_refreshed_at timestamptz;
begin
  select s.refreshed_at
    into v_refreshed_at
  from public.powerhouse_revenue_attribution_snapshot_v1 s
  where s.refreshed_at is not null
  order by s.refreshed_at desc
  limit 1;

  return jsonb_build_object(
    'contract','powerhouse-revenue-attribution-cached-status-v1',
    'state',case when v_refreshed_at is null then 'EMPTY_CACHE' else 'REUSED_CACHE' end,
    'refreshed_at',v_refreshed_at,
    'refresh_owner','powerhouse-runtime-scheduler-mux-v1',
    'critical_path_refresh',false,
    'observed_at',clock_timestamp()
  );
end
$function$;

revoke execute on function public.powerhouse_revenue_attribution_cached_status_v1()
  from public, anon, authenticated;
grant execute on function public.powerhouse_revenue_attribution_cached_status_v1()
  to service_role;

comment on function public.powerhouse_revenue_attribution_cached_status_v1() is
  'Read-only attribution cache receipt for latency-critical commercial execution. Full attribution refresh belongs to runtime maintenance, never the heartbeat transaction.';

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
  v_identity jsonb;
  v_attribution jsonb;
  v_health jsonb;
  v_result jsonb;
begin
  v_identity:=public.powerhouse_sync_identity_graph_batch_v1(25);
  v_attribution:=public.powerhouse_revenue_attribution_cached_status_v1();
  select to_jsonb(h) into v_health
  from public.powerhouse_revenue_event_spine_health_v1 h;

  v_result:=jsonb_build_object(
    'contract','powerhouse-rocket-revenue-event-spine-v3',
    'run_date',p_run_date,
    'identity_graph',v_identity,
    'multi_touch_attribution',v_attribution,
    'health',v_health,
    'orchestration',jsonb_build_object(
      'mode','bounded_incremental_runtime',
      'full_identity_maintenance_owner','powerhouse_sync_identity_graph_v1 independent maintenance',
      'runtime_identity_owner','powerhouse_sync_identity_graph_batch_v1',
      'attribution_refresh_owner','powerhouse-runtime-scheduler-mux-v1 maintenance slots',
      'attribution_runtime_mode','cached-read-only',
      'next_best_action_owner','powerhouse_commercial_next_best_action_v5 -> revenue_command_center_snapshot_v1',
      'action_owner','powerhouse_materialize_command_center_actions_v1',
      'reason','Heavy whole-graph and attribution materialization are outside the latency-critical commercial execution loop.'
    ),
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'rocket-revenue-spine:'||p_run_date,
    'rocket_revenue_event_spine_cycle',
    'powerhouse-rocket-revenue-event-spine-v3',
    'growth-revenue-os',
    now(),
    v_result,
    jsonb_build_object(
      'existing_state_first',true,
      'reuse_first',true,
      'bounded_incremental_runtime',true,
      'attribution_refresh_in_critical_path',false
    ),
    case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'error' end,
    'VERIFIED',
    1,
    now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    source=excluded.source,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=excluded.updated_at;

  return v_result;
end
$function$;

comment on function public.powerhouse_revenue_event_spine_cycle_v1(date) is
  'Latency-bounded commercial revenue spine. Identity uses a small delta batch; revenue attribution is read from the latest materialized cache and refreshed only by maintenance.';

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
  h integer := extract(hour from (p_now at time zone 'UTC'))::integer;
  v_locked boolean := false;
  v_results jsonb := '[]'::jsonb;
  v_task jsonb;
begin
  v_locked := pg_try_advisory_xact_lock(hashtextextended('powerhouse-runtime-scheduler-mux-v1',0));
  if not v_locked then
    return jsonb_build_object(
      'contract','powerhouse-runtime-scheduler-mux-v2',
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

  v_task := public.powerhouse_runtime_mux_task_v1(
    'reconciliation-worker',
    'select public.powerhouse_reconciliation_worker_v2()',
    8000
  );
  v_results := v_results || jsonb_build_array(v_task);

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

  if (m % 5) = 4 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'content-closed-loop',
      'select public.powerhouse_content_closed_loop_tick_v1()',
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  if (m % 10) = 1 then
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

  if m in (4,19,34,49) then
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

  if h = 6 and m = 4 then
    v_task := public.powerhouse_runtime_mux_task_v1(
      'prediction-learning-audit',
      'select public.powerhouse_prediction_learning_audit_v2()',
      10000
    );
    v_results := v_results || jsonb_build_array(v_task);
  end if;

  return jsonb_build_object(
    'contract','powerhouse-runtime-scheduler-mux-v2',
    'healthy',not exists (
      select 1
      from jsonb_array_elements(v_results) e
      where coalesce((e->>'ok')::boolean,false)=false
    ),
    'minute',m,
    'hour_utc',h,
    'heartbeat_slots_excluded',true,
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
  v_count integer;
begin
  select count(*) into v_count
  from cron.job
  where jobname='powerhouse-runtime-scheduler-mux-v1'
    and active;

  if v_count <> 1 then
    raise exception 'RUNTIME_MUX_OWNER_COUNT_INVALID:%', v_count;
  end if;

  for r in
    select jobid
    from cron.job
    where jobname='powerhouse-runtime-scheduler-mux-v1'
  loop
    perform cron.alter_job(
      r.jobid,
      schedule := '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *'
    );
  end loop;
end
$block$;
