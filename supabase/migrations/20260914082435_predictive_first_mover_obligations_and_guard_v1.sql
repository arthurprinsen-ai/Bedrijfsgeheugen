create or replace function public.powerhouse_sync_forecast_calibration_obligation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.status in ('active','claimed') then
    insert into public.revenue_learning_obligations(tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at)
    values('canonical','forecast-calibration:'||new.forecast_id::text,'FORECAST_CALIBRATION',null,null,'OPEN',jsonb_build_object('forecast_id',new.forecast_id,'forecast_key',new.forecast_key,'probability',new.probability,'confidence',new.confidence,'prediction_mode',new.prediction_mode,'contract','predictive-first-mover-intelligence-v1'),coalesce(new.expected_by,new.horizon_end)::timestamptz,now())
    on conflict (tenant_id,obligation_id) do update set payload=excluded.payload,due_at=excluded.due_at,updated_at=now(),status=case when public.revenue_learning_obligations.status='CLOSED' then public.revenue_learning_obligations.status else 'OPEN' end;
  end if;
  return new;
end$$;

drop trigger if exists trg_powerhouse_forecast_calibration_obligation on public.powerhouse_forecasts;
create trigger trg_powerhouse_forecast_calibration_obligation
after insert or update of status,expected_by,horizon_end,probability,confidence on public.powerhouse_forecasts
for each row execute function public.powerhouse_sync_forecast_calibration_obligation();

insert into public.revenue_learning_obligations(tenant_id,obligation_id,type,content_id,window_hours,status,payload,due_at,updated_at)
select 'canonical','forecast-calibration:'||f.forecast_id::text,'FORECAST_CALIBRATION',null,null,'OPEN',jsonb_build_object('forecast_id',f.forecast_id,'forecast_key',f.forecast_key,'probability',f.probability,'confidence',f.confidence,'prediction_mode',f.prediction_mode,'contract','predictive-first-mover-intelligence-v1'),coalesce(f.expected_by,f.horizon_end)::timestamptz,now()
from public.powerhouse_forecasts f
where f.status in ('active','claimed')
on conflict (tenant_id,obligation_id) do nothing;

create or replace function public.powerhouse_predictive_health(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language sql
stable
set search_path = public, pg_catalog
as $$
with h as (
  select gemeten_op,status,detail from public.bg_gezondheid
  where onderdeel='powerhouse-predictive-engine'
    and (gemeten_op at time zone 'Europe/Amsterdam')::date=p_run_date
  order by gemeten_op desc limit 1
), c as (
  select measured_at from public.powerhouse_forecast_calibration order by measured_at desc limit 1
)
select jsonb_build_object(
  'contract','predictive-first-mover-intelligence-v1',
  'run_date',p_run_date,
  'predictive_run_seen',exists(select 1 from h),
  'predictive_run_ok',coalesce((select status='ok' from h),false),
  'last_predictive_run',(select gemeten_op from h),
  'last_predictive_detail',(select detail from h),
  'active_forecasts',(select count(*) from public.powerhouse_forecasts where status in ('active','claimed')),
  'queue_size',(select count(*) from public.powerhouse_first_mover_queue),
  'overdue_calibrations',(select count(*) from public.revenue_learning_obligations where tenant_id='canonical' and type='FORECAST_CALIBRATION' and status='OPEN' and due_at < now()),
  'last_calibration',(select measured_at from c),
  'healthy',coalesce((select status='ok' from h),false) and (select count(*)=0 from public.revenue_learning_obligations where tenant_id='canonical' and type='FORECAST_CALIBRATION' and status='OPEN' and due_at < now()),
  'revenue_target_eur',1000000,
  'revenue_target_deadline','2027-09-14'
)$$;

create or replace function public.powerhouse_daily_execution_guard(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
set search_path = public, pg_catalog
as $$
declare s jsonb; p jsonb; current_state text; combined jsonb; all_ok boolean;
begin
  s := public.powerhouse_execution_status(p_run_date);
  p := public.powerhouse_predictive_health(p_run_date);
  all_ok := coalesce((s->>'execution_complete')::boolean,false) and coalesce((p->>'healthy')::boolean,false);
  combined := s || jsonb_build_object('predictive',p,'execution_complete_with_predictive',all_ok);
  select state into current_state from public.powerhouse_daily_runs where run_date=p_run_date;

  if all_ok and current_state in ('started','degraded') then
    update public.powerhouse_daily_runs
       set state='completed', completed_at=coalesce(completed_at,now()), evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','execution_status',combined,'completion_confirmed_at',now()), updated_at=now()
     where run_date=p_run_date;
  elsif current_state='completed' and not all_ok then
    update public.powerhouse_daily_runs
       set state='degraded', completed_at=null, evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','execution_status',combined,'completion_reconciled_at',now()), updated_at=now()
     where run_date=p_run_date;
  end if;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-execution-contract','execution-guard',case when all_ok then 'ok' else 'fout' end,case when all_ok then 'dagcyclus inclusief predictive intelligence en calibration obligations is execution-complete' else 'dagcyclus mist delivery, predictive run of heeft overdue calibration; completed blijft fail-closed' end,combined);
  return combined;
end$$;

revoke all on function public.powerhouse_sync_forecast_calibration_obligation() from anon, authenticated;
revoke all on function public.powerhouse_predictive_health(date) from anon, authenticated;
revoke all on function public.powerhouse_daily_execution_guard(date) from anon, authenticated;
grant execute on function public.powerhouse_predictive_health(date) to service_role;
grant execute on function public.powerhouse_daily_execution_guard(date) to service_role;