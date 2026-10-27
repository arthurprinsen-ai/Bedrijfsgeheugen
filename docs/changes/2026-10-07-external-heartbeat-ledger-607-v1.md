# External heartbeat ledger 607 reconciliation

Production advanced to migration `20261007091140_restore_single_staggered_commercial_heartbeat_owner` during an emergency heartbeat recovery. That temporary restore proved the heartbeat path, but the canonical architecture had already moved scheduler ownership to the authenticated Netlify → Supabase Edge runner.

This recovery restores repository/provider migration identity without preserving the emergency scheduler topology.

- Remote migration 607 is represented locally with the exact production version and name.
- Replay is convergent: any legacy `powerhouse-one-commercial-heartbeat-v1` pg_cron owner is unscheduled.
- The external Edge runner remains the canonical owner and carries the transaction-local `powerhouse.external_heartbeat_owner=netlify-supabase-edge-v1` marker.
- Durable heartbeat readback remains required before terminal green.
- No direct mutation of `supabase_migrations.schema_migrations` is performed.

Terminal proof remains: 607/607 migration parity → canonical Supabase main integration promotes the current Edge runner → legacy pg_cron retired in production → scheduled external heartbeat returns 200 and writes VERIFIED durable receipt → fresh application 401/500/503/522 readback.
