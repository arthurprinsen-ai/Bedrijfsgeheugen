-- Missed publications become incidents with an owner, once per (date, channel).
-- Uses the existing failure registry (brain_observe_failure) and the existing
-- hourly content tick. No new scheduler. Each stage is isolated like the others.
create or replace function public.powerhouse_report_missed_publications_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $fn$
declare
  v_report jsonb;
  m jsonb;
  v_count integer := 0;
begin
  v_report := public.powerhouse_missed_publication_v1(p_now, 3);
  for m in select * from jsonb_array_elements(coalesce(v_report->'missed','[]'::jsonb)) loop
    perform public.brain_observe_failure(
      'missed-publication:' || (m->>'publication_date') || ':' || (m->>'channel'),
      'powerhouse|content|missed-publication|' || (m->>'channel'),
      encode(sha256(convert_to((m->>'publication_date') || '|' || (m->>'channel'), 'utf8')), 'hex'),
      jsonb_build_object(
        'kind','MISSED_PUBLICATION',
        'owner', m->>'owner',
        'channel', m->>'channel',
        'publication_date', m->>'publication_date',
        'deadline', m->>'deadline',
        'status_at_check', m->>'status',
        'hours_late', m->'hours_late',
        'rule','Groen vereist PUBLISHED of later met provider-bewijs; een kanaal zonder uitvoerder of rij telt als gemist.'
      )
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$fn$;

revoke all on function public.powerhouse_report_missed_publications_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_report_missed_publications_v1(timestamptz) to service_role;

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamp with time zone default now())
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_catalog', 'net', 'vault'
as $function$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_token text;
begin
  begin
    perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  exception when others then
    raise warning 'CONTENT_OUTCOME_RECONCILE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'reconciliation', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','reconcile_pre','isolated',true));
    exception when others then
      raise warning 'CONTENT_RECONCILE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_measure_content_outcomes_v1(p_now);
  exception when others then
    raise warning 'CONTENT_OUTCOME_MEASURE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'measurement', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','measure','isolated',true));
    exception when others then
      raise warning 'CONTENT_MEASURE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_report_missed_publications_v1(p_now);
  exception when others then
    raise warning 'CONTENT_MISSED_PUBLICATION_REPORT_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'missed-publication-report', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','missed_report','isolated',true));
    exception when others then
      raise warning 'CONTENT_MISSED_REPORT_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  -- Auth/security and provider dispatch errors are deliberately NOT caught.
  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  if v_token is null then
    raise exception 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  end if;
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end
$function$;
