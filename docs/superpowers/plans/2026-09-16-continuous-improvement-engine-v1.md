# Powerhouse Continuous Improvement Engine v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic Continuous Improvement Engine that turns existing Powerhouse evidence into deduplicated improvement candidates, evaluates them against baselines and hard gates, resolves overlap, records rollback/revalidation/attribution metadata, and closes the loop through the existing Engineering OS, Brain, Supabase and Notion authorities.

**Architecture:** Extend `powerhouse-engineering-os-v1` with one `continuous_improvement` contract and add a small pure-function engine under `scripts/brain/continuous-improvement/`. The engine reads normalized evidence supplied by existing runtime authorities and emits deterministic candidate/decision objects; persistence remains in existing Supabase/Brain records. Required CI remains the release gate and BRAIN-DELIVERY-v2 remains promotion authority.

**Tech Stack:** Node.js ESM, node:test/assert, GitHub Actions Required test, existing Powerhouse Engineering OS/Brain contracts, Supabase `brain_records`, Notion projections.

**Spec:** `docs/superpowers/specs/2026-09-16-continuous-improvement-engine-v1-design.md`

## Global Constraints

- No new durable memory, learning database, architecture registry, queue, CRM or analytics truth.
- `powerhouse-engineering-os-v1` remains parent authority.
- `BRAIN-CHAT-LEARNING-v1` remains learning authority.
- `BRAIN-DELIVERY-v2` remains candidate/release authority.
- `powerhouse-state-of-the-art-adoption-v1` remains technology-currency authority.
- Security/tenant isolation and correctness/reliability are non-degradation gates.
- Unknown critical evidence fails closed.
- No single aggregate score decides promotion.
- Rollback/fallback identity is required before production promotion.
- Business-impact claims require business/outcome evidence.
- Candidate dedupe/conflict resolution occurs before persistent write or overlapping implementation.
- RED test evidence must precede production implementation.

---

### Task 1: Add RED contract tests for Continuous Improvement Engine

**Files:**
- Modify: `tests/brain-powerhouse-engineering-os-contract.test.mjs`
- Create: `tests/brain-continuous-improvement-engine.test.mjs`

**Interfaces:**
- Consumes: `loadEngineeringContract()`, future exports from `scripts/brain/continuous-improvement/index.mjs`.
- Produces: executable failing specifications for contract presence, deterministic fingerprints, coalescing/conflict decisions, fail-closed evidence gates, rollback metadata, revalidation and attribution semantics.

- [ ] **Step 1: Extend Engineering OS contract test with failing assertions**

Add assertions that `contract.continuous_improvement.fingerprint === 'powerhouse-continuous-improvement-engine-v1'`, that lifecycle equals `OBSERVE,CLUSTER,CANDIDATE,BASELINE,EVALUATE,DECIDE,SHADOW_OR_CANARY,PROMOTE_OR_REJECT,PROD_OBSERVE,ROLLBACK_OR_CONFIRM,ATTRIBUTE,WRITEBACK,REVALIDATE`, and that policy flags enforce dedupe, no magic score, fail-closed critical unknowns, non-degradation and rollback requirements.

- [ ] **Step 2: Create focused behavioral test file**

The file imports these exact future exports:

```js
import {
  fingerprintCandidate,
  coalesceCandidates,
  arbitrateConflict,
  evaluateCandidate,
  buildRevalidationDecision,
  buildAttribution
} from '../scripts/brain/continuous-improvement/index.mjs';
```

Tests cover:

```js
fingerprintCandidate({ component:'brain', problemClass:'latency', evidenceCluster:['b','a'], changeClass:'local_fix', scope:'global' })
```

being stable regardless of evidence order; exact duplicates coalescing; same component/problem but different change classes returning `COMPARE`; missing critical security/correctness evidence returning `REJECT`; security regression returning `REJECT`; cost increase without explicit measurable compensated benefit returning `REJECT`; valid bounded candidate returning `EXPERIMENT` or `ALLOW` per metadata; rollback identity missing returning `REJECT`; stale decision returning `CANDIDATE_REQUIRED`; attribution returning deltas while `causalClaim` remains false unless an explicit experimental design proves causality.

- [ ] **Step 3: Run exact tests and capture RED**

Run:

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs tests/brain-continuous-improvement-engine.test.mjs
```

Expected: FAIL because `continuous_improvement` and `scripts/brain/continuous-improvement/index.mjs` do not yet exist.

- [ ] **Step 4: Commit RED tests**

```bash
git add tests/brain-powerhouse-engineering-os-contract.test.mjs tests/brain-continuous-improvement-engine.test.mjs
git commit -m "test: define continuous improvement engine contract"
```

### Task 2: Add machine-readable Engineering OS contract and validator

**Files:**
- Modify: `config/powerhouse-engineering-os.json`
- Modify: `scripts/brain/powerhouse-engineering-os.mjs`

**Interfaces:**
- Consumes: existing Engineering OS authorities.
- Produces: `continuous_improvement` config and validator output `continuous_improvement_fingerprint`.

- [ ] **Step 1: Add minimal `continuous_improvement` contract**

Include exact fields:

```json
{
  "fingerprint":"powerhouse-continuous-improvement-engine-v1",
  "lifecycle":["OBSERVE","CLUSTER","CANDIDATE","BASELINE","EVALUATE","DECIDE","SHADOW_OR_CANARY","PROMOTE_OR_REJECT","PROD_OBSERVE","ROLLBACK_OR_CONFIRM","ATTRIBUTE","WRITEBACK","REVALIDATE"],
  "candidate":{"dedupe_before_persist":true,"conflict_arbitration":true,"stable_identity":true},
  "promotion":{"security_non_degradation":true,"correctness_non_degradation":true,"unknown_critical_fails_closed":true,"no_single_magic_score":true,"rollback_identity_required":true,"compensated_tradeoff_requires_evidence":true,"business_claim_requires_business_evidence":true},
  "revalidation":{"require_revalidate_after":true,"states":["CONFIRMED","CANDIDATE_REQUIRED","SUPERSEDED","BLOCKED_HARD_BOUNDARY"]},
  "attribution":{"causality_not_assumed":true,"baseline_comparison_required":true}
}
```

- [ ] **Step 2: Extend fail-closed validator**

Add `validateContinuousImprovement(contract, errors)` and return `continuous_improvement_fingerprint`. Validate fingerprint, lifecycle, all true policy flags, four revalidation states, and causality/baseline requirements.

- [ ] **Step 3: Run contract test**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs
```

Expected: contract assertions GREEN; behavioral engine tests still RED because engine module is absent.

- [ ] **Step 4: Commit contract implementation**

```bash
git add config/powerhouse-engineering-os.json scripts/brain/powerhouse-engineering-os.mjs
git commit -m "feat: register continuous improvement engine contract"
```

### Task 3: Implement deterministic candidate/evaluation engine

**Files:**
- Create: `scripts/brain/continuous-improvement/index.mjs`
- Test: `tests/brain-continuous-improvement-engine.test.mjs`

**Interfaces:**
- Produces:
  - `fingerprintCandidate(input) -> string`
  - `coalesceCandidates(candidates) -> { candidates, coalesced }`
  - `arbitrateConflict(a,b) -> 'COALESCE'|'COMPARE'|'SUPERSEDE'|'ISOLATE'`
  - `evaluateCandidate(candidate) -> { decision:'ALLOW'|'EXPERIMENT'|'REJECT'|'REVALIDATE', reasons:string[] }`
  - `buildRevalidationDecision(input) -> { state, reasons }`
  - `buildAttribution({baseline,current,experimentalDesign}) -> { deltas, causalClaim, limitation }`

- [ ] **Step 1: Implement stable normalization and SHA-256 fingerprint**

Normalize strings, sort/de-duplicate `evidenceCluster`, preserve component/problem/change/scope identity, and hash canonical JSON with Node `crypto.createHash('sha256')`.

- [ ] **Step 2: Implement coalescing/conflict arbitration**

Exact fingerprint equality => `COALESCE`; same component/problem/scope with materially different `changeClass` => `COMPARE`; explicit `supersedesFingerprint` match => `SUPERSEDE`; otherwise `ISOLATE`.

- [ ] **Step 3: Implement promotion evaluation**

Reject when critical evidence is missing, security/correctness delta is negative, rollback identity missing for production promotion, or cost/latency regression lacks `compensatedBenefitEvidence`. Return `EXPERIMENT` when evidence is non-critical incomplete but bounded experiment metadata is present. Return `ALLOW` only when required baseline/comparability/evidence gates are satisfied.

- [ ] **Step 4: Implement revalidation**

Return `BLOCKED_HARD_BOUNDARY` when hard boundary is active, `SUPERSEDED` when superseding verified identity exists, `CANDIDATE_REQUIRED` when `revalidateAfter` is past and evidence changed/stale, otherwise `CONFIRMED`.

- [ ] **Step 5: Implement attribution**

Calculate numeric deltas only for comparable baseline/current fields. Default `causalClaim:false`; set true only when `experimentalDesign.causalIdentification === true`. Always include a limitation string when causal identification is absent.

- [ ] **Step 6: Run focused tests**

```bash
node --test tests/brain-continuous-improvement-engine.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Run Engineering OS tests**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs tests/brain-continuous-improvement-engine.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit engine**

```bash
git add scripts/brain/continuous-improvement/index.mjs tests/brain-continuous-improvement-engine.test.mjs
git commit -m "feat: add deterministic continuous improvement engine"
```

### Task 4: Document operating contract and CI wiring

**Files:**
- Modify: `docs/development-operating-system.md`
- Modify: `.github/workflows/required-test.yml` only if focused test is not already covered by an existing wildcard/command.
- Modify: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Produces: human operating rule and proof Required executes the new behavioral regression test.

- [ ] **Step 1: Add Development OS section**

Document the lifecycle, existing-state reuse, deterministic candidate identity, baseline/eval/non-degradation gates, bounded experiment rule, conflict arbitration, revalidation and attribution/no-causal-overclaim rule.

- [ ] **Step 2: Wire focused behavioral test into Required**

Add `tests/brain-continuous-improvement-engine.test.mjs` to the same Required node test command if it is not already transitively executed.

- [ ] **Step 3: Extend CI regression assertion**

Assert Required workflow text contains both Engineering OS and Continuous Improvement test paths.

- [ ] **Step 4: Run exact contract and behavioral tests**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs tests/brain-continuous-improvement-engine.test.mjs
node scripts/brain/powerhouse-engineering-os.mjs --check
```

Expected: all PASS / `ENGINEERING_OS_READY`.

- [ ] **Step 5: Commit docs/CI**

```bash
git add docs/development-operating-system.md .github/workflows/required-test.yml tests/brain-powerhouse-engineering-os-contract.test.mjs
git commit -m "docs: enforce continuous improvement operating loop"
```

### Task 5: Protected delivery and production closure

**Files/Systems:**
- GitHub PR/Required/BRAIN
- Supabase existing `brain_records`
- Existing Notion System Map, Human Handbook, Master Register, Latest Verified State, Agent Activity Log

**Interfaces:**
- Produces: exact protected merge identity plus runtime/readback evidence.

- [ ] **Step 1: Open PR from `feat/continuous-improvement-engine-v1` to `main`**

PR body states no new durable authority and names exact tests/contract/executable.

- [ ] **Step 2: Verify exact-head Required and BRAIN delivery**

Both must be terminal `success`; do not merge on pending/skipped/unknown required evidence.

- [ ] **Step 3: Protected merge with expected head SHA**

Use GitHub protected merge only after exact-head green.

- [ ] **Step 4: Read current `main` and exact files back**

Verify the merge SHA is an ancestor/current source and `config/powerhouse-engineering-os.json`, validator and engine module contain the final capability.

- [ ] **Step 5: Write existing Supabase `brain_records` CurrentState and Learning**

Use current production schema. `source_revision` must equal protected merge SHA. CurrentState status `LIVE_BEWEZEN`; Learning status `VERIFIED`; both executed/verified true and both use deterministic record IDs under fingerprint `powerhouse-continuous-improvement-engine-v1`.

- [ ] **Step 6: Read Supabase records back directly**

Require both records and exact same merge SHA before documentation closure.

- [ ] **Step 7: Update existing Notion projections**

Update System Map, Human Handbook, Master Register; add/reconcile Latest Verified State and Agent Activity Log using the same fingerprint/evidence. No new database/page family when an existing projection exists.

- [ ] **Step 8: Re-read Notion surfaces**

Verify fingerprint, merge SHA, authorities, outcome, rollback, prevention learning and open obligation state.

- [ ] **Step 9: Close with hard terminal status**

Return `LIVE & BEWEZEN` only when GitHub + Supabase + Notion evidence all agree; otherwise return `DEELS LIVE` or `GEBLOKKEERD` with exact residual obligation.
