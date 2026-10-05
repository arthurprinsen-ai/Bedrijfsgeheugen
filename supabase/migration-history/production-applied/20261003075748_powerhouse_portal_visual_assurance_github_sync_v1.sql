do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname='powerhouse-portal-visual-assurance-sync-v1';
exception when others then
  null;
end $$;

select cron.schedule(
  'powerhouse-portal-visual-assurance-sync-v1',
  '12 * * * *',
  $cron$
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-visual-assurance-sync',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',(
        select decrypted_secret
        from vault.decrypted_secrets
        where name='powerhouse_daily_scheduler_token'
        order by created_at desc
        limit 1
      )
    ),
    body := jsonb_build_object('source','pg_cron','requested_at',now())
  ) as request_id;
  $cron$
);

update public.powerhouse_loop_assurance_registry_v1
set cron_jobname='powerhouse-portal-visual-assurance-sync-v1',
    runtime_source=null,
    evidence_contract=evidence_contract || jsonb_build_object(
      'github_sync_adapter','powerhouse-visual-assurance-sync-v1',
      'github_sync_cron','powerhouse-portal-visual-assurance-sync-v1',
      'github_sync_schedule','12 * * * *',
      'github_public_evidence',true,
      'scheduler_token_authority','powerhouse_daily_scheduler_token'
    ),
    updated_at=now()
where loop_key='portal-visual-density';
