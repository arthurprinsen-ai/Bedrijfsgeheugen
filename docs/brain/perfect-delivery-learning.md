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
9. Every `PROVEN` lesson must map to an active rule in `config/delivery-prevention-rules.json`; otherwise preflight fails closed.

## Failure record

Minimum fields: stage, component, normalized reason, fingerprint, evidence reference, head SHA, root cause, failed attempts, successful fix, prevention rule, status, cost and lead-time evidence when available.

## Learning states

- `OBSERVED`: failure evidence exists; root cause is unresolved.
- `PROVEN`: root cause, successful fix and prevention rule are verified.
- `RETIRED`: a prevention rule is no longer applicable because the underlying route or component no longer exists.

Only `PROVEN` lessons are allowed to automatically block preflight. This prevents guesses from becoming permanent rules.

## Speed invariant

The next comparable change should require less diagnosis than the previous one. Repeated fingerprints without reuse of the proven prevention rule are a Brain regression.

## Learning-plane runtime contract

The shared Brain learning plane is split by responsibility. Do not collapse reads and rebuilds back into one hot path.

- **BG166 (`7135971`)** is the append-only learning writer and canonical fingerprint-deduplication owner. New material learning may persist without forcing another projection rebuild. BG167 refresh reservations are cost-coalesced to at most one successful refresh window per 60 minutes during cost-recovery mode.
- **BG167 (`7136045`)** is the expensive current-state projection refresh service. Module 2 may run only when the request contains both `agent_id=BG166` and `mode=refresh`. A noncanonical direct call must stop after the trigger and consume zero downstream operations/credits.
- **BG168 (`7136176`)** classifies and routes material agent outcomes to BG166. Learning failures remain fail-open relative to the primary agent result.
- **BG197 (`7165044`)** is the explicit low-cost shared-context cache reader. Ordinary context reads use the dedicated one-record cache and must not execute Notion reads, projection builders or cache writes.
- **BG169 (`7137190`)** remains production authority and is not part of ordinary context-read traffic.

### Verified evidence (2026-08-30)

- BG197 canary `2952571768e64dcbb4441404db4d46ce`: current `TEAM-CONTRACT-v2.1`, 2 operations / 3 credits, cache-read path only.
- BG167 noncanonical canary `fbed6233cb464df385775d674a79b4b7`: 0 operations / 0 credits.
- BG167 canonical refresh `5ed4f06289d94036ba89ac60d270a14e`: 6 operations / 11 credits, current projection returned.
- BG168 dispatch `544c89b5735e46f0b439a45a534ad014`: 2 operations / 3 credits; corresponding BG166 run `6fb152e2f811438f8d023c84a3b6298c` persisted learning and returned `COALESCED_REFRESH`.
- BG150 sentinel run `5e42cec9ba0d436aa471e0beb2a86e32`: 17 expected, 17 found, 17 healthy, 0 degraded, coverage `COMPLETE`, including BG197.
- BG167 projection `6d2cdc8c5ca440819ae73a24a58c21c2` and BG197 readback `86cdc3270780458981c9625e56b718c1` expose BG197 in `control_plane` plus the explicit `learning_plane` contract.

### Retired failure patterns

Do not retry the in-place BG167 `BasicIfElse` / `BasicMerge` read-vs-refresh split variants without new Make platform evidence. Multiple variants saved but failed blueprint initialization before runtime. They were rolled back completely. `saved` or `configured` is not runtime proof.

Do not use a reservation/coalescing gate that can leave the first ordinary reader without context. Coalescing is valid only for the expensive projection refresh obligation, never for correctness of ordinary reads.

Do not reactivate duplicate periodic owners for the same learning/projection obligation. BG166 is the canonical projection-refresh owner; ordinary readers do not own rebuilds.

### Regression gates

Reject or self-heal when any of the following occurs:

1. A non-BG166 request reaches BG167 module 2.
2. More than one BG167 refresh reservation succeeds inside the current 60-minute cost-recovery window.
3. An ordinary context read performs a Notion query, projection rebuild or cache write.
4. BG197 is missing, inactive, invalid, paused, or absent from the governed runtime registry/control-plane projection.
5. A material duplicate fingerprint creates another durable learning record.
6. A stored blueprint is called green without a successful runtime canary.
7. Visible documentation contradicts the active runtime mapper; treat this as documentation drift and keep it open until safely corrected.

### Known documentation debt

BG166 module 12 currently has a historical visible label referring to a `10s` window while its active mapper and verified runtime contract use a **60-minute cost-recovery window**. Do not change the proven mapper merely to make the label agree. Rename the label only through a safe supported Make configuration mutation path, then verify runtime again.
