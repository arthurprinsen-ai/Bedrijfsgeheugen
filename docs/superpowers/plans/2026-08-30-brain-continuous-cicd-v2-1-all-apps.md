# BRAIN Continuous CI/CD v2.1 — All Apps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every current and future Bedrijfsgeheugen-connected app, agent and scenario participate in one automatic continuous CI/CD architecture where each independently safe green change is activated immediately and unrelated work is never batched or blocked.

**Architecture:** Extend the existing `BRAIN-DELIVERY-v1`, fast-branch policy and BG167/BG168/BG169 control plane with a universal change envelope, complete platform registry, cross-platform conflict/dependency index and platform-native delivery adapters. Repository-backed changes continue through short-lived Git isolation and exact merge-SHA deployment; non-Git SaaS/config/data changes use their own atomic/versioned mutation and read-back mechanisms but inherit the same Brain governance, outcome, security, cost and learning contracts.

**Tech Stack:** Node.js 24, GitHub Actions, GitHub Git Data API, Netlify, Make, Notion, Supabase, DataForSEO, Bedrijfsgeheugen Brain BG166/BG167/BG168/BG169, existing repository tests and policy JSON.

**Spec:** `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md` and `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-1-all-apps-design.md`

## Global Constraints

- Every independently safe green change activates immediately; unrelated changes are never accumulated into a batch.
- `main` may move continuously; unrelated drift must never trigger branch rebuild/replay/rebase solely to reach `behind_by=0`.
- Repository changes use short-lived isolation and exact merge-SHA production verification.
- Non-Git platforms use platform-native atomicity/versioning plus exact live-state read-back evidence.
- Cross-platform contracts, not application names or file paths alone, determine dependencies and conflicts.
- BG167 is shared current context, BG168 is material outcome/learning routing and BG169 is production authority.
- All connected platforms must be registered; missing registration is an architecture gap, not an exemption.
- A red change blocks only itself and true dependents; unrelated green changes continue.
- Existing hard boundaries for secrets/permissions/security/destructive data/paid resources/legal-financial actions remain immutable.
- Existing last-known-good production remains protected throughout migration.

---

### Task 1: Make the universal delivery contract machine-readable

**Files:**
- Modify: `config/brain-delivery-system.json`
- Modify: `tests/brain-delivery-system.test.mjs`

**Interfaces:**
- Consumes: existing `BRAIN-DELIVERY-v1` policy and `branchPolicy`.
- Produces: `continuousPromotion`, `platformPolicy` and `contractConflictPolicy` configuration consumed by delivery tooling and onboarding validation.

- [ ] **Step 1: Write failing policy tests**

Add tests asserting the policy contains:

```js
assert.equal(policy.continuousPromotion.releaseUnit, 'smallest-independently-safe-change');
assert.equal(policy.continuousPromotion.batchUnrelatedChanges, false);
assert.equal(policy.continuousPromotion.activateImmediatelyWhenGreen, true);
assert.equal(policy.platformPolicy.requireRegistration, true);
assert.equal(policy.platformPolicy.nonGitRequiresReadBackEvidence, true);
assert.equal(policy.contractConflictPolicy.behindByIsConflict, false);
```

Also assert required known platforms include `github`, `netlify`, `make`, `notion`, `supabase`, `dataforseo`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/brain-delivery-system.test.mjs
```

Expected: FAIL because the new policy properties do not yet exist.

- [ ] **Step 3: Add minimal policy configuration**

Extend `config/brain-delivery-system.json` with:

```json
{
  "continuousPromotion": {
    "releaseUnit": "smallest-independently-safe-change",
    "batchUnrelatedChanges": false,
    "activateImmediatelyWhenGreen": true,
    "failureIsolation": true
  },
  "platformPolicy": {
    "requireRegistration": true,
    "nonGitRequiresReadBackEvidence": true,
    "knownRequiredPlatforms": ["github", "netlify", "make", "notion", "supabase", "dataforseo"]
  },
  "contractConflictPolicy": {
    "behindByIsConflict": false,
    "pathOverlapRequiresClassification": true,
    "contractOverlapRequiresRevalidation": true,
    "globalLockingAllowed": false
  }
}
```

Preserve all existing fields and fast-branch behavior.

- [ ] **Step 4: Re-run focused tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/brain-delivery-system.json tests/brain-delivery-system.test.mjs
git commit -m "arch: define universal continuous promotion policy"
```

---

### Task 2: Add the universal Change Envelope and contract keys

**Files:**
- Create: `platform/delivery/change-envelope.mjs`
- Create: `tests/change-envelope.test.mjs`

**Interfaces:**
- Produces: `createChangeEnvelope(input)` returning an immutable object with `changeId`, `owner`, `platform`, `baseVersion`, `candidateVersion`, `changedResources`, `contractKeys`, `riskClass`, `requiredGates`, `rollbackStrategy`, `hardBoundary`, `expectedEvidence`.

- [ ] **Step 1: Write failing Change Envelope tests**

Test a GitHub change and a Supabase change. Require stable normalization, deduped/sorted resources and contract keys, and rejection when owner/platform/evidence are missing.

Example assertion:

```js
const envelope = createChangeEnvelope({
  changeId: 'chg-123',
  owner: 'agent-portal',
  platform: 'github',
  baseVersion: 'a'.repeat(40),
  candidateVersion: 'b'.repeat(40),
  changedResources: ['portal/app.mjs'],
  contractKeys: ['portal-state:v4'],
  riskClass: 'reversible',
  requiredGates: ['portal-regression'],
  rollbackStrategy: 'revert-merge',
  hardBoundary: false,
  expectedEvidence: ['exact-production-sha']
});
assert.equal(envelope.platform, 'github');
assert.deepEqual(envelope.contractKeys, ['portal-state:v4']);
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/change-envelope.test.mjs
```

Expected: module not found/function absent.

- [ ] **Step 3: Implement minimal pure module**

No external calls. Validate required fields, normalize arrays, freeze nested structures, retain platform-native version strings without forcing Git SHA format.

- [ ] **Step 4: Re-run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/delivery/change-envelope.mjs tests/change-envelope.test.mjs
git commit -m "feat: add universal Brain change envelope"
```

---

### Task 3: Build a cross-platform conflict/dependency index

**Files:**
- Create: `platform/delivery/conflict-index.mjs`
- Create: `tests/conflict-index.test.mjs`

**Interfaces:**
- Consumes: two or more Change Envelopes.
- Produces: `classifyConflict(candidate, concurrentChanges)` returning `NO_RELEVANT_DRIFT`, `DUPLICATE_ALREADY_LANDED`, `PATH_OVERLAP_SAFE`, `CONTRACT_OVERLAP`, `MERGE_CONFLICT`, or `HARD_BOUNDARY` plus affected resources/contracts.

- [ ] **Step 1: Write failing classification tests**

Cover:

```js
assert.equal(classifyConflict(portalChange, [seoChange]).state, 'NO_RELEVANT_DRIFT');
assert.equal(classifyConflict(portalChange, [supabaseSameSchema]).state, 'CONTRACT_OVERLAP');
assert.equal(classifyConflict(makeScenarioChange, [notionSchemaChange]).state, 'CONTRACT_OVERLAP');
```

Also prove `behindBy` is ignored unless overlap exists.

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/conflict-index.test.mjs
```

- [ ] **Step 3: Implement deterministic classification**

Use exact normalized changed-resource and contract-key intersections. Do not infer conflicts from platform name alone. Support an explicit `mergeConflict=true` signal from GitHub integration.

- [ ] **Step 4: Re-run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/delivery/conflict-index.mjs tests/conflict-index.test.mjs
git commit -m "feat: add cross-platform conflict index"
```

---

### Task 4: Expand the Brain platform registry to the complete active estate

**Files:**
- Modify: `docs/brain/component-registry.json`
- Create: `platform/delivery/platform-registry.mjs`
- Create: `tests/platform-registry.test.mjs`

**Interfaces:**
- Produces: normalized active platform entries with `key`, `platform`, `owner`, `adapterType`, `productionIdentity`, `validation`, `activation`, `readBackEvidence`, `rollback`, `costClass`, `securityClass`, `brainContractVersion`.

- [ ] **Step 1: Write failing completeness test**

Require explicit registered platform entries for:

```js
['github', 'netlify', 'make', 'notion', 'supabase', 'dataforseo']
```

Require every active platform entry to have `brain.v1`, cost/security governance and a read-back evidence strategy.

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/platform-registry.test.mjs
```

Expected: Notion/Supabase and possibly other fields are missing.

- [ ] **Step 3: Add platform registry loader/validator**

Implement `validatePlatformRegistry(registry, requiredPlatforms)` as a pure module that fails closed on missing or incomplete active platforms.

- [ ] **Step 4: Register known current platforms**

Add platform entries for GitHub, Netlify, Make, Notion, Supabase and DataForSEO using existing real component identifiers/connections where already known. Do not invent credentials or secret identifiers. Where a platform connector exists but no stable external id belongs in source control, store the platform key and adapter contract only.

- [ ] **Step 5: Re-run tests**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/brain/component-registry.json platform/delivery/platform-registry.mjs tests/platform-registry.test.mjs
git commit -m "arch: register all active Brain delivery platforms"
```

---

### Task 5: Convert repository delivery from batch semantics to per-change continuous promotion

**Files:**
- Modify: `tools/brain-delivery-system.mjs`
- Modify: `.github/workflows/unified-brain-delivery.yml`
- Modify: `tests/brain-delivery-system.test.mjs`

**Interfaces:**
- Consumes: Change Envelope, conflict classification, affected lanes.
- Produces: one individually promotable exact merge candidate per green change.

- [ ] **Step 1: Add failing tests for immediate release semantics**

Assert:

```js
assert.equal(plan.production.batchRequired, false);
assert.equal(plan.production.activateImmediatelyWhenGreen, true);
assert.equal(plan.production.waitForUnrelatedChanges, false);
```

Add a test proving an unrelated concurrent change does not add a dependency to the delivery plan.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
node --test tests/brain-delivery-system.test.mjs
```

- [ ] **Step 3: Update planner output**

Keep lane parallelism but remove semantics that require unrelated lanes/features to form one future release batch. The plan is scoped to one change envelope and its true affected lanes/dependencies.

- [ ] **Step 4: Update workflow**

The GitHub workflow must:

1. validate the individual candidate;
2. run only affected lanes in parallel;
3. evaluate current-main overlap before merge;
4. skip branch reconstruction on unrelated drift;
5. expose an immediate promotion-ready result for that change;
6. never wait for unrelated PRs/branches.

- [ ] **Step 5: Re-run tests and workflow syntax validation**

```bash
node --test tests/brain-delivery-system.test.mjs
node scripts/brain/test-all.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/brain-delivery-system.mjs .github/workflows/unified-brain-delivery.yml tests/brain-delivery-system.test.mjs
git commit -m "feat: promote every green change independently"
```

---

### Task 6: Add platform-native delivery adapter contracts

**Files:**
- Create: `platform/delivery/adapters/contract.mjs`
- Create: `platform/delivery/adapters/github.mjs`
- Create: `platform/delivery/adapters/netlify.mjs`
- Create: `platform/delivery/adapters/make.mjs`
- Create: `platform/delivery/adapters/notion.mjs`
- Create: `platform/delivery/adapters/supabase.mjs`
- Create: `platform/delivery/adapters/dataforseo.mjs`
- Create: `tests/delivery-adapters.test.mjs`

**Interfaces:**
- Every adapter implements:

```js
{
  platform,
  classifyChange(input),
  validateCandidate(input),
  activate(input),
  readBack(input),
  rollback(input)
}
```

The first implementation may expose pure planning/validation functions and delegate live connector calls to existing orchestrators. No credentials are embedded.

- [ ] **Step 1: Write contract tests**

Require all six adapters and identical interface shape. Add platform-specific evidence expectations:

- GitHub: exact merge SHA;
- Netlify: exact `commit_ref`/deploy identity + ready state;
- Make: scenario id + `lastEdit`/execution evidence;
- Notion: page/database/schema object identity + post-write read-back;
- Supabase: migration/schema/object version or deterministic state query;
- DataForSEO: query/config contract + source/provenance/freshness evidence.

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/delivery-adapters.test.mjs
```

- [ ] **Step 3: Implement adapter contracts without live destructive calls**

Adapters should normalize evidence and reject incomplete candidate/rollback metadata. Keep connector invocation behind dependency injection.

- [ ] **Step 4: Re-run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/delivery/adapters tests/delivery-adapters.test.mjs
git commit -m "feat: add Brain delivery adapters for current platforms"
```

---

### Task 7: Project active changes and dependencies into BG167

**Files:**
- Modify existing BG167 integration code/config discovered in repository or Make scenario `7136045` through its supported interface.
- Create: `tests/brain-current-delivery-state.test.mjs`
- Modify: `docs/brain/component-registry.json` if the projection contract needs a version bump.

**Interfaces:**
- BG167 current context adds `active_changes`, `change_dependencies`, `conflict_states`, `production_promotions`.

- [ ] **Step 1: Write failing projection contract test**

Require a current-state object such as:

```js
{
  active_changes: [],
  change_dependencies: [],
  conflict_states: [],
  production_promotions: []
}
```

and require each active change to contain `changeId`, `owner`, `platform`, `state`, `contractKeys`.

- [ ] **Step 2: Verify RED**

Run the focused test and confirm current projection lacks the new fields.

- [ ] **Step 3: Extend BG167 current projection**

Use existing Brain event/current-state inputs. Keep it read-only/current-state oriented; do not move production authority into BG167.

- [ ] **Step 4: Verify with an on-demand BG167 read**

Request current delivery state and assert the new fields are present even when arrays are empty.

- [ ] **Step 5: Commit repository-side contract changes**

```bash
git add tests/brain-current-delivery-state.test.mjs docs/brain/component-registry.json
git commit -m "feat: expose continuous delivery state in BG167"
```

---

### Task 8: Route universal delivery outcomes and contract changes through BG168

**Files:**
- Modify repository event schemas/tests used by BG168 if present.
- Modify Make scenario `7136176` only through validated scenario patching if its classifier does not already accept the new event kinds.
- Create: `tests/brain-delivery-learning.test.mjs`

**Interfaces:**
- Material event kinds include `CHANGE_PROPOSED`, `CHANGE_GREEN`, `CHANGE_PROMOTED`, `CHANGE_SUPERSEDED`, `CONFLICT_RECONCILED`, `PLATFORM_REGISTERED`, `PRODUCTION_ROLLBACK`, `CONTRACT_CHANGE`.

- [ ] **Step 1: Write failing material-outcome tests**

Ensure every listed event is treated as material and fingerprinted/deduped.

- [ ] **Step 2: Run and verify RED where coverage is missing**

- [ ] **Step 3: Extend classifier/router minimally**

Preserve existing ERROR/RECOVERY/IMPROVEMENT semantics. Do not duplicate events already represented by an equivalent fingerprint.

- [ ] **Step 4: Run BG168 on-demand smoke**

Dispatch one synthetic non-destructive `CONTRACT_CHANGE` and confirm `LEARNING_DISPATCHED`.

- [ ] **Step 5: Commit code/schema changes**

Commit only repository changes; Make scenario mutation has its own exact `lastEdit`/read-back evidence.

---

### Task 9: Generalize BG169 into universal live-activation authority

**Files:**
- Modify repository production-policy code/tests associated with BG169.
- Patch Make scenario `7137190` only if required after inspecting its current interface.
- Create: `tests/production-authority-platforms.test.mjs`

**Interfaces:**
- Input: platform, change envelope, candidate evidence, required gates, hard-boundary state.
- Output: `PROMOTE`, `REJECT`, `ROLLBACK`, or `BLOCKED_HARD_BOUNDARY` with exact candidate/live identity.

- [ ] **Step 1: Write failing platform authority tests**

Cover GitHub/Netlify, Make, Notion, Supabase and DataForSEO configuration activation without embedding secrets.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement platform-neutral authority decision**

BG169 remains deterministic for hard gates. AI must not be required to decide whether exact evidence/security/cost/dependency gates are satisfied.

- [ ] **Step 4: Verify hard boundaries**

Tests must prove credentials, security weakening, irreversible destructive changes, increased paid resources and legal/financial actions cannot be auto-promoted.

- [ ] **Step 5: Commit**

```bash
git add tests/production-authority-platforms.test.mjs <discovered-production-policy-files>
git commit -m "arch: make BG169 universal production authority"
```

---

### Task 10: Enforce the contract in agent and Make onboarding

**Files:**
- Modify: `AGENTS.md`
- Modify: `tools/brain-delivery-system.mjs`
- Modify: tests covering Brain membership/onboarding.
- Patch current Make onboarding/governance scenario(s) discovered from component registry rather than assuming ids beyond known BG167/BG168/BG169.

**Interfaces:**
- New production-capable agent/scenario/app is rejected as production-ready unless it declares shared-context read, outcome writeback, platform registration, cost/security class and immediate-safe-change delivery contract.

- [ ] **Step 1: Add failing membership/onboarding tests**

A new agent/scenario lacking `continuousDelivery=true` or platform adapter membership must fail validation.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Update membership projection and AGENTS contract**

Add explicit rule: no platform/app/scenario may create a release island or unrelated batch queue.

- [ ] **Step 4: Validate all current active agent/scenario membership**

Produce a machine artifact listing compliant and non-compliant members. Existing non-compliant members become migration obligations; do not silently mark them green.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md tools/brain-delivery-system.mjs tests
git commit -m "arch: enforce continuous delivery for all Brain members"
```

---

### Task 11: Add migration obligations for each current platform without a big-bang cutover

**Files:**
- Modify: `config/outcome-obligations.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-github.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-netlify.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-make.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-notion.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-supabase.json`
- Create: `docs/outcome-obligations/brain-cicd-platform-dataforseo.json`

**Interfaces:**
- One independent obligation per platform; no platform waits for another platform migration to finish.

- [ ] **Step 1: Add failing obligation completeness test**

Require all known current platforms to have an open/completed migration obligation with owner, evidence, rollback and idempotency key.

- [ ] **Step 2: Add the six obligations**

Each obligation terminates only at `COMPLETED` with live evidence or `BLOCKED_HARD_BOUNDARY`.

- [ ] **Step 3: Re-run obligation tests**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add config/outcome-obligations.json docs/outcome-obligations
git commit -m "ops: track continuous delivery migration per platform"
```

---

### Task 12: Instrument speed, cost, conflict and duplicate-work metrics

**Files:**
- Create: `platform/delivery/metrics.mjs`
- Create: `tests/delivery-metrics.test.mjs`
- Extend BG159/BG162-compatible event payload schema where required.

**Interfaces:**
- Produces metrics: `timeToLiveMs`, `unrelatedWaitMs`, `branchRebuildsForUnrelatedDrift`, `serialWrites`, `duplicateWork`, `ciDurationMs`, `rollbackDurationMs`, `platformCost`, `unaffectedGatesSkipped`.

- [ ] **Step 1: Write failing metric aggregation tests**

Prove target invariants:

```js
assert.equal(summary.branchRebuildsForUnrelatedDrift, 0);
assert.equal(summary.unrelatedWaitMs, 0);
```

for a healthy independent release sequence.

- [ ] **Step 2: Implement pure metric aggregation**

- [ ] **Step 3: Route metric events into existing cost/quality learning path**

Do not add a new paid observability product.

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/delivery/metrics.mjs tests/delivery-metrics.test.mjs
git commit -m "feat: measure Brain continuous delivery throughput and cost"
```

---

### Task 13: Add end-to-end parallel-release regression

**Files:**
- Create: `tests/brain-continuous-cicd-e2e.test.mjs`
- Modify: `.github/workflows/unified-brain-delivery.yml` only if needed to expose test fixtures/artifacts.

**Interfaces:**
- Simulates at least three independent changes and one conflicting change across multiple platforms.

- [ ] **Step 1: Write the failing end-to-end regression**

Test sequence:

1. website Git change based on main A;
2. unrelated portal Git change lands, moving main to B;
3. website candidate stays valid without rebuild and can merge;
4. independent Notion change can activate without waiting for either Git change;
5. Supabase change sharing `portal-state:v4` with a portal candidate returns `CONTRACT_OVERLAP` and only those dependents reconcile;
6. failed DataForSEO config change does not block Netlify/Notion/Make promotions;
7. all successful changes emit material outcomes and exact live evidence.

- [ ] **Step 2: Verify RED before final orchestration wiring**

- [ ] **Step 3: Wire missing orchestration pieces until GREEN**

Use only already-defined Change Envelope, Conflict Index, platform registry/adapters, BG167/BG168/BG169 contracts.

- [ ] **Step 4: Run full Brain regression suite**

```bash
node scripts/brain/test-all.mjs
node --test tests/brain-continuous-cicd-e2e.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/brain-continuous-cicd-e2e.test.mjs .github/workflows/unified-brain-delivery.yml
git commit -m "test: lock all-app continuous delivery architecture"
```

---

### Task 14: Preview/canary, immediate production rollout and exact verification

**Files:**
- Update obligations/ledger only after runtime evidence exists.
- Create: `docs/development-ledger/2026-08-30-brain-continuous-cicd-v2-1.md`

**Interfaces:**
- Uses existing GitHub/Netlify/Make/Supabase/Notion/DataForSEO connectors and BG169 authority; no new secrets are introduced.

- [ ] **Step 1: Produce exact candidate from current main**

Use the conflict-aware branch policy. Do not rebuild for unrelated main drift.

- [ ] **Step 2: Run all affected CI lanes and full e2e regression**

Every required test must be green.

- [ ] **Step 3: Verify Netlify preview for the exact candidate SHA**

Require ready state, redirect/header/function/edge evidence and zero secret-scan matches.

- [ ] **Step 4: Verify non-Git adapters with non-destructive canaries/read-backs**

For Make, Notion, Supabase and DataForSEO, verify adapter behavior using read-only or safely reversible test objects/config where available. Do not perform destructive, paid-resource-increasing or legally binding operations.

- [ ] **Step 5: Merge immediately after gates are green**

Do not wait for unrelated branches/apps.

- [ ] **Step 6: Verify exact production merge SHA/live states**

Netlify must report the exact merge SHA. Each non-Git platform adapter must return its exact live/read-back identity.

- [ ] **Step 7: Close only proven platform obligations**

A platform with incomplete live evidence remains open independently; it does not cause unrelated completed platforms to be rolled back or withheld.

- [ ] **Step 8: Write ledger and shared learning**

Record migration results, conflicts, recoveries, operation cost and timing. Route material outcomes through BG168 and verify BG167 current context reflects the new architecture.

- [ ] **Step 9: Verify the final documentation/ledger head in production**

Production is complete only when the exact final documentation head is also deployed/visible according to the repository production contract.

---

## Plan Self-Review

- Spec coverage: all v2 and v2.1 requirements map to Tasks 1–14.
- No big-bang migration: each platform has its own independent obligation and can go live as soon as its adapter is green.
- No hidden platform islands: platform registry completeness and onboarding tests fail closed.
- Moving-main behavior: retained and explicitly tested.
- Non-Git semantics: use platform-native atomicity/version/read-back instead of forcing Git branches onto SaaS data/config changes.
- Hard boundaries: preserved at platform adapter and BG169 layers.
- Exact evidence: every platform requires exact candidate/live identity or deterministic read-back evidence.
- No placeholders: implementation paths that depend on runtime discovery explicitly instruct executors to discover the existing production-policy/onboarding file before mutation rather than inventing one.
