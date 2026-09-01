-- Canonical runtime SLO projection derived only from genuine persisted RUM.
-- No synthetic/sample-seeding rows are created by this migration.

create unique index if not exists brain_runtime_slo_identity_uq
  on public.brain_runtime_slo (tenant_id, surface, route);

create or replace function public.refresh_brain_runtime_slo_for_metric()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_p95_cached double precision;
  v_p95_interactive double precision;
  v_cached_samples bigint;
  v_interactive_samples bigint;
  v_last_observed_at timestamptz;
begin
  select
    percentile_cont(0.95) within group (order by metric_value_ms::double precision)
      filter (where metric_name = 'cached_ms'),
    percentile_cont(0.95) within group (order by metric_value_ms::double precision)
      filter (where metric_name = 'interactive_ms'),
    count(*) filter (where metric_name = 'cached_ms'),
    count(*) filter (where metric_name = 'interactive_ms'),
    max(observed_at)
  into
    v_p95_cached,
    v_p95_interactive,
    v_cached_samples,
    v_interactive_samples,
    v_last_observed_at
  from public.brain_runtime_metrics
  where tenant_id = new.tenant_id
    and surface = new.surface
    and route = new.route;

  insert into public.brain_runtime_slo (
    tenant_id,
    surface,
    route,
    p95_cached_ms,
    p95_interactive_ms,
    samples,
    last_observed_at
  ) values (
    new.tenant_id,
    new.surface,
    new.route,
    v_p95_cached,
    v_p95_interactive,
    least(v_cached_samples, v_interactive_samples),
    v_last_observed_at
  )
  on conflict (tenant_id, surface, route) do update set
    p95_cached_ms = excluded.p95_cached_ms,
    p95_interactive_ms = excluded.p95_interactive_ms,
    samples = excluded.samples,
    last_observed_at = excluded.last_observed_at;

  return new;
end;
$$;

revoke all on function public.refresh_brain_runtime_slo_for_metric() from public;
revoke all on function public.refresh_brain_runtime_slo_for_metric() from anon;
revoke all on function public.refresh_brain_runtime_slo_for_metric() from authenticated;

drop trigger if exists brain_runtime_metrics_refresh_slo on public.brain_runtime_metrics;
create trigger brain_runtime_metrics_refresh_slo
after insert on public.brain_runtime_metrics
for each row execute function public.refresh_brain_runtime_slo_for_metric();

-- Backfill the projection only from rows that already exist. With zero real RUM rows this is a no-op.
insert into public.brain_runtime_slo (
  tenant_id,
  surface,
  route,
  p95_cached_ms,
  p95_interactive_ms,
  samples,
  last_observed_at
)
select
  tenant_id,
  surface,
  route,
  percentile_cont(0.95) within group (order by metric_value_ms::double precision)
    filter (where metric_name = 'cached_ms'),
  percentile_cont(0.95) within group (order by metric_value_ms::double precision)
    filter (where metric_name = 'interactive_ms'),
  least(
    count(*) filter (where metric_name = 'cached_ms'),
    count(*) filter (where metric_name = 'interactive_ms')
  ),
  max(observed_at)
from public.brain_runtime_metrics
group by tenant_id, surface, route
on conflict (tenant_id, surface, route) do update set
  p95_cached_ms = excluded.p95_cached_ms,
  p95_interactive_ms = excluded.p95_interactive_ms,
  samples = excluded.samples,
  last_observed_at = excluded.last_observed_at;
