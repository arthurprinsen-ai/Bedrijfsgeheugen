# Runtime cron pressure relief v1

Supabase runtime recovery exposed a database-side scheduling bottleneck after the transport/auth fixes were already deployed.

Observed production evidence:
- pg_cron emitted repeated `job startup timeout` events;
- canonical commercial heartbeat job 154 was among the timed-out jobs;
- PostgREST schema-cache queries hit statement timeout;
- Management SQL was intermittently timing out;
- two independent runtime maintenance owners both ran every minute.

Structural correction:
- introduce `powerhouse_runtime_maintenance_tick_v1`;
- use a transaction advisory lock to prevent overlapping maintenance ticks;
- keep execution-resilience watchdog cadence at every minute, preserving the 120-second resilience SLA;
- run reconciliation in the same database session;
- skip reconciliation on minutes divisible by five, reserving those slots for the canonical commercial heartbeat;
- retire the two previous every-minute cron owners and replace them with one maintenance owner.

The commercial heartbeat function and its five-minute schedule are not changed.


## Migration identity closure

Production had already applied the heartbeat-aware maintenance migration as `20261007060126_powerhouse_runtime_cron_pressure_relief_v1`. The first repository writeback used the local alias `20261007055200_...`, so the Supabase GitHub integration correctly failed with `Remote migration versions not found in local migrations directory` before replaying DDL.

The repository now uses the exact production identity `20261007060126`, removes the `055200` alias, and updates `supabase/migration-history.lock.json` to the observed 593-entry production ledger. No production DDL is replayed by this identity repair.
