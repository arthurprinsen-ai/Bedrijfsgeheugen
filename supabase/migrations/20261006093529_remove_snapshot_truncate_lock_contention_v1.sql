CREATE OR REPLACE FUNCTION public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
 RETURNS TABLE(row_count bigint, refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_refreshed_at timestamptz := clock_timestamp();
  v_row_count bigint := 0;
begin
  delete from public.powerhouse_revenue_command_center_snapshot_v1;

  insert into public.powerhouse_revenue_command_center_snapshot_v1(
    revenue_rank,opportunity_key,person_key,company_key,person_name,role,why_now,
    account_thesis,recommended_account_move,recommended_action,recommended_channel,message_strategy,
    effective_recommended_asset,verified_asset_reference,recommended_cta,pressure_state,cooldown_until,next_follow_up_at,
    prediction_reply,prediction_meeting,prediction_proposal,prediction_win,prediction_confidence,prediction_model_version,
    prediction_sample_size,expected_commercial_value_eur,action_confidence,buying_window_score,buying_window_confidence,
    evidence_density,research_reason,missing_evidence,identity_conflict,structural_lineage_gap,command_evidence,refreshed_at
  )
  select
    row_number() over(
      order by (coalesce(v.expected_commercial_value_eur,0)*coalesce(v.action_confidence,.25)) desc,
               coalesce(v.buying_window_score,0) desc,
               v.opportunity_key
    ) as revenue_rank,
    v.opportunity_key,v.person_key,v.company_key,v.person_name,v.role,v.best_context as why_now,
    v.account_thesis,v.recommended_account_move,v.recommended_action,v.recommended_channel,v.message_strategy,
    v.effective_recommended_asset,v.verified_asset_reference,v.recommended_cta,v.pressure_state,v.cooldown_until,v.next_follow_up_at,
    v.prediction_reply,v.prediction_meeting,v.prediction_proposal,v.prediction_win,v.prediction_confidence,v.prediction_model_version,
    v.prediction_sample_size,v.expected_commercial_value_eur,v.action_confidence,v.buying_window_score,v.buying_window_confidence,
    v.evidence_density,v.research_reason,v.missing_evidence,
    (v.person_key is null or nullif(trim(v.person_key),'') is null) as identity_conflict,
    (v.recommended_action in ('linkedin_dm','email','warm_intro_request') and v.forecast_id is null) as structural_lineage_gap,
    jsonb_build_object(
      'source','powerhouse-commercial-next-best-action-v5',
      'forecast_id',v.forecast_id,
      'asset_ready',v.asset_ready,
      'pressure_state',v.pressure_state,
      'pending_response',coalesce(v.pending_response,false),
      'research_reason',v.research_reason,
      'prediction_basis','canonical-nba-view-materialization'
    ) as command_evidence,
    v_refreshed_at
  from public.powerhouse_commercial_next_best_action_v5 v;

  get diagnostics v_row_count = row_count;
  return query select v_row_count,v_refreshed_at;
end
$function$;
revoke all on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() to service_role;