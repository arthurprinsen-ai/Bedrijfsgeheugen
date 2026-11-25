# Runtime backpressure v1

The remaining POWERHOUSE runtime incident was not missing wiring. Supabase was active, but PostgREST/Supavisor degradation was amplified by public request paths that still synchronously touched the database.

Observed in the two-hour incident window:

- 1,224 HTTP 522 responses on `bg_growth_ingest_event`;
- 963 HTTP 522 responses on `cms_content_items`;
- 960 HTTP 500 responses from `portal-state-eu`;
- management SQL itself timed out, proving database transport pressure rather than a single broken function.

Structural change:

- CMS public reads now have a 2.5 second backend budget, a shared 30 second circuit breaker, and a 15 minute stale overlay cache. When Supabase is degraded, the static website remains authoritative and CMS overlay failure is fail-open.
- Growth events are durably queued in Netlify Blobs on the visitor request path. They no longer call Supabase or BG211 synchronously.
- A scheduled drain runs once per minute, processes at most ten queued records, and stops on the first backend failure. This converts unbounded visitor fan-out into bounded database pressure.
- Manual `growth-replay` reuses the same drain engine.

Service-to-service authentication is also removed from the PostgREST failure loop:

- scheduled callers already send `x-powerhouse-token`; receivers no longer re-read that token through the Data API before authorization;
- `supabase/functions/_shared/powerhouse-scheduler-auth.ts` is the single authority;
- its fallback secret lookup uses the IPv4 Supavisor pooler on port 6543 with one connection per isolate and a five-minute warm cache;
- an injected `POWERHOUSE_DAILY_SCHEDULER_TOKEN` can eliminate even that cold lookup;
- only missing/mismatched credentials return HTTP 401; secret lookup infrastructure failures return HTTP 503.

The database and service-auth layer remains fail-closed for critical writes. The change removes retry amplification and the circular PostgREST dependency from authentication; it does not weaken authorization.
