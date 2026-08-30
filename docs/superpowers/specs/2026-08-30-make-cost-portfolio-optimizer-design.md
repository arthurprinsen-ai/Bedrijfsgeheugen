# Make Cost Portfolio Optimizer Design — 2026-08-30

## Status
Approved architectural design for reducing Make cost across the full Bedrijfsgeheugen/Powerhouse scenario fleet without weakening outcome verification, reliability, security, rollback safety or the BRAIN Continuous CI/CD v2 delivery contract.

## Goal
Drive Make cost toward the lowest safe level by continuously selecting the highest verified waste opportunity across the full scenario fleet, applying only the smallest reversible optimization, measuring before/after cost per verified outcome, and retaining the change only when protected outcomes remain equal or better.

## Existing control plane
This design extends the existing cost control plane rather than creating a parallel optimizer:

- BG159 (`7132648`) is the fleet cost sensor and daily normalized inventory/snapshot collector.
- BG162 (`7135438`) is the adaptive cost/quality governor.
- Agent 14 is the Make Cost Optimizer specialist.
- BG160 (`7134976`) remains the deterministic Class-A repair executor for exact reversible actions.
- BG168 routes material outcomes; BG166 stores immutable learning/errors; BG167 refreshes current shared context.
- BG169 remains the production authority for GitHub-backed changes.

The current Powerhouse Team Memory already identifies the economic cortex as BG159/BG162/PH14/PH16 and requires lower cost without sacrificing correctness.

## Core invariant
The optimizer minimizes **cost per verified outcome**, not raw credits alone.

A cost reduction is accepted only when all applicable protected metrics remain equal or better:

- intended outcome remains independently verified;
- success/error rate does not regress;
- no new MISSED_OBLIGATION is introduced;
- latency does not materially regress unless explicitly accepted by policy;
- security controls are unchanged or stronger;
- no new silent failure path exists;
- rollback remains deterministic;
- shared learning/writeback remains intact.

If a change lowers credits but weakens outcome evidence, reliability or required latency, the change is RED and must be rolled back.

## Portfolio-first selection
BG159 maintains a normalized fleet inventory and daily cost snapshot. The daily optimizer must rank candidates using verified efficiency rather than total historical credits alone.

Each scenario candidate is scored from available evidence including:

- credits consumed in the measurement window;
- successful executions;
- verified business/system outcomes;
- credits per verified outcome;
- avoidable duplicate executions;
- avoidable data transfer;
- avoidable polling frequency;
- repeated identical reads/writes;
- external API/rate-limit pressure;
- retry waste;
- expensive modules executed before cheap exclusion filters;
- cache/projection eligibility;
- confidence that a reversible Class-A action exists.

The daily optimizer chooses at most one primary autonomous mutation candidate at a time. This prevents fleet-wide simultaneous rewrites and makes before/after attribution reliable.

## Optimization order
For the chosen scenario, evaluate the cheapest and safest opportunities first:

1. Stop duplicate work before any expensive module using fingerprint/idempotency gates.
2. Skip unchanged writes and no-op updates.
3. Move cheap deterministic filters before Notion, HTTP, AI or other expensive modules where behavior is equivalent.
4. Replace unnecessary polling with webhook/event-driven triggers where an existing event source is already proven.
5. Increase polling intervals for non-time-critical optional work when obligations remain within deadline.
6. Reuse current-state projections/cache for repeated reads when freshness/equivalence can be proven.
7. Batch compatible reads/writes where the external contract supports it safely.
8. Reduce requested payload/fields and data transfer where consumers do not require omitted data.
9. Apply bounded retry/backoff so 429/external failures cannot amplify into repeated paid executions.
10. Deactivate or retire only scenarios already proven duplicate, obsolete or replaced; never infer retirement from low activity alone.

AI-driven modules are not used to decide an action when a deterministic rule is sufficient.

## Action classes
### Class A — autonomous reversible
May be executed automatically through BG162/BG160 when exact scenario state and rollback are known. Examples include deterministic filter changes, schedule interval changes within obligation deadlines, removing a proven duplicate no-op route, enabling an already-designed cache/projection path after its explicit promotion contract is satisfied, or changing bounded retry/backoff configuration.

### Class B — candidate experiment
Requires a measured canary/preview or shadow phase before retention because semantic behavior could differ. Examples include moving modules across branches, changing batching semantics or adopting a new projection for a read path.

### Class C — hard boundary
Never autonomous: secrets/credentials/OAuth/account connections, permissions, security weakening, destructive/irreversible data, paid resource increases, or legally/financially binding actions.

## Before/after evidence contract
Every retained optimization stores:

- scenario id/name and exact pre-change `lastEdit`;
- optimization fingerprint and owner `agent-cost` / Agent 14;
- baseline window and sample count;
- baseline credits/run and credits/verified-outcome;
- baseline latency and error rate where available;
- baseline data transfer where available;
- exact mutation and rollback state;
- post-change sample window;
- post-change credits/run and credits/verified-outcome;
- post-change latency/error/outcome evidence;
- decision: KEEP, ROLLBACK, or BLOCKED_HARD_BOUNDARY;
- verified savings in credits and percentage;
- regression/prevention rule;
- BG168/BG166 writeback fingerprint and BG167 refresh evidence.

No optimization is marked completed on configuration save alone.

## Selection guardrails
- Do not optimize more than one scenario mutation concurrently unless their state, triggers and outcome contracts are demonstrably independent and attribution cannot overlap.
- Do not repeatedly optimize a scenario whose prior experiment is still awaiting enough verified post-change evidence.
- Do not repeat a known failed approach without new evidence.
- Maximum two identical retries per hypothesis.
- Always fetch fresh scenario state and use `lastEdit` drift protection before Make mutation.
- Verify whether the desired external side effect already exists before retrying any side-effecting run.

## Mission Control special contract
BG139/BG186/BG188/BG190/BG191 remain governed by their stricter existing promotion contract. This portfolio optimizer must not bypass it.

Specifically:

- BG139 remains legacy-live during SHADOW.
- The known permanent BG190 shadow insert is prohibited because it was already measured as worse.
- Cache promotion requires BG188 equivalence streak >=25 plus freshness/payload/no-divergence and recent real BG139 request evidence.
- BG191 remains the only Class-A projection ACTIVATE/BYPASS verifier.
- The exact approved cutover route is authoritative; no free-form AI blueprint rewrite is permitted.
- Any regression immediately restores BYPASS/legacy state and records PRODUCTION_ROLLBACK/learning.

## Daily flow
1. BG159 performs one fleet inventory/snapshot pass.
2. It normalizes all discovered scenarios into the canonical cost ledger.
3. It computes portfolio efficiency and identifies the highest-confidence waste candidate.
4. If no safe measurable candidate exists, it records no-action and ends without expensive escalation.
5. If a candidate exists, BG159 dispatches one compact cost event to BG162.
6. BG162 deduplicates the fingerprint and selects Tier 0/1/2/3 according to existing policy.
7. Exact reversible Class-A action routes to BG160; advisory/cache architecture routes only to the existing specialist path.
8. The mutation uses fresh scenario state and drift protection.
9. The optimizer gathers the minimum sufficient post-change samples.
10. Outcome/cost protected metrics are compared with baseline.
11. Green improvement => KEEP and material IMPROVEMENT/EXPERIMENT_RESULT writeback.
12. Regression/no verified saving => deterministic rollback, verify restored outcome, and write RECOVERY/EXPERIMENT_RESULT.
13. BG167 is refreshed so all agents inherit the result.

## Cost of the optimizer itself
The optimizer is required to be net-positive. It must avoid creating a monitoring system that costs more than the savings it produces.

Rules:

- reuse BG159's existing single fleet inventory call;
- one normal daily portfolio evaluation is the default cadence;
- enrich recent execution/module detail only for the chosen candidate, not for all scenarios;
- stop the chain early on duplicate snapshot/no candidate/no actionable Class-A result;
- avoid AI calls for deterministic ranking and validation;
- cache stable catalog/classification data;
- write to Notion/shared memory only for daily snapshots and material outcomes, not every read/no-op;
- compute gross and net savings including optimizer overhead.

A retained optimization must have positive expected net savings over its evaluation horizon.

## Initial prioritization
Current fleet evidence shows BG139 as the largest historical Make credit consumer among the most recently inspected scenarios. It is therefore the first scenario to evaluate for waste, but not automatically the first scenario to mutate. Its stricter Mission Control promotion contract can make another scenario the highest safe actionable candidate.

BG166 and BG167 are also significant consumers and should be evaluated for coalescing/dedupe and refresh-frequency waste, but their shared-memory correctness is protected and cannot be weakened merely to save credits.

## Outcome obligations
This design extends the existing cost obligations:

- `cost-policy-10000-monthly`: optional work remains inside the shared monthly envelope.
- `cost-ledger-all-scenarios-daily`: every current scenario remains represented once in the normalized cost ledger.
- `brain-budget-writeback`: every material optimization decision/outcome is routed through BG168 and visible in BG167.

The implementation should add/strengthen a portfolio optimization obligation requiring one daily portfolio decision with evidence of either a safe optimization candidate, verified no-action, or a valid hard boundary.

## Failure and rollback
If a mutation fails validation or protected outcomes regress:

1. stop further mutations for that candidate;
2. restore the captured exact pre-change state;
3. verify real scenario outcome after rollback;
4. record ERROR/RECOVERY/EXPERIMENT_RESULT with the failed hypothesis;
5. refresh BG167;
6. resume on a new hypothesis or next candidate, never blind-repeat the same action.

## Success metrics
Portfolio success is measured by trend, not one isolated run:

- lower total Make credits per day/week/month;
- lower credits per verified outcome;
- lower data transfer per verified outcome;
- fewer duplicate/no-op executions;
- fewer paid failures and rate-limit amplification events;
- stable or lower p95 latency for protected interactive routes;
- no increase in MISSED_OBLIGATION rate;
- no increase in rollback/error rate caused by cost optimization;
- percentage of cost improvements autonomously retained after before/after verification;
- cumulative verified net credits saved minus optimizer overhead.

## Rollout strategy
Compatibility-first; no destructive fleet rewrite.

Phase 1 strengthens BG159 ranking and evidence so it selects one portfolio candidate deterministically.
Phase 2 strengthens BG162/BG160 action gating and exact rollback evidence for the safe optimization classes already supported.
Phase 3 adds before/after retention/rollback evaluation and shared-learning writeback.
Phase 4 expands the library of deterministic optimization fingerprints only after each pattern has independently proven savings and correctness.

## Definition of done
The portfolio optimizer is production-ready only when:

- existing Make fleet inventory remains complete;
- one daily decision is produced from current fleet evidence;
- only one primary autonomous candidate is mutated at a time by default;
- optimizer overhead is measured;
- every retained action has positive verified net savings;
- protected outcomes remain green;
- rollback is exact and tested;
- Mission Control special invariants remain untouched unless their own promotion gate is satisfied;
- material outcomes are visible through BG168/BG166/BG167;
- relevant repository tests/contracts are green;
- any GitHub-backed implementation is promoted only through BRAIN-DELIVERY-v2/BG169 and exact production verification.
