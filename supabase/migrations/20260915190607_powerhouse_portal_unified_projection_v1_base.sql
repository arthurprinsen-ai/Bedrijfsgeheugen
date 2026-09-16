create or replace view public.powerhouse_portal_resource_summary_v1
with (security_invoker=true)
as
select tenant_id,
       count(*) as observations,
       coalesce(sum(energy_kwh),0) as energy_kwh,
       coalesce(sum(co2e_kg),0) as co2e_kg,
       coalesce(sum(water_liters),0) as water_liters,
       count(*) filter (where calculation_status='unknown_factor') as unknown_factor_observations,
       max(occurred_at) as latest_observed_at
from public.powerhouse_resource_impact_v1
group by tenant_id;

-- Replay hardening: production is already browser-role closed by the paired privileges migration.
-- Keep the canonical historical version safe when replayed from a fresh database as well.
revoke all on public.powerhouse_portal_resource_summary_v1 from public, anon, authenticated;
grant select on public.powerhouse_portal_resource_summary_v1 to service_role;
