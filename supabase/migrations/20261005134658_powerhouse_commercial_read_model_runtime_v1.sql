create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
  v_res jsonb; v_enrich jsonb; v_now timestamptz:=now();
  v_actions int:=0; v_forecasts int:=0; v_snapshot_at timestamptz;
begin
  v_res:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
  v_enrich:=public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,200);

  select max(refreshed_at) into v_snapshot_at
  from public.powerhouse_revenue_command_center_snapshot_v1;

  with ranked as (
    select s.*
    from public.powerhouse_revenue_command_center_snapshot_v1 s
    where s.revenue_rank<=20
      and s.buying_window_score>=.30
      and s.buying_window_confidence>=.25
      and coalesce(s.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
      and (s.cooldown_until is null or s.cooldown_until<=v_now)
      and coalesce(s.identity_conflict,false)=false
      and coalesce(s.structural_lineage_gap,false)=false
    order by s.revenue_rank
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'autonomy:'||p_run_date::text||':'||r.opportunity_key,
    coalesce(r.person_key,r.company_key,r.opportunity_key),
    r.person_key,r.company_key,
    case
      when r.recommended_channel='linkedin_comment' then 'expert_comment'
      when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach'
      else 'research_enrichment'
    end,
    r.recommended_channel,
    round(least(100,greatest(0,100*coalesce(r.prediction_win,r.buying_window_score)))::numeric,2),
    'Bounded execution read-model from current revenue command center snapshot.',
    coalesce(r.command_evidence,'{}'::jsonb) || jsonb_build_object(
      'commercial_intelligence',jsonb_build_object(
        'contract','powerhouse-commercial-intelligence-heartbeat-v3',
        'source_nba','powerhouse_commercial_next_best_action_v5',
        'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
        'snapshot_refreshed_at',r.refreshed_at,
        'why_now',r.why_now,
        'account_thesis',r.account_thesis,
        'recommended_account_move',r.recommended_account_move,
        'recommended_action',r.recommended_action,
        'buying_window_score',r.buying_window_score,
        'buying_window_confidence',r.buying_window_confidence,
        'recommended_channel',r.recommended_channel,
        'message_strategy',r.message_strategy,
        'recommended_asset',r.effective_recommended_asset,
        'verified_asset_reference',r.verified_asset_reference,
        'recommended_cta',r.recommended_cta,
        'pressure_state',r.pressure_state,
        'cooldown_until',r.cooldown_until,
        'next_follow_up_at',r.next_follow_up_at,
        'prediction_reply',r.prediction_reply,
        'prediction_meeting',r.prediction_meeting,
        'prediction_proposal',r.prediction_proposal,
        'prediction_win',r.prediction_win,
        'prediction_model_version',r.prediction_model_version,
        'prediction_confidence',r.prediction_confidence,
        'prediction_sample_size',r.prediction_sample_size,
        'evidence_density',r.evidence_density,
        'policy','Read-model execution only; provider side effects remain exact-message-quality gated.'
      )
    ),
    '', 'suggested', v_now, r.opportunity_key,r.expected_commercial_value_eur,r.person_name,r.company_key,r.role
  from ranked r
  on conflict(dedupe_key) do update set
    channel=excluded.channel,
    priority=excluded.priority,
    reason=excluded.reason,
    evidence=excluded.evidence,
    expected_value_eur=excluded.expected_value_eur,
    person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
    company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),
    role=coalesce(excluded.role,powerhouse_sales_actions.role),
    updated_at=v_now
  where powerhouse_sales_actions.status in ('suggested','prepared','waiting');
  get diagnostics v_actions=row_count;

  with ranked as (
    select s.*
    from public.powerhouse_revenue_command_center_snapshot_v1 s
    where s.revenue_rank<=20
      and s.buying_window_score>=.30
      and s.buying_window_confidence>=.25
      and coalesce(s.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
      and (s.cooldown_until is null or s.cooldown_until<=v_now)
      and coalesce(s.identity_conflict,false)=false
      and coalesce(s.structural_lineage_gap,false)=false
    order by s.revenue_rank
  )
  insert into public.powerhouse_forecasts(
    forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,predicted_event,predicted_problem,
    predicted_question,predicted_search_intent,predicted_buying_trigger,probability,confidence,expected_lead_days,
    first_mover_score,strategic_fit,revenue_potential,signal_acceleration,market_saturation,whitespace_score,
    prediction_mode,evidence,status,last_scored_at,updated_at
  )
  select
    'commercial:'||p_run_date::text||':'||r.opportunity_key,
    p_run_date,
    p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
    p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
    case when r.person_key is not null then 'person' else 'company' end,
    coalesce(r.person_key,r.company_key,r.opportunity_key),
    'commercial_progression',
    nullif(r.why_now,''),
    'Will this relationship progress to an observed positive commercial outcome inside the horizon?',
    'commercial_intent',
    r.recommended_cta,
    coalesce(r.prediction_win,r.buying_window_score),
    greatest(r.buying_window_confidence,coalesce(r.prediction_confidence,0)),
    case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end,
    round(100*r.buying_window_score,2),
    r.buying_window_score,
    least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
    least(1,greatest(0,r.evidence_density)),
    greatest(0,1-r.evidence_density),
    least(1,greatest(0,r.evidence_density)),
    'anticipatory',
    jsonb_build_object(
      'contract','powerhouse-commercial-intelligence-heartbeat-v3',
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',r.refreshed_at,
      'opportunity_key',r.opportunity_key,
      'person_key',r.person_key,
      'company_key',r.company_key,
      'message_strategy',r.message_strategy,
      'recommended_channel',r.recommended_channel,
      'recommended_cta',r.recommended_cta,
      'prediction_model_version',r.prediction_model_version,
      'prediction_confidence',r.prediction_confidence
    ),
    'active',v_now,v_now
  from ranked r
  on conflict(forecast_key) do update set
    probability=excluded.probability,
    confidence=excluded.confidence,
    predicted_problem=excluded.predicted_problem,
    predicted_buying_trigger=excluded.predicted_buying_trigger,
    evidence=excluded.evidence,
    last_scored_at=v_now,
    updated_at=v_now;
  get diagnostics v_forecasts=row_count;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v3',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,
      'source_nba','v5','runtime_read_model','revenue_command_center_snapshot_v1','snapshot_refreshed_at',v_snapshot_at
    ),
    jsonb_build_object(
      'bounded',true,'no_provider_send',true,'same_canonical_lineage',true,'pressure_gated',true,
      'incremental_enrichment',true,'heavy_nba_view_out_of_critical_path',true
    ),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v3',
    'healthy',true,'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'resolution',v_res,'enrichment',v_enrich,
    'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,
    'provider_send_executed',false,'executed_at',v_now
  );
exception when others then
  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v3',
    'healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'executed_at',now()
  );
end $$;
