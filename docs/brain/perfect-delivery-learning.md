# Perfect Delivery Learning

Every commit, pull request, merge, pipeline, deploy and production promotion is treated as a learning event.

## Contract

1. Before a comparable change, agents read `docs/brain/delivery-failure-lessons.json` and reuse every relevant `PROVEN` prevention rule.
2. A known delivery failure may not be rediscovered from scratch. Missing proven prevention is preflight-blocking.
3. A new failure is first recorded as `OBSERVED`; it may become `PROVEN` only after root cause, successful fix and prevention rule are known.
4. Failure fingerprints normalize volatile identifiers so repeated classes deduplicate.
5. Commit, PR, merge and pipeline failures are material Brain outcomes and require BG168/BG167 writeback.
6. The fastest path is targeted preflight first, parallel lane checks second, one integrated full gate last.
7. Exact SHA identity remains mandatory from candidate through Netlify production verification.
8. Before the final integrated gate, refresh against current `main`; a stale overlapping base is a merge failure, not a reason to continue on an obsolete branch.

## Failure record

Minimum fields: stage, component, normalized reason, fingerprint, evidence reference, head SHA, root cause, failed attempts, successful fix, prevention rule, status, cost and lead-time evidence when available.

## Learning states

- `OBSERVED`: failure evidence exists; root cause is unresolved.
- `PROVEN`: root cause, successful fix and prevention rule are verified.
- `RETIRED`: a prevention rule is no longer applicable because the underlying route or component no longer exists.

Only `PROVEN` lessons are allowed to automatically block preflight. This prevents guesses from becoming permanent rules.

## Speed invariant

The next comparable change should require less diagnosis than the previous one. Repeated fingerprints without reuse of the proven prevention rule are a Brain regression.
