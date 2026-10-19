-- Avoid unchanged-row lock storms; no historical migration is rewritten.
create or replace function public.powerhouse_refresh_forecast_calibration_obligations()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_count integer := 0;
begin
  -- MVCC comparison happens before INSERT/ON CONFLICT takes row locks.
  -- Unchanged forecasts and already CLOSED evidence never enter the write set.
  with candidates as (
    select 'canonical'::text tenant_id,
      'forecast-calibration:'||f.forecast_id::text obligation_id,
      jsonb_build_object('forecast_id',f.forecast_id,'forecast_key',f.forecast_key,
        'probability',f.probability,'confidence',f.confidence,'prediction_mode',f.prediction_mode,
        'contract','predictive-first-mover-intelligence-v1',
        'forecast_revision',md5(jsonb_build_array(f.forecast_id,f.forecast_key,f.scope,f.scope_key,f.topic_key,f.predicted_event,f.predicted_problem,f.predicted_question,f.predicted_search_intent,f.probability,f.created_at,f.horizon_start,f.horizon_end,f.expected_by,f.evidence_signal_ids)::text)) payload,
      coalesce(f.expected_by,f.horizon_end)::timestamptz due_at
    from public.powerhouse_forecasts f where f.status in ('active','claimed')
  ), changed as (
    select c.* from candidates c
    left join public.revenue_learning_obligations previous
      on previous.tenant_id=c.tenant_id and previous.obligation_id=c.obligation_id
    cross join lateral public.powerhouse_merge_calibration_obligation_v1(
      previous.payload,c.payload,previous.due_at,c.due_at,previous.status) desired
    where previous.obligation_id is null
      or (previous.payload,previous.due_at,previous.status)
         is distinct from (desired.payload,desired.due_at,desired.status)
  )
  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at)
  select tenant_id,obligation_id,'FORECAST_CALIBRATION',null,null,'OPEN',payload,due_at,now()
  from changed
  on conflict (tenant_id,obligation_id) do update
    set (payload,due_at,status)=(select m.payload,m.due_at,m.status from public.powerhouse_merge_calibration_obligation_v1(public.revenue_learning_obligations.payload,excluded.payload,public.revenue_learning_obligations.due_at,excluded.due_at,public.revenue_learning_obligations.status) m),updated_at=now();

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke execute on function public.powerhouse_refresh_forecast_calibration_obligations() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_forecast_calibration_obligations() to service_role;
