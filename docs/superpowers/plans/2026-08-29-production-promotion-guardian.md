# Production Promotion Guardian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one deterministic Powerhouse Production Promotion Guardian responsible for carrying every safe, verified repository change from accepted candidate through `main`, Netlify production, exact-SHA verification, smoke/regression, and rollback until a terminal green state exists.

**Architecture:** Extend the existing whole-brain obligation contract with a machine-readable production policy and a pure release-state evaluator. Enforce the evaluator through CI and the existing hourly Self Heal/control plane. Runtime ownership stays centralized: GitHub supplies immutable source identity, Netlify executes deploys, BG169 supplies production authority, and the Guardian owns the obligation until `PRODUCTION_GREEN`, `ROLLED_BACK_GREEN`, or a valid `BLOCKED_HARD_BOUNDARY`.

**Tech Stack:** Node.js ESM, JSON policy, GitHub Actions, GitHub/Netlify APIs, Powerhouse Make control plane, existing shared memory BG166/BG167/BG168/BG169.

**Spec:** `docs/superpowers/specs/2026-08-29-production-promotion-guardian-design.md`

## Global Constraints

- `NO SILENT FAILURE`.
- `NO LOST OBLIGATION`.
- `GREEN MEANS OUTCOME VERIFIED`.
- `RED MEANS AGENTS KEEP WORKING`.
- `GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION`.
- Repository: `arthurprinsen-ai/Bedrijfsgeheugen`.
- Production branch: `main`.
- Netlify site id: `fd527056-493a-4d8a-8125-d00370104fa3`.
- Release identity is immutable SHA, never mutable branch/PR identity alone.
- `Netlify ready` is not sufficient without exact `commit_ref` match and required production evidence.
- Maximum two identical retries per hypothesis; then change hypothesis/fix/fallback.
- Never force-push over concurrent agent work.
- Do not change credentials/OAuth/secrets/permissions, weaken security, perform destructive/irreversible data operations, increase paid resources, or perform legal/financial commitments.
- Safe green production promotion and rollback are autonomous actions, not hard boundaries.

---

### Task 1: Machine-readable production promotion policy

**Files:**
- Create: `config/production-promotion.json`
- Test: `tests/production-promotion-guardian.test.mjs`

**Interfaces:**
- Produces policy keys consumed by the evaluator: `repository`, `branch`, `siteId`, `graceSeconds`, `terminalStates`, `requiredEvidence`, `retryPolicy`, `supersessionPolicy`, `hardBoundaries`.

- [ ] **Step 1: Write the failing policy contract test**

Add assertions that the policy exists and exactly binds repository `arthurprinsen-ai/Bedrijfsgeheugen`, branch `main`, site id `fd527056-493a-4d8a-8125-d00370104fa3`, requires exact-SHA production equality, includes `PRODUCTION_GREEN`, `ROLLED_BACK_GREEN`, `BLOCKED_HARD_BOUNDARY`, and states that green candidates create production obligations.

- [ ] **Step 2: Run the test to verify RED**

Run: `node --test tests/production-promotion-guardian.test.mjs`
Expected: FAIL because `config/production-promotion.json` does not yet exist.

- [ ] **Step 3: Create minimal policy**

Use this contract shape:

```json
{
  "version": 1,
  "ownerAgent": "Powerhouse Production Promotion Guardian",
  "repository": "arthurprinsen-ai/Bedrijfsgeheugen",
  "branch": "main",
  "siteId": "fd527056-493a-4d8a-8125-d00370104fa3",
  "graceSeconds": 180,
  "greenCandidateCreatesProductionObligation": true,
  "productionExactShaRequired": true,
  "terminalStates": ["PRODUCTION_GREEN", "ROLLED_BACK_GREEN", "BLOCKED_HARD_BOUNDARY"],
  "requiredEvidence": ["candidate_tests", "preview_or_equivalent", "main_sha", "production_commit_ref", "deploy_ready", "smoke", "regression", "protected_metrics"],
  "retryPolicy": {"maxIdenticalRetriesPerHypothesis": 2},
  "supersessionPolicy": {"coalesceToNewestReleasableMain": true, "requireExplicitSupersessionEvidence": true},
  "hardBoundaries": ["credentials_or_account_connection", "permissions", "security_control_weakening", "destructive_or_irreversible_data", "paid_resource_increase", "legal_or_financial_commitment"]
}
```

- [ ] **Step 4: Run the policy test to verify GREEN**

Run: `node --test tests/production-promotion-guardian.test.mjs`
Expected: policy assertions PASS; evaluator assertions may still fail until Task 2.

- [ ] **Step 5: Commit**

Commit message: `feat: define production promotion policy`.

### Task 2: Pure deterministic release-state evaluator

**Files:**
- Create: `tools/evaluate-production-promotion.mjs`
- Modify: `tests/production-promotion-guardian.test.mjs`

**Interfaces:**
- Export: `evaluateProductionPromotion(state, policy)`.
- Input fields: `candidateSha`, `candidateGreen`, `candidateEvidenceComplete`, `mainSha`, `productionCommitRef`, `deployState`, `deployAgeSeconds`, `smokePass`, `regressionPass`, `protectedMetricsPass`, `productionRegression`, `lastKnownGoodSha`, `hardBoundary`, `supersededBySha`.
- Output: `{ state, reason, nextAction, obligationOpen }`.

- [ ] **Step 1: Add failing state-machine tests**

Cover at least:
1. green candidate not on main => `PROMOTING_TO_MAIN`, next action `PROMOTE_EXACT_CANDIDATE`;
2. candidate red => `CANDIDATE_RED`, no production action;
3. main ahead of production within grace => `DEPLOY_PENDING`;
4. main ahead beyond grace => `DEPLOY_STALE`, next action `TRIGGER_DEPLOY`;
5. deploy `ready` on wrong SHA => `VERIFYING_PRODUCTION` or `DEPLOY_STALE`, never green;
6. exact SHA + ready but missing smoke => `VERIFYING_PRODUCTION`;
7. exact SHA + all evidence => `PRODUCTION_GREEN`, obligation closed;
8. production regression with LKG => `ROLLING_BACK`, next action `ROLLBACK_TO_LKG`;
9. hard boundary => `BLOCKED_HARD_BOUNDARY` only when supplied explicitly;
10. superseded intermediate SHA => explicit `SUPERSEDED` closure metadata while newest releasable SHA remains the active release obligation.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/production-promotion-guardian.test.mjs`
Expected: FAIL because evaluator is missing.

- [ ] **Step 3: Implement the smallest pure evaluator**

Order gates deterministically: hard boundary -> candidate acceptance -> main identity -> production identity/state -> production evidence -> rollback/red -> green. Never invoke external APIs inside the evaluator.

- [ ] **Step 4: Run evaluator tests GREEN**

Run: `node --test tests/production-promotion-guardian.test.mjs`
Expected: all state-machine cases PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add deterministic production promotion evaluator`.

### Task 3: CI contract gate

**Files:**
- Modify: `.github/workflows/shared-agent-memory-tests.yml`
- Modify: `tests/development-doc-contract.test.mjs`

**Interfaces:**
- CI must execute `tests/production-promotion-guardian.test.mjs` for automation branches and PRs targeting `main`.
- Documentation contract must require both production-promotion spec and plan plus policy/evaluator artifacts.

- [ ] **Step 1: Add failing contract assertions**

Require:
- `docs/superpowers/specs/2026-08-29-production-promotion-guardian-design.md`;
- `docs/superpowers/plans/2026-08-29-production-promotion-guardian.md`;
- `config/production-promotion.json`;
- `tools/evaluate-production-promotion.mjs`;
- workflow command includes `tests/production-promotion-guardian.test.mjs`.

- [ ] **Step 2: Run bounded suite RED if workflow does not include gate**

Run the exact Node test command used by `.github/workflows/shared-agent-memory-tests.yml`.

- [ ] **Step 3: Add the production guardian test to CI**

Preserve all existing tests; append the new test, do not replace existing coverage.

- [ ] **Step 4: Run bounded suite GREEN**

Expected: all shared-memory, obligation, development-doc, repository-writer, and production-promotion tests pass.

- [ ] **Step 5: Commit**

Commit message: `test: enforce production promotion guardian in CI`.

### Task 4: Make runtime Production Promotion Guardian

**Runtime:** existing Powerhouse Make team `2138086`.

**Interfaces:**
- Reuse shared control plane rather than isolated truth.
- Inputs/evidence: current GitHub `main` SHA, candidate/CI evidence, current Netlify production deploy + `commit_ref`, smoke/regression/protected metrics, LKG.
- Outputs: material event through BG168/BG166/BG167; production authority through BG169 where applicable.

- [ ] **Step 1: Inspect current production authority and existing release/self-heal scenarios**

Read BG169 `7137190`, BG156 `7132258`, BG165 `7135746`, BG168 `7136176`, and any existing scenario whose name includes Promotion/Production/Deploy. Reuse existing primitives and connection ids.

- [ ] **Step 2: Create or patch one deterministic guardian**

Guardian must run on a bounded schedule and/or on-demand, cheaply detect `main != production commit_ref`, respect 180-second grace, and route to the safe production action. Healthy checks must not require paid AI.

- [ ] **Step 3: Implement autonomous action rules**

- green candidate not on main: governed exact candidate promotion path;
- newest releasable main behind production: wait/verify;
- production behind main after grace: trigger deploy/reconcile to newest releasable `main`;
- wrong SHA ready: remain red and reconcile;
- exact SHA ready but smoke missing: verify smoke, do not mark green;
- production regression: execute/dispatch rollback to LKG, verify green;
- hard boundary: record explicit block and keep obligation open.

- [ ] **Step 4: Run safe canary against current already-green production**

Current reference at plan creation: `main=5864b930356f5a84163dca405365e8feb3a17c6c`; Netlify deploy `6a92c7f575e3cc0008f9ce17` had exact matching `commit_ref` and state `ready`. Canary must return `PRODUCTION_GREEN` without unnecessary deploy side effects.

- [ ] **Step 5: Run deterministic stale-state test without publishing obsolete code**

Use evaluator/test inputs or a no-side-effect guardian test mode to prove `main != production` beyond grace selects `TRIGGER_DEPLOY`, while current live production remains untouched.

- [ ] **Step 6: Verify runtime active and incomplete executions = 0**

Confirm schedule, connections OK, latest execution success, declared outcome includes exact production SHA/deploy evidence.

### Task 5: Agent contract and shared memory ownership

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/development-operating-system.md`
- Modify: `docs/self-healing-agents.md`
- Modify: `docs/outcome-obligations.md`
- Modify: `config/outcome-obligations.json`
- Append only: `docs/development-ledger.md`

**Interfaces:**
- Every future safe repository change creates a production obligation owned by `Powerhouse Production Promotion Guardian` once candidate acceptance is green.

- [ ] **Step 1: Add failing documentation contract assertions**

Require phrases/semantics:
- `Powerhouse Production Promotion Guardian`;
- `GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION`;
- commit/merge is not completion;
- exact production SHA evidence is required;
- safe promotion/rollback is autonomous.

- [ ] **Step 2: Update contracts minimally**

Do not duplicate the whole spec. Add concise ownership clauses and reference `config/production-promotion.json`.

- [ ] **Step 3: Append ledger events**

Append `CONTRACT_CHANGE` and `IMPROVEMENT` including fingerprint `production-promotion|guardian|autonomous-owner`, owner, tests, runtime scenario id, current LKG, and exact evidence.

- [ ] **Step 4: Write shared learning**

Route the same material outcome through BG168/BG166 and refresh BG167 so all agents inherit the production owner.

- [ ] **Step 5: Run contract tests GREEN**

Run bounded shared suite and production guardian tests.

### Task 6: Exact candidate release and production verification

**Files:** no new implementation files unless a release defect is found.

**Interfaces:** exact immutable candidate SHA -> PR -> main SHA -> Netlify `commit_ref` -> smoke/regression -> shared evidence.

- [ ] **Step 1: Re-fetch latest `main` and isolate candidate**

Because concurrent agents write frequently, create/rebase a fresh promotion branch on the newest main and ensure only guardian changes are included.

- [ ] **Step 2: Verify exact candidate CI**

Require Shared Agent Memory Tests plus any affected production/repository writer gates green on exact candidate SHA.

- [ ] **Step 3: Verify preview/equivalent safe evidence**

For governance/tooling-only changes, a green CI candidate plus unchanged web artifact may satisfy equivalent safe evidence; for web/runtime code, require exact preview deploy and relevant smoke.

- [ ] **Step 4: Merge exact tested candidate**

Use exact-head protection; if `main` moves, do not force merge—reconcile and re-run necessary gates.

- [ ] **Step 5: Guardian carries main to production**

Verify or trigger Netlify deployment for newest accepted main. Do not deploy obsolete intermediate SHAs.

- [ ] **Step 6: Verify production exact identity and health**

Require `production.commit_ref == main_sha`, deploy `ready`, smoke/regression/protected metrics green, no material security regression.

- [ ] **Step 7: Write `PRODUCTION_PROMOTION` and close obligation**

Record candidate SHA, merge/main SHA, deploy id, exact evidence, LKG, and reusable lesson in repo ledger and shared memory.

- [ ] **Step 8: Final whole-system verification**

Confirm Guardian runtime active, zero incomplete executions, current main equals production commit ref, required CI green, and no open safely-solvable release obligation remains.
