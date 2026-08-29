# Outcome Obligations — Whole-Brain Reliability Contract

## Highest invariant

> **NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

This contract applies to every current and future production-critical Bedrijfsgeheugen / Powerhouse workflow, agent, scheduled task, publication, data refresh, deploy, content action, SEO action, sales action and monitoring action.

A successful process execution is not proof of a successful outcome. `success`, HTTP 2xx, a completed Make run, a green build, or zero returned candidates may be execution evidence only. If an expected real-world result is absent after its due time and grace period, the obligation is **RED**.

## Canonical obligation
Every obligation must expose enough state for another agent to resume recovery without chat history:

- `obligation_id` — stable dedupe identity;
- `component` — authoritative subsystem;
- `expected_outcome` — concrete result required;
- `due_at` — deadline;
- `grace_until` — bounded tolerance;
- `owner_agent` — single recovery owner;
- `evidence_source` — authoritative proof location;
- `verification_rule` — deterministic condition for outcome verification;
- `idempotency_key` — prevents duplicate side effects;
- `repair_class` — deterministic-safe, governed-agent, or hard-boundary;
- `attempts` — hypotheses and retry counts;
- `last_known_good` — rollback/fallback when relevant;
- `next_safe_action` — resumable recovery instruction;
- `status` — `EXPECTED`, `ATTEMPTED`, `VERIFIED`, `COMPLETED`, `RED`, or `BLOCKED_HARD_BOUNDARY`.

## State semantics
- `EXPECTED`: the result is required but is not yet due or not yet attempted.
- `ATTEMPTED`: a worker or workflow tried to satisfy it; this is not success.
- `VERIFIED`: independent evidence proves the expected result exists.
- `COMPLETED`: verification evidence is persisted in canonical state/shared memory. **COMPLETED always requires verification**; a run status alone is insufficient.
- `RED`: the outcome is overdue, missing, invalid, regressed, or cannot be verified.
- `BLOCKED_HARD_BOUNDARY`: only legal when the next necessary step crosses an existing hard autonomous boundary and all safe work has been exhausted.

A **zero-candidate**, **zero-work**, or **zero-output** successful run is RED whenever an obligation is already due and unverified. It may be healthy only when no obligation is due.

## Recovery order
1. Detect obligation/state mismatch deterministically.
2. Dedupe by fingerprint and read BG167 current context plus BG166 history.
3. Protect last-known-good where applicable.
4. Reuse a known fix if environment/state matches.
5. Apply deterministic idempotent repair when substantive gates are already proven and the repair does not weaken controls.
6. Re-run the existing executor, then independently verify the actual outcome.
7. If deterministic repair is unsafe or insufficient, write `ERROR` through BG168 → BG166/BG167 and dispatch governed GREEN-UNTIL-DONE recovery through BG156 or the smallest capable specialist team.
8. Max two identical retries per hypothesis; then change hypothesis/fix/fallback.
9. Remain RED across future runs until verified green or a genuine hard boundary.
10. Write `RECOVERY`, `IMPROVEMENT`, `CONTRACT_CHANGE`, promotion/rollback and reusable prevention when material.

## Control-plane responsibilities
- **BG184** — first domain reference implementation: social outcome obligations.
- **BG165** — continuity repair for unexpectedly inactive/invalid Make runtime state.
- **BG156** — governed GREEN-UNTIL-DONE recovery for unresolved RED obligations.
- **BG168** — material outcome/learning router.
- **BG166** — append-only error and learning history.
- **BG167** — current shared team context projection.
- **BG169** — exact-SHA production authority for repository/deployment releases.

These components are complementary. Runtime continuity never substitutes for business-outcome verification.

## Deterministic-first cost rule
Healthy-path monitoring must be deterministic, bounded and cheap. Do not run a full paid AI agent chain simply to prove that nothing is wrong. Invoke governed/AI recovery only when a deterministic sensor has produced a material RED obligation that cannot be safely repaired mechanically.

## Idempotency
Every side-effecting recovery route must use existing channel/object IDs or another `idempotency_key` before retrying. Self-healing must never produce duplicate posts, duplicate messages, duplicate writes, duplicate deploys or duplicate legally/financially meaningful actions.

## Social reference adapter
The central media calendar creates channel obligations. A due LinkedIn personal post is verified by `Post ID LinkedIn`; a due LinkedIn company post by `Bedrijfspaginapost`; a due Instagram post by `Post ID Instagram`, together with placed/verified status where available.

BG184 checks these outcomes hourly and uses a bounded grace period. If a due record has substantive automated QA green but only stale release-state fields, BG184 may repair those release-state fields and call existing idempotent native executors BG171/BG179. Explicit rejection or blocking cannot be overridden. If substantive QA is not green, BG184 writes RED and escalates to BG156.

## Global Make execution obligation sentinel
A global deterministic sentinel complements domain adapters by checking production-critical Make scenarios for expected schedule/trigger state, invalid/inactive state, last execution recency and declared required output where available. Continuity faults route to BG165; unresolved outcome faults route to BG156 and BG168.

The global sentinel is not allowed to infer that a business outcome happened merely because a Make run succeeded. Domain adapters remain the verification authority for actual business results.

## Hard boundaries
The obligation layer preserves the existing autonomous boundaries. It may not:
- change secrets, credentials or permissions;
- weaken security controls;
- perform destructive or irreversible data mutations;
- increase paid external resources;
- perform legally or financially binding actions.

A platform plan/usage limit that can only be solved by purchasing more resources is therefore a valid hard boundary for that external runtime step. Safe repository, diagnosis, documentation, test and recovery work must continue around it.

## Production and release outcomes
Repository/deploy obligations follow the same rule: a green candidate is not a completed production outcome until BG169 can verify exact production SHA/deploy, smoke/regression and protected metrics. Production regression requires immediate last-known-good rollback and continued repair.

## Future-workflow admission rule
A new production-critical workflow is not production-ready until it declares:
1. the expected outcome;
2. due/deadline semantics;
3. independent evidence source and `verification_rule`;
4. `idempotency_key` or equivalent duplicate protection;
5. deterministic RED detection including zero-work cases;
6. owner agent and `next_safe_action`;
7. safe deterministic repair where possible;
8. governed GREEN-UNTIL-DONE route otherwise;
9. shared-learning writeback.

If any of these are absent, the workflow itself has an open governance obligation and must not be treated as fully green.
