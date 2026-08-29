# No Silent Failure / No Lost Obligation — Design

## Status
Approved architectural invariant for Bedrijfsgeheugen / Powerhouse.

## Goal
Every intended material action in Bedrijfsgeheugen becomes an explicit obligation whose real-world outcome is independently verified. A technically successful execution without the intended outcome is RED, never green.

## Highest invariant

> **NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

No workflow, agent, scheduled job, publication, deploy, data refresh, lead action, SEO action, content action, monitoring action or future Powerhouse component may silently skip an intended result.

## Problem class
A scenario can return `success` while producing zero candidates, zero writes, no external post, no deploy, no refreshed metric or no downstream action. Runtime success is execution evidence, not outcome evidence. The 2026-08-29 social-publication incident demonstrated this: native publication windows ran successfully, but the planned post remained unpublished because release-state fields prevented it from entering the publisher query.

## Canonical obligation model
Every production-critical obligation carries:

- `obligation_id`: stable, deduplicatable identity;
- `component`: owning subsystem;
- `expected_outcome`: concrete result that must exist;
- `due_at`: deadline in the authoritative timezone;
- `grace_until`: bounded tolerance after the deadline;
- `owner_agent`: one recovery owner;
- `evidence_source`: where completion is proven;
- `verification_rule`: deterministic rule for GREEN;
- `idempotency_key`: prevents duplicate side effects;
- `last_known_good`: safe fallback where applicable;
- `repair_class`: deterministic-safe, governed-agent, or hard-boundary;
- `attempts`: hypotheses/retries, max two identical retries per hypothesis;
- `next_safe_action`: resumable recovery instruction;
- `status`: `EXPECTED`, `ATTEMPTED`, `VERIFIED`, `COMPLETED`, `RED`, or `BLOCKED_HARD_BOUNDARY`.

`COMPLETED` is legal only when the verifier has concrete outcome evidence. A scheduler/run status alone can never satisfy it.

## State machine

1. `EXPECTED` — an outcome is required and has a deadline.
2. `ATTEMPTED` — a worker or workflow attempted the action.
3. `VERIFIED` — independent evidence confirms the intended result exists.
4. `COMPLETED` — verification is persisted in the authoritative state/memory.
5. If `grace_until` passes without verification, status becomes `RED` automatically.
6. `RED` starts or resumes GREEN-UNTIL-DONE recovery.
7. Only `COMPLETED`, `PRODUCTION_GREEN`, `ROLLED_BACK_GREEN`, or a genuine `BLOCKED_HARD_BOUNDARY` can terminate the relevant recovery path.

## Outcome Guardian architecture

### Layer 1 — deterministic sensors
Low-cost sensors compare expected state with actual state. They do not invoke paid AI on healthy paths. Examples:

- calendar says a social post is due, but external platform ID is absent;
- scheduled scenario should have run, but no fresh execution exists;
- build/deploy is expected, but exact SHA/deploy proof is absent;
- data refresh deadline passed, but freshness timestamp did not advance;
- CRM action is due, but no outcome/evidence exists.

A sensor returning zero eligible work while an obligation is due is itself a RED condition.

### Layer 2 — deterministic self-repair
When the cause and fix are mechanically proven and reversible, the Guardian performs the smallest safe correction, retries idempotently and verifies the outcome. It must not weaken QA or security gates.

Example: a social record has substantive QA green (`Rode-draadcheck=Klopt`, channel text ready, valid asset, `Visual QA=Auto-safe`, `Testmodus=false`) but only release-state fields are stale. The Guardian may repair those release-state fields, invoke existing idempotent native publishers, then require external post IDs before declaring recovery.

### Layer 3 — governed agent recovery
If deterministic repair is not safe, the Guardian writes an `ERROR` through BG168/BG166/BG167 and dispatches the obligation to BG156 / the relevant specialist team. The obligation remains RED and automatically resumes until a terminal green state or hard boundary.

### Layer 4 — hard boundary
Only the existing hard autonomous boundaries may stop self-healing: secrets/credentials/permissions, weakened security, destructive/irreversible data, increased paid external resources, or legally/financially binding actions. All other safe work must already be completed before `BLOCKED_HARD_BOUNDARY` is emitted.

## Domain adapters
The obligation contract is universal; verification remains domain-specific.

- **Social/content:** calendar/date/slot is expectation; LinkedIn/Instagram native IDs plus status are outcome evidence. BG184 is the first reference adapter.
- **SEO/blog:** publication queue/date is expectation; public URL plus verifier/smoke is evidence.
- **GitHub/Netlify:** green candidate SHA is expectation; exact production SHA/deploy plus smoke/protected metrics is evidence. BG169 remains production authority.
- **Make runtime:** schedule/trigger contract is expectation; bounded execution recency and required outputs are evidence. BG165 handles continuity; a global sentinel adds missed-run/missed-output detection.
- **Data/metrics:** freshness SLA is expectation; source-backed timestamp/row/metric update is evidence.
- **CRM/sales:** committed follow-up/action is expectation; logged channel outcome is evidence, subject to contact-pressure and legal constraints.
- **Website/product:** deployed change/experiment is expectation; exact artifact plus runtime/protected metric evidence is required.

Future adapters register the same canonical obligation fields rather than inventing separate success semantics.

## Social reference implementation — BG184
`BG 184 - Social Outcome Obligation Guardian v1` runs hourly and inspects the central media calendar. It compares due channel outcomes with native external IDs. Ten minutes after a due slot, absence of the required ID is RED.

Safe deterministic recovery is allowed only if substantive QA is already green and there is no explicit rejection/block. Otherwise BG184 logs the missing obligation and dispatches governed recovery. Native BG171/BG179 remain the publication executors and their platform IDs remain the completion evidence.

## Global execution sentinel
A second deterministic sentinel must cover active production-critical Make scenarios. It checks expected schedule/trigger state, last execution recency, invalid/inactive state, and where declared, required outputs. It routes continuity faults to BG165 and unresolved outcome faults to BG156. Healthy scans should be cheap and must not invoke the full AI recovery chain.

This sentinel does not replace domain outcome adapters: a successful Make execution cannot prove a business outcome unless the adapter's verifier says so.

## Shared memory and dedupe
Every material obligation event is written through BG168/BG166 and projected by BG167. Fingerprints are stable and include component + obligation class + failure signature. Known fixes are reused. Open RED obligations retain current hypothesis, retries, last evidence, owner, last-known-good and next safe action so recovery does not depend on chat history.

Required event vocabulary adds `MISSED_OBLIGATION`, `AUTO_REPAIR` and `OUTCOME_VERIFIED` semantics, represented through the existing material `ERROR`, `RECOVERY`, `IMPROVEMENT`, `CONTRACT_CHANGE`, promotion and rollback records.

## Cost and reliability constraints
Healthy monitoring is deterministic and bounded. Paid/AI agents are called only when a RED obligation cannot be repaired safely by deterministic logic. Polling is bounded; no high-frequency full-system sweeps. The Guardian must reduce duplicate work through idempotency and fingerprint coalescing.

## Security and data constraints
The obligation layer cannot bypass approval, security, privacy or data-integrity controls. It may repair stale machine state only when existing deterministic evidence proves the intended state. Explicit rejection/blocking always wins over inferred approval.

## Tests and release gates
Machine-enforced governance must assert:

1. this contract exists and is referenced by the operating/self-healing contract;
2. the highest invariant text remains present;
3. `COMPLETED` requires verification evidence;
4. zero-work/zero-candidate success cannot satisfy an overdue obligation;
5. every critical adapter declares expectation, verifier, idempotency and recovery route;
6. BG184 is registered as the social reference implementation;
7. hard boundaries and retry limits remain unchanged.

A candidate that weakens these conditions is not production-ready.

## Acceptance
The architecture is accepted when:

- the missed 2026-08-29 social obligation is externally verified as recovered;
- BG184 is configured and scheduled, with safe deterministic recovery and governed escalation;
- the universal contract and CI regression gate are in the repository;
- shared learning contains ERROR + RECOVERY + CONTRACT_CHANGE/IMPROVEMENT;
- repo changes pass CI/preview and exact production verification;
- any external resource-limit block is recorded without increasing paid resources.
