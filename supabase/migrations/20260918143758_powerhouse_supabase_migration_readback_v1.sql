create or replace function public.powerhouse_supabase_migration_readback_v1(
  p_expected jsonb
)
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
    select e.version,e.name,
           (sm.version is not null) as matched
    from expected e
    left join supabase_migrations.schema_migrations sm
      on sm.version=e.version and sm.name=e.name
    where e.version is not null and e.name is not null
  )
  select count(*),
         count(*) filter (where matched),
         coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'matched',matched) order by version,name),'[]'::jsonb)
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