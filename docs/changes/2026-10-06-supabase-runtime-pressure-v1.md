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

## Final structural closure

The remaining pressure was not network transport. `powerhouse_research_queue_v1` forced the buying-window intelligence graph to be evaluated again through freshness/contradiction logic, making NBA v3+ exceed the database timeout. Production migration `20261006095838_cache_research_freshness_and_split_one_brain_v1` introduced a small server-only freshness/contradiction cache and rewired the research queue to it. The same migration split the composite one-brain cron into separately staggered one-brain, LinkedIn OAuth, regression-stage and SEO jobs.

The production migration lineage from `20261006085416` through `20261006095958` is mirrored into the repository so hosted preview/fresh replay use the same version sequence. Replay mirrors preserve the production statements and add explicit EXECUTE hardening where current production exposes the function only to `postgres/service_role`.

## Final production readback

- research queue returned 157 rows without timeout;
- NBA v3, v4 and v5 each returned 581 rows without connection timeout;
- revenue snapshot materialized 581 rows at 10:01:52 UTC;
- the scheduled revenue snapshot then succeeded at 10:07 UTC in about 52 seconds;
- one-brain reconciliation succeeded at 09:43 UTC in about 35 seconds;
- freshness cache succeeded at 10:06 UTC in about 4 seconds;
- one-minute execution watchdog and reconciliation worker succeeded at 10:10 UTC in milliseconds;
- the 10:00–10:15 UTC error readback contained no real PostgREST 522, Supavisor checkout timeout, cron startup timeout or schema-cache failure.

The remaining commercial heartbeat failure is `OUTBOUND_COPY_QUALITY_NOT_PROVEN`. That is an intentional content-quality fail-closed gate and is not a network/database availability defect.

