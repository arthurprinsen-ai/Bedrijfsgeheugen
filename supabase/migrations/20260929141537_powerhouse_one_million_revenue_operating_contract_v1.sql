-- €1M Revenue Operating Contract v1
create or replace view public.powerhouse_one_million_revenue_pace_v1
with (security_invoker = true)
as
with cfg as (
  select date '2026-09-29' as target_start,
         date '2027-09-29' as target_end,
         1000000::numeric as target_eur
),
actual as (
  select coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur
  from public.powerhouse_sales_outcomes, cfg
  where occurred_at >= cfg.target_start::timestamptz
    and occurred_at < cfg.target_end::timestamptz
),
pace as (
  select cfg.*,
         actual.realized_revenue_eur,
         greatest(0,least(365,(current_date-cfg.target_start)))::numeric as elapsed_days,
         greatest(0,(cfg.target_end-current_date))::numeric as remaining_days
  from cfg cross join actual
)
select
  target_start,
  target_end,
  target_eur,
  realized_revenue_eur,
  round(target_eur/12,2) as nominal_monthly_target_eur,
  round(target_eur/52,2) as nominal_weekly_target_eur,
  round(target_eur/260,2) as nominal_business_day_target_eur,
  round(target_eur*(elapsed_days/365),2) as paced_target_eur,
  round(realized_revenue_eur-(target_eur*(elapsed_days/365)),2) as pace_variance_eur,
  greatest(0,target_eur-realized_revenue_eur) as remaining_revenue_eur,
  case when remaining_days > 0 then round(greatest(0,target_eur-realized_revenue_eur)/remaining_days,2) else greatest(0,target_eur-realized_revenue_eur) end as required_calendar_day_eur,
  case when realized_revenue_eur >= target_eur then 'TARGET_REACHED'
       when realized_revenue_eur >= target_eur*(elapsed_days/365) then 'ON_OR_AHEAD'
       else 'BEHIND_PACE'
  end as pace_status,
  now() as measured_at
from pace;

revoke all on public.powerhouse_one_million_revenue_pace_v1 from public,anon,authenticated;
grant select on public.powerhouse_one_million_revenue_pace_v1 to service_role;

create or replace function public.powerhouse_one_million_revenue_governor_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_cycle jsonb;
  v_pace jsonb;
  v_now timestamptz := now();
begin
  v_cycle := public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(p_run_date);
  select to_jsonb(p) into v_pace from public.powerhouse_one_million_revenue_pace_v1 p;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'one-million-revenue-governor:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'one_million_revenue_governor',
    'powerhouse-one-million-revenue-operating-contract-v1',
    'powerhouse',
    v_now,
    jsonb_build_object(
      'pace',v_pace,
      'canonical_cycle_contract',v_cycle->>'contract',
      'run_date',p_run_date,
      'truth_boundary','realized revenue comes only from observed powerhouse_sales_outcomes'
    ),
    jsonb_build_object(
      'one_brain',true,
      'execute_before_recommendation_when_authorized',true,
      'generic_cold_bulk_autosend',false,
      'warm_consented_followup_autonomous',true
    ),
    case when coalesce(v_cycle->>'contract','')<>'' then 'actioned' else 'error' end,
    'verified',
    1,
    v_now
  )
  on conflict(dedupe_key) do update
  set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=excluded.updated_at;

  return jsonb_build_object(
    'contract','powerhouse-one-million-revenue-operating-contract-v1',
    'pace',v_pace,
    'commercial_cycle',v_cycle,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_one_million_revenue_governor_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_one_million_revenue_governor_v1(date) to service_role;

select cron.schedule(
  'powerhouse-commercial-learning-v1',
  '27 * * * *',
  $$select public.powerhouse_one_million_revenue_governor_v1();$$
);
