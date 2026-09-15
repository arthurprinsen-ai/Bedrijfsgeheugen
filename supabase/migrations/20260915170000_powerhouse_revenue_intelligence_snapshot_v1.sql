create table if not exists public.powerhouse_revenue_command_center_snapshot_v1 as
select v.*, now()::timestamptz as refreshed_at
from public.powerhouse_revenue_command_center_v2 v
with no data;

create index if not exists powerhouse_revenue_command_center_snapshot_rank_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (revenue_rank);
create index if not exists powerhouse_revenue_command_center_snapshot_opportunity_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (opportunity_key);
create index if not exists powerhouse_revenue_command_center_snapshot_person_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (person_key);
create index if not exists powerhouse_revenue_command_center_snapshot_company_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (company_key);
create index if not exists powerhouse_revenue_command_center_snapshot_research_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (research_reason);
create index if not exists powerhouse_revenue_command_center_snapshot_refreshed_idx
  on public.powerhouse_revenue_command_center_snapshot_v1 (refreshed_at desc);

alter table public.powerhouse_revenue_command_center_snapshot_v1 enable row level security;
revoke all on table public.powerhouse_revenue_command_center_snapshot_v1 from anon, authenticated;
grant select on table public.powerhouse_revenue_command_center_snapshot_v1 to service_role;

create or replace function public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
returns table(row_count bigint, refreshed_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_refreshed_at timestamptz := clock_timestamp();
  v_row_count bigint := 0;
begin
  perform set_config('statement_timeout','120000',true);

  truncate table public.powerhouse_revenue_command_center_snapshot_v1;

  insert into public.powerhouse_revenue_command_center_snapshot_v1
  select v.*, v_refreshed_at
  from public.powerhouse_revenue_command_center_v2 v;

  get diagnostics v_row_count = row_count;
  return query select v_row_count, v_refreshed_at;
end;
$$;

revoke all on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_intelligence_snapshot_v1() to service_role;

-- Rebuildable operational projection only. Canonical truth remains the underlying Powerhouse tables/views.
do $$
declare
  j record;
begin
  for j in select jobid from cron.job where jobname='powerhouse-revenue-intelligence-snapshot-15m'
  loop
    perform cron.unschedule(j.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-revenue-intelligence-snapshot-15m',
    '*/15 * * * *',
    $cron$select public.powerhouse_refresh_revenue_intelligence_snapshot_v1();$cron$
  );
end;
$$;
