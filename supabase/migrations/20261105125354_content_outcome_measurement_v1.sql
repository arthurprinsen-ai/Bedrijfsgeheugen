-- Content outcome measurement: the missing "meting" stage of the content chain.
-- Owner: powerhouse_content_closed_loop_tick_v1 (existing hourly cron). No new scheduler.
-- Reads only bg_ga4_csv_batches (GA4 page rows already collected) and writes only through
-- record_content_publication_state. Never sets LEARNED. Low traffic is recorded honestly as INSUFFICIENT_DATA.
create or replace function public.powerhouse_measure_content_outcomes_v1(
  p_now timestamptz default now(),
  p_min_age_days integer default 7,
  p_min_sessions integer default 10
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  r record;
  v_path text;
  v_start date;
  v_end date;
  v_sessions bigint;
  v_users bigint;
  v_events bigint;
  v_days integer;
  v_window integer := greatest(p_min_age_days,1);
  v_measured integer := 0;
  v_sufficient integer := 0;
begin
  for r in
    select tenant_id, publication_date, channel, slug, canonical_url
    from public.content_publication_obligations
    where content_kind = 'blog'
      and status = 'LIVE_PROVEN'
      and measured_at is null
      and canonical_url is not null
      and live_proven_at <= p_now - make_interval(days => v_window)
    order by publication_date
    limit 50
  loop
    v_path := rtrim(regexp_replace(r.canonical_url, '^https?://[^/]+', ''), '/');
    v_start := r.publication_date;
    v_end := r.publication_date + (v_window - 1);

    with latest as (
      select distinct on (period_start) period_start, csv_text
      from public.bg_ga4_csv_batches
      where period_start between v_start and v_end
        and status in ('IMPORTED','PARTIAL')
      order by period_start, completed_at desc nulls last
    ), lines as (
      select period_start,
             regexp_match(line, '^(\d{8}),([^,]+),(.*),(\d+),(\d+),(\d+)$') m
      from latest, regexp_split_to_table(csv_text, E'\n') line
    )
    select (select count(*) from latest),
           coalesce(sum((m)[4]::bigint) filter (where rtrim((m)[2],'/') = v_path), 0),
           coalesce(sum((m)[5]::bigint) filter (where rtrim((m)[2],'/') = v_path), 0),
           coalesce(sum((m)[6]::bigint) filter (where rtrim((m)[2],'/') = v_path), 0)
      into v_days, v_sessions, v_users, v_events
    from lines where m is not null;

    perform public.record_content_publication_state(
      r.tenant_id, r.publication_date, r.channel, 'MEASURED',
      null, r.slug, null, r.canonical_url,
      jsonb_build_object('measured_by','powerhouse_measure_content_outcomes_v1','source','bg_ga4_csv_batches'),
      jsonb_build_object(
        'window_start', v_start, 'window_end', v_end, 'window_days', v_window,
        'days_with_ga4_batch', v_days,
        'sessions', v_sessions, 'active_users', v_users, 'events', v_events,
        'min_sessions', p_min_sessions,
        'data_quality', case when v_days < v_window then 'INCOMPLETE_COVERAGE'
                             when v_sessions < p_min_sessions then 'INSUFFICIENT_DATA'
                             else 'SUFFICIENT' end),
      case when v_days >= v_window and v_sessions >= p_min_sessions
           then 'Leerregel mag worden afgeleid uit deze meting.'
           else 'Meting is te dun voor een leerregel; niet leren, wel verder meten bij meer verkeer.' end,
      null);

    v_measured := v_measured + 1;
    if v_days >= v_window and v_sessions >= p_min_sessions then v_sufficient := v_sufficient + 1; end if;
  end loop;

  return jsonb_build_object('measured', v_measured, 'sufficient_for_learning', v_sufficient, 'at', p_now);
end
$function$;

revoke all on function public.powerhouse_measure_content_outcomes_v1(timestamptz,integer,integer) from public, anon, authenticated;

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamp with time zone default now())
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_catalog','net','vault'
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
