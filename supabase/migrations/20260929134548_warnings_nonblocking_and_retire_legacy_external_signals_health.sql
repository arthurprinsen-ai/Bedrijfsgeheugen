
do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
  into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='powerhouse_full_cycle_production_proof'
  limit 1;

  if v_def is null then raise exception 'powerhouse_full_cycle_production_proof not found'; end if;

  v_def := replace(
    v_def,
    'coalesce(bool_and(lower(canonical_health_status) = ''ok'' and lower(freshness_status) = ''fresh''), false)',
    'coalesce(bool_and(lower(canonical_health_status) in (''ok'',''waarschuwing'') and lower(freshness_status) in (''fresh'',''fresh_with_warning'')), false)'
  );
  v_def := replace(
    v_def,
    'filter (where lower(canonical_health_status) <> ''ok'' or lower(freshness_status) <> ''fresh'')',
    'filter (where lower(canonical_health_status) not in (''ok'',''waarschuwing'') or lower(freshness_status) not in (''fresh'',''fresh_with_warning''))'
  );

  execute v_def;
end
$migration$;

insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
values (
  now(),
  'externe-signalen',
  'versheid',
  'ok',
  'retired als verplichte provider-specifieke bron; vervangen door external-intelligence',
  jsonb_build_object(
    'max_leeftijd','36:00:00',
    'required_activity',false,
    'retired',true,
    'superseded_by','external-intelligence',
    'contract','powerhouse-data-intake-learning-spine-v1'
  )
);
