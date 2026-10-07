-- Reconcile the production provider-error closure into repository history.
-- A current-set provider execution error is a terminal non-send decision, never an implicit retry.

create or replace function public.powerhouse_close_current_set_provider_errors_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date),
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_closed integer := 0;
begin
  update public.powerhouse_sales_actions a
     set status='expired',
         updated_at=p_now,
         evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
           'commercial_closure',jsonb_build_object(
             'contract','powerhouse-current-set-provider-error-closure-v1',
             'decision','OBSERVE',
             'terminalized_at',p_now,
             'reason','provider execution failed; do not retry or send without a fresh canonical action',
             'send_forbidden',true,
             'provider_error',coalesce(
               a.evidence#>>'{autopilot,error}',
               a.evidence#>>'{provider,error}',
               'PROVIDER_EXECUTION_FAILED'
             ),
             'reopen_rule','only a fresh deduped quality-ready canonical action with current provider/source evidence may re-enter execution'
           )
         )
   where a.status='error'
     and a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
     and a.evidence#>>'{daily_action_set,state}'='active'
     and a.evidence#>>'{commercial_intelligence,source_nba}'='powerhouse_commercial_next_best_action_v5'
     and lower(replace(coalesce(a.channel,''),' ','_')) in (
       'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
     );

  get diagnostics v_closed=row_count;

  return jsonb_build_object(
    'contract','powerhouse-current-set-provider-error-closure-v1',
    'run_date',p_run_date,
    'closed_provider_errors',v_closed,
    'decision','OBSERVE',
    'send_forbidden',true,
    'executed_at',p_now
  );
end;
$function$;

revoke execute on function public.powerhouse_close_current_set_provider_errors_v1(date,timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_close_current_set_provider_errors_v1(date,timestamptz)
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
  v_provider_error_closure jsonb := '{}'::jsonb;
  v_closure jsonb := '{}'::jsonb;
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

  v_promote := public.powerhouse_promote_research_to_social_v1();
  v_current_set := public.powerhouse_reconcile_current_commercial_action_set_v2(v_run_date);
  v_social_release := public.powerhouse_prepare_quality_social_comments_v1(v_run_date);
  v_social_dispatch := public.powerhouse_dispatch_linkedin_comment_autopilot_v1(v_run_date);
  v_provider_error_closure := public.powerhouse_close_current_set_provider_errors_v1(v_run_date,p_now);
  v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now);
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
      'provider_error_closure',v_provider_error_closure,
      'closure',v_closure,
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
