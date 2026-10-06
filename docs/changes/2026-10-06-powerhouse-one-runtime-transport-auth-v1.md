# POWERHOUSE_ONE runtime transport/auth/database recovery v1

## Scope

This recovery contract assumes repository, Netlify, Supabase and service wiring already exist. It addresses the remaining runtime failure domain: Postgres transport saturation/unavailability, PostgREST amplification and service-to-service auth misclassification.

## Canonical transport rules

- GitHub-hosted recovery never depends on the direct `db.<ref>.supabase.co:5432` endpoint because the project direct endpoint is IPv6.
- Trusted database repair uses the established IPv4 Supavisor route.
- Serverless/public read paths use bounded Data API calls, circuit breakers and cache/stale fallback where semantics allow it.
- Critical control-plane writes remain fail-closed.

## Runtime pressure rules

- Interaction/growth telemetry cannot hold a Data API request longer than its bounded budget.
- Public CMS reads have a bounded budget and may serve bounded stale data instead of creating retry amplification.
- Revenue learning projection reads are serialized and bounded; they must never fan out five large PostgREST scans in parallel.
- Social/revenue learning infrastructure failures are classified as availability failures, not application 500s.

## Service-to-service auth rules

A failed Vault/Data API lookup is an infrastructure failure and must return 503. Only a provided credential that differs from a successfully resolved expected credential may return 401.

Scheduler tokens are cached per warm isolate for a bounded period to prevent every scheduler invocation from requiring a `bg_geheim` PostgREST round trip.

## Database recovery authority

For paid projects, the canonical restart path is the Supabase Management API Postgres config endpoint with `restart_database=true`. The repository workflow `.github/workflows/powerhouse-db-restart-once.yml` is the controlled recovery authority and consumes `SUPABASE_ACCESS_TOKEN` only from GitHub Actions secrets.

It is intentionally not an unbounded auto-restart loop. A restart terminates active database workloads and is only valid after independent evidence that:
1. direct/management SQL is unavailable;
2. PostgREST is returning sustained 5xx;
3. load-amplifying application paths have already been bounded.

## Terminal proof

Do not declare `POWERHOUSE_ONE / LIVE_PROVEN` until all of the following are true on the same recovered runtime:
1. Postgres SQL read succeeds;
2. the canonical `public.powerhouse_commercial_heartbeat_v1(now())` completes;
3. the resulting `powerhouse_runtime_events` commercial heartbeat row reads back;
4. the latest `powerhouse-commercial-regression-gate` row reads back healthy;
5. the post-recovery verification window has no unexplained runtime 401/500/503 from the POWERHOUSE service chain.

A restart request or a green CI run alone is never terminal proof.
