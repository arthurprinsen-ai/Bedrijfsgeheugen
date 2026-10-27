# Bounded browser verification without weakening access control

## Evidence
- PR #4228 merged and Netlify production ready on exact main `ee82f942dea7e74a273627a59ce84a6efec547bd`, deploy `6ac884214a13c30008fe18bf`.
- Exact-head PR preview run `37891722168` passed 14 tests and skipped 1, but failed one production DOM parity assertion on HTTP 403 from `/klantportaal?klant=demoAI`. A separate mobile test of the identical public demo URL passed. A transient provider response is possible, not independently proven.
- Canonical production shell readback `37891725830` failed four HTTP 403 requests across public English routes on high-concurrency desktop/tablet sweeps. Existing request retries did not resolve those observations.

## Changes
- Keep the same authorized demo URL and all 24 capability paths, using at most three attempts for explicitly retryable statuses. Persistent 403 still fails the test.
- Keep the entire sitemap-derived route and three-viewport coverage. Reduce only production parallel traffic from four route workers / two viewport batches to two / one, respectively, retaining the hard CI timeout and fail-closed errors.
- Add a native Netlify deploy heartbeat to ensure exact-head branch and current main are published for verification. No live authorization logic, trust boundaries, customer data, redirects, secrets or agents are changed.

## Closure gates
PR merge is not live proof. Require exact-head tests, immutable Netlify release, passing preview and production browser readback. Parent #4215 remains open for real authenticated two-tenant write to ONE BRAIN, roadmap effects and official CSRD/ESRS legal applicability evidence.
