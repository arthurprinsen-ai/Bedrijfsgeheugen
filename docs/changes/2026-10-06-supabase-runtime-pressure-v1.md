# Supabase runtime pressure recovery v1

## Incident

The timeout pattern was not one defect. GitHub direct database transport is IPv6-only by default, while the production incident itself was a database-pressure cascade: clustered pg_cron starts exhausted connection startup/checkout capacity, Supavisor timed out, and PostgREST could not reload its schema cache within the authenticator timeout. Noncritical interaction telemetry then amplified the outage with a high-volume stream of REST inserts.

## Structural changes

- Keep trusted GitHub migration repair on the canonical Supavisor **session** endpoint in eu-central-1 on port 5432. The direct `db.<project>.supabase.co` URL is accepted only as secret input to the OIDC bridge and is never returned to GitHub.
- Stagger the existing 5/10/15-minute, hourly, and 06:20 daily cron fan-out. No business capability is removed; only start offsets change.
- Resolve cron jobs by stable `jobname`, not environment-specific job IDs.
- Scheduler replay alters canonical jobs that exist in the target environment; preview branches may omit production-only jobs. Production completeness is checked separately by strict readback.
- Canonicalize the live `bg-interactie` source in the repository.
- Treat `bg-interactie` as noncritical telemetry: 2.5s Data API budget, 30s circuit breaker, HTTP 202 on degraded storage rather than 5xx retry amplification.

## Production readback

After the scheduler spread, the previously failing 1-minute watchdog and reconciliation workers completed successfully in roughly 0.03–0.09 seconds. PostgREST reconnected to PostgreSQL and successfully reloaded its schema cache. The earlier 522/Supavisor timeout storm did not continue after the recovery window.

This change does not weaken provider/publication truth gates. Critical content/publication writes remain fail-closed; only disposable interaction telemetry is fail-open.


## Runtime event state contract

Once connection pressure was removed, the commercial heartbeat exposed a second defect that had been hidden by startup timeouts: three writers emitted `degraded` into `powerhouse_runtime_events.state`, while the table contract allows only `observed/decided/actioned/closed/ignored/error`. Production migration `20261006090209_normalize_runtime_event_degraded_state_v1` maps the degraded lifecycle outcome to `error`; degradation detail remains represented by data quality, confidence and evidence.
