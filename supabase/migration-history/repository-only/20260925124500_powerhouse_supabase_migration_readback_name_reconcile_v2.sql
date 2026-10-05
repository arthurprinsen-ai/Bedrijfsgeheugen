-- Reconcile Supabase-applied migration identity with canonical Git identity.
-- Exact version+name remains authoritative. A unique applied migration with the
-- same stable name is accepted when Supabase assigned a different timestamp
-- during controlled production application. Ambiguous duplicate names fail closed.

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
    select nullif(btrim(x.version),'') as expected_version,
           nullif(btrim(x.name),'') as name
    from jsonb_to_recordset(p_expected) as x(version text,name text)
  ),
  candidates as (
    select
      e.expected_version,
      e.name,
      sm.version as applied_version,
      count(sm.version) over (partition by e.expected_version,e.name) as same_name_count,
      bool_or(sm.version=e.expected_version) over (partition by e.expected_version,e.name) as exact_present
    from expected e
    left join supabase_migrations.schema_migrations sm
      on sm.name=e.name
    where e.expected_version is not null and e.name is not null
  ),
  resolved as (
    select distinct on (expected_version,name)
      expected_version,
      name,
      case
        when exact_present then expected_version
        when same_name_count=1 then applied_version
        else null
      end as applied_version,
      case
        when exact_present then 'EXACT_VERSION_AND_NAME'
        when same_name_count=1 and applied_version is not null then 'UNIQUE_NAME_RECONCILED'
        when same_name_count>1 then 'AMBIGUOUS_NAME'
        else 'NOT_FOUND'
      end as match_mode,
      case
        when exact_present then true
        when same_name_count=1 and applied_version is not null then true
        else false
      end as matched
    from candidates
    order by expected_version,name,
      case when applied_version=expected_version then 0 else 1 end,
      applied_version
  )
  select count(*),
         count(*) filter (where matched),
         coalesce(jsonb_agg(
           jsonb_build_object(
             'version',expected_version,
             'expected_version',expected_version,
             'applied_version',applied_version,
             'name',name,
             'matched',matched,
             'match_mode',match_mode
           )
           order by expected_version,name
         ),'[]'::jsonb)
    into v_total,v_matched,v_rows
  from resolved;

  return jsonb_build_object(
    'contract','powerhouse-supabase-migration-readback-v2',
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
