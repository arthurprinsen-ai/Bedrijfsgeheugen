# Control Plane Diet — Implementation Plan

> **Required execution discipline:** execute this plan in bounded batches. After every mutation batch, record exact HEAD, changed objects, evidence, blocker and next action. Never poll successful jobs repeatedly. Never create a successor merely because a gate is queued.

**Goal:** Reduce Bedrijfsgeheugen engineering lead time by collapsing duplicate control-plane work across GitHub, Netlify, Supabase and Notion while preserving protected-main, security and production parity.

**Architecture:** GitHub owns source/delivery policy, Netlify owns web deployment, Supabase owns operational runtime/data, and Notion is a human projection. One canonical writer exists per side-effect class. CI produces immutable evidence/artifacts that downstream stages reuse instead of rebuilding/re-proving.

**Approved design:** `docs/superpowers/specs/2026-10-06-control-plane-diet-design.md`

---

## Execution protocol

For every task below:

1. Read current main/production state first.
2. Make the smallest coherent change.
3. Run only the directly relevant test/readback.
4. If terminal failure occurs, inspect only that failed job/step.
5. If external work is queued/in-progress, checkpoint and continue independent work.
6. Never declare a phase complete without readback.
7. Never delete a resource solely because its name looks stale.

## Batch 0 — Baseline and freeze control-plane growth

### Task 0.1: Add machine-readable architecture budgets

**Files:**
- Create: `config/control-plane-budget.json`
- Create: `tools/ci/check-control-plane-budget.mjs`
- Test: `tests/ci/control-plane-budget.test.mjs`

**Budget configuration:**

```json
{
  "github": {
    "maxTopLevelTriggeredWorkflows": 15,
    "maxOpenImplementationPRs": 10,
    "maxLivePRsPerObligation": 1,
    "maxSuccessorDepth": 1
  },
  "netlify": {
    "maxActiveBedrijfsgeheugenProjects": 5,
    "defaultEphemeralTtlDays": 7
  },
  "supabase": {
    "maxActiveEdgeFunctions": 40
  },
  "notion": {
    "maxPrivateRootItems": 50
  },
  "runtime": {
    "maxPollingSeconds": 120,
    "maxIdenticalDeploysPer30Minutes": 2
  }
}
```

**Implementation requirements:**
- First version is report-only for existing debt.
- It must fail on *new* budget regression relative to the checked-in baseline.
- Output JSON evidence to `artifacts/control-plane-budget.json`.
- Do not make the historical over-budget state block all development.

**Commit:** `ci: freeze control plane growth with architecture budgets`

### Task 0.2: Add evidence envelope contract

**Files:**
- Create: `schemas/delivery-evidence.schema.json`
- Create: `tools/ci/write-delivery-evidence.mjs`
- Test: `tests/ci/delivery-evidence.test.mjs`

Required fields:
- obligation_id
- source_sha
- artifact_hash
- contract_version
- provider
- provider_object_id
- started_at
- completed_at
- result
- proof

Evidence must be immutable/content-addressed after completion.

**Commit:** `ci: add immutable delivery evidence contract`

### Task 0.3: Add churn circuit breaker

**Files:**
- Create: `tools/ci/control-plane-circuit-breaker.mjs`
- Test: `tests/ci/control-plane-circuit-breaker.test.mjs`

Trip when:
- successor depth > 1;
- >3 head rewrites without semantic source change;
- same failure signature repeats twice after repair;
- identical artifact is rebuilt >2 times;
- >1 recovery controller claims one obligation.

On trip: emit one diagnostic artifact and stop mutation. Do not create another recovery PR.

**Commit:** `ci: stop recursive recovery churn`

---

## Batch 1 — GitHub PR admission consolidation

### Task 1.1: Inventory workflow trigger ownership

**Files:**
- Create: `docs/ops/workflow-trigger-inventory.md`
- Create: `config/workflow-trigger-owners.json`
- Create: `tools/ci/inventory-workflow-triggers.mjs`

For every file under `.github/workflows`, capture:
- top-level triggers;
- reusable-only status;
- provider mutations;
- expensive jobs;
- overlapping workflow purpose;
- replacement target;
- retirement status.

Do not retire anything yet.

**Commit:** `ci: inventory workflow trigger ownership`

### Task 1.2: Create canonical Required workflow

**Files:**
- Modify/Create: `.github/workflows/required.yml`
- Create/modify reusable workflows as required.

Required performs only:
- exact-head identity;
- lease/branch hygiene;
- changed-path classification;
- lint/type/syntax;
- affected unit/contract tests;
- lightweight static safety;
- architecture-budget regression check.

Hard requirements:
- no deployment;
- no full browser suite;
- no full Supabase replay/readback;
- no polling another workflow;
- no successor creation;
- target p95 <60s, normal hard ceiling 120s.

**Commit:** `ci: make Required the single PR admission path`

### Task 1.3: Convert duplicate PR workflows to reusable calls

For every workflow currently triggered by `pull_request`:
- if logic is still needed, convert it to `workflow_call` or script;
- invoke only from Required or merge gate;
- otherwise retire it.

Prove an ordinary PR produces exactly one top-level admission workflow.

**Commit:** `ci: remove duplicate pull request fan-out`

### Task 1.4: Build central PR lifecycle janitor

**Files:**
- Create: `tools/ci/pr-lineage-janitor.mjs`
- Create: `config/pr-obligation-rules.json`
- Test: `tests/ci/pr-lineage-janitor.test.mjs`

Classify open PRs:
- CURRENT
- SUPERSEDED
- STALE
- BLOCKED
- ARCHIVE

Dry-run first. Produce exact list of PRs proposed for closure and why.

Only after readback, close proven stale/superseded PRs.

Never close:
- the current live implementation PR;
- PRs with unique unmerged semantic changes;
- PRs whose obligation cannot be identified.

**Commit:** `ci: enforce one live pull request per obligation`

---

## Batch 2 — Build once / artifact reuse

### Task 2.1: Define artifact identity

**Files:**
- Create: `tools/build/artifact-id.mjs`
- Create: `config/build-contract.json`
- Test: `tests/build/artifact-id.test.mjs`

Compute:

`sha256(source_manifest + lockfile + toolchain_manifest + build_contract_version)`

The same inputs must always produce the same artifact id.

**Commit:** `build: make release artifacts content addressed`

### Task 2.2: Produce one website artifact

Update the canonical build workflow to upload:
- deployable output;
- manifest;
- artifact hash;
- test/evidence bundle;
- provenance.

Do not rebuild the same artifact in later jobs.

**Commit:** `build: produce one immutable website artifact`

### Task 2.3: Reuse artifact in merge/release

Merge/release downloads the exact artifact produced for the accepted source SHA.

Fallback rebuild is allowed only when:
- artifact missing;
- provenance invalid;
- build-contract version changed.

Fallback must be recorded explicitly in evidence.

**Commit:** `release: reuse verified build artifact`

### Task 2.4: Replace full production re-proof with identity readback

Readback chain:

`source SHA -> artifact hash -> Netlify deploy id -> live release marker/hash`

Target healthy-provider readback <30 seconds.

**Commit:** `release: verify production by artifact identity`

---

## Batch 3 — Netlify cleanup and acceleration

### Task 3.1: Inventory all 16 projects

Create:
- `config/netlify-project-registry.json`
- `docs/ops/netlify-project-inventory.md`

Classify each project:
- PROD
- ACTIVE_NONPROD
- EPHEMERAL
- ARCHIVE
- DELETE_CANDIDATE

Capture:
- site id;
- custom domains;
- repo linkage;
- deploy activity;
- open PR references;
- runtime dependencies;
- intended expiry.

**Commit:** `ops: classify Netlify project lifecycle`

### Task 3.2: Consolidate Bedrijfsgeheugen deploy authority

Prove `bedrijfsgeheugen` is the only production authority.

Determine whether `bg-portaal-bronsync` is required. If not, migrate required functionality first, verify production, then retire it.

**Commit:** `deploy: enforce one Netlify production authority`

### Task 3.3: Add ephemeral TTL janitor

**Files:**
- Create: `tools/netlify/ephemeral-janitor.mjs`
- Test: `tests/netlify/ephemeral-janitor.test.mjs`

Default expiry: 7 days.

Never delete if:
- custom domain exists;
- production alias exists;
- active dependency exists;
- open PR references it;
- release contract references site id.

Run dry first, then delete only confirmed candidates.

**Commit:** `ops: expire safe Netlify preview infrastructure`

### Task 3.4: Cache and skip unchanged scopes

Implement deterministic cache keys and changed-scope skips.

Prefer artifact upload to a second Netlify build.

**Commit:** `build: eliminate redundant Netlify work`

---

## Batch 4 — Supabase runtime consolidation

### Task 4.1: Add Edge Function registry

**Files:**
- Create: `config/supabase-edge-functions.json`
- Create: `tools/supabase/inventory-edge-functions.mjs`

For all 115 functions capture:
- domain;
- public/internal;
- writer/read-only;
- auth mode;
- source callers;
- telemetry/call evidence;
- replacement;
- deprecation state;
- deletion-after.

No deletion in this task.

**Commit:** `supabase: inventory edge function ownership`

### Task 4.2: Identify consolidation candidates

Group into:
- Brain
- Content
- Social
- Commercial
- Portal
- Operations
- provider callbacks

Candidates with no external API contract and only internal sequencing become modules behind a domain gateway/worker.

Produce before/after call graph.

**Commit:** `supabase: define domain runtime boundaries`

### Task 4.3: Introduce durable job queue

**Migration:**
- create queue table(s) with state, idempotency key, available_at, lease, attempts, payload and evidence reference;
- indexes for claim path;
- RLS/service-role posture explicit.

**Worker:**
- bounded batch claim;
- `FOR UPDATE SKIP LOCKED`;
- short transaction;
- idempotent side effects;
- terminal evidence.

Migrate one low-risk internal orchestration path first and prove parity.

**Commit:** `supabase: add durable event driven job execution`

### Task 4.4: Consolidate internal Edge Functions

Migrate internal-only chains incrementally to domain workers/modules.

For each function:
1. prove caller set;
2. migrate callers;
3. production readback;
4. observe;
5. mark deprecated;
6. delete only after no-call proof.

Target <=40 active functions unless an exception has explicit justification.

**Commit series:** `supabase: consolidate <domain> runtime`

### Task 4.5: Database performance cleanup

Order:
1. remove 3 proven duplicate indexes;
2. assess/add 10 FK indexes where query patterns justify;
3. observe 127 unused indexes over representative period;
4. remove only high-confidence unused indexes;
5. analyze query plans before/after.

No advisor-only mass deletion.

**Commit:** `db: remove proven index waste`

### Task 4.6: Resolve Supabase security debt

Resolve:
- 8 security-definer view errors;
- 4 mutable search-path warnings;
- materialized-view API exposure;
- unnecessary security-definer execution grants;
- classify 156 RLS/no-policy tables.

Do not add permissive policies merely to clear lint.

**Commit series:** `security: harden Supabase access contracts`

---

## Batch 5 — Notion information lifecycle

### Task 5.1: Establish six canonical roots

Map/reuse existing hubs where possible:

1. Strategy & Research
2. Product & Technology
3. Content & Marketing
4. Sales & Relationships
5. Operations
6. Archive

Do not duplicate an existing good hub solely to normalize naming.

### Task 5.2: Classify 329 untitled root pages

For each page capture:
- content present/empty;
- duplicate signature;
- last edit;
- inbound references where available;
- likely source/sync;
- target hub;
- action: MOVE / TITLE / MERGE / ARCHIVE / DELETE_CANDIDATE.

Dry-run report first.

### Task 5.3: Move/title/archive safely

Apply non-destructive actions first:
- title useful content;
- move to canonical hub;
- archive obsolete but uncertain items.

Delete only proven empty/duplicate/unreferenced pages.

Target <=50 root items.

### Task 5.4: Make Notion sync projection-only

Audit `bg-notion-sync` callers and writes.

Target:

`canonical machine state -> Notion projection`

Inbound Notion control is permitted only for explicitly modeled human approval/input objects.

**Commit:** `ops: make Notion a projection not runtime authority`

---

## Batch 6 — Hard enforcement and janitors

### Task 6.1: Make architecture budgets blocking

After cleanup reaches targets:
- change report-only legacy debt handling to strict enforcement;
- exceptions require owner, reason and expiry.

**Commit:** `ci: enforce control plane architecture budgets`

### Task 6.2: Weekly lifecycle janitor

One scheduled workflow produces a report for:
- stale PRs;
- extra workflow triggers;
- old Netlify ephemeral sites;
- deprecated/no-call Edge Functions;
- Notion root growth;
- repeated artifact deployments.

It must not automatically perform risky destructive actions. Safe TTL deletions may be automated only where the registry proves eligibility.

**Commit:** `ops: add bounded weekly lifecycle janitor`

### Task 6.3: Performance SLO dashboard

Persist:
- PR admission p50/p95;
- queue delay;
- workflow count per SHA;
- rebuild count;
- deploy count;
- production readback latency;
- successor count;
- polling time.

Regression thresholds create one diagnostic issue/evidence object, not recursive repair PRs.

**Commit:** `ops: measure engineering lead time SLOs`

---

## Final verification

The implementation is terminal only after readback proves:

- <=15 independently triggered top-level GitHub workflows;
- ordinary PR produces one admission workflow;
- <=10 open implementation/recovery PRs;
- one live PR per obligation;
- immutable build artifact reused for release;
- production identity readback works without full rebuild;
- <=5 active Bedrijfsgeheugen Netlify projects;
- TTL enforcement exists for temporary projects;
- <=40 active Supabase Edge Functions or explicit justified exceptions;
- duplicate indexes zero;
- Supabase security ERROR findings zero;
- Notion private root <=50;
- architecture-budget test blocks new regression;
- measured PR admission p95 <60s under normal runner conditions.

Only then use the labels:

`TERMINAL_GREEN / LIVE_PROVEN`
