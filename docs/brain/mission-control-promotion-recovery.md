# Mission Control Promotion Recovery

This runbook records the 2026-08-30 Mission Control cache/promotion regression. The root cause is proven; the repair is intentionally not marked proven while Make organization/team execution is quota-paused.

## Canonical ownership

- BG139 / scenario `7071153`: public Mission Control read API. It should remain cache-first.
- BG186 / scenario `7152183`: Mission Control current-state projection. `SHADOW` is deliberately not usable by ordinary reads; only fresh `ACTIVE` state is a cache hit.
- BG188 / scenario `7152314`: semantic-equivalence guardian and canonical owner of the `eq:<n>:<state>` SHADOW verification marker.
- BG190 / scenario `7152387`: live fallback read service when a valid active cache is unavailable.
- BG191 / scenario `7152400`: sole SHADOW-to-ACTIVE promotion authority. It requires at least 25 equivalent states and owns activate, readback, cache canary, semantic equality verification and rollback.

## Proven regression chain

The original BG139 path built live Mission Control state and then invoked BG188. Execution `2468d5ec8563447d9e652beb7ceab1d4` proves legacy module 8 called scenario `7152314` with `current_payload_json`.

BG188 subsequently ran on approximately the same 7–8 minute cadence as BG139 through the afternoon. This allowed it to compare the current payload with the previous projection and evolve the `eq:<n>:EQUIVALENT` streak.

The cache-first refactor correctly removed three direct Notion reads from BG139 and materially reduced per-request cost/transfer. Example:

- early BG139 execution `2468d5ec8563447d9e652beb7ceab1d4`: 7 operations, 8 credits, 71,386 bytes;
- later BG139 execution `b2ce6b3783914028820d5fb4393fab3b`: 5 operations, 6 credits, 22,412 bytes.

However, the refactor also removed the BG139-to-BG188 handoff. Current BG139 has no BG188 successor module and BG188 execution history stops after the refactor window.

Fallback responsibility moved to BG190. BG190 module 11 now writes BG186 directly using `WRITE_SHADOW` and `semantic_hash=live-fallback-v24`. This conflicts with BG188 ownership because BG188 derives the previous streak only from semantic hashes matching `eq:<n>`; a generic BG190 write can therefore erase the equivalence marker and make the next BG188 comparison start from zero.

BG191's latest verified attempt, execution `5cebb8d52eeb47b0ad30a9c649accdce`, stopped safely at `PRECONDITION_NOT_MET` with streak 21. Its threshold of 25 is correct and must not be weakened.

The resulting feedback loop is:

1. BG139 reads a fresh SHADOW payload and correctly refuses it as a cache hit.
2. BG139 falls back to BG190.
3. BG190 performs live reads and writes generic SHADOW state.
4. BG188 is no longer called from the normal path, and the generic write can replace prior equivalence metadata.
5. The 25-equivalence promotion condition is not reliably reached/retried.
6. BG186 stays SHADOW, so future browser polls keep paying fallback cost.

Canonical superseding fingerprint: `mission-control|cache-first-refactor-dropped-equivalence-handoff|2026-08-30-v3`.

## Repair design

Preserve the cache-first optimization. Do not restore direct Notion reads to BG139.

Preferred repair:

1. After BG190 builds a fresh `LIVE_NOTION` payload, send `current_payload_json` to BG188 instead of letting BG190 own generic equivalence SHADOW metadata.
2. BG188 remains the single owner of semantic comparison and `eq:<n>` streak state.
3. After BG188 successfully writes SHADOW, invoke BG191 exactly once when `promotion_candidate=true`.
4. BG191 keeps its existing 25+ gate, ACTIVATE operation, projection readback, cache-service canary, semantic equality test and BYPASS rollback.
5. Retire BG190's direct generic `WRITE_SHADOW` only after the restored path is runtime verified.

Do not accept SHADOW in BG139 merely to reduce cost. That would bypass the promotion governance that previously prevented false-green active state.

Do not make BG191 periodic. Promotion must be driven by the equivalence-threshold transition, not another polling loop.

## Post-quota verification

Make currently refuses scenario executions because the organization/team is quota-paused. No repair may be called PROVEN until execution eligibility returns.

When Make is executable again:

1. prove organization/team execution eligibility with one bounded cheap canary;
2. capture current BG186 state and equivalence marker;
3. apply the smallest BG190/BG188 successor repair;
4. run repeated controlled equivalent payloads below threshold and prove BG191 is not called;
5. cross the threshold and prove exactly one BG191 attempt occurs;
6. verify BG191 returns ACTIVE only after its existing gates pass;
7. call BG139 and prove direct `CACHE_HIT` without BG190 fallback;
8. intentionally test a failed promotion candidate and prove BYPASS rollback;
9. compare operations, credits and transfer with the pre-fix evidence;
10. promote the open learning from OBSERVED to PROVEN only after these checks pass.

## Durable owners

- Operational obligation: GitHub issue `#741`.
- Machine-readable v1/v2/v3 findings: `docs/brain/open-learning/`.
- Make runtime learning writeback remains deferred until BG166 can execute again.
