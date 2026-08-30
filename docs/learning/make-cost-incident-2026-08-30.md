# Make Cost Incident + Chat Learning — 2026-08-30

Status: durable shared Brain learning. This file is under the classified `docs/learning/` shared-memory path and must be reused before Make cost, polling, cache, shadow, canary, agent-routing or periodic-guardian changes.

## Core incident

Fingerprint: `make-cost|runaway-successful-executions|control-plane-overhead-v1`

A technically successful Make execution can still be economically red. During this incident Make credits/tokens were consumed far faster than expected while many executions returned success.

Verified evidence from this tranche:
- Mission Control scenario ID `7071153` was observed executing roughly every 7–8 minutes.
- The legacy request path was typically about 7 credits per request.
- Added shadow/control-plane instrumentation produced runs around 8–10 credits.
- A tested BG190 cache-first/shadow hot-path variant reached about 12 credits and about 12.3 seconds versus roughly 7 credits and 5–7 seconds on the legacy path.
- That BG190 hot-path shadow variant was rolled back and is a known failed hypothesis. Do not repeat it without new evidence and a materially different mechanism.
- BG166 burst coalescing proved multiple learning writes can be preserved while redundant BG167 context rebuilds are coalesced.

## Permanent economics contract

Primary KPI: **credits per verified successful outcome**. A Make `success` status is not itself a verified business outcome and is not itself economic success.

Also measure:
- latency per verified outcome;
- transfer per verified outcome;
- AI/provider tokens or credits per verified outcome;
- control-plane cost per verified outcome;
- logging, shadow, memory-refresh, observability and canary overhead as part of total optimization cost.

A no-change path should approach zero incremental Make work where source semantics allow it.

Before a cost optimization or canary:
1. record baseline credits/outcome, latency/outcome and transfer/outcome;
2. estimate expected 7-day saving;
3. define maximum test/canary budget;
4. define rollback and protected metrics;
5. use cheapest deterministic evidence first;
6. run one hypothesis, one candidate and one bounded canary;
7. allow at most two identical retries without new evidence;
8. stop when marginal evidence value is below the cost of obtaining it;
9. KEEP only measured net savings after optimizer, agent, shadow, logging and memory overhead.

Prefer expected 7-day saving materially above test cost; >=3x is the default target where practical.

## Runaway-cost response contract

When burn rate is abnormal:
1. treat cost as a protected-metric incident;
2. stop non-essential experiments/canaries first;
3. identify actual top credit consumers from execution evidence;
4. separate user/business demand from polling, retries, duplicate periodic owners and control-plane fan-out;
5. use event/webhook, cache, delta/query projection, dedupe and coalescing before expensive source reads or AI;
6. preserve last-known-good functionality;
7. resume optimization only after runaway demand is bounded;
8. persist root cause, measured before/after cost, fix and prevention.

Do not spend large amounts of Make credits repeatedly querying Make in order to diagnose Make cost.

## Mission Control exact identity + cache learning

Never identify a Make capability by `BGxxx` label alone.

Fingerprint: `make-governance|scenario-label-identity-collision-v1`

Historical records used `BG139` for a different Instagram capability, while the current Mission Control route is scenario ID `7071153`. Canonical Make identity is:

`scenario_id + current scenario name + capability/owner`

Before mutation, fetch the exact live scenario and verify name, trigger, modules and owner. Historical BG-label-only evidence is ambiguous until mapped to an exact scenario ID.

Current relevant identities in this tranche:
- scenario `7071153`: Mission Control live request path;
- scenario `7152183`: projection state with SHADOW/ACTIVE/BYPASS;
- scenario `7152314`: post-response semantic equivalence guardian;
- scenario `7152387`: isolated cache-first read service/canary, not a permanent shadow hot-path insert;
- scenario `7152400`: fail-closed Class-A projection promotion/rollback verifier.

Cache promotion remains fail-closed. Require real consecutive semantic equivalence evidence (designed around >=25 genuine requests), ignore only explicitly approved volatile fields such as `generatedAt`, retain live Notion fallback + BYPASS kill switch, make exact reversible changes, and verify real customer-path response/cost/latency after cutover. Protected-metric regression means immediate rollback and exact verification.

Existing newer checkpoint learning also records that two structurally exact Mission Control cutover attempts failed because Make auto-assigned different module IDs. Do not perform a third identical attempt without a new mechanism or explicit compatibility-contract change.

## Rate limiting

Fingerprint: `make-runtime|429-learning-writeback|no-blind-retry-v1`

A shared-memory writeback to BG168 during this chat returned `Too Many Requests`.

Required response:
- do not blind-retry while rate-limited;
- keep the material learning as an open writeback obligation;
- persist repository shared-memory fallback first;
- after cooldown, perform one controlled BG168 writeback;
- verify propagation through BG166/BG167;
- never create a retry storm to record that retry storms are forbidden.

Runtime BG168/BG166/BG167 synchronization for this incident remains open until that one controlled writeback is verified.

## Chat-learning completeness

Fingerprint: `shared-memory|chat-learning-completeness-gate-v1`

A chat/run is not complete while material engineering or operational learning exists only in conversation text. Durable capture must include relevant:
- error/fingerprint;
- symptom and impact;
- root cause;
- proven fix/recovery;
- failed/forbidden repeat approaches;
- prevention/regression contract;
- exact component ownership/identity;
- runtime/production evidence;
- open obligations/blockers;
- measured cost/performance outcome.

Repository shared memory is a valid fail-safe when runtime memory is unavailable/rate-limited, but runtime synchronization remains an obligation until verified.

## Periodic ownership

Fingerprint: `duplicate-periodic-obligation-owner-v1`

Before creating, enabling or updating any recurring watcher/guardian:
- inventory existing active automations by semantic scope, cadence, owner and side effects;
- choose one canonical owner unless explicit orchestration/dedupe exists;
- merge/disable superseded overlap where safely allowed;
- account for duplicate logs, credits, retries, races and possible external side effects.

This applies across ChatGPT automations, Make schedules and future periodic agents.

## Delivery learning from this exact writeback

Fingerprint: `brain|delivery-classifier|canonical-shared-memory-path-v2`

The first PR for this incident created `docs/chat-learning-cost-incident-2026-08-30.md` from an older main base. BRAIN planning correctly failed with `unclassified delivery path`. Moving the content to the then-existing checkpoint still failed on that stale candidate because its older `config/brain-delivery-system.json` did not yet contain the newer shared-path classification that current main had acquired concurrently.

Prevention:
- never weaken the delivery classifier merely to make a learning PR green;
- inspect the candidate's own delivery policy, not only current main's policy;
- if a needed shared-memory classification arrived on current main after the branch base, rebuild/rebase the learning candidate from current main rather than overwriting newer shared memory;
- prefer already classified shared-memory families such as `docs/learning/` on the current delivery policy;
- preserve concurrent newer checkpoint content instead of replacing it with an older branch snapshot.

Fingerprint: `github|candidate-write|placeholder-staging-noise-v1`

During repair, a temporary placeholder file was mistakenly created as a staging step. It was removed before the final candidate, but the action could trigger unnecessary CI and create another unclassified path.

Prevention:
- do not stage placeholder files in governed branches;
- construct the intended final change directly;
- where multiple path mutations are required, prefer the repository's `atomic-tree-commit` write mode;
- verify the final PR diff contains only intended canonical files before considering the candidate green.

## Do not repeat

- Equating Make `success` with economic success.
- Permanent shadow/control-plane calls in a hot path without net cost/latency proof.
- Repeated manual canaries without a new hypothesis.
- Blind retries during 429/rate pressure.
- Using BG labels alone as scenario identity.
- Duplicate periodic watchers without ownership reconciliation.
- Optimizations whose observability/agent/test overhead erases the savings.
- Weakening a delivery classifier instead of using a governed/classified memory path.
- Overwriting newer main shared-memory content with an older branch snapshot.
- Placeholder/staging commits that trigger avoidable CI.

## Resume obligation

When Make rate pressure has cleared, perform exactly one controlled material learning write through BG168 (`7136176`), verify persistence/routing through BG166 and visibility in BG167, and record that runtime synchronization evidence. Until then repository shared memory is durable, but runtime memory synchronization is not yet `PRODUCTION_GREEN`.