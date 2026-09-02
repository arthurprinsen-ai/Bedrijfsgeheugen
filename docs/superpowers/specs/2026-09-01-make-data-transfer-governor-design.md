# Make Data Transfer Governor Design

## Goal
Extend the existing Powerhouse cost-control chain so Make credits and data transfer are governed together, with automatic throttling and Brain learning before the Make team can be paused by monthly operations/data-transfer limits.

## Existing canonical components
- BG82 — Powerhouse Cost + Runtime Guard v8.1: O(1) team-usage sensor every 4 hours using Make `getUsage`.
- BG159 — Powerhouse Cost Snapshot Collector v1: daily scenario-level metering and baseline collection.
- BG162 — Adaptive Cost & Quality Governor v1: governed economy execution and recovery router.
- PH Agent 14 — Make Cost Optimizer v3 stable runner: specialist optimizer used by BG162.
- BG211 → BG205/BG168/BG166/BG167: universal event, graph-lineage, durable learning and shared Brain projection.

No parallel cost controller or second source of truth is introduced.

## Budget model
The governor uses the Make monthly data-transfer entitlement as the canonical cap when the API exposes it. If Make does not expose the entitlement, a configured explicit monthly cap is used and is labelled `configured_cap`, never inferred silently.

The daily allowance is dynamic:

`safe_daily_allowance = remaining_month_bytes / remaining_calendar_days`

The governor also tracks credits with the same projected-exhaustion model. A scenario may be throttled because of data transfer, credits, or both.

### Control zones
- GREEN: <60% of the current pro-rata daily allowance.
- AMBER: 60–80%.
- RED: 80–95%.
- HARD: >=95% or projected monthly exhaustion before month end.

The percentages are Powerhouse operating thresholds, not Make product limits.

## Automatic behaviour
### GREEN
Normal execution. Still collect scenario efficiency metrics.

### AMBER
Prefer smaller payloads and lower-cost paths automatically:
- select only required Notion fields;
- reduce page sizes and bounded lookback windows;
- use URL/reference identifiers instead of passing binary/large payloads through Make;
- coalesce duplicate reads and writes;
- use batching/cache where existing adapters support them;
- avoid non-material enrichment.

### RED
In addition to AMBER actions:
- throttle non-critical scenario schedules;
- suppress discretionary AI/enrichment paths;
- prioritize publishing, revenue/outcome, recovery, security, and Brain-critical traffic;
- prevent curiosity canaries and blind retries.

### HARD
Fail closed for non-essential Make consumption. Preserve only critical execution classes and recovery needed to restore safe operating capacity. Do not purchase or increase capacity autonomously.

## Scenario anomaly detection
BG159 remains the scenario-level metering owner. For each active scenario it derives:
- bytes per run;
- bytes per operation;
- daily bytes delta;
- credit delta;
- rolling baseline from prior snapshots;
- ratio to own baseline.

A scenario is anomalous when one of the following is true:
- bytes/run > 2x its established rolling baseline;
- bytes/operation > 2x baseline;
- daily bytes delta consumes a material share of the current daily allowance;
- repeated zero/low-value runs consume material transfer or credits.

An anomaly is routed through BG162 using a stable fingerprint and exact scenario identity.

## Optimization order
BG162 and PH14 must try the smallest reversible fix first:
1. reduce fields;
2. reduce page/window size;
3. replace payload transfer with URL/reference where possible;
4. dedupe/coalesce;
5. batch;
6. cache;
7. reduce polling/schedule frequency;
8. remove discretionary AI/enrichment;
9. temporary throttle of non-critical execution.

Disabling a scenario is containment only and creates a recovery obligation. The agent must continue to root cause, minimal safe fix, regression/readback, and safe reactivation when possible.

## Criticality classes
Every Make producer is assigned one of:
- CRITICAL_PUBLISHING
- CRITICAL_REVENUE_OUTCOME
- CRITICAL_RECOVERY_SECURITY
- CRITICAL_BRAIN
- STANDARD_OPERATIONAL
- DISCRETIONARY_ENRICHMENT

RED/HARD controls preserve the first four classes before standard/discretionary work.

## New-producer contract
A new Make scenario or future integration cannot be considered production-ready without:
- credit budget;
- data-transfer budget;
- maximum payload policy;
- page/batch/window limit;
- dedupe/idempotency key;
- criticality class;
- degradation/throttle strategy;
- outcome/proof signal;
- BG211 universal event/learning ownership.

Missing mandatory cost-governance metadata is a fail-closed readiness violation.

## Brain closed loop
Every material breach/anomaly uses the universal event envelope and persists:
- source scenario and execution evidence;
- bytes/credits before and after;
- stable fingerprint;
- observed symptom;
- verified root cause;
- failed approaches;
- proven fix;
- prevention rule;
- regression contract;
- criticality/degradation decision;
- realized savings/outcome when measured.

Only proven learning is projected as durable shared intelligence. Unverified hypotheses remain OBSERVED/UNVERIFIED.

Canonical path:

`BG82/BG159 signal → BG162/PH14 decision+repair → BG211 event/lineage → BG205 graph → BG168/BG166 durable learning → BG167 shared context`

## Runtime and cost constraints
- BG82 remains O(1): one team usage read per cycle; no estate-wide fanout from BG82.
- BG159 performs bounded daily scenario analysis and must not repeatedly reread the entire estate during the same day.
- No paid AI is required for deterministic threshold classification.
- No blind retries while Make reports team/org paused, quota exceeded or capacity exhaustion.
- A capacity blocker is an open recovery obligation, not a success state.

## Testing and proof
Before declaring production-ready:
1. deterministic policy tests prove GREEN/AMBER/RED/HARD classification;
2. anomaly tests prove 2x baseline detection and no false alarm for stable scenarios;
3. criticality tests prove publishing/recovery/Brain work survives RED while discretionary work is throttled;
4. bounded canary uses synthetic usage data rather than consuming real transfer where possible;
5. one live read-only Make usage read confirms mappings/threshold inputs;
6. runtime mutation is verified by fresh scenario readback;
7. any actual self-heal must include before/after usage evidence;
8. learning is written through BG211/BG168/BG166 and projected to BG167 when Make capacity is executable.

## Success criteria
- Make data transfer cannot be treated as an after-the-fact alert only.
- Powerhouse detects projected exhaustion before the account-wide pause where enough lead time exists.
- High-transfer scenarios are attributed and optimized individually.
- Non-critical work degrades first; publishing/revenue/recovery/Brain are preserved.
- Every material incident/fix becomes reusable Brain intelligence.
- Future Make scenarios inherit the governance contract by default.
