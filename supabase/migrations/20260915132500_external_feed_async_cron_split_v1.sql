-- pg_net starts queued requests after the transaction commits.
-- The old single transaction (enqueue -> sleep -> process) therefore always
-- observed missing responses. Split collection and processing into separate
-- cron transactions so external market/research feeds are actually ingested.

create or replace function intern.bronnen_controleren()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform intern.bronnen_ophalen();
end;
$function$;

create or replace function intern.bronnen_verwerken_afmaken()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform 1 from intern.bronnen_verwerken();
  perform intern.voorstellen_bijwerken();
  delete from net._http_response where created < now() - interval '2 days';
end;
$function$;

select cron.alter_job(
  (select jobid from cron.job where jobname='bronnen-dagelijks' limit 1),
  command := 'select intern.bronnen_controleren();',
  active := true
);

select case
  when exists (select 1 from cron.job where jobname='bronnen-verwerken-dagelijks')
    then cron.alter_job(
      (select jobid from cron.job where jobname='bronnen-verwerken-dagelijks' limit 1),
      schedule := '5 4 * * *',
      command := 'select intern.bronnen_verwerken_afmaken();',
      active := true
    )::text
  else cron.schedule(
    'bronnen-verwerken-dagelijks',
    '5 4 * * *',
    'select intern.bronnen_verwerken_afmaken();'
  )::text
end;
