create or replace function benchmark_projection.refresh_scan_benchmarks()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from benchmark_projection.benchmark_branche_data where true;
  insert into benchmark_projection.benchmark_branche_data (branche,aantal,score_gemiddeld,score_midden,score_bovenste_kwart)
  select branche,count(*),round(avg(score),1),round(percentile_cont(0.5) within group (order by score::double precision)::numeric,1),round(percentile_cont(0.75) within group (order by score::double precision)::numeric,1)
  from public.scan_inzendingen where soort='frisse_blik' and score is not null and branche is not null and tenant_identity_status='verified' and organisatie_id is not null
  group by branche having count(*)>=5;

  delete from benchmark_projection.benchmark_niveaus_data where true;
  insert into benchmark_projection.benchmark_niveaus_data (branche,onderdeel,aantal,niveau_gemiddeld)
  select s.branche,n.sleutel,count(*),round(avg(n.ruw::numeric),2)
  from public.scan_inzendingen s cross join lateral jsonb_each_text(coalesce(s.niveaus,'{}'::jsonb)) n(sleutel,ruw)
  where s.soort='frisse_blik' and s.branche is not null and s.tenant_identity_status='verified' and s.organisatie_id is not null
  group by s.branche,n.sleutel having count(*)>=5;
  return null;
end;
$function$;

-- Replay hardening: production currently exposes EXECUTE only to postgres.
-- Make that fail-closed state explicit in the canonical historical replay.
revoke execute on function benchmark_projection.refresh_scan_benchmarks() from public, anon, authenticated;
