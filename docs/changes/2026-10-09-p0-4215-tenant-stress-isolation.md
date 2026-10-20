# P0 #4215 — tenant isolation + 200-field/1000-observation regression

## Observed gap
The canonical BusinessInput ACK recovery is protected-merged and live. Existing coverage is insufficient to claim the requested 200-field/1000-observation, durable retry and tenant-scoping acceptance. A checked-in executable stress fixture is needed to make future regressions visible.

## Existing-state implementation
- Reuse the existing `createPortalBusinessInputHandler`, `createPortalBusinessInput`, source-observation and organism graph contracts. No parallel datastore, scheduler or processing authority.
- Exactly **1000 distinct source observations** (500 per simulated tenant) carrying **200 customer fields**, producing synthetic, in-memory RawSource, BusinessInput, CurrentState and ImpactAssessment records with complete immutable revision links.
- Force user identity from the test-authenticated tenant context rather than from untrusted client `tenantId` and `userId` input fields. Verify 500 tenant-specific canonical projection commits each, non-empty Brain receipt and 4,000 scoped records, including identical same-content hashes in two tenants with safely separate composite store keys.
- Simulate lost CurrentState provider response after the two prior append calls; verify fail-closed HTTP 502, zero premature projection and idempotent retry without duplicated records.
- Simulate a revoked Identity session: HTTP 401 and zero writes.
- Refuse a client payload >750KB with HTTP 413 and zero writes. This tests *safety only*, not transactional chunking; **large legitimate payload support is still not implemented**.
- Add this regression to the existing mandatory CI preflight with no alternative Brain or customer data.

## Run
`node --test tests/brain-p0-4215-input-stress-isolation-v1.test.mjs`

## Scope of proof (do not misrepresent)
All test subjects and memory stores are isolated deterministic test doubles. Passing this CI gate **does not prove** two real authenticated customers, real database throughput/locking, concurrent write correctness, provider outage retry, stable consumer ACK or legally defensible customer-specific CSRD/ESRS applicability. The production P0 #4215 must remain open for those independent real-provider acceptance gates and exhaustive DOM/dynamic source inventory.
