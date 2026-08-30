# Make control-plane credit storm — 2026-08-30

Status: canonical incident learning
Fingerprint: `make|multi-agent-context-learning-credit-storm|2026-08-30-v1`
Guard: `control-plane-credit-storm-prevention-v1`

## Incident

On 2026-08-30 the Make daily credit balance dropped from 10,000 to 835: 9,165 credits consumed in one day. Live scenario evidence showed burst traffic in the multi-agent control plane, especially BG167 Shared Multi-Agent Team Context Hub and BG168 Outcome & Learning Router. Make itself started returning HTTP 429 / Too Many Requests during control-plane inspection.

Emergency containment deactivated BG167 and BG168 while keeping core production flows such as BG139 Mission Control and normal business execution active. This proved insufficient on its own: both components are on-demand subscenarios and other scenarios could still invoke them while their Make status was inactive. The durable containment therefore requires a guard at the callee entry point, not only the scenario activation toggle.

## Root cause

1. BG166 already deduplicated learning fingerprints and reserved a context refresh, but that guard only covered refreshes originating from BG166.
2. Multiple agents/control-plane callers could still invoke BG167 and BG168 directly in bursts.
3. BG167 rebuilt shared context from Notion and published multiple Make cache records on each invocation, even when the effective state was unchanged.
4. BG168 could be invoked for outcomes that were not materially new; the materiality gate occurred after the scenario had already consumed credits.
5. There was no global single-flight/circuit-breaker budget guard spanning all callers of the shared context/learning services.
6. Periodic/refresh ownership can overlap unless semantic scope, owner, cadence and side-effects are checked before activation. This is the previously identified `duplicate-periodic-obligation-owner-v1` failure class applied to control-plane refreshes.
7. Configuration drift existed between the intended refresh reservation logic and the actual downstream mapper. Any rule with two competing sources of truth is a regression risk.
8. A Make on-demand subscenario can still be invoked by another scenario while its own status is inactive. Therefore `scenario_deactivate` is not a reliable circuit breaker for subscenario fan-out.

## Permanent prevention rules

- Shared context is cache-first for workers. Workers do not rebuild the projection.
- Projection rebuild is event-driven and only triggered after a genuinely new canonical learning/state mutation.
- Equivalent refreshes are globally single-flight and coalesced across all callers.
- A state hash/version is compared before cache write; unchanged context produces zero writes.
- BG168/outcome routing is called only for explicit material outcomes. NO_ACTION/healthy/no-change results terminate before the router call.
- One canonical owner exists for every periodic or refresh obligation. Before create/enable/update, inventory semantic scope, cadence, owner and side-effects and merge/disable superseded owners.
- Control-plane services have per-caller rate limits, cooldowns and a global credit circuit breaker.
- A 429/502 on a state-changing Make call is ambiguous; read back remote state before any retry. Blind retries are prohibited.
- Learning persistence is primary; projection refresh is secondary and fail-open. If BG167 is unavailable, BG166 must retain the immutable learning record and return safely.
- Audit history and current projection remain separate truth classes.
- No paid-capacity increase is an autonomous recovery action. Cost/capacity exhaustion is a hard boundary.
- Never treat an inactive toggle as sufficient containment for an on-demand subscenario. Put the safety predicate before the expensive first module or remove/guard every caller.
- BG167 canonical refresh is now explicitly gated at module 2: the expensive projection path proceeds only when `request_json` contains `"mode":"refresh"` and `"agent_id":"BG166"`. Direct context requests terminate before the Notion read/cache-write path.

## Required regression contract

A release is not green if any of the following is true:

- more than one equivalent BG167 refresh occurs within the configured coalescing window;
- an unchanged shared-context hash causes a cache write;
- an agent invokes BG168 for a non-material outcome;
- two active periodic/refresh owners have overlapping semantic scope without explicit orchestration;
- concurrent agent tests can trigger a Make 429 burst;
- projected credit burn exceeds the configured budget slope/circuit-breaker threshold;
- a failed projection refresh causes the canonical BG166 learning write to be lost;
- a retry occurs after 429/502 without readback evidence;
- a control-plane configuration rule is duplicated in code and mapper with divergent values;
- a safety design assumes `inactive` alone prevents an on-demand subscenario from being invoked by another scenario.

## Recovery contract

1. Detect abnormal credit slope / burst rate.
2. Identify top callers by executions and credits, not lifetime counters alone.
3. Contain only runaway control-plane paths; preserve unrelated production.
4. For on-demand subscenarios, install an entry guard before the first expensive module; deactivation alone is insufficient.
5. Persist the incident to BG166 with a stable fingerprint.
6. Apply single-flight, materiality-before-dispatch, cache-first and state-change guards.
7. Verify bounded concurrent behavior with exact execution/credit evidence.
8. Reactivate one control-plane component at a time only after the regression contract is green.
9. If a reactivation increases credit slope or 429s, immediately return that component to safe mode and continue root-cause repair.

## Evidence from the incident

- Daily balance: 10,000 -> 835 credits.
- BG167 showed dozens of automatic executions within minutes, commonly 6-9 credits per call.
- After BG167 was set inactive, direct callers still invoked it and full runs continued, including 9-11 credit executions. This is direct evidence for `make|subscenario|inactive-still-callable-v1`.
- BG168 showed multiple automatic calls per minute, commonly 3 credits per call even when only its initial gate ran.
- BG139 and BG89 are substantial consumers too, but the acute abnormal pattern was the multi-agent context/learning burst rather than ordinary useful production traffic.
- Make returned Too Many Requests during inspection, confirming real platform saturation.
- The incident fingerprint was persisted through BG166 on 2026-08-30 and the write returned `learning_persisted=true`.
- BG167 was subsequently patched so only canonical BG166 refresh calls can enter the expensive projection path.

## Agent preflight rule

Before any agent changes, creates or activates a Make scenario that can trigger another scenario, refresh shared context, route learning, poll state or write a cache, it must match this fingerprint and prove:

`canonical owner -> material state change -> dedupe/single-flight -> bounded cost -> callee entry guard -> idempotent side-effects -> readback evidence -> fail-open learning durability`.

If that proof is missing, the agent must not activate the new recurring/control-plane path.