
create or replace function public.powerhouse_refresh_seo_assurance_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_recs bigint;
  v_forecasts bigint;
  v_pass boolean;
  s text;
begin
  select count(*) into v_recs
  from public.powerhouse_content_recommendations
  where run_date=v_date
    and lower(coalesce(evidence->>'contract','')) like '%seo%';

  select count(*) into v_forecasts
  from public.powerhouse_forecasts
  where created_at >= date_trunc('day',p_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
    and lower(coalesce(evidence->>'contract','')) like '%seo%';

  v_pass := v_recs>0 or v_forecasts>0;

  foreach s in array array['action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1(
      'seo-opportunity-resolver',s,
      jsonb_build_object(
        'contract','powerhouse-seo-opportunity-resolver-v1',
        'pass',case when s='guard' then v_pass else null end,
        'recommendations_today',v_recs,
        'forecasts_today',v_forecasts,
        'evidence_basis','resolver outputs, not raw keyword refresh timestamp'
      ),
      p_now
    );
  end loop;
  return jsonb_build_object('ok',true,'pass',v_pass,'recommendations_today',v_recs,'forecasts_today',v_forecasts);
end;
$function$;
