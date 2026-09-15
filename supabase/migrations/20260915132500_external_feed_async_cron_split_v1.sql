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
declare
  v_tijd timestamptz := now();
  v_total integer;
  v_failed integer;
  v_publicaties bigint;
  v_status text;
begin
  perform 1 from intern.bronnen_verwerken();
  perform intern.voorstellen_bijwerken();

  select count(*), count(*) filter (where not laatste_controle_gelukt)
  into v_total, v_failed
  from public.bronnen
  where actief;

  select count(*) into v_publicaties from public.bronpublicaties;
  v_status := case when v_total > 0 and v_failed = 0 then 'ok' else 'fout' end;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    v_tijd,
    'external-research-feeds',
    'versheid',
    v_status,
    case when v_status='ok'
      then v_total || '/' || v_total || ' actieve feeds succesvol verwerkt'
      else (v_total-v_failed) || '/' || v_total || ' feeds succesvol; ' || v_failed || ' mislukt'
    end,
    jsonb_build_object(
      'contract','powerhouse-data-intake-learning-spine-v1',
      'active_feeds',v_total,
      'failed_feeds',v_failed,
      'publication_rows',v_publicaties,
      'collection_mode','pg_net_two_phase'
    )
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'source-health:external-research-feeds:' || to_char(v_tijd at time zone 'Europe/Amsterdam','YYYY-MM-DD'),
    'source_health_evaluated',
    'intern.bronnen_verwerken_afmaken',
    'external-research-feeds',
    'system',
    v_tijd,
    jsonb_build_object('status',v_status,'active_feeds',v_total,'failed_feeds',v_failed,'publication_rows',v_publicaties),
    jsonb_build_object('contract','powerhouse-data-intake-learning-spine-v1','collection_mode','pg_net_two_phase'),
    case when v_status='ok' then 'observed' else 'error' end,
    case when v_status='ok' then 'OBSERVED' else 'DEGRADED' end,
    case when v_status='ok' then 1.0 else 0.5 end
  )
  on conflict (dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  delete from net._http_response where created < now() - interval '2 days';
end;
$function$;

-- SECURITY DEFINER functions are internal automation only. Keep browser roles
-- fail-closed; cron owner/postgres and service_role remain the only executors.
revoke execute on function intern.bronnen_controleren() from public, anon, authenticated;
revoke execute on function intern.bronnen_verwerken_afmaken() from public, anon, authenticated;
grant execute on function intern.bronnen_controleren() to service_role;
grant execute on function intern.bronnen_verwerken_afmaken() to service_role;

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
