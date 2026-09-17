# Powerhouse Fast Development Protocol v2 — Design

## Status
Approved design, pending implementation.

## Goal
Add one incremental, event-driven Fast Development Protocol above the existing Powerhouse Engineering OS and BRAIN-DELIVERY-v2 so ordinary work stops reconstructing and revalidating unchanged state while all existing safety, truth, protected-main, exact-SHA, CurrentState, Learning, security, outcome-obligation and LIVE & BEWEZEN invariants remain authoritative.

## Non-goals
- Do not create a second Brain, delivery authority, queue, registry, calendar, CurrentState, learning store or production promotion mechanism.
- Do not weaken release, security, schema, identity, publishing, protected-main, outcome-obligation or production-readback gates.
- Do not let cached evidence substitute for required exact-SHA production readback.
- Do not make speculative integration authoritative for production.

## Canonical flow
`INTENT -> EXECUTION_PACKET_V2 -> NO_OP_DEDUP -> IMPACT_GRAPH -> EXECUTION_DAG -> TARGETED_TESTS -> CANDIDATE -> FULL_RELEASE_GATES -> EXACT_SHA_PROD_READBACK -> DELTA_WRITEBACK`

The protocol changes what must be recomputed, not what must ultimately be proven.

## Existing authorities to preserve
- `AGENTS.md`
- `config/powerhouse-engineering-os.json`
- `config/brain-delivery-system.json` / BRAIN-DELIVERY-v2
- `config/brain-chat-learning-contract.json`
- `config/outcome-obligations.json`
- BG169 production promotion authority
- BG167 shared/current context read authority
- BG168/BG166 learning/outcome writeback authority
- protected `main`
- exact candidate identity and exact-SHA verification
- CurrentState and Learning semantics
- existing completion supervisor and LIVE & BEWEZEN rules

## 1. Execution Packet v2
The canonical preflight output becomes one small, machine-readable packet containing only execution-relevant state.

Required fields:
- `protocol_version`
- `task_id`
- `intent_digest`
- `execution_class`
- `main_sha`
- `last_verified_sha`
- `last_verified_state_id`
- `current_state_id`
- `component_ids`
- `delivery_lanes`
- `changed_paths`
- `resource_refs` for relevant files, tables, functions and external runtime resources
- `open_obligations`
- `relevant_learning_fingerprints`
- `known_blockers`
- `required_gates`
- `config_digest`
- `schema_digest`
- `dependency_digest`
- `test_policy_digest`
- `freshness`
- `lazy_load_refs`

The packet is bounded. Full history is never copied into it. Conflicting or insufficient state is referenced through `lazy_load_refs` and fetched only on demand.

## 2. Delta Context Engine
Context resolution is based on `last_verified_state -> current_delta`.

Rules:
- Load current canonical state and last verified state identity first.
- Compute only changed facts relevant to the task and impact graph.
- Historical records are lazy-loaded only for unresolved conflicts, missing provenance, an unknown fingerprint, a failed dedupe decision or a gate that explicitly requires historical evidence.
- The resulting model context is bounded and includes stable policy references rather than repeated policy prose.
- If state identity is missing or contradictory, fail closed to the existing full canonical preflight rather than guessing.

## 3. Deterministic execution classification
Replace the current `FAST / STANDARD / DEEP` taxonomy with:
- `FAST`: low-risk, bounded changes with known ownership and no critical contract/schema/security/publishing impact.
- `STANDARD`: normal material changes requiring targeted tests and ordinary protected delivery.
- `CRITICAL`: schema, migration, security, auth, identity/publishing gates, destructive-risk, control-plane or other high-blast-radius changes.
- `WAITING_EXTERNAL`: progress depends on an external event or hard boundary that cannot be safely satisfied by the current execution authority.

Classification runs before expensive model reasoning and must be deterministic from task intent, impacted components/contracts and risk metadata. Unknown criticality fails upward to `CRITICAL`.

## 4. No-op and dedupe gate
Before deeper reasoning or modification, evaluate whether work is already complete or exactly reusable.

Checks include:
- fix already present on current `main`;
- equivalent PR already merged;
- obligation already fulfilled with valid evidence;
- runtime already in the desired state;
- identical candidate or change fingerprint already proven;
- exact known solution reusable without conflicting delta;
- duplicate active work item already owned elsewhere.

A proven no-op produces `NO_CHANGE_NEEDED` with evidence and compact writeback. It must not run redundant build/deploy/release work.

## 5. Impact Graph and targeted testing
Extend the existing affected-test logic into a dependency-aware impact graph.

Inputs:
- changed paths;
- component ownership;
- delivery lanes;
- conflict contracts;
- schema/functions;
- runtime resources;
- dependency graph;
- test ownership/profile mapping.

Outputs:
- impacted components and contracts;
- required targeted unit, contract, integration and E2E profiles;
- mandatory critical checks;
- unaffected contracts eligible for evidence reuse;
- unknown material scope, which fails closed to the full required profile.

Targeted tests accelerate development feedback only. Candidate promotion still runs every mandatory release gate required by BRAIN-DELIVERY-v2 for that candidate and impact class.

## 6. Parallel execution DAG
A single coordinator creates small closed work packages for specialist workers.

Each work package contains:
- `id`
- exact `base_sha`
- intended `candidate_sha` or candidate identity contract
- paths/resources owned by the package
- dependencies
- contracts
- expected outputs/evidence
- test profile
- retry/idempotency policy

Independent work packages execute concurrently in deterministic waves. Work is serialized only for true dependency, changed-path overlap, declared contract overlap, shared mutable resource conflict or explicit critical gate sequencing.

The coordinator owns truth, dependency state and Definition of Done. Workers cannot independently promote to production or create alternate authority.

## 7. Evidence Cache v2
Evidence reuse is persistent, identity-safe and invalidation-driven.

Minimum cache identity:
`candidate_sha + environment + config_digest + schema_digest + dependency_digest + gate_or_test_version + relevant_contract_digest`

Every cached proof stores:
- evidence type;
- exact identity tuple;
- observed time;
- source;
- TTL/freshness class;
- invalidation rules;
- result;
- provenance/reference.

Invalidation occurs when any identity field or declared dependency changes, TTL expires, provider/runtime freshness policy requires re-read, or a critical gate explicitly forbids cache reuse.

Never cache-away:
- exact-SHA production readback;
- required security freshness checks;
- provider outcome verification when current external state matters;
- schema/migration proof after relevant schema change;
- identity/publishing final-media proof when exact external bytes/state must be read back.

## 8. Release-boundary verification
Development uses fast local/targeted feedback. Candidate promotion is the single heavy verification boundary.

Phases:
1. targeted development tests;
2. candidate assembly with exact identity;
3. full required release gates for the calculated impact/risk;
4. protected promotion through existing authority;
5. exact-SHA production readback;
6. outcome/obligation verification;
7. delta writeback.

The protocol must prevent repeated full LIVE & BEWEZEN cycles inside one unchanged candidate while preserving the final proof boundary.

## 9. Delta writeback
Writeback contains changed facts only:
- `changed`
- `evidence`
- `outcome`
- `learning`
- `obligation_delta`
- `timing`
- `cache_usage`
- `open_obligations`

Human-readable Engineering OS/System Map/documentation is updated deterministically from canonical machine state when needed. Audit history remains append-only and distinct from current-state projection.

## 10. Performance telemetry
Capture per material task:
- `context_load_ms`
- `classification_ms`
- `reasoning_ms`
- `tool_ms`
- `targeted_test_ms`
- `full_gate_ms`
- `deploy_ms`
- `proof_ms`
- `writeback_ms`
- `total_lead_time_ms`
- context bytes/tokens loaded
- evidence-cache hit/miss count and avoided gate time
- duplicate/no-op work avoided
- parallelism/concurrency utilization

Telemetry is observability, not release authority. Optimization must not weaken correctness, security, reliability or proof quality.

## 11. Compatibility and migration
Implementation must consolidate and extend existing mechanisms instead of replacing them blindly:
- evolve `scripts/brain/powerhouse-fast-execution.mjs` into the v2 preflight/context/evidence primitives;
- extend `scripts/brain/parallel-engineering-fabric.mjs` for impact-graph and DAG semantics;
- integrate through `scripts/brain/powerhouse-engineering-os.mjs` and `config/powerhouse-engineering-os.json`;
- reuse existing delivery, learning, outcome and completion-supervisor authorities;
- add versioned configuration and tests so old v1 behavior remains understood during migration;
- no parallel production authority or alternate persistent truth store.

## 12. Failure behavior
- Missing or contradictory identity -> fail closed to canonical full preflight.
- Unknown material scope -> full required tests/gates.
- Cache identity mismatch/stale proof -> recompute evidence.
- DAG dependency cycle or mutable-resource collision -> block that execution wave and surface a deterministic planner error.
- External hard boundary -> `WAITING_EXTERNAL` with a recovery packet under existing completion rules.
- Technical failure that is safely repairable -> continue the existing self-healing loop; do not terminally stop at `DEELS LIVE`.

## Acceptance criteria
The protocol is complete only when all of the following are proven:
1. Execution Packet v2 is generated deterministically and bounded.
2. Delta-context loads only changed/relevant state in normal cases and safely falls back when required.
3. Classification returns exactly `FAST`, `STANDARD`, `CRITICAL` or `WAITING_EXTERNAL`.
4. No-op/dedupe prevents redundant work with auditable evidence.
5. Impact analysis selects targeted tests and fails closed for unknown material scope.
6. Parallel DAG scheduling runs independent packages together while preventing real conflicts.
7. Evidence cache reuses only exact valid proof and invalidates correctly.
8. Full mandatory release gates still execute at the candidate promotion boundary.
9. Exact-SHA production readback is never skipped by cache.
10. Delta writeback updates canonical learning/state without duplicating historical prose.
11. Timing/lead-time telemetry is emitted for every material execution.
12. Existing Engineering OS, BRAIN-DELIVERY-v2, protected-main and completion invariants remain green.
13. Production candidate is promoted only through the existing authority and finishes LIVE & BEWEZEN with canonical learning/writeback.

## Measurement target
For ordinary non-critical changes, Powerhouse should determine the execution path within seconds, produce candidate code/tests within minutes where the underlying work allows it, and spend heavy verification time only at the promotion boundary. Baseline and post-change measurements must be recorded rather than claimed from intuition.
