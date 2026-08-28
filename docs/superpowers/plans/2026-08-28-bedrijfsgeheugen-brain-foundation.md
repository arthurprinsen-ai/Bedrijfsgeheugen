# Bedrijfsgeheugen Brain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-capable Bedrijfsgeheugen Brain foundation that connects existing Powerhouse sensors, cortices, workers, governors and actuators through one typed Signal -> Opportunity -> Decision -> Mission -> Outcome -> Learning contract without replacing stable specialist scenarios.

**Architecture:** Existing Make/Notion/Powerhouse systems remain authoritative specialist components. A thin contract, validation, scoring and context-compilation layer is introduced first; existing BG156/BG166/BG167/BG168/BG169 are then adapted to consume/produce those contracts. Creative intelligence explicitly reuses BG09/BG14/BG24/BG25/BG180 for text, image, video, narrative, prompt and scene learning. Rollout is observe -> shadow -> safe autonomous missions -> production autonomy, never a big-bang rewrite.

**Tech Stack:** Existing static Bedrijfsgeheugen repository, GitHub Actions, Make scenarios, Notion/Datahub, JavaScript deterministic validators, existing AI Tools modules, Netlify production verification.

**Spec:** `docs/superpowers/specs/2026-08-28-bedrijfsgeheugen-brain-design.md`

## Global Constraints

- Read `AGENTS.md`, `docs/development-operating-system.md`, `docs/development-ledger.md`, `docs/self-healing-agents.md`, current shared team context and relevant regression docs before each material implementation task.
- Reuse existing BG scenarios; do not build a parallel replacement Powerhouse.
- One shared truth: no agent-owned shadow dataset becomes primary truth.
- Evidence, inference, hypothesis, current state and observed outcome remain distinct.
- All mutations are idempotent and traceable with `trace_id`, `correlation_id` and `idempotency_key`.
- Production follows exact-candidate verification and GREEN-UNTIL-DONE with automatic rollback to last-known-good.
- Maximum two identical retries per hypothesis without new evidence.
- Never change secrets, credentials or permissions; never weaken security; never make destructive/irreversible mutations; never increase paid external resources; never make legal/financial commitments autonomously.
- Existing BG09/BG14/BG24/BG25/BG180 creative/prompt intelligence is reused and connected, not recreated.
- Every executable Mission defines baseline, primary success metric, protected metrics, budget and rollback before execution.

---

### Task 1: Freeze the existing Brain component inventory and contracts

**Files:**
- Create: `docs/brain/component-registry.json`
- Create: `docs/brain/contracts.md`
- Create: `scripts/brain/validate-component-registry.mjs`
- Create: `scripts/brain/test-component-registry.mjs`

**Interfaces:**
- Consumes: current Make scenario IDs/names and the approved Brain spec.
- Produces: `component-registry.json` entries with `id`, `name`, `role`, `cortex`, `authority`, `inputs`, `outputs`, `status`, `brain_contract_version`; deterministic registry validator.

- [ ] **Step 1: Write the failing registry test**

Create a Node script that loads `docs/brain/component-registry.json` and fails unless required foundation components exist: BG09, BG14, BG24, BG25, BG156, BG166, BG167, BG168, BG169, BG180 and PH Agents 01-16. Assert every active entry has exactly one primary role from `SENSOR|MEMORY|CORTEX|GOVERNOR|WORKER|ACTUATOR|CONTROL_PLANE` and a non-empty cortex.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node scripts/brain/test-component-registry.mjs`
Expected: FAIL because registry/validator is not yet present.

- [ ] **Step 3: Create the inventory and validator**

Populate the registry from live Make evidence, marking retired/inactive systems explicitly rather than deleting them. Document the universal flow and authority precedence in `contracts.md`. Validator exits non-zero on duplicate active component IDs, missing primary role, missing cortex or unsupported contract version.

- [ ] **Step 4: Verify the registry**

Run: `node scripts/brain/validate-component-registry.mjs && node scripts/brain/test-component-registry.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/brain scripts/brain
git commit -m "feat: establish Brain component registry"
```

### Task 2: Implement universal Brain object schemas

**Files:**
- Create: `brain/contracts/envelope.schema.json`
- Create: `brain/contracts/signal.schema.json`
- Create: `brain/contracts/evidence.schema.json`
- Create: `brain/contracts/opportunity.schema.json`
- Create: `brain/contracts/decision.schema.json`
- Create: `brain/contracts/mission.schema.json`
- Create: `brain/contracts/experiment.schema.json`
- Create: `brain/contracts/outcome.schema.json`
- Create: `brain/contracts/pattern.schema.json`
- Create: `brain/contracts/current-state.schema.json`
- Create: `scripts/brain/validate-contracts.mjs`
- Create: `scripts/brain/test-contracts.mjs`

**Interfaces:**
- Consumes: object definitions from the spec.
- Produces: versioned `brain.v1` JSON contracts used by adapters and Make validators.

- [ ] **Step 1: Write failing fixture tests**

Test one valid and one invalid fixture for every object. Invalid Signal must fail without `evidence_refs`; invalid Mission must fail without `baseline`, `success_metrics`, `protected_metrics`, `budget` and `rollback`; invalid Outcome must fail without actual result and cost fields.

- [ ] **Step 2: Run tests**

Run: `node scripts/brain/test-contracts.mjs`
Expected: FAIL before schemas exist.

- [ ] **Step 3: Implement schemas and deterministic validator**

Use dependency-free JavaScript validation so the repository does not require a new paid/external runtime. Require universal envelope fields `id`, `schema_version`, `created_at`, `producer`, `trace_id`, `correlation_id`, `classification`, `data_quality`, `confidence`, `provenance`. Add canonical Decision enum and Mission recovery states from the spec.

- [ ] **Step 4: Run all contract tests**

Run: `node scripts/brain/validate-contracts.mjs && node scripts/brain/test-contracts.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add brain/contracts scripts/brain
git commit -m "feat: add universal Brain contracts"
```

### Task 3: Add deterministic priority, hard-gate and portfolio policy

**Files:**
- Create: `brain/decision/policy.mjs`
- Create: `brain/decision/score.mjs`
- Create: `brain/decision/portfolio.mjs`
- Create: `scripts/brain/test-decision-policy.mjs`

**Interfaces:**
- Consumes: validated Opportunity/Incident candidates.
- Produces: `{decision, lane, score, reasons, blocked_by, recheck_at}` without executing side effects.

- [ ] **Step 1: Write failing policy tests**

Cover security interrupt over growth, production-red over content, insufficient evidence -> `RESEARCH`, stale evidence -> `WATCH`, hard boundary -> `ESCALATE_HARD_BOUNDARY`, high-value reversible opportunity -> executable candidate, and `WAIT` as a valid result.

- [ ] **Step 2: Verify failure**

Run: `node scripts/brain/test-decision-policy.mjs`
Expected: FAIL because policy modules do not exist.

- [ ] **Step 3: Implement hard gates before scoring**

Implement policy order: security/privacy/permission/hard-boundary -> production/data integrity -> contact pressure -> evidence/freshness -> budget -> normalized expected utility. Never allow a score to override a hard gate.

- [ ] **Step 4: Implement portfolio lanes and WIP**

Use lanes `INCIDENT`, `COMMERCIAL`, `GROWTH`, `PRODUCT`, `CONTENT_DEMAND`, `IMPROVEMENT`, `EXPLORATION`. Enforce default maximum three large active opportunity experiments while allowing incident recovery and small reversible optimizations.

- [ ] **Step 5: Run tests and commit**

Run: `node scripts/brain/test-decision-policy.mjs`
Expected: PASS.

```bash
git add brain/decision scripts/brain/test-decision-policy.mjs
git commit -m "feat: add Brain decision and portfolio policy"
```

### Task 4: Build the Context Compiler and shared-memory boundary

**Files:**
- Create: `brain/context/compiler.mjs`
- Create: `brain/context/authority.mjs`
- Create: `scripts/brain/test-context-compiler.mjs`
- Create: `docs/brain/context-contract.md`

**Interfaces:**
- Consumes: Mission + Current State + Evidence + Patterns + relevant failures/procedures.
- Produces: minimal `{mission, why_now, targets, known_facts, evidence, patterns, current_state, constraints, protected_metrics, budget, rollback}` package.

- [ ] **Step 1: Write tests for authority and context minimization**

Assert verified Current State beats stale event projections; observed outcomes beat AI inference; contradicted evidence lowers confidence; unrelated entity history is excluded; hard-boundary constraints are always present.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/brain/test-context-compiler.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement authority precedence and compiler**

Encode truth statuses `VERIFIED|SUPPORTED|INFERRED|HYPOTHESIS|CONTESTED|STALE|INVALID`. Never let `INFERRED`, `STALE` or `INVALID` overwrite `VERIFIED` Current State.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-context-compiler.mjs`
Expected: PASS.

```bash
git add brain/context scripts/brain/test-context-compiler.mjs docs/brain/context-contract.md
git commit -m "feat: add Brain context compiler"
```

### Task 5: Formalize the Creative Intelligence & Prompt Cortex

**Files:**
- Create: `brain/creative/creative-contract.schema.json`
- Create: `brain/creative/prompt-contract.schema.json`
- Create: `brain/creative/learning-dimensions.json`
- Create: `docs/brain/creative-prompt-cortex.md`
- Create: `scripts/brain/test-creative-contract.mjs`

**Interfaces:**
- Consumes: BG09 narrative/channel decisions, BG14 observed learning, BG24 Mira video briefs, BG25 carousel production and BG180 scene outcomes.
- Produces: normalized Creative Intent and Prompt Compilation objects without replacing those scenarios.

- [ ] **Step 1: Write failing creative contract tests**

Require normalized dimensions for `format`, `text_type`, `hook_type`, `cta_type`, `audience`, `problem`, `channel`, `narrative_arc`, `narrative_role`, `core_story`, `emotion`, `brand_signature`; video additionally requires scene/opening/cliffhanger/continuity dimensions. Require `source_learning_refs` and `experiment_variable`.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/brain/test-creative-contract.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement contracts and mapping documentation**

Map BG09 -> Creative Strategy/Narrative/Format Brain, BG14 -> observed creative learning, BG24 -> Video/Prompt Brain, BG25 -> visual/carousel actuator, BG180 -> scene-level outcome learning. Define Prompt Compiler as model-specific translation of Creative Intent, never as a new independent source of truth.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-creative-contract.mjs`
Expected: PASS.

```bash
git add brain/creative docs/brain/creative-prompt-cortex.md scripts/brain/test-creative-contract.mjs
git commit -m "feat: connect creative and prompt intelligence to Brain"
```

### Task 6: Add health, data-quality and quarantine contracts

**Files:**
- Create: `brain/health/quality.mjs`
- Create: `brain/health/quarantine.mjs`
- Create: `scripts/brain/test-health-quality.mjs`
- Create: `docs/brain/data-quality.md`

**Interfaces:**
- Consumes: incoming Evidence/Signal/Current State records.
- Produces: health status, confidence downgrade, quarantine reason and replay eligibility.

- [ ] **Step 1: Write failing tests**

Cover malformed schema -> quarantine, stale source -> confidence downgrade, contradictory evidence -> `CONTESTED`, unavailable source -> last-known-good with age, low-confidence identity -> `POSSIBLE_MATCH` not merge, verified state protected from stale overwrite.

- [ ] **Step 2: Run failing tests**

Run: `node scripts/brain/test-health-quality.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic quality gates**

Use source states `HEALTHY|STALE|DEGRADED|CONTRADICTED|UNAVAILABLE`. Quarantined records remain append-only and replayable after repair; they are excluded from active Decision context.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-health-quality.mjs`
Expected: PASS.

```bash
git add brain/health scripts/brain/test-health-quality.mjs docs/brain/data-quality.md
git commit -m "feat: add Brain data quality and quarantine gates"
```

### Task 7: Define Make adapter contracts for existing Powerhouse control plane

**Files:**
- Create: `docs/brain/make-adapters.md`
- Create: `brain/adapters/make-contract-map.json`
- Create: `scripts/brain/test-make-contract-map.mjs`

**Interfaces:**
- Consumes: live scenario inventory and universal schemas.
- Produces: exact adapter mapping for BG156/BG166/BG167/BG168/BG169 and specialist cortices.

- [ ] **Step 1: Write failing mapping test**

Require every active foundation component to declare which Brain objects it reads/writes and its authority. Reject a component that writes Current State without declared authority or writes Outcome without trace/correlation lineage.

- [ ] **Step 2: Verify failure**

Run: `node scripts/brain/test-make-contract-map.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement the map**

Set BG166 = append-only Event/Learning persistence, BG167 = shared Current State/Context projection, BG168 = Outcome/Learning Router, BG156 = Mission/Closed-Loop orchestration, BG169 = Production Authority. Map research, SEO, commercial, creative, social, product, economic, security and reliability scenarios to sensor/cortex/worker/actuator roles.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-make-contract-map.mjs`
Expected: PASS.

```bash
git add docs/brain/make-adapters.md brain/adapters scripts/brain/test-make-contract-map.mjs
git commit -m "feat: map Powerhouse components to Brain contracts"
```

### Task 8: Put the Executive Brain into OBSERVE/SHADOW mode

**Files:**
- Create: `brain/runtime/shadow-decision.mjs`
- Create: `scripts/brain/test-shadow-decision.mjs`
- Modify: live BG156/BG167/BG168 only after fresh scenario reads and exact module-level regression baselines.

**Interfaces:**
- Consumes: real normalized candidates and shared context.
- Produces: non-executing shadow Decision records with expected outcome, alternatives and reevaluation time.

- [ ] **Step 1: Capture fresh Make blueprints and baseline executions**

Read BG156, BG167 and BG168 immediately before editing. Record `lastEdit`, interfaces, relevant module IDs, latest successful execution and current outputs. Do not edit if current state differs from the adapter map; update the map first.

- [ ] **Step 2: Write local shadow-decision regression tests**

Assert shadow mode has no actuator side effects and always records `mode=SHADOW`, policy version, expected utility, evidence refs and proposed team.

- [ ] **Step 3: Run tests**

Run: `node scripts/brain/test-shadow-decision.mjs`
Expected: FAIL before runtime exists.

- [ ] **Step 4: Implement local shadow evaluator**

Use Tasks 2-4 modules to validate, gate, score and compile context. Output Decision only; no CONTACT/BUILD/PUBLISH/DEPLOY mutation.

- [ ] **Step 5: Patch the smallest existing Make control-plane surface**

Add only the adapter/output fields necessary to persist shadow decisions through existing shared memory/outcome routing. Use `expectedLastEdit` and preserve existing production behavior. Do not create a duplicate monolithic Brain scenario.

- [ ] **Step 6: Run a controlled Make execution and inspect module outputs**

Verify success, zero actuator side effects, valid trace lineage and valid Decision contract.

- [ ] **Step 7: Commit mapping/runtime changes**

```bash
git add brain/runtime scripts/brain/test-shadow-decision.mjs docs/brain
git commit -m "feat: enable Brain shadow decision mode"
```

### Task 9: Calibrate shadow decisions against observed outcomes

**Files:**
- Create: `brain/learning/calibration.mjs`
- Create: `scripts/brain/test-calibration.mjs`
- Create: `docs/brain/shadow-calibration.md`

**Interfaces:**
- Consumes: shadow Decision + later observed Outcome.
- Produces: calibration error, causal confidence, challenger evidence and no production policy mutation.

- [ ] **Step 1: Write failing calibration tests**

Test overprediction, underprediction, correct WAIT, false-positive opportunity, and high-value missed opportunity. Low causal confidence must receive lower learning weight.

- [ ] **Step 2: Run failing tests**

Run: `node scripts/brain/test-calibration.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement calibration**

Calculate expected-vs-actual error separately for value, cost, protected metrics and decision class. Store proposed weight changes as Challenger evidence only.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-calibration.mjs`
Expected: PASS.

```bash
git add brain/learning scripts/brain/test-calibration.mjs docs/brain/shadow-calibration.md
git commit -m "feat: calibrate Brain shadow decisions"
```

### Task 10: Enable first safe autonomous Mission classes

**Files:**
- Create: `brain/runtime/autonomy.mjs`
- Create: `scripts/brain/test-autonomy.mjs`
- Create: `docs/brain/autonomy-matrix.md`
- Modify: BG156 only after fresh blueprint/baseline read.

**Interfaces:**
- Consumes: validated Decision + Mission + autonomy policy.
- Produces: `ALLOW|SHADOW|BLOCK_HARD_BOUNDARY` plus execution class and required gates.

- [ ] **Step 1: Write failing autonomy tests**

Allow research, dedupe, cache, validation, internal enrichment and reversible test generation. Block credentials, permissions, destructive mutation, paid-resource increase, legal/financial commitment and security weakening. Production change must require exact-candidate gates.

- [ ] **Step 2: Verify failure**

Run: `node scripts/brain/test-autonomy.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement Safety Kernel and autonomy evaluator**

Safety rules are constants outside learned weights. Return explicit reason codes and required production/measurement gates.

- [ ] **Step 4: Patch BG156 for only the safe A0/A1 mission subset**

Preserve all existing execution routes. Add Brain Mission validation before dispatch and material outcome writeback after execution. No customer-facing or production mutation in this task.

- [ ] **Step 5: Execute safe canaries**

Run one research/internal-enrichment mission and one deliberately hard-boundary mission. Verify first completes and writes Outcome; second produces `BLOCKED_HARD_BOUNDARY` without side effects.

- [ ] **Step 6: Commit**

```bash
git add brain/runtime scripts/brain/test-autonomy.mjs docs/brain/autonomy-matrix.md
git commit -m "feat: enable safe autonomous Brain missions"
```

### Task 11: Connect production autonomy to existing BG169 authority

**Files:**
- Create: `brain/production/constitution.mjs`
- Create: `scripts/brain/test-production-constitution.mjs`
- Modify: BG169 only after fresh blueprint and successful baseline run.

**Interfaces:**
- Consumes: A3 Mission candidate, exact candidate identity, QA/security/cost/performance evidence and rollback target.
- Produces: `PROMOTE|ROLLBACK|RECOVERING|BLOCK_HARD_BOUNDARY`.

- [ ] **Step 1: Write failing production tests**

Reject mismatched candidate SHA, missing rollback, red protected metric, missing security gate and missing exact preview evidence. Accept exact green candidate. Production regression must return rollback to last-known-good.

- [ ] **Step 2: Run tests**

Run: `node scripts/brain/test-production-constitution.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement constitution**

Encode baseline -> isolated candidate -> tests -> security -> cost/performance -> exact preview -> promotion -> exact production verification -> protected metrics. Do not implement credential/permission mutation.

- [ ] **Step 4: Patch BG169 minimally**

Make BG169 consume the validated production decision contract while preserving its existing production-authority semantics.

- [ ] **Step 5: Verify canary and rollback path**

Use a reversible non-material candidate. Verify exact candidate identity. Deliberately fail a protected canary in preview/test only and prove rollback decision points to last-known-good.

- [ ] **Step 6: Commit**

```bash
git add brain/production scripts/brain/test-production-constitution.mjs
git commit -m "feat: connect Brain to production authority"
```

### Task 12: Add economic budgets, cost-per-outcome and compute routing

**Files:**
- Create: `brain/economics/budget.mjs`
- Create: `brain/economics/router.mjs`
- Create: `scripts/brain/test-economics.mjs`
- Create: `docs/brain/economics.md`

**Interfaces:**
- Consumes: Mission expected value/confidence plus observed Make/AI/API/runtime cost.
- Produces: budget envelope, compute tier and cost-per-outcome metrics.

- [ ] **Step 1: Write failing economics tests**

Assert cache/deterministic path precedes AI, low-value task cannot escalate to heavy reasoning without evidence, high-value uncertain task may receive research budget within existing resources, retry storm triggers anomaly, and cheaper model is promoted only when quality protected metrics hold.

- [ ] **Step 2: Verify failure**

Run: `node scripts/brain/test-economics.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement compute ladder and mission budget**

Use `cache -> deterministic -> data query -> statistics -> small model -> larger model -> multi-agent`. Budget includes Make credits, AI/API calls, runtime and retry limits.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-economics.mjs`
Expected: PASS.

```bash
git add brain/economics scripts/brain/test-economics.mjs docs/brain/economics.md
git commit -m "feat: add Brain economic governor"
```

### Task 13: Add end-to-end trace, observability and silent-failure detection

**Files:**
- Create: `brain/observability/trace.mjs`
- Create: `brain/observability/invariants.mjs`
- Create: `scripts/brain/test-observability.mjs`
- Create: `docs/brain/observability.md`

**Interfaces:**
- Consumes: Brain events from Signal through Pattern.
- Produces: trace completeness, invariant violations and recovery Signals.

- [ ] **Step 1: Write failing observability tests**

Detect missing downstream Outcome, stale Current State projection, duplicate idempotency key, broken parent lineage, impossible PRODUCTION_GREEN without verified production identity, and missing heartbeat.

- [ ] **Step 2: Verify failure**

Run: `node scripts/brain/test-observability.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement trace/invariant checks**

Invariant violations produce Operational Signals rather than silently modifying state. Preserve existing telemetry/self-healing ownership.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/brain/test-observability.mjs`
Expected: PASS.

```bash
git add brain/observability scripts/brain/test-observability.mjs docs/brain/observability.md
git commit -m "feat: add Brain observability invariants"
```

### Task 14: Prove one complete cross-domain Brain trace

**Files:**
- Create: `tests/brain/end-to-end-fixture.json`
- Create: `scripts/brain/test-end-to-end.mjs`
- Create: `docs/brain/acceptance.md`

**Interfaces:**
- Consumes: all foundation modules.
- Produces: one reproducible `Evidence -> Signal -> Opportunity -> Decision -> Mission -> Outcome -> Pattern -> changed next Decision` proof.

- [ ] **Step 1: Create the failing end-to-end test**

Use a safe synthetic fixture representing a market/customer problem that yields a research/content/landing-page candidate. Assert one trace ID survives the entire chain, hard gates remain active, the Mission has measurement/rollback, Outcome updates learning, and a second Decision changes only when evidence/outcome justifies it.

- [ ] **Step 2: Run the full Brain suite**

Run: `for f in scripts/brain/test-*.mjs; do node "$f" || exit 1; done`
Expected: FAIL until all integration gaps are fixed.

- [ ] **Step 3: Fix only integration defects exposed by the suite**

Do not broaden scope. Reuse the defined interfaces; no duplicate data model or second Decision engine.

- [ ] **Step 4: Run full suite again**

Run: `for f in scripts/brain/test-*.mjs; do node "$f" || exit 1; done`
Expected: PASS.

- [ ] **Step 5: Verify repository/build/security gates**

Run all existing repository checks required by `AGENTS.md` and the development operating system in addition to the Brain suite. Expected: all relevant gates green.

- [ ] **Step 6: Commit acceptance proof**

```bash
git add tests/brain scripts/brain docs/brain
git commit -m "test: prove end-to-end Brain learning loop"
```

### Task 15: Preview, production promotion, learning writeback and rollout expansion

**Files:**
- Modify: `docs/development-ledger.md`
- Modify: shared BG166/BG167/BG168 learning/context only through their validated contracts.
- No new architecture files unless a regression requires a documented contract amendment.

**Interfaces:**
- Consumes: exact green implementation candidate and acceptance evidence.
- Produces: verified preview, production promotion/rollback evidence and shared material outcome.

- [ ] **Step 1: Create isolated implementation branch from current exact main**

Do not implement on the design branch. Re-read main, shared team context and production state, then create the implementation branch from exact current main and apply the reviewed plan/spec commits as appropriate.

- [ ] **Step 2: Run full candidate verification**

Run Brain tests plus existing repository tests/build/security checks. Record exact candidate SHA and last-known-good production SHA.

- [ ] **Step 3: Deploy preview and verify exact identity**

Verify HTTPS preview, exact candidate SHA/artifact, smoke/regression, protected metrics and zero unexpected actuator side effects.

- [ ] **Step 4: Promote only the exact green candidate**

Use existing production authority. Verify exact production commit/deploy after promotion.

- [ ] **Step 5: Roll back automatically on red**

If production protected metrics regress, restore last-known-good, record `PRODUCTION_ROLLBACK`, keep the candidate in `RECOVERING` and continue with a new hypothesis.

- [ ] **Step 6: Write material outcomes and ledger**

Record implementation, tests, production identity, failures/fixes, protected metrics and reusable lessons in `docs/development-ledger.md` and BG166/BG167/BG168 shared learning/context.

- [ ] **Step 7: Expand autonomy incrementally**

Only after observed evidence supports the foundation, enable A2 customer-facing experiments and broader A3 opportunity-to-production classes one class at a time with their own baseline, canary and rollback. Never mass-enable all legacy scenarios at once.

## Self-review results

- Spec coverage: contracts, Knowledge/Context boundary, Decision Fabric, portfolio/WIP, Creative/Prompt Cortex, data quality, shared memory, Make control-plane integration, shadow learning, autonomy, production constitution, economics, observability and end-to-end learning are all assigned to explicit tasks.
- Migration safety: existing scenarios are adapted after fresh reads and baseline executions; no big-bang replacement is planned.
- Creative gap fixed: BG09/BG14/BG24/BG25/BG180 are explicitly integrated as Creative/Prompt Cortex components.
- Hard boundaries remain immutable and outside learned policy.
- No plan step requires a new paid resource or credential/permission mutation.
