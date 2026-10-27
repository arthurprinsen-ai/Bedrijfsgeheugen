
create index if not exists bg_connecties_bijgewerkt_op_idx
  on public.bg_connecties (bijgewerkt_op desc);

create or replace function public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
returns table(row_count bigint, refreshed_at timestamptz)
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_refreshed_at timestamptz := clock_timestamp();
  v_row_count bigint := 0;
begin
  truncate table public.powerhouse_revenue_command_center_snapshot_v1;

  insert into public.powerhouse_revenue_command_center_snapshot_v1(
    revenue_rank,opportunity_key,person_key,company_key,person_name,role,why_now,
    account_thesis,recommended_account_move,recommended_action,recommended_channel,message_strategy,
    effective_recommended_asset,verified_asset_reference,recommended_cta,
    pressure_state,cooldown_until,next_follow_up_at,
    prediction_reply,prediction_meeting,prediction_proposal,prediction_win,prediction_confidence,
    prediction_model_version,prediction_sample_size,expected_commercial_value_eur,action_confidence,
    buying_window_score,buying_window_confidence,evidence_density,research_reason,missing_evidence,
    identity_conflict,structural_lineage_gap,command_evidence,refreshed_at
  )
  select
    row_number() over(
      order by (coalesce(b.expected_commercial_value_eur,0)*coalesce(b.action_confidence,.25)) desc,
               coalesce(b.buying_window_score,0) desc
    ),
    b.opportunity_key,b.person_key,b.company_key,b.person_name,b.role,b.best_context,
    b.account_thesis,b.recommended_account_move,b.recommended_action,b.recommended_channel,b.message_strategy,
    b.effective_recommended_asset,b.verified_asset_reference,b.recommended_cta,
    b.pressure_state,b.cooldown_until,b.next_follow_up_at,
    b.prediction_reply,b.prediction_meeting,b.prediction_proposal,b.prediction_win,b.prediction_confidence,
    b.prediction_model_version,b.prediction_sample_size,b.expected_commercial_value_eur,b.action_confidence,
    b.buying_window_score,b.buying_window_confidence,b.evidence_density,b.research_reason,b.missing_evidence,
    (b.person_key is null or nullif(trim(b.person_key),'') is null),
    (b.recommended_action in ('linkedin_dm','email','warm_intro_request') and b.forecast_id is null),
    jsonb_build_object(
      'source','powerhouse-commercial-next-best-action-v5',
      'forecast_id',b.forecast_id,
      'pressure_state',b.pressure_state,
      'research_reason',b.research_reason,
      'prediction_model_version',b.prediction_model_version,
      'truth_boundary','materialized canonical v5 read model; no outcome or revenue is synthesized'
    ),
    v_refreshed_at
  from public.powerhouse_commercial_next_best_action_v5 b;

  get diagnostics v_row_count = row_count;
  return query select v_row_count,v_refreshed_at;
end
$function$;

revoke execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
  from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
  to service_role;

do $cron$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-identity-graph-v1';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid,
      schedule := '32 * * * *',
      command := 'select public.powerhouse_sync_identity_graph_batch_v1(100);',
      active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-one-brain-reconcile-v1';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid,schedule := '13,43 * * * *',active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-loop-assurance-v2';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid,schedule := '14,29,44,59 * * * *',active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-revenue-intelligence-snapshot-15m';
  if v_jobid is not null then
    perform cron.alter_job(v_jobid,schedule := '7,22,37,52 * * * *',active := true);
  end if;
end
$cron$;
