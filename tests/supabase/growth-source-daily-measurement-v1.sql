-- Run against a disposable Supabase Preview AFTER the migration.
-- Read-only integration and access assertions, no provider state fabricated.
do $verify$
declare v_count integer;
begin
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relname='powerhouse_growth_source_daily_v1' and c.relrowsecurity) then
     raise exception 'GROWTH_DAILY_RLS_MISSING';
  end if;
  if has_table_privilege('anon','public.powerhouse_growth_source_daily_v1','SELECT')
     or has_table_privilege('authenticated','public.powerhouse_growth_source_daily_v1','SELECT') then
     raise exception 'GROWTH_DAILY_PUBLIC_READ_FORBIDDEN';
  end if;
  if has_function_privilege('anon','public.powerhouse_capture_growth_source_daily_v1(date)','EXECUTE')
     or has_function_privilege('authenticated','public.powerhouse_capture_growth_source_daily_v1(date)','EXECUTE') then
     raise exception 'GROWTH_DAILY_PUBLIC_EXECUTE_FORBIDDEN';
  end if;
  select count(*) into v_count from cron.job where jobname='powerhouse-growth-source-health-6h-v1' and active=true;
  if v_count<>1 then raise exception 'GROWTH_DAILY_CRON_NOT_UNIQUE'; end if;
  if not exists(select 1 from pg_proc where proname='powerhouse_capture_growth_source_daily_v1'
    and pg_get_functiondef(oid) like '%NO_REVENUE_VERIFIED%') then
    raise exception 'GROWTH_DAILY_REVENUE_MISSING_TRUTH';
  end if;
end $verify$;
