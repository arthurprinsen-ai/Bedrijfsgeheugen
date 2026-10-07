# Heartbeat attribution critical-path decoupling

## Incident

The external commercial heartbeat transport is live through Netlify → Supabase Edge → IPv4 Supavisor, but production executions still failed after database checkout. The repeated blocking stack was:

`powerhouse_commercial_heartbeat_v1` → `powerhouse_one_commercial_decision_loop_v1` → `powerhouse_revenue_event_spine_cycle_v1` → `powerhouse_refresh_revenue_attribution_snapshot_v1`.

The attribution refresh materializes a 180-day multi-touch view into a temp table, upserts the complete snapshot and removes stale rows. Production repeatedly returned statement/lock timeout before a durable heartbeat receipt could be written.

## Structural correction

- `powerhouse_revenue_event_spine_cycle_v1` keeps the bounded identity batch at 25.
- Heartbeat reads `powerhouse_revenue_event_spine_health_v1` and the existing durable attribution snapshot; it does not rebuild attribution.
- The existing `powerhouse-runtime-scheduler-mux-v1` remains the only attribution refresh owner at minutes 7/22/37/52.
- Attribution balance, missing-touch gaps, refresh timestamp and snapshot age remain explicit heartbeat evidence.
- The legacy pg_cron heartbeat is not retired by this change. Retirement remains gated on one externally executed heartbeat with durable VERIFIED readback.

No auth weakening, no provider bypass and no business-data deletion are introduced.
