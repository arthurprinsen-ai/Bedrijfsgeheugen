# P0 #4215 — durable customer BusinessInput acknowledgement

## Observed root cause
The existing Browser V2 `savePortalBusinessInput` accepted every HTTP 2xx response. The existing Netlify handler could respond 200 even when `store.putCanonical` returned `stored:false` or `stale:true`. This made it possible to advance `/api/portal-state` after a failed or stale canonical projection, presenting an unconfirmed input as saved.

## Scoped recovery
- Browser requires explicit `stored:true`, non-stale, accepted Brain authority, Powerhouse feed, organism impact and nonempty immutable source/record identifiers before proceeding to the secondary portal projection.
- Server returns HTTP 409 `CANONICAL_PROJECTION_STALE` or HTTP 503 `CANONICAL_PROJECTION_NOT_STORED` rather than success if canonical projection cannot be confirmed.
- Keeps all upstream Brain records and existing idempotent writer; no new stores, queues, credentials or bypass.
- Regression exercises 200 + false, stale, omitted feed acknowledgement, incomplete lineage and server projection refusals.

## Verification
`node --test portal-v2/tests/portal-business-input-persistence.test.mjs tests/portal-business-input-powerhouse-feed.test.mjs`. Required + CodeQL and protected exact-main Netlify production readback after merge remain independent gates.

## Deliberate limitations
This corrects **false saved status**, not proof that any real customer's input has been stored or propagated. A durable append is distinct from downstream Brain consumer ACK, model recalculation, cards, roadmap and legal decision. P0 #4215 remains open until genuine separate signed-in customers A/B, complete rendered field matrix, >750KB split/ACK, 200 fields / 1000 observations, tenant isolation and CSRD/ESRS applicability evidence exist.
