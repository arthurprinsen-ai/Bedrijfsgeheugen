# Brain Runtime Mission Recovery Ledger — 2026-08-29

This file is an append-only ledger fragment for the Bedrijfsgeheugen Brain runtime work performed on 2026-08-29. It supplements `docs/development-ledger.md` and follows the same material-outcome contract.

## 2026-08-29 00:01 CEST — ERROR — BG168 governance ruling misclassified as error
- **Fingerprint:** `brain|bg168|governance-ruling-false-error`
- **Signal:** governance/architecture rulings containing words such as `blocked`, `failed` or `error` were classified as `AGENT_ERROR` even when the semantic outcome was an approved ruling/contract change.
- **Impact:** current Team Memory showed false active errors for Knowledge/Governance and Architect/Integrator decisions.
- **Root cause:** broad free-text error matching executed without sufficient semantic precedence for explicit rulings and approved contract changes.
- **Evidence:** live regression canaries against BG168 scenario `7136176` demonstrated the false-positive class; a real `GOVERNANCE_BLOCK` remained a true error.
- **Fix:** semantic-start normalization plus explicit precedence for `GOVERNANCE_RULING`, `ARCHITECTURE_RULING`, `RULING` and approved-with-mandates outcomes, while preserving explicit `GOVERNANCE_BLOCK` as error.
- **Regression gate:** approved ruling -> `AGENT_CONTRACT_CHANGE`; real governance block -> `AGENT_ERROR`.
- **Verification:** BG168 canaries `596645406b264beb8764ea9614045c50` and `c71770bfbc564a9981919d91dc798643` returned the expected opposite classifications.
- **Owner:** PH12 Knowledge/Governance + BG168 Outcome Router.
- **Rollback:** restore prior BG168 module-2 classifier only if semantic precedence causes a verified regression.
- **Reusable lesson:** semantic state must dominate incidental vocabulary inside agent prose.

## 2026-08-29 00:02 CEST — RECOVERY — BG167 false-ruling projection suppression
- **Fingerprint:** `brain|bg167|false-ruling-current-state-suppressed`
- **Fix:** BG167 current-state projection suppresses historical records that were stored as `AGENT_MATERIAL_ERROR` but are semantically approved governance/architecture rulings; immutable BG166 history is not altered.
- **Verification:** BG167 execution `4627378d6e324cf39c91ccfd532c0fde` removed the two false current-state errors while retaining a real `GOVERNANCE_BLOCK` error.
- **Protected invariants:** immutable history retained; current state corrected only by projection logic.
- **Reusable lesson:** immutable history and corrected current projection are distinct responsibilities.

## 2026-08-29 00:04 CEST — CONTRACT_CHANGE — internal Brain Mission adapters
- **Fingerprint:** `brain|internal-mission-adapters|v1`
- **Change:** introduced bounded adapters `BG182` scenario `7142406` (Brain Internal Mission Dispatcher) and `BG183` scenario `7142431` (Creative Mission Evidence Handoff).
- **Autonomy scope:** only high-confidence/high-evidence `CONTENT_DEMAND` missions are internally dispatched; `side_effects_authorized=false`; no publish, DM, customer contact, production mutation, credentials/permissions change or paid-resource increase is authorized.
- **Architecture:** BG158 portfolio -> BG182 persist/gate -> BG183 evidence-first handoff -> PH03 Intelligence audit -> PH10 Calendar/Content internal worker -> BG168/BG166 learning.
- **Rollback:** restore BG182 direct persisted-only behavior and deactivate BG183 if the handoff contract regresses.
- **Reusable lesson:** bounded adapters may orchestrate specialists but do not become a new source of truth or production authority.

## 2026-08-29 00:11 CEST — ERROR — duplicate paid-agent fan-out after connector 502
- **Fingerprint:** `make|7142431|duplicate-paid-agent-retry|pre-guard`
- **Signal:** one client-side 502 caused four identical BG183 executions, each reaching paid PH03 work.
- **Impact:** unnecessary AI credits and duplicate work.
- **Root cause:** no atomic mission reservation existed before paid-agent fan-out, so client retry behavior was not idempotent.
- **Evidence:** four BG183 executions around 22:09–22:11 UTC, each ~57 Make credits before the guard.
- **Failed approach:** trusting a client-side 5xx as proof that no server-side execution occurred.
- **Owner:** Brain Runtime + PH14 Cost Optimizer.

## 2026-08-29 00:14 CEST — RECOVERY — atomic Mission coalescing before paid agents
- **Fingerprint:** `make|7142431|duplicate-paid-agent-retry|coalesced`
- **Fix:** BG183 now reserves `mission_id + trace_id` in Make data store `174105` before PH03/PH10. Identical missions in the same 30-minute bucket return `DUPLICATE_MISSION_COALESCED` through the reservation error-handler path.
- **Regression gate:** repeat the exact Mission immediately; second BG183 execution must invoke only modules `1,10,11,12,13` and report `paid_agents_dispatched=false`.
- **Verification:** duplicate execution `a707e04d4885415ca4b808bb6877ff44` returned `DUPLICATE_MISSION_COALESCED`, used 5 credits and invoked zero paid agents.
- **Rollback:** fail closed rather than dispatch paid agents if reservation storage becomes unavailable.
- **Reusable lesson:** every paid-agent fan-out requires idempotency before the first paid operation.

## 2026-08-29 00:20 CEST — ERROR — JavaScript wait exceeded Make Code runtime
- **Fingerprint:** `make|7142431|ph03-wait|code-timeout`
- **Signal:** BG183 used a JavaScript sleep to wait 35 seconds for PH03, but Make Code terminated user code at about 29 seconds.
- **Impact:** technically successful PH03 work could not be read and the handoff failed despite no business error.
- **Evidence:** BG183 execution `ca4def0b34964b41b9d2c0af5e1d60af` failed with `The Code execution timed out`, billable user-code time ~29,063 ms.
- **Root cause:** using code execution as a timer crossed the runtime limit.
- **Owner:** Brain Runtime / System Performance.

## 2026-08-29 00:22 CEST — RECOVERY — native Make Sleep for evidence handoff
- **Fingerprint:** `make|7142431|ph03-wait|native-sleep`
- **Fix:** replaced the JavaScript sleep with native Make `Sleep` for 35 seconds and made the execution-read reference PH03's exact execution ID directly.
- **Verification:** BG183 execution `1685fc647adb49f09b67b1470e7a3401` completed successfully in 40.739 s, ordered modules reservation -> PH03 -> native Sleep -> exact execution read -> evidence validation -> PH10, with no code timeout.
- **Protected metrics:** no external side effects; no paid external resource increase; only existing Make modules/connections used.
- **Rollback:** restore fail-closed persisted-only behavior if the native wait path becomes unavailable.
- **Reusable lesson:** use native scheduler/wait primitives for time, not billable code runtimes.

## 2026-08-29 00:24 CEST — IMPROVEMENT — bounded deterministic Context Compiler
- **Fingerprint:** `brain|context-compiler|bg166-evidence-resolution|v1`
- **Baseline problem:** PH03/PH10 previously treated absence from BG167's compact top-10 current projection as evidence that an older BG166 fingerprint did not exist.
- **Change:** BG183 now extracts required `evidence_refs`, executes one bounded deterministic Notion query against BG166 immutable learning/history, compiles a machine-resolved evidence packet, and supplies that packet to PH03 before paid specialist reasoning.
- **Rule:** BG167 projection lag is not evidence failure; BG166 deterministic fingerprint resolution is authoritative for evidence existence.
- **Regression gate:** known BG166 refs must yield `required_count == resolved_count`, `missing=[]`, `all_refs_resolved=true`; missing refs keep the Mission fail-closed and internal.
- **Verification:** Context Compiler canary `716cf706cf824ba58157a52a4af386f0` resolved 2/2 required refs and completed the evidence-first handoff. PH03 execution `dfecddf2a44545a8959fd9ce2dbab1d1` explicitly confirmed both BG166 refs and marked internal handoff merge-ready. PH10 execution `318d9e6265b6470087ef8a3a83eb0c64` confirmed `EVIDENCE_USABILITY: MERGE-READY`, missing `[]`, zero external side effects.
- **Cost/performance note:** deterministic resolution happens before the paid specialist, preventing AI spend on obviously unresolved Missions.
- **Rollback:** remove BG183 modules 15–17 and keep the evidence gate fail-closed; do not fall back to assuming BG167 top-10 equals history.
- **Reusable lesson:** compile bounded task context deterministically before model invocation; models should reason over resolved evidence, not search for system truth in a truncated projection.

## 2026-08-29 00:27 CEST — RECOVERY — evidence-audit classifier semantics
- **Fingerprint:** `brain|bg168|evidence-audit-semantic-classification`
- **Signal:** historical PH03 evidence audits were misclassified as `PRODUCTION_PROMOTION` or `IMPROVEMENT` because those words appeared inside audit prose.
- **Root cause:** production/improvement keyword detection was not sufficiently positive-evidence-bound.
- **Fix:** explicit affirmative promotion evidence is required; evidence-audit/gap semantics take precedence over generic optimization vocabulary. BG167 additionally suppresses historical false audit promotions/improvements from Current State while preserving BG166 history.
- **Regression gate:** audit saying no promotion record exists -> `AGENT_ERROR`/context-required, not promotion; explicit verified `PRODUCTION_PROMOTION` -> production promotion.
- **Verification:** BG168 executions `eadeb52bfbeb4bacaa2d292fcd67cacb` and `17d5caabc2644643b46156da9cf1be26`; BG167 refresh `5763941afdb844e9aeb1021933c3942c` showed the corrected current projection.
- **Reusable lesson:** release-state classification requires affirmative evidence, never mere word occurrence.

## Final runtime acceptance snapshot
- BG168 classifier semantic boundary canaries: green.
- BG167 current projection correction: green; immutable history preserved.
- BG182 high-confidence internal CONTENT_DEMAND gate: active, side effects disabled.
- BG183 atomic duplicate coalescing: green.
- BG183 native wait and ordered PH03 -> PH10 handoff: green.
- Context Compiler BG166 evidence resolution: 2/2 refs, no missing refs.
- PH03 evidence audit: merge-ready for internal handoff.
- PH10 evidence usability: merge-ready; no external side effects.
- Production website/application code was not changed by these Make runtime adaptations; production authority remains BG169 and existing GitHub/Netlify release gates.
