-- powerhouse-live-system-map-v1
-- Read-only technical inventory for the existing canonical System Map.
create or replace function public.powerhouse_system_map_inventory_v1()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, cron
as $$
  select jsonb_build_object(
    'observed_at', now(),
    'tables', coalesce((
      select jsonb_agg(t.table_name order by t.table_name)
      from information_schema.tables t
      where t.table_schema='public'
    ), '[]'::jsonb),
    'views', coalesce((
      select jsonb_agg(v.table_name order by v.table_name)
      from information_schema.views v
      where v.table_schema='public'
    ), '[]'::jsonb),
    'functions', coalesce((
      select jsonb_agg(name order by name)
      from (
        select distinct p.proname as name
        from pg_proc p
        join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public'
      ) q
    ), '[]'::jsonb),
    'active_cron_jobs', coalesce((
      select jsonb_agg(j.jobname order by j.jobname)
      from cron.job j
      where j.active=true
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.powerhouse_system_map_inventory_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_system_map_inventory_v1() to service_role;
