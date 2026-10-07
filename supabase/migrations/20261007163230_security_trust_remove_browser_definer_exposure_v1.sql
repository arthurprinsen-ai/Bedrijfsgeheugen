do $$
declare
  v_relation text;
begin
  foreach v_relation in array array[
    'powerhouse_sales_machine_decision_context_v1',
    'powerhouse_intelligence_fabric_v1',
    'powerhouse_intelligence_fabric_health_v1',
    'powerhouse_company_signal_resolution_v1',
    'powerhouse_company_signal_people_v1',
    'powerhouse_predictive_commercial_brief_v1',
    'powerhouse_revenue_learning_provenance_v1',
    'powerhouse_commercial_memory_v1'
  ]
  loop
    if exists(
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relname=v_relation
        and c.relkind='v'
    ) then
      execute format('alter view public.%I set (security_invoker = true)',v_relation);
      execute format('revoke all on table public.%I from anon, authenticated',v_relation);
      execute format('grant select on table public.%I to service_role',v_relation);
    end if;
  end loop;

  if to_regclass('public.powerhouse_predictive_commercial_brief_cache_v1') is not null then
    execute 'revoke all on table public.powerhouse_predictive_commercial_brief_cache_v1 from anon, authenticated';
    execute 'grant select on table public.powerhouse_predictive_commercial_brief_cache_v1 to service_role';
  end if;
end $$;
