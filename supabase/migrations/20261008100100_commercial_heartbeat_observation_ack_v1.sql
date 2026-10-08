-- The 2026-10-08 provider-proof gate exposed a transport-ack circular dependency.
-- Daily commercial output can honestly be unproven while the Heartbeat transport
-- succeeds. A durable verified OBSERVATION is necessary to preserve the learning
-- loop without fabricating any email/post/revenue or second scheduler.
-- Preserve existing side effects/executors and internal-only function grants.
create or replace function public.powerhouse_commercial_heartbeat_v1(
  p_now timestamp with time zone default now()
) returns jsonb
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
  v_proven boolean := false;
  v_control_healthy boolean := false;
  v_output_valid boolean := false;
begin
  select not exists (
    select 1 from public.powerhouse_runtime_events e
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
  v_proven := coalesce((v_output->>'commercial_day_proven')::boolean,false);
  -- Transport/durable observation health is NOT the daily sales SLA.
  -- Fail closed if the output-assurance contract itself is absent or malformed.
  v_output_valid := coalesce(v_output->>'contract','')='powerhouse-commercial-output-assurance-v3'
    and coalesce(v_output->>'run_date','')=v_run_date::text
    and jsonb_typeof(v_output->'commercial_day_proven')='boolean'
    and nullif(v_output->>'commercial_day_state','') is not null;
  v_control_healthy := coalesce((v_gate->>'healthy')::boolean,false)
    and v_output_valid;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'commercial-heartbeat:'||to_char(p_now at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_heartbeat','powerhouse-commercial-heartbeat-v1','growth-revenue-os',p_now,
    jsonb_build_object(
      'full_cycle_executed',v_full_needed,'full_cycle',v_full,'composer',v_composer,
      'research_promotion',v_promote,'current_action_set',v_current_set,
      'social_release',v_social_release,'social_dispatch',v_social_dispatch,
      'provider_error_closure',v_provider_error_closure,'closure',v_closure,
      'terminal_lineage',v_terminal,'output_assurance',v_output,'regression_gate',v_gate,
      'commercial_day_proven',v_proven,
      'control_plane_healthy',v_control_healthy,
      'commercial_delivery_healthy',coalesce((v_output->>'healthy')::boolean,false),
      'commercial_day_state',v_output->>'commercial_day_state'
    ),
    jsonb_build_object(
      'single_scheduler_owner',true,'scheduler_authority','NETLIFY_SUPABASE_EDGE',
      'existing_state_first',true,'terminal_lineage_required',true,
      'provider_execution_owned_by_canonical_channel_executors',true
    ),
    case when not v_control_healthy then 'error'
      when v_proven then 'actioned'
      else 'observed' end,
    case when v_control_healthy then 'VERIFIED' else 'PARTIAL' end,
    case when v_control_healthy then 1 else 0.5 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-heartbeat-v1','run_date',v_run_date,
    'full_cycle_executed',v_full_needed,'current_action_set',v_current_set,
    'social_release',v_social_release,'social_dispatch',v_social_dispatch,
    'provider_error_closure',v_provider_error_closure,'output_assurance',v_output,
    'terminal_lineage',v_terminal,'regression_gate',v_gate,
    'healthy',v_control_healthy,
    'commercial_delivery_healthy',coalesce((v_output->>'healthy')::boolean,false),
    'commercial_day_proven',v_proven,
    'commercial_day_state',v_output->>'commercial_day_state','executed_at',p_now
  );
end;
$function$;

revoke execute on function public.powerhouse_commercial_heartbeat_v1(timestamptz) from public, anon, authenticated;
