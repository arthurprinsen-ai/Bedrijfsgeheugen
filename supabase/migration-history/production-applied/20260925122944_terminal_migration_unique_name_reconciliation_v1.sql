create or replace function public.powerhouse_supabase_migration_readback_v1(p_expected jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_total integer := 0;
  v_matched integer := 0;
  v_rows jsonb := '[]'::jsonb;
begin
  if p_expected is null or jsonb_typeof(p_expected)<>'array' then
    raise exception 'VALIDATION_ERROR';
  end if;

  with expected as (
    select nullif(btrim(x.version),'') as version,
           nullif(btrim(x.name),'') as name
    from jsonb_to_recordset(p_expected) as x(version text,name text)
  ),
  checked as (
    select
      e.version as expected_version,
      e.name,
      exact.version as exact_version,
      by_name.name_count,
      by_name.only_version as name_only_version,
      case
        when exact.version is not null then true
        when by_name.name_count = 1 then true
        else false
      end as matched,
      case
        when exact.version is not null then exact.version
        when by_name.name_count = 1 then by_name.only_version
        else null
      end as actual_version,
      case
        when exact.version is not null then 'EXACT_VERSION_AND_NAME'
        when by_name.name_count = 1 then 'UNIQUE_NAME_RECONCILED'
        when by_name.name_count > 1 then 'AMBIGUOUS_NAME'
        else 'NOT_FOUND'
      end as identity_mode
    from expected e
    left join lateral (
      select sm.version
      from supabase_migrations.schema_migrations sm
      where sm.version=e.version and sm.name=e.name
      limit 1
    ) exact on true
    left join lateral (
      select count(*)::integer as name_count,
             min(sm.version) as only_version
      from supabase_migrations.schema_migrations sm
      where sm.name=e.name
    ) by_name on true
    where e.version is not null and e.name is not null
  )
  select count(*),
         count(*) filter (where matched),
         coalesce(
           jsonb_agg(
             jsonb_build_object(
               'version',expected_version,
               'name',name,
               'matched',matched,
               'actual_version',actual_version,
               'identity_mode',identity_mode,
               'name_match_count',coalesce(name_count,0)
             )
             order by expected_version,name
           ),
           '[]'::jsonb
         )
    into v_total,v_matched,v_rows
  from checked;

  return jsonb_build_object(
    'contract','powerhouse-supabase-migration-readback-v1',
    'expected_count',v_total,
    'matched_count',v_matched,
    'all_matched',v_total>0 and v_total=v_matched,
    'migrations',v_rows,
    'verified_at',clock_timestamp()
  );
end;
$function$;

revoke execute on function public.powerhouse_supabase_migration_readback_v1(jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_supabase_migration_readback_v1(jsonb) to service_role;
