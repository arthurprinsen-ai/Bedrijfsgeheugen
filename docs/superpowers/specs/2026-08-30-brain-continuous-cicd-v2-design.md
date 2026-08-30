# BRAIN Continuous CI/CD v2 — Architecture Design

## Status
Approved architectural direction: every safe change is independently releasable and is promoted to `main` and production as soon as its own gates are green. No batching or waiting for unrelated work.

## Goal
Make Bedrijfsgeheugen one continuously delivering Brain in which website, portal, backend, Netlify functions, GitHub workflows, Make scenarios, agents and future apps can all be developed simultaneously without being blocked merely because `main` has advanced.

The governing loop is:

**change → isolate → classify → test in parallel → reconcile moving main → merge immediately → deploy immediately → verify exact production state → measure → learn → shared memory**

## Architectural principles

### 1. `main` is moving truth
`main` is expected to change continuously. New commits on `main` are normal concurrent progress, not branch failure.

A feature branch is never rebuilt, replayed or rebased solely because it is behind `main`.

Synchronization is required only when one of these conditions is proven:
- Git merge conflict;
- changed-path overlap that can alter the candidate;
- shared contract/schema/API overlap;
- protected invariant changed by both sides;
- equivalent work already landed and must be deduplicated.

If there is no relevant overlap and the branch is mergeable, the tested feature head stays valid. The resulting merge commit with current `main` becomes the production candidate.

### 2. Smallest independently safe change is the release unit
There are no release batches for unrelated work. Every bounded change is released independently as soon as it is green.

Examples:
- Agent A changes website navigation and can release while Agent B is still developing portal functionality.
- Agent C fixes a backend function and can release without waiting for Make optimization work.
- Agent D adds an agent/scenario and can release independently if its Brain, security, cost and outcome contracts are green.

A release is delayed only by its own dependencies or by a proven shared-contract conflict.

### 3. Short-lived isolation, not direct unverified writes to production
Agents do not use long-lived feature branches as queues. They create short-lived isolation branches from current `main` for the smallest safe change.

Typical lifecycle:
1. create branch from current `main`;
2. make one bounded atomic change;
3. run relevant tests and preview;
4. reconcile only proven overlap with current `main`;
5. merge immediately when green;
6. delete/retire the branch.

Branch lifetime should normally be minutes, not days.

### 4. Atomic writes are preferred
For bounded multi-file work, the preferred repository mutation is one Git tree/commit rather than a sequence of independent file API commits.

Benefits:
- all files represent one coherent candidate;
- fewer intermediate broken states;
- lower GitHub/API cost;
- faster branch construction;
- easier rollback and provenance.

Serial file writes are reserved for cases where the tool or safety contract requires them.

## Continuous Parallel Promotion architecture

### Change Producer
Any current or future builder can be a Change Producer:
- ChatGPT/Codex agent;
- website agent;
- portal agent;
- backend agent;
- reliability/security/cost agent;
- SEO/content agent when code/config changes are required;
- Make scenario that safely produces repository changes;
- GitHub workflow or future app registered in the Brain.

Every Change Producer must consume shared Brain context before acting and write a material outcome after completion.

### Change Envelope
Every proposed change is represented by a machine-readable envelope with at least:
- `changeId`;
- `missionId` or obligation id;
- owner agent/component;
- base SHA;
- feature SHA;
- changed paths;
- affected Brain domains/lanes;
- affected contracts/schemas;
- risk class;
- required tests;
- rollback/revert strategy;
- hard-boundary classification;
- expected outcome evidence.

The envelope follows the candidate through GitHub, CI, Netlify, production verification and BG168 learning.

### Scope/Conflict Index
Before merge, the Brain computes a conflict index between the candidate and commits added to `main` after the candidate base.

The index distinguishes:
- `NO_RELEVANT_DRIFT`: unrelated changes; no sync required;
- `DUPLICATE_ALREADY_LANDED`: reuse/dedupe; do not repeat work;
- `PATH_OVERLAP_SAFE`: same broad area but contracts/invariants prove independence;
- `CONTRACT_OVERLAP`: re-test/reconcile affected contract only;
- `MERGE_CONFLICT`: reconcile affected files only;
- `HARD_BOUNDARY`: stop only for the existing security/credential/destructive/paid/legal-financial boundaries.

`behind_by > 0` is never itself a conflict state.

### Lane execution
`BRAIN-DELIVERY-v1` lane classification remains useful, but lanes no longer imply batching.

For each individual change, only affected lanes run. They may include:
- backend;
- website;
- portal;
- workflow/automation;
- Make/scenario contract checks;
- security/governance;
- cost/performance.

Independent lanes run concurrently. An unaffected lane must not create unnecessary waiting.

### Integration candidate
The integration candidate is created at merge time against current `main`.

Rules:
- no artificial requirement for feature head `behind_by=0`;
- no full feature replay merely because unrelated commits landed;
- merge is permitted when the conflict index proves the new `main` changes irrelevant or safely compatible;
- if relevant overlap exists, only the overlapping contract/files are reconciled and re-tested;
- the exact resulting merge SHA becomes the production candidate.

### Immediate production promotion
When an individual merge SHA passes its required production gates, BG169 promotes it immediately.

There is no scheduled release train and no waiting for unrelated branches.

For each merge:
1. exact merge SHA identified;
2. exact-source preflight passes;
3. Netlify/GitHub deployment uses that exact candidate;
4. production deployment reaches `ready`;
5. required smoke/regression/protected metrics pass;
6. outcome evidence is written;
7. BG168 records the outcome/learning;
8. BG167 refreshes current state.

Meanwhile, other agents continue building. They do not block on the production verification of unrelated work unless they depend on its contract.

## App and platform integration

### GitHub
GitHub is the source-control and candidate-integration plane.

Required capabilities:
- short-lived branch creation from current `main`;
- atomic tree/commit writes;
- base/head changed-path comparison;
- semantic/shared-contract conflict classification;
- PR/mergeability evidence;
- exact expected-head merge protection;
- per-change CI status;
- automatic merge after gates are green;
- automatic stale/superseded PR cleanup.

### Netlify
Netlify is the web/functions production plane.

Required capabilities:
- preview from exact feature SHA where useful;
- production from exact merge SHA;
- `commit_ref` or equivalent exact-source evidence;
- headers/redirects/functions/edge/secret-scan evidence;
- last-known-good rollback;
- no unrelated candidate waiting.

### Make
Make is an execution platform inside the Brain, not a separate delivery island.

All current and future development-capable scenarios must:
- read BG167 shared current context before repository mutation;
- include the current branch/concurrency policy;
- register cost class and ownership;
- use idempotency/dedupe fingerprints;
- never recreate a branch solely because `main` advanced;
- write material outcomes through BG168;
- defer production authority to BG169;
- obey the same hard boundaries as agents.

Operational Make scenarios that do not change code still use shared context, outcome obligations, cost governance and learning, but do not need Git branch creation.

### Agents
Every agent inherits the same delivery contract automatically through Brain membership.

A new agent is not production-ready unless it has:
- shared-context read;
- change-envelope creation for repository changes;
- conflict-index use;
- outcome-obligation support;
- material-outcome writeback;
- cost/security governance;
- BG169 production-authority handoff;
- reuse/dedupe of existing work.

### Future apps/platforms
A new application or external platform becomes part of the same architecture through a Brain delivery adapter. The adapter maps the platform into:
- source/change identity;
- test/validation status;
- deploy identity;
- outcome evidence;
- rollback mechanism;
- cost/security signals.

No new platform may create its own isolated release truth.

## Dependency and contract safety
Parallel development must not rely only on file paths. Two changes in different files can still conflict through an API, schema, route, state shape or design invariant.

Therefore shared contracts are first-class conflict keys. Examples:
- API request/response schema;
- portal state schema;
- database/read-model schema;
- route/navigation contract;
- accepted website baseline;
- design tokens shared by website/portal;
- environment/runtime interface;
- Make webhook/input-output contract;
- agent/shared-memory contract;
- Netlify build/deploy contract.

Breaking contract changes require compatibility handling, versioning or synchronized dependent changes. Additive compatible changes can continue independently.

## Failure isolation and rollback
A failed candidate must not halt unrelated delivery.

Rules:
- production remains last-known-good;
- the failing change is isolated;
- unrelated green changes continue toward production;
- retries are bounded and hypothesis-driven;
- rollback/revert targets the smallest offending change where safe;
- if a later main commit depends on the failed change, the dependency graph determines a coordinated rollback rather than blindly reverting history;
- errors and recoveries are recorded in BG168 and become reusable prevention rules.

## Concurrency ownership
Agents do not need exclusive global locks. Global locking would destroy throughput.

The architecture uses narrow leases only for truly conflicting resources, such as:
- same database migration identifier;
- same shared schema version;
- same protected config key;
- same irreversible external side effect;
- same legally binding operation.

Normal code/path overlap is resolved through the conflict index and Git merge/retest process rather than long-lived locks.

## Cost and speed requirements
The delivery architecture itself is subject to continuous optimization.

Required metrics include:
- branch creation latency;
- branch rebuild count caused by non-overlapping drift (target: 0);
- atomic vs serial write count;
- CI duration per lane;
- percentage of unaffected lanes skipped;
- time from green candidate to production;
- merge conflict rate;
- duplicate-work rate;
- rollback rate;
- GitHub/Netlify/Make operation cost per successful production change.

Agents continuously reduce these costs without weakening correctness, security or outcome evidence.

## Brain control plane
The existing Brain components remain authoritative:
- **BG167** — current shared context and active dependency/concurrency state;
- **BG168** — material outcomes, incidents, patterns and reusable learning;
- **BG169** — sole production promotion/rollback authority.

The architecture adds three logical control-plane functions, which can initially live inside the existing Brain delivery tooling:
- **Change Registry** — tracks active change envelopes;
- **Conflict Index** — evaluates drift/overlap/contract impact;
- **Continuous Promotion Controller** — promotes each independently green change immediately instead of forming batches.

These are logical responsibilities, not necessarily new paid services.

## Machine states
Every repository change moves through these states:

`PROPOSED`
→ `ISOLATED`
→ `TESTING`
→ `CANDIDATE_GREEN`
→ `MAIN_RECONCILE`
→ `MERGED`
→ `PRODUCTION_PROMOTING`
→ `PRODUCTION_GREEN`
→ `LEARNING_WRITTEN`

Alternative states:
- `SUPERSEDED_DEDUPED`;
- `RECONCILE_REQUIRED`;
- `ROLLED_BACK_GREEN`;
- `BLOCKED_HARD_BOUNDARY`.

`MAIN_MOVED` is deliberately not a failure state.

## CI/CD trigger model
Automatic CI/CD is event-driven:
- branch/change commit → relevant candidate tests/preview;
- candidate green → current-main conflict evaluation;
- compatible → automatic merge;
- merge SHA → immediate production promotion;
- production result → exact verification + outcome writeback;
- failure → self-heal/rollback path;
- BG167/BG168 updates → all agents receive the new truth on their next execution.

No manual release button is required for ordinary safe changes.

## Security and hard boundaries
The existing hard boundaries remain immutable. Automatic CI/CD must not autonomously:
- change secrets/credentials/permissions;
- weaken security controls;
- perform destructive or irreversible data mutations;
- increase paid external resources;
- execute legally or financially binding actions.

These boundaries stop only the affected action, not unrelated development and deployment.

## Required invariants
1. `MAIN MAY MOVE; SAFE WORK MUST CONTINUE`.
2. `NO REBUILD FOR NON-OVERLAPPING MAIN DRIFT`.
3. `SMALLEST SAFE CHANGE RELEASES IMMEDIATELY`.
4. `UNRELATED WORK NEVER WAITS`.
5. `EXACT MERGE SHA IS THE PRODUCTION CANDIDATE`.
6. `GREEN MEANS PRODUCTION OUTCOME VERIFIED`.
7. `ONE BRAIN, ONE SHARED CONTEXT, ONE PRODUCTION AUTHORITY`.
8. `FAILURE IS ISOLATED; LAST-KNOWN-GOOD STAYS AVAILABLE`.
9. `EVERY MATERIAL OUTCOME BECOMES SHARED LEARNING`.
10. `NEW APPS, AGENTS AND SCENARIOS INHERIT THIS CONTRACT AUTOMATICALLY`.

## Acceptance criteria
The architecture is implemented when all of the following are true:
- two or more independent feature changes can be built simultaneously while `main` advances;
- a branch with unrelated drift is never rebuilt merely to reach `behind_by=0`;
- independently green changes merge and deploy one-by-one without waiting for each other;
- actual overlap triggers bounded reconciliation rather than full branch reconstruction;
- shared contracts detect cross-file semantic overlap;
- exact merge SHA is verified in production for every release;
- a failed change does not block unrelated green releases;
- BG167 exposes active change/concurrency state;
- BG168 receives merge/deploy/failure/recovery learning;
- BG169 remains the sole production authority;
- all current and future development-capable agents/Make scenarios inherit the contract;
- CI tests fail if the old rebuild-on-drift or batch-release behavior is reintroduced;
- operational metrics prove branch rebuilds due solely to non-overlapping drift remain zero.

## Migration strategy
The architecture is introduced additively over the already-live `BRAIN-DELIVERY-v1` and fast-branch policy.

Phase 1: formalize change envelope and conflict index in existing delivery tooling.

Phase 2: change the unified delivery workflow from batch-oriented integration semantics to per-change continuous promotion while retaining lane parallelism.

Phase 3: project active change/concurrency state into BG167 and route outcomes through BG168.

Phase 4: require every development-capable Make scenario and agent membership to inherit the same contract.

Phase 5: instrument throughput/cost/conflict metrics and let optimization agents continuously improve the delivery path.

At no point is the current working production path removed before the replacement proves itself green.