# POWERHOUSE development ledger — Portal BusinessInput durability acknowledgement

- **Parent:** P0 #4215.
- **Candidate:** fix/p0-4215-business-input-durable-ack-20261009; protected PR release pending.
- **Starting main:** 7709d119ecf15d01986810f5ccbec0f341d1dd06, published Netlify 6ac89eb228944b0008e44408 READY at exact SHA.
- **Observed production data (read-only, 2026-10-09):** Supabase auth.users = 1, portal_state_layers distinct tenant_id = 1, brain_records BusinessInput = 0, CurrentState = 577, undelivered brain_outbox = 0. These facts do **not** establish independent two-tenant customer sessions or consumer ACK.
- **Root cause:** HTTP 200 with canonical `stored:false` was treated as saved by browser; server also returned HTTP 200 for stale or unpersisted projection.
- **Recovery:** enforce positive canonical and immutable Brain lineage ACK in browser and non-2xx server status on projection refusal; preserve fail-closed identity, tenant and upstream idempotent authority.
- **Scope:** portal-v2/business-input-store.js, portal-v2/tests/portal-business-input-persistence.test.mjs, platform/api/portal-business-input-handler.mjs, tests/portal-business-input-powerhouse-feed.test.mjs.
- **Verification:** targeted regression, protected Required/CodeQL, merge and exact-main Netlify production readback. Parent #4215 remains open for real authorized A/B, exhaustive dynamic field-level matrix, consumer durability/ACK under >750KB, and individual CSRD/ESRS national/legal review. No fabricated customer traffic or fake green status.
