-- Preserve real calibration attempts across both existing canonical writers.
create or replace function public.powerhouse_merge_calibration_obligation_v1(
 p_previous_payload jsonb,p_canonical_payload jsonb,
 p_previous_due timestamptz,p_canonical_due timestamptz,p_previous_status text)
returns table(payload jsonb,due_at timestamptz,status text)
language plpgsql immutable security invoker
set search_path=pg_catalog,public
as $merge$
declare
 v_same_revision boolean := nullif(p_previous_payload->>'forecast_revision','') is not null
   and p_previous_payload->>'forecast_revision'=p_canonical_payload->>'forecast_revision';
 v_payload jsonb;
begin
 if p_previous_status='CLOSED' then
   return query select p_previous_payload,p_previous_due,'CLOSED'::text;
   return;
 end if;
 v_payload := (coalesce(p_previous_payload,'{}'::jsonb)-array['last_attempt_at','last_result','last_reason','last_confidence'])
   ||coalesce(p_canonical_payload,'{}'::jsonb);
 if v_same_revision then
   v_payload := coalesce(p_previous_payload,'{}'::jsonb)||coalesce(p_canonical_payload,'{}'::jsonb);
 elsif p_previous_payload->>'last_attempt_at' is not null then
   v_payload := v_payload||jsonb_build_object('forecast_calibration_prior_attempts_v1',
     coalesce(p_previous_payload->'forecast_calibration_prior_attempts_v1','[]'::jsonb)||
     jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
       'forecast_revision',p_previous_payload->'forecast_revision',
       'last_attempt_at',p_previous_payload->'last_attempt_at',
       'last_result',p_previous_payload->'last_result',
       'last_reason',p_previous_payload->'last_reason',
       'last_confidence',p_previous_payload->'last_confidence'))));
 end if;
 return query select v_payload,
   case when v_same_revision and p_previous_payload->>'last_result'='uncertain'
     and p_previous_payload->>'last_attempt_at' is not null
     then greatest(p_previous_due,p_canonical_due) else p_canonical_due end,
   'OPEN'::text;
end
$merge$;
revoke all on function public.powerhouse_merge_calibration_obligation_v1(jsonb,jsonb,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.powerhouse_merge_calibration_obligation_v1(jsonb,jsonb,timestamptz,timestamptz,text) to service_role;

create or replace function public.powerhouse_sync_forecast_calibration_obligation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.status in ('active','claimed') then
    insert into public.revenue_learning_obligations(tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at)
    values('canonical','forecast-calibration:'||new.forecast_id::text,'FORECAST_CALIBRATION',null,null,'OPEN',jsonb_build_object('forecast_id',new.forecast_id,'forecast_key',new.forecast_key,'probability',new.probability,'confidence',new.confidence,'prediction_mode',new.prediction_mode,'contract','predictive-first-mover-intelligence-v1','forecast_revision',md5(jsonb_build_array(new.forecast_id,new.forecast_key,new.scope,new.scope_key,new.topic_key,new.predicted_event,new.predicted_problem,new.predicted_question,new.predicted_search_intent,new.probability,new.created_at,new.horizon_start,new.horizon_end,new.expected_by,new.evidence_signal_ids)::text)),coalesce(new.expected_by,new.horizon_end)::timestamptz,now())
    on conflict (tenant_id,obligation_id) do update set (payload,due_at,status)=(select m.payload,m.due_at,m.status from public.powerhouse_merge_calibration_obligation_v1(public.revenue_learning_obligations.payload,excluded.payload,public.revenue_learning_obligations.due_at,excluded.due_at,public.revenue_learning_obligations.status) m),updated_at=now();
  end if;
  return new;
end$$;


create or replace function public.powerhouse_refresh_forecast_calibration_obligations()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_count integer := 0;
begin
  insert into public.revenue_learning_obligations(
    tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at
  )
  select
    'canonical',
    'forecast-calibration:'||f.forecast_id::text,
    'FORECAST_CALIBRATION',
    null,
    null,
    'OPEN',
    jsonb_build_object(
      'forecast_id',f.forecast_id,
      'forecast_key',f.forecast_key,
      'probability',f.probability,
      'confidence',f.confidence,
      'prediction_mode',f.prediction_mode,
      'contract','predictive-first-mover-intelligence-v1',
      'forecast_revision',md5(jsonb_build_array(f.forecast_id,f.forecast_key,f.scope,f.scope_key,f.topic_key,f.predicted_event,f.predicted_problem,f.predicted_question,f.predicted_search_intent,f.probability,f.created_at,f.horizon_start,f.horizon_end,f.expected_by,f.evidence_signal_ids)::text)
    ),
    coalesce(f.expected_by,f.horizon_end)::timestamptz,
    now()
  from public.powerhouse_forecasts f
  where f.status in ('active','claimed')
  on conflict (tenant_id,obligation_id) do update
    set (payload,due_at,status)=(select m.payload,m.due_at,m.status from public.powerhouse_merge_calibration_obligation_v1(public.revenue_learning_obligations.payload,excluded.payload,public.revenue_learning_obligations.due_at,excluded.due_at,public.revenue_learning_obligations.status) m),updated_at=now();

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke execute on function public.powerhouse_refresh_forecast_calibration_obligations() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_forecast_calibration_obligations() to service_role;
