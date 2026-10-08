-- Canonical commercial Heartbeat: distinguish safe non-send from provider-proven commercial execution.
-- Existing scheduler/owner, actions, evidence and Brain tables only; no second executor.
create or replace function public.powerhouse_commercial_output_assurance_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_now timestamptz := now();
  v_email int := 0;
  v_social int := 0;
  v_set int := 0;
  v_decisions int := 0;
  v_stale int := 0;
  v_proofs jsonb := '[]'::jsonb;
  v_proven boolean;
  v_safe_no_send boolean;
  v_result jsonb;
begin
  -- No action is provider-proven from status='done' alone.
  select count(*)::int into v_email
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and (
      coalesce(a.evidence->>'provider_ack_verified','false')='true'
      or coalesce(a.evidence->>'provider_readback_verified','false')='true'
    )
    and nullif(btrim(coalesce(a.evidence->>'provider_message_id','')),'') is not null
    and nullif(btrim(coalesce(a.evidence->>'provider_thread_id','')),'') is not null;

  select count(*)::int into v_social
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm','linkedin_dm')
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and coalesce(a.evidence->>'provider_ack_verified','false')='true'
    and coalesce(
      nullif(btrim(a.evidence->>'provider_post_id'),''),
      nullif(btrim(a.evidence->>'provider_comment_id'),''),
      nullif(btrim(a.evidence->>'provider_object_id'),'')
    ) is not null;

  select coalesce(jsonb_agg(jsonb_build_object(
      'action_id',a.action_id,
      'channel',a.channel,
      'provider_object_id',coalesce(
        nullif(a.evidence->>'provider_message_id',''),
        nullif(a.evidence->>'provider_post_id',''),
        nullif(a.evidence->>'provider_comment_id',''),
        nullif(a.evidence->>'provider_object_id','')
      ),
      'executed_at',a.executed_at
    )), '[]'::jsonb)
    into v_proofs
  from public.powerhouse_sales_actions a
  where a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and (
      (
        lower(a.channel) in ('email','e-mail')
        and (coalesce(a.evidence->>'provider_ack_verified','false')='true'
             or coalesce(a.evidence->>'provider_readback_verified','false')='true')
        and nullif(btrim(coalesce(a.evidence->>'provider_message_id','')),'') is not null
        and nullif(btrim(coalesce(a.evidence->>'provider_thread_id','')),'') is not null
      )
      or (
        lower(a.channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm','linkedin_dm')
        and coalesce(a.evidence->>'provider_ack_verified','false')='true'
        and coalesce(
          nullif(btrim(a.evidence->>'provider_post_id'),''),
          nullif(btrim(a.evidence->>'provider_comment_id'),''),
          nullif(btrim(a.evidence->>'provider_object_id'),'')
        ) is not null
      )
    );

  select count(*)::int into v_set
  from public.powerhouse_sales_actions a
  where a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
    and a.evidence#>>'{daily_action_set,state}'='active'
    and a.updated_at >= (p_run_date::timestamp at time zone 'Europe/Amsterdam');

  select count(*)::int into v_decisions
  from public.powerhouse_sales_actions a
  where a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
    and a.evidence#>>'{daily_action_set,state}'='active'
    and coalesce(a.evidence#>>'{commercial_closure,decision}','')
      in ('WAIT','NURTURE','OBSERVE','SUPPRESS')
    and coalesce(
      (a.evidence#>>'{commercial_closure,decided_at}')::timestamptz,
      (a.evidence#>>'{commercial_closure,terminalized_at}')::timestamptz,
      a.updated_at
    ) >= (p_run_date::timestamp at time zone 'Europe/Amsterdam');

  select count(*)::int into v_stale
  from public.powerhouse_sales_actions a
  where coalesce(a.evidence#>>'{commercial_closure,decision}','')
      in ('WAIT','NURTURE','OBSERVE','SUPPRESS')
    and not (
      a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
      and a.evidence#>>'{daily_action_set,state}'='active'
    );

  v_proven := v_email+v_social>0;
  v_safe_no_send := v_set>0 and v_decisions=v_set;
  v_result := jsonb_build_object(
    'contract','powerhouse-commercial-output-assurance-v3',
    'run_date',p_run_date,
    'checked_at',v_now,
    'provider_proven_email',v_email,
    'provider_proven_social',v_social,
    'provider_proof',v_proofs,
    'commercial_day_proven',v_proven,
    'daily_commercial_execution_sla','MET_ONLY_WITH_PROVIDER_PROOF',
    'commercial_day_state',case when v_proven then 'PROVIDER_PROVEN' else 'OPEN_NO_PROVEN_ACTION' end,
    'current_daily_action_set_count',v_set,
    'fresh_current_set_non_send_decisions',v_decisions,
    'historical_decisions_excluded',v_stale,
    'safe_no_send_decision',v_safe_no_send,
    'healthy',v_proven or v_safe_no_send,
    'state',case
      when v_proven then 'PROVIDER_OUTPUT_PROVEN'
      when v_safe_no_send then 'ZERO_OUTPUT_EXPLICITLY_JUSTIFIED'
      when v_set=0 then 'DEGRADED_NO_CURRENT_DAILY_ACTION_SET'
      else 'DEGRADED_INCOMPLETE_CURRENT_SET_DECISIONS' end,
    'rule','Safety/no-send may be healthy but NEVER closes commercial-day execution without exact provider IDs'
  );

  -- One durable, idempotent daily obligation in existing canonical Brain; no duplicate scheduler or queue.
  insert into public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version
  ) values (
    'COMMERCIAL_EXECUTION','daily-commercial-provider-proof-v1','growth-revenue-os',p_run_date::text,
    'Europe/Amsterdam',md5('daily-commercial-provider-proof-v1:'||p_run_date::text),
    'daily-commercial-provider-proof-v1','Powerhouse Growth & Revenue OS',
    case when v_proven then 'FULFILLED' else 'OPEN' end,
    jsonb_build_object(
      'commercial_day_proven',v_proven,
      'provider_proven_email',v_email,
      'provider_proven_social',v_social,
      'provider_proof',v_proofs,
      'safe_no_send_decision',v_safe_no_send,
      'next_owner','existing canonical Growth & Revenue OS and channel executors',
      'requires_fresh_eligible_action',not v_proven,
      'checked_at',v_now
    ),
    v_now,v_now,1
  )
  on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
  do update set
    state=case when public.brain_obligations.state='FULFILLED' or excluded.state='FULFILLED'
      then 'FULFILLED' else 'OPEN' end,
    evidence=excluded.evidence,updated_at=excluded.updated_at,
    version=public.brain_obligations.version+1;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (
    v_now,'powerhouse-commercial-output-assurance','daily-output-sla',
    case when v_proven or v_safe_no_send then 'ok' else 'fout' end,
    case when v_proven then 'Provider-proven commercial action.'
      when v_safe_no_send then 'Safe non-send decided; commercial-day execution remains OPEN.'
      else 'Daily commercial action not provider-proven and decisions incomplete.' end,
    v_result
  );

  update public.powerhouse_daily_runs
  set state=case when v_proven or v_safe_no_send then state else 'degraded' end,
      evidence=coalesce(evidence,'{}'::jsonb)||
        jsonb_build_object('commercial_output_assurance',v_result),
      updated_at=v_now
  where run_date=p_run_date;

  return v_result;
end;
$function$;

-- Preserve the sole external heartbeat owner while making its commercial state truthful.
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
  v_control_healthy := coalesce((v_gate->>'healthy')::boolean,false)
    and coalesce((v_output->>'healthy')::boolean,false);

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
      'commercial_day_proven',v_proven
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
    'healthy',v_control_healthy,'commercial_day_proven',v_proven,'executed_at',p_now
  );
end;
$function$;