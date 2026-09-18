create or replace function public.powerhouse_verify_migration_identity_v1(
  p_version text,
  p_name text
)
returns table(version text,name text,verified boolean)
language sql
security definer
set search_path to 'public','pg_catalog','supabase_migrations'
as $function$
  select
    sm.version::text,
    sm.name::text,
    true
  from supabase_migrations.schema_migrations sm
  where sm.version::text = p_version
    and sm.name::text = p_name
  limit 1;
$function$;

revoke execute on function public.powerhouse_verify_migration_identity_v1(text,text) from public, anon, authenticated;
grant execute on function public.powerhouse_verify_migration_identity_v1(text,text) to service_role;

comment on function public.powerhouse_verify_migration_identity_v1(text,text) is
  'Compatibility verifier retained as production-ledger history. Canonical control-plane authority is powerhouse_supabase_migration_readback_v1(jsonb).';
