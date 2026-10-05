do $$
declare
  v_sales_job bigint;
  v_context_job bigint;
  v_actions_job bigint;
begin
  select jobid into v_sales_job from cron.job where jobname='powerhouse-sales-machine-daily-v6';
  if v_sales_job is not null then
    perform cron.alter_job(
      job_id := v_sales_job,
      command := 'select public.powerhouse_one_commercial_decision_loop_v1((now() at time zone ''Europe/Amsterdam'')::date);',
      active := true
    );
  end if;

  select jobid into v_context_job from cron.job where jobname='powerhouse-commercial-context-daily-v1';
  if v_context_job is not null then
    perform cron.alter_job(job_id := v_context_job, active := false);
  end if;

  select jobid into v_actions_job from cron.job where jobname='powerhouse-commercial-actions-daily-v1';
  if v_actions_job is not null then
    perform cron.alter_job(job_id := v_actions_job, active := false);
  end if;
end $$;
