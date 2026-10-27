-- Powerhouse Foresight & Prediction Intelligence v2
create or replace view public.powerhouse_forecast_quality_v2
with (security_invoker=true) as
with resolved as (
  select f.forecast_id,f.scope,f.topic_key,f.prediction_mode,
    greatest(1,(f.horizon_end-f.horizon_start))::int horizon_days,
    f.probability,c.outcome_value,c.brier_component,c.timing_error_days,c.measured_at
  from public.powerhouse_forecasts f
  join public.powerhouse_forecast_calibration c on c.forecast_id=f.forecast_id
  where c.outcome_value is not null
),
bucketed as (
  select *,case
    when horizon_days<=7 then '7d'
    when horizon_days<=30 then '30d'
    when horizon_days<=90 then '90d'
    when horizon_days<=365 then '12m'
    else '36m+'
  end horizon_bucket
  from resolved
)
select horizon_bucket,scope,coalesce(prediction_mode,'unknown') prediction_mode,
  count(*)::int resolved_forecasts,
  round(avg(probability)::numeric,4) mean_probability,
  round(avg(outcome_value)::numeric,4) event_rate,
  round(avg(coalesce(brier_component,power(probability-outcome_value,2)))::numeric,4) brier_score,
  round(abs(avg(probability)-avg(outcome_value))::numeric,4) calibration_error,
  round(avg(abs(timing_error_days))::numeric,3) timing_mae_days,
  max(measured_at) last_measured_at
from bucketed
group by horizon_bucket,scope,coalesce(prediction_mode,'unknown');

revoke all on public.powerhouse_forecast_quality_v2 from public,anon,authenticated;
grant select on public.powerhouse_forecast_quality_v2 to service_role;

create or replace view public.powerhouse_forecast_resolution_debt_v2
with (security_invoker=true) as
select f.forecast_id,f.forecast_key,f.scope,f.scope_key,f.topic_key,f.predicted_event,
  f.probability,f.confidence,f.horizon_start,f.horizon_end,f.prediction_mode,
  current_date-f.horizon_end overdue_days,
  cardinality(f.evidence_signal_ids) signal_count,
  case
    when current_date-f.horizon_end>=30 then 'CRITICAL'
    when current_date-f.horizon_end>=14 then 'HIGH'
    when current_date-f.horizon_end>=7 then 'MEDIUM'
    else 'DUE'
  end resolution_priority
from public.powerhouse_forecasts f
where f.horizon_end<current_date
  and not exists (
    select 1 from public.powerhouse_forecast_calibration c
    where c.forecast_id=f.forecast_id and c.outcome_value is not null
  );

revoke all on public.powerhouse_forecast_resolution_debt_v2 from public,anon,authenticated;
grant select on public.powerhouse_forecast_resolution_debt_v2 to service_role;

create or replace view public.powerhouse_prediction_intelligence_control_v2
with (security_invoker=true) as
with totals as (
  select count(*)::int forecast_total,
    count(*) filter(where horizon_end<current_date)::int forecasts_due
  from public.powerhouse_forecasts
),
resolved as (
  select count(distinct forecast_id)::int resolved_total,
    round(avg(coalesce(brier_component,power((select f.probability from public.powerhouse_forecasts f where f.forecast_id=c.forecast_id)-outcome_value,2)))::numeric,4) brier_score,
    round(avg(abs(timing_error_days))::numeric,3) timing_mae_days
  from public.powerhouse_forecast_calibration c
  where outcome_value is not null
),
debt as (
  select count(*)::int resolution_debt from public.powerhouse_forecast_resolution_debt_v2
),
signals as (
  select count(*)::int signal_total,
    count(distinct source_type)::int independent_source_types,
    count(distinct topic_key)::int topics
  from public.powerhouse_predictive_signals
  where observed_at>=now()-interval '90 days'
),
quality as (
  select round(avg(calibration_error)::numeric,4) calibration_error,
    count(*) filter(where resolved_forecasts>=20)::int statistically_usable_buckets
  from public.powerhouse_forecast_quality_v2
)
select now() observed_at,t.forecast_total,t.forecasts_due,r.resolved_total,d.resolution_debt,
  case when t.forecasts_due=0 then 1 else round((r.resolved_total::numeric/greatest(t.forecasts_due,1))::numeric,4) end resolution_coverage_proxy,
  r.brier_score,q.calibration_error,r.timing_mae_days,s.signal_total,s.independent_source_types,s.topics,
  q.statistically_usable_buckets,
  case
    when d.resolution_debt>100 then 'RESOLUTION_DEBT_CRITICAL'
    when coalesce(r.brier_score,1)>0.25 then 'PREDICTION_QUALITY_DEGRADED'
    when coalesce(q.calibration_error,1)>0.15 then 'CALIBRATION_DEGRADED'
    when coalesce(r.timing_mae_days,999)>14 then 'TIMING_DEGRADED'
    when r.resolved_total<20 then 'LEARN_MORE'
    else 'CALIBRATED_LEARNING'
  end prediction_state,
  jsonb_build_object(
    'north_star','Improve future prediction accuracy every day using resolved outcomes and calibrated uncertainty.',
    'quality_metrics',jsonb_build_array('brier_score','calibration_error','timing_mae_days','resolution_coverage','signal_diversity'),
    'promotion_path',jsonb_build_array('backtest','shadow','canary','promote_or_rollback'),
    'prediction_is_not_fact',true,
    'direct_self_rewrite_forbidden',true
  ) contract
from totals t cross join resolved r cross join debt d cross join signals s cross join quality q;

revoke all on public.powerhouse_prediction_intelligence_control_v2 from public,anon,authenticated;
grant select on public.powerhouse_prediction_intelligence_control_v2 to service_role;

create or replace view public.powerhouse_prediction_improvement_queue_v2
with (security_invoker=true) as
select 'resolve_forecasts'::text improvement_type,
  'Increase resolved forecast coverage before trusting model changes.'::text hypothesis,
  greatest(0,resolution_debt)::numeric priority_score,
  jsonb_build_object('resolution_debt',resolution_debt,'resolved_total',resolved_total) evidence,
  'resolution_coverage'::text target_metric
from public.powerhouse_prediction_intelligence_control_v2
where resolution_debt>0
union all
select 'recalibrate_probability_mapping',
  'Probability estimates need recalibration against observed event frequency.',
  (coalesce(calibration_error,0)*1000)::numeric,
  jsonb_build_object('calibration_error',calibration_error,'brier_score',brier_score),
  'calibration_error'
from public.powerhouse_prediction_intelligence_control_v2
where calibration_error is not null and calibration_error>0.12
union all
select 'optimize_horizon_estimation',
  'Lead-time estimation should be challenged using resolved timing errors.',
  coalesce(timing_mae_days,0)::numeric,
  jsonb_build_object('timing_mae_days',timing_mae_days),
  'timing_mae_days'
from public.powerhouse_prediction_intelligence_control_v2
where timing_mae_days is not null and timing_mae_days>7
union all
select 'broaden_signal_diversity',
  'Forecast robustness needs more independent source types.',
  (10-coalesce(independent_source_types,0))::numeric,
  jsonb_build_object('independent_source_types',independent_source_types,'topics',topics),
  'signal_diversity'
from public.powerhouse_prediction_intelligence_control_v2
where independent_source_types<10;

revoke all on public.powerhouse_prediction_improvement_queue_v2 from public,anon,authenticated;
grant select on public.powerhouse_prediction_improvement_queue_v2 to service_role;

create or replace function public.powerhouse_prediction_learning_audit_v2()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_control jsonb; v_queue jsonb;
begin
  select to_jsonb(x) into v_control from public.powerhouse_prediction_intelligence_control_v2 x;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.priority_score desc),'[]'::jsonb)
    into v_queue from public.powerhouse_prediction_improvement_queue_v2 q;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,created_at,updated_at
  ) values (
    'prediction-learning-audit:'||(now() at time zone 'Europe/Amsterdam')::date::text,
    'prediction_learning_audit',
    'powerhouse-foresight-autonomy-v2',
    'prediction-intelligence',
    'system',now(),
    jsonb_build_object('control',v_control,'improvement_queue',v_queue),
    jsonb_build_object('direct_self_rewrite',false,'promotion_requires','backtest-shadow-canary'),
    'observed','VERIFIED',1,now(),now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object('control',v_control,'improvement_queue',v_queue,'audited_at',now());
end;
$$;

revoke execute on function public.powerhouse_prediction_learning_audit_v2() from public,anon,authenticated;
grant execute on function public.powerhouse_prediction_learning_audit_v2() to service_role;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-prediction-learning-audit-v2' limit 1;
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
end $$;

select cron.schedule(
  'powerhouse-prediction-learning-audit-v2',
  '35 6 * * *',
  $cron$select public.powerhouse_prediction_learning_audit_v2();$cron$
);

comment on view public.powerhouse_forecast_quality_v2 is 'Horizon/scope/method forecast quality using resolved outcomes, Brier score, calibration and timing error.';
comment on view public.powerhouse_forecast_resolution_debt_v2 is 'Due forecasts without verified resolution; unresolved predictions are explicit learning debt.';
comment on view public.powerhouse_prediction_intelligence_control_v2 is 'Canonical prediction-quality control plane over existing forecasts/signals/calibration.';
comment on view public.powerhouse_prediction_improvement_queue_v2 is 'Evidence-driven prediction improvement hypotheses; candidates require backtest/shadow/canary before promotion.';
