do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-revenue-intelligence-daily';
exception when others then null;
end $$;

select cron.schedule(
  'powerhouse-revenue-intelligence-daily',
  '14 6 * * *',
  $cron$
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-revenue-intelligence/daily',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
    ),
    body := jsonb_build_object('runDate', current_date::text),
    timeout_milliseconds := 120000
  );
  $cron$
);

alter view public.powerhouse_contact_pressure_v1 set (security_invoker=true);
alter view public.powerhouse_account_strategy_v1 set (security_invoker=true);
alter view public.powerhouse_research_queue_v1 set (security_invoker=true);
alter view public.powerhouse_commercial_next_best_action_v3 set (security_invoker=true);
alter view public.powerhouse_revenue_attribution_v1 set (security_invoker=true);
alter view public.powerhouse_model_health_v1 set (security_invoker=true);
alter view public.powerhouse_experiment_learning_v2 set (security_invoker=true);
alter view public.powerhouse_revenue_command_center_v2 set (security_invoker=true);

revoke all on public.powerhouse_contact_pressure_v1 from anon, authenticated;
revoke all on public.powerhouse_account_strategy_v1 from anon, authenticated;
revoke all on public.powerhouse_research_queue_v1 from anon, authenticated;
revoke all on public.powerhouse_commercial_next_best_action_v3 from anon, authenticated;
revoke all on public.powerhouse_revenue_attribution_v1 from anon, authenticated;
revoke all on public.powerhouse_model_health_v1 from anon, authenticated;
revoke all on public.powerhouse_experiment_learning_v2 from anon, authenticated;
revoke all on public.powerhouse_revenue_command_center_v2 from anon, authenticated;

grant select on public.powerhouse_contact_pressure_v1 to service_role;
grant select on public.powerhouse_account_strategy_v1 to service_role;
grant select on public.powerhouse_research_queue_v1 to service_role;
grant select on public.powerhouse_commercial_next_best_action_v3 to service_role;
grant select on public.powerhouse_revenue_attribution_v1 to service_role;
grant select on public.powerhouse_model_health_v1 to service_role;
grant select on public.powerhouse_experiment_learning_v2 to service_role;
grant select on public.powerhouse_revenue_command_center_v2 to service_role;
