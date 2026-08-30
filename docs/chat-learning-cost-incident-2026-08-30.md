# Chat Learning — Make Cost Incident — 2026-08-30

## Purpose
This document captures durable learning from the Powerhouse/Bedrijfsgeheugen Make cost incident and the associated cache/shadow/agent work. Future agents must read and reuse these fingerprints before changing polling, cache, observability, canaries, agent routing or cost governance.

## Incident fingerprint
`make-cost|runaway-successful-executions|control-plane-overhead-v1`

### Symptom
Make credits/tokens were consumed far faster than expected even though many executions were technically successful.

### Root cause pattern
A technically successful execution can still be economically wrong. Frequent polling, repeated full Notion reads, shadow verification, control-plane calls, manual canaries and optimizer/agent runs can consume large amounts of Make credits without producing a new verified business outcome.

### Verified evidence from this tranche
- BG139 Mission Control was observed executing roughly every 7–8 minutes.
- Typical legacy BG139 runs consumed about 7 credits; later shadow-instrumented runs consumed 8–10 credits.
- A tested BG190 hot-path/shadow integration increased total request cost to about 12 credits and latency to about 12.3 seconds versus a legacy baseline around 7 credits and roughly 5–7 seconds.
- That BG190 shadow integration was therefore rolled back and is a known failed approach. Do not reintroduce the same architecture without new evidence and a different hypothesis.
- BG166 burst coalescing proved that multiple learning writes can be persisted while avoiding duplicate expensive BG167 context rebuilds.

## Permanent economics contract
Primary KPI is **credits per verified successful outcome**, not raw scenario success count.

Also measure:
- latency per verified outcome;
- transfer per verified outcome;
- AI/provider usage per verified outcome;
- control-plane cost per verified outcome;
- observability/canary cost as part of total optimization cost.

A successful Make run with no new verified outcome is not automatically economically green.

## Optimization budget rule
Before any cost optimization or canary:
1. record baseline credits/outcome, latency/outcome and transfer/outcome;
2. estimate expected 7-day saving;
3. define a maximum test/canary budget;
4. define rollback and protected metrics;
5. use cheapest deterministic evidence first;
6. run one hypothesis / one candidate / one bounded canary;
7. never run more than two identical retries without new evidence;
8. stop when the marginal value of more evidence is lower than the cost of obtaining it;
9. accept only measured **net** savings after including optimizer, shadow, logging, memory-refresh and agent overhead.

Rule of thumb: expected 7-day savings should materially exceed the optimization execution cost; prefer >=3x where practical.

## Runaway-cost incident response
When credits burn unusually fast:
1. treat it as a protected-metric incident;
2. stop non-essential experiments/canaries first;
3. identify top credit consumers from actual execution history;
4. distinguish user/business demand from internal retries, polling and control-plane fan-out;
5. suppress duplicate or unnecessary demand using cache, delta, event-driven triggers, dedupe and coalescing;
6. preserve core business functionality and last-known-good behavior;
7. resume optimization only after the runaway source is bounded;
8. write root cause, measured cost, fix and prevention to shared memory.

Do not spend more Make credits repeatedly querying Make to diagnose Make cost during a 429/rate-limit incident. Cool down and use one targeted read when safe.

## Architectural prevention rules
- Prefer event-driven/webhook updates over polling where source semantics support it.
- Prefer cache before source reads.
- Prefer delta/query projection before full-dataset reads.
- Prefer deterministic checks before AI.
- Prefer one specialist before whole-agent fan-out.
- Deep control-plane inspection runs only on anomaly/change, not every normal request.
- A 'no change' path should approach zero incremental Make work.
- Separate proof/shadow architecture from the customer hot path when the proof layer materially increases latency or credits.
- Temporary shadow verification must have an exit condition; never leave expensive proof instrumentation running indefinitely.
- Coalesce projection rebuilds, but never drop immutable learning events.

## BG139/BG186/BG188/BG190/BG191 learning
Current functional roles in this tranche:
- BG139 scenario ID `7071153`: Mission Control live request path.
- BG186 scenario ID `7152183`: Mission Control projection state, including SHADOW/ACTIVE/BYPASS.
- BG188 scenario ID `7152314`: post-response semantic equivalence guardian.
- BG190 scenario ID `7152387`: isolated cache-first read service/canary component, not a permanent shadow hot-path insert.
- BG191 scenario ID `7152400`: fail-closed Class-A projection promotion/rollback verifier.

Promotion rules:
- never activate cache merely because a scenario is technically green;
- require real consecutive semantic equivalence evidence, currently designed around >=25 genuine live requests;
- ignore only explicitly approved volatile fields such as `generatedAt` during equivalence;
- preserve live Notion fallback and a BYPASS kill switch;
- use exact reversible wiring/actuator changes;
- verify real customer-path response, cost and latency after cutover;
- any protected-metric regression triggers BYPASS/legacy rollback and exact verification.

## Scenario identity collision prevention
Fingerprint: `make-governance|scenario-label-identity-collision-v1`

A prior checkpoint contains a historical reference to `BG139` as a duplicate Instagram publisher, while the current verified Mission Control scenario is also referred to as BG139 and has exact scenario ID `7071153`.

Therefore:
- never identify a Make capability by `BGxxx` label alone;
- canonical identity is `scenario_id + current scenario name + capability/owner`;
- before mutation, fetch the live scenario by exact ID and verify its current name, trigger, modules and expected owner;
- historical learning keyed only by BG number must be treated as ambiguous until mapped to an exact scenario ID;
- new ledger/checkpoint entries must include exact scenario ID for Make components whenever available.

This prevents stale historical aliases from causing changes to the wrong active scenario.

## Rate-limit learning
Fingerprint: `make-runtime|429-learning-writeback|no-blind-retry-v1`

A shared-memory writeback attempt during this chat returned `Too Many Requests`.

Required behavior:
- do not blind-retry the same write while rate-limited;
- keep the learning as an open writeback obligation;
- persist a repository fallback/checkpoint first when safe;
- after cooldown, perform one controlled runtime writeback and verify shared-context visibility;
- never create a retry storm merely to record that retry storms are bad.

## Chat-learning completeness gate
Fingerprint: `shared-memory|chat-learning-completeness-gate-v1`

A chat/run is not fully complete while material technical or operational learning exists only in conversational text. Completion requires durable capture of relevant new:
- errors/fingerprints;
- root causes;
- proven fixes;
- failed or forbidden repeat approaches;
- prevention rules/regression contracts;
- exact component ownership and successor mappings;
- production/runtime evidence;
- open obligations/blockers;
- cost/performance outcomes.

Repository documentation is a valid fail-safe when the runtime memory route is rate-limited, but the runtime/shared-memory writeback remains an open obligation until verified.

## Periodic obligation ownership
Fingerprint: `duplicate-periodic-obligation-owner-v1`

Before creating, enabling or updating a recurring watcher/guardian:
- inventory existing active automations by semantic scope, cadence, owner and side effects;
- do not create multiple active owners with overlapping periodic responsibility unless explicit orchestration/deduplication exists;
- select one canonical owner and merge/disable superseded overlap;
- account for duplicate logs, costs, retries, races and external side effects.

This rule applies to ChatGPT automations, Make schedules and any future periodic agents.

## Do not repeat
- Do not equate Make `success` with economic success.
- Do not permanently add shadow/control-plane calls to a hot path without measuring net cost and latency.
- Do not retry repeatedly during 429/rate pressure.
- Do not run repeated manual canaries without a new hypothesis.
- Do not use scenario labels alone as runtime identity.
- Do not create duplicate hourly/daily watchers without ownership reconciliation.
- Do not call an optimization complete until net savings and protected outcomes are verified.

## Resume obligation
Runtime shared-memory writeback for this incident remains required once Make rate limiting has cleared. The writeback should use the fingerprints in this document and verify the resulting material learning through BG168/BG166/BG167 rather than creating a second independent truth.