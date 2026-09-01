-- Canonical runtime SLO projection derived only from genuine persisted RUM.
-- Production already exposes brain_runtime_slo as a view; preserve that architecture.
-- No synthetic/sample-seeding rows are created by this migration.

create or replace view public.brain_runtime_slo as
select
  tenant_id,
  surface,
  route,
  percentile_cont(0.95) within group (order by metric_value_ms::double precision)
    filter (where metric_name = 'cached_ms') as p95_cached_ms,
  percentile_cont(0.95) within group (order by metric_value_ms::double precision)
    filter (where metric_name = 'interactive_ms') as p95_interactive_ms,
  least(
    count(*) filter (where metric_name = 'cached_ms'),
    count(*) filter (where metric_name = 'interactive_ms')
  ) as samples,
  max(observed_at) as last_observed_at
from public.brain_runtime_metrics
group by tenant_id, surface, route;
