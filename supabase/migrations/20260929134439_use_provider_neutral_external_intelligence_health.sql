
do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
  into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='bg_gezondheid_meten'
  limit 1;

  if v_def is null then raise exception 'bg_gezondheid_meten not found'; end if;

  v_def := replace(
    v_def,
    '(''externe-signalen'',(select max(es.opgehaald_op) from bg_externe_signalen es),interval ''36 hours'',true)',
    '(''external-intelligence'',(select max(o.observed_at) from powerhouse_evidence_source_observations o where o.source_key=''external-intelligence''),interval ''36 hours'',true)'
  );

  execute v_def;
end
$migration$;
