create or replace function public.powerhouse_record_flywheel_health_v1()
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
  select 'revenue-flywheel-health-'||to_char(now() at time zone 'UTC','YYYYMMDDHH24'),
         'revenue_flywheel_health','powerhouse_revenue_flywheel_v1','powerhouse',now(),
         jsonb_build_object('open_opportunities',open_opportunities,'weighted_pipeline_eur',weighted_pipeline_eur,'expected_value_eur',expected_value_eur,'pending_actions',pending_actions,'executed_without_outcome',executed_without_outcome,'realized_revenue_eur',realized_revenue_eur,'forecast_count',forecast_count,'calibration_count',calibration_count,'active_experiments',active_experiments,'experiments_awaiting_decision',experiments_awaiting_decision),
         jsonb_build_object('outcome_gap',outcome_gap,'calibration_gap',calibration_gap,'experiment_decision_gap',experiment_decision_gap),
         case when outcome_gap or calibration_gap or experiment_decision_gap then 'error' else 'observed' end,
         'system',1
  from public.powerhouse_revenue_flywheel_v1
  on conflict (dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now()
  returning event_id into v_id;
  return v_id;
end $$;

revoke all on function public.powerhouse_record_flywheel_health_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_record_flywheel_health_v1() to service_role;

create index if not exists powerhouse_sales_actions_event_id_idx on public.powerhouse_sales_actions(event_id);
create index if not exists powerhouse_sales_actions_outcome_id_idx on public.powerhouse_sales_actions(outcome_id);
create index if not exists powerhouse_sales_outcomes_action_id_idx on public.powerhouse_sales_outcomes(action_id);

do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-revenue-flywheel-health-v1';
    perform cron.schedule('powerhouse-revenue-flywheel-health-v1','17 * * * *','select public.powerhouse_record_flywheel_health_v1();');
  end if;
end $$;
