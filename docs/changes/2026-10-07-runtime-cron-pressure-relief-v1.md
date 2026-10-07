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
