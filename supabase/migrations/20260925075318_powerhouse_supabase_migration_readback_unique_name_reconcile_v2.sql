create or replace function public.powerhouse_supabase_migration_readback_v1(p_expected jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_total integer := 0;
  v_matched integer := 0;
  v_ambiguous integer := 0;
  v_rows jsonb := '[]'::jsonb;
begin
  if p_expected is null or jsonb_typeof(p_expected)<>'array' then
    raise exception 'VALIDATION_ERROR';
  end if;

  with expected as (
    select nullif(btrim(x.version),'') as expected_version,
           nullif(btrim(x.name),'') as name
    from jsonb_to_recordset(p_expected) as x(version text,name text)
  ),
  ledger as (
    select sm.version, sm.name
    from supabase_migrations.schema_migrations sm
  ),
  checked as (
    select
      e.expected_version,
      e.name,
      count(l.version) filter (where l.name=e.name) as name_match_count,
      min(l.version) filter (where l.name=e.name) as actual_version,
      bool_or(l.version=e.expected_version and l.name=e.name) as exact_match
    from expected e
    left join ledger l on l.name=e.name
    where e.expected_version is not null and e.name is not null
    group by e.expected_version,e.name
  ),
  resolved as (
    select
      expected_version,
      name,
      actual_version,
      name_match_count,
      (exact_match or name_match_count=1) as matched,
      case
        when exact_match then 'EXACT_VERSION_NAME'
        when name_match_count=1 then 'UNIQUE_NAME_RECONCILED'
        when name_match_count=0 then 'MISSING'
        else 'AMBIGUOUS_NAME'
      end as match_mode
    from checked
  )
  select count(*),
         count(*) filter (where matched),
         count(*) filter (where match_mode='AMBIGUOUS_NAME'),
         coalesce(jsonb_agg(jsonb_build_object(
           'version',expected_version,
           'name',name,
           'actual_version',actual_version,
           'name_match_count',name_match_count,
           'matched',matched,
           'match_mode',match_mode
         ) order by expected_version,name),'[]'::jsonb)
    into v_total,v_matched,v_ambiguous,v_rows
  from resolved;

  return jsonb_build_object(
    'contract','powerhouse-supabase-migration-readback-v2',
    'expected_count',v_total,
    'matched_count',v_matched,
    'ambiguous_count',v_ambiguous,
    'all_matched',v_total>0 and v_total=v_matched and v_ambiguous=0,
    'migrations',v_rows,
    'verified_at',clock_timestamp()
  );
end;
$function$;

revoke execute on function public.powerhouse_supabase_migration_readback_v1(jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_supabase_migration_readback_v1(jsonb) to service_role;
