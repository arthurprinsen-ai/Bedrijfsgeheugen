# Runtime cron deconfliction v1

The remaining POWERHOUSE runtime blocker was database scheduler pressure rather than missing wiring.

Provider evidence showed repeated `pg_cron` **job startup timeout** events. In a 40-minute window, the two every-minute recovery owners each recorded 19 startup timeouts. Multiple 5/10/15-minute jobs also shared exact minute boundaries, while management SQL and PostgREST metadata queries intermittently timed out.

This change preserves canonical owners and materially preserves cadence while removing deterministic collisions:

- `powerhouse-reconciliation-worker-v2`: `* * * * *` → `59 seconds`;
- `powerhouse-data-spine-watchdog-v1`: `0,10,20,30,40,50` → `4,14,24,34,44,54`;
- `powerhouse-revenue-attribution-snapshot-v1`: `7,22,37,52` → `9,24,39,54`.

The execution-resilience watchdog remains every minute, the commercial heartbeat remains every five minutes, and no canonical job is disabled. Migration verification fails closed if any target owner is missing or the resulting schedules do not read back exactly.
