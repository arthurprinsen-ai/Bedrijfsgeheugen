create or replace function public.powerhouse_offers_source_heartbeat_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_count integer;
  v_latest timestamptz;
  v_dedupe text;
begin
  select count(*)::integer, max(bijgewerkt_op)
    into v_count, v_latest
  from public.offertes;

  v_dedupe := 'offers:canonical-readback:' || to_char(date_trunc('hour', now()) at time zone 'UTC', 'YYYY-MM-DD"T"HH24');

  insert into public.powerhouse_evidence_source_observations(
    source_key,dedupe_key,external_event_id,observed_at,evidence
  ) values(
    'offers',v_dedupe,null,now(),jsonb_build_object(
      'provider','canonical-supabase-offertes',
      'provenance','canonical-offers-readback',
      'scope','provider-readback-heartbeat',
      'readback_verified',true,
      'offers_observed',v_count,
      'latest_offer_update',v_latest,
      'data_content_stored',false,
      'note','Availability/readback heartbeat only; no proposal or commercial outcome asserted.'
    )
  )
  on conflict(dedupe_key) do update
    set observed_at=excluded.observed_at,
        evidence=excluded.evidence;

  return jsonb_build_object('ok',true,'source_key','offers','offers_observed',v_count,'latest_offer_update',v_latest,'dedupe_key',v_dedupe);
end;
$function$;

revoke all on function public.powerhouse_offers_source_heartbeat_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_offers_source_heartbeat_v1() to service_role;

select cron.unschedule(jobid) from cron.job where jobname='powerhouse-offers-source-heartbeat-hourly-v1';
select cron.schedule('powerhouse-offers-source-heartbeat-hourly-v1','17 * * * *','select public.powerhouse_offers_source_heartbeat_v1();');

select public.powerhouse_offers_source_heartbeat_v1();
