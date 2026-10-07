-- Close provider-error lifecycle inside the external commercial heartbeat without reintroducing pg_cron ownership.
-- One external heartbeat owns current-set labeling, quality release and canonical social dispatch.

create or replace function public.powerhouse_reconcile_current_commercial_action_set_v2(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_now timestamptz := now();
  v_active int := 0;
  v_superseded int := 0;
begin
  update public.powerhouse_sales_actions a
     set evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
       'daily_action_set',jsonb_build_object(
         'contract','powerhouse-current-commercial-action-set-v2',
         'run_date',p_run_date,
         'state','superseded',
         'reconciled_at',v_now,
         'selector','nba-v5-external-current-day'
       )
     ),
     updated_at = v_now
   where a.evidence#>>'{daily_action_set,run_date}' = p_run_date::text
     and a.evidence#>>'{daily_action_set,state}' = 'active'
     and not (
       a.evidence#>>'{commercial_intelligence,source_nba}' = 'powerhouse_commercial_next_best_action_v5'
       and lower(replace(coalesce(a.channel,''),' ','_')) in (
         'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
       )
       and (
         (a.created_at at time zone 'Europe/Amsterdam')::date = p_run_date
         or (a.updated_at at time zone 'Europe/Amsterdam')::date = p_run_date
         or (coalesce(a.executed_at,a.created_at) at time zone 'Europe/Amsterdam')::date = p_run_date
       )
     );
  get diagnostics v_superseded = row_count;

  with candidates as (
    select a.action_id
    from public.powerhouse_sales_actions a
    where a.evidence#>>'{commercial_intelligence,source_nba}' = 'powerhouse_commercial_next_best_action_v5'
      and lower(replace(coalesce(a.channel,''),' ','_')) in (
        'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
      )
      and a.status in ('suggested','prepared','waiting','done','expired','error')
      and (
        (a.created_at at time zone 'Europe/Amsterdam')::date = p_run_date
        or (a.updated_at at time zone 'Europe/Amsterdam')::date = p_run_date
        or (coalesce(a.executed_at,a.created_at) at time zone 'Europe/Amsterdam')::date = p_run_date
      )
    order by a.priority desc nulls last,a.updated_at desc,a.action_id
    limit 20
  )
  update public.powerhouse_sales_actions a
     set evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
       'daily_action_set',jsonb_build_object(
         'contract','powerhouse-current-commercial-action-set-v2',
         'run_date',p_run_date,
         'state','active',
         'reconciled_at',v_now,
         'selector','nba-v5-external-current-day'
       )
     ),
     updated_at = v_now
    from candidates c
   where a.action_id = c.action_id;
  get diagnostics v_active = row_count;

  return jsonb_build_object(
    'contract','powerhouse-current-commercial-action-set-v2',
    'run_date',p_run_date,
    'active_count',v_active,
    'superseded_count',v_superseded,
    'selector','nba-v5-external-current-day',
    'status_mutation',false,
    'executed_at',v_now
  );
end;
$function$;

revoke execute on function public.powerhouse_reconcile_current_commercial_action_set_v2(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_current_commercial_action_set_v2(date)
  to service_role;

create or replace function public.powerhouse_terminalize_current_set_provider_errors_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date),
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_closed int := 0;
begin
  update public.powerhouse_sales_actions a
     set status='expired',
         updated_at=p_now,
         evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
           'commercial_closure',jsonb_build_object(
             'contract','powerhouse-commercial-provider-error-closure-v1',
             'decision','OBSERVE',
             'terminalized_at',p_now,
             'reason','canonical provider execution failed; zero-output is explicitly explained and no fabricated success is allowed',
             'provider_error',coalesce(
               nullif(a.evidence#>>'{autopilot,error}',''),
               nullif(a.evidence#>>'{provider_error,message}',''),
               nullif(a.evidence#>>'{provider_execution,error}',''),
               'provider execution error'
             ),
             'reopen_rule','only a fresh deduped quality-ready action may retry through the canonical provider executor'
           )
         )
   where a.status='error'
     and a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
     and a.evidence#>>'{daily_action_set,state}'='active'
     and lower(replace(coalesce(a.channel,''),' ','_')) in (
       'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
     );
  get diagnostics v_closed=row_count;

  return jsonb_build_object(
    'contract','powerhouse-commercial-provider-error-closure-v1',
    'run_date',p_run_date,
    'provider_errors_terminalized_observe',v_closed,
    'executed_at',p_now
  );
end;
$function$;

revoke execute on function public.powerhouse_terminalize_current_set_provider_errors_v1(date,timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_terminalize_current_set_provider_errors_v1(date,timestamptz)
  to service_role;

create or replace function public.powerhouse_commercial_heartbeat_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_run_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_full_needed boolean := false;
  v_full jsonb := '{}'::jsonb;
  v_composer jsonb := '{}'::jsonb;
  v_promote jsonb := '{}'::jsonb;
  v_current_set jsonb := '{}'::jsonb;
  v_social_release jsonb := '{}'::jsonb;
  v_social_dispatch jsonb := '{}'::jsonb;
  v_closure jsonb := '{}'::jsonb;
  v_provider_error_closure jsonb := '{}'::jsonb;
  v_terminal jsonb := '{}'::jsonb;
  v_output jsonb := '{}'::jsonb;
  v_gate jsonb := '{}'::jsonb;
begin
  select not exists (
    select 1
    from public.powerhouse_runtime_events e
    where e.dedupe_key='one-commercial-decision-loop:'||v_run_date::text
      and e.occurred_at >= v_run_date::timestamp at time zone 'Europe/Amsterdam'
  ) into v_full_needed;

  if v_full_needed then
    v_full := public.powerhouse_one_commercial_decision_loop_v1(v_run_date);
  else
    v_composer := public.powerhouse_dispatch_human_sales_composer_v2(5);
  end if;

  -- Lightweight continuation owned by the same external heartbeat.
  -- No pg_cron owner is introduced.
  v_promote := public.powerhouse_promote_research_to_social_v1();
  v_current_set := public.powerhouse_reconcile_current_commercial_action_set_v2(v_run_date);
  v_social_release := public.powerhouse_prepare_quality_social_comments_v1(v_run_date);
  v_social_dispatch := public.powerhouse_dispatch_linkedin_comment_autopilot_v1(v_run_date);
  v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now);
  v_provider_error_closure := public.powerhouse_terminalize_current_set_provider_errors_v1(v_run_date,p_now);
  v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
  v_output := public.powerhouse_commercial_output_assurance_v1(v_run_date);
  v_gate := public.powerhouse_commercial_regression_gate_v1(v_run_date);

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-heartbeat:'||to_char(p_now at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_heartbeat',
    'powerhouse-commercial-heartbeat-v1',
    'growth-revenue-os',
    p_now,
    jsonb_build_object(
      'full_cycle_executed',v_full_needed,
      'full_cycle',v_full,
      'composer',v_composer,
      'research_promotion',v_promote,
      'current_action_set',v_current_set,
      'social_release',v_social_release,
      'social_dispatch',v_social_dispatch,
      'closure',v_closure,
      'provider_error_closure',v_provider_error_closure,
      'terminal_lineage',v_terminal,
      'output_assurance',v_output,
      'regression_gate',v_gate
    ),
    jsonb_build_object(
      'single_scheduler_owner',true,
      'scheduler_authority','NETLIFY_SUPABASE_EDGE',
      'existing_state_first',true,
      'terminal_lineage_required',true,
      'provider_execution_owned_by_canonical_channel_executors',true
    ),
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'actioned' else 'error' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'VERIFIED' else 'PARTIAL' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 1 else 0.5 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-heartbeat-v1',
    'run_date',v_run_date,
    'full_cycle_executed',v_full_needed,
    'current_action_set',v_current_set,
    'social_release',v_social_release,
    'social_dispatch',v_social_dispatch,
    'provider_error_closure',v_provider_error_closure,
    'output_assurance',v_output,
    'terminal_lineage',v_terminal,
    'regression_gate',v_gate,
    'healthy',coalesce((v_gate->>'healthy')::boolean,false),
    'executed_at',p_now
  );
end;
$function$;
