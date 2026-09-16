# Shared Learning & Architecture Evolution v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Powerhouse Engineering OS so all current/future agents and chats share one enforced learning loop, continuously improve reusable skills, and evolve architecture only through measurable evidence without creating parallel truth or learning systems.

**Architecture:** Extend the existing `powerhouse-engineering-os-v1`, `BRAIN-CHAT-LEARNING-v1`, shared team context and BRAIN-DELIVERY-v2 authority. Add machine-readable shared-learning, skill-evolution and architecture-evolution contracts to the existing Engineering OS config, enforce them in the current validator/bootstrap, expand the existing regression test and Development OS, then project the verified state into the existing Notion/System Map/Handbook/Register surfaces. No new database, queue, memory, registry, agent fabric or deployment authority is introduced.

**Tech Stack:** Node.js 22, JSON, GitHub Actions, BRAIN-DELIVERY-v2, existing Brain learning/context pipeline, Supabase runtime authority, Netlify production readback, Notion human-readable projection.

**Spec:** `docs/superpowers/specs/2026-09-16-shared-learning-architecture-evolution-design.md`

## Global Constraints

- Preserve `powerhouse-engineering-os-v1` as the parent Engineering OS fingerprint.
- Add `powerhouse-shared-learning-architecture-evolution-v1` as the new contract fingerprint; do not create another Engineering OS.
- Keep `BRAIN-DELIVERY-v2` as delivery authority.
- Reuse `config/brain-chat-learning-contract.json` and current shared-context/learning lineage; no second learning store.
- `STATE-OF-THE-ART-EVIDENCE-BASED-ADOPTION` remains the only technology-currency authority.
- Architecture and skill promotion require baseline, measurable evaluation, rollback/fallback, compatibility and post-promotion outcome evidence.
- Hard boundaries remain `secrets_credentials_permissions`, `security_control_weakening`, `destructive_irreversible_data`, `paid_resource_increase`, `legal_financial_commitment`.
- Required CI remains the existing protected `test` context; do not add a competing required workflow.
- No `LIVE & BEWEZEN` status without exact candidate identity and direct current readback for affected production/runtime surfaces.

---

### Task 1: Extend the executable Engineering OS contract

**Files:**
- Modify: `config/powerhouse-engineering-os.json`
- Test: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Consumes: existing Engineering OS principles, golden path, canonical authorities, hard boundaries and state-of-the-art adoption contract.
- Produces: `shared_learning`, `skill_evolution`, and `architecture_evolution` contract objects plus `IMPROVE` lifecycle stage.

- [ ] **Step 1: Write failing contract assertions**

Add assertions requiring:

```js
assert.ok(contract.principles.includes('SHARED-LEARNING'));
assert.ok(contract.principles.includes('TEAM-OF-AGENTS'));
assert.equal(contract.golden_path.at(-1), 'IMPROVE');
assert.equal(contract.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
assert.equal(contract.shared_learning.preflight.read_current_shared_context, true);
assert.equal(contract.shared_learning.dedupe_before_write, true);
assert.equal(contract.shared_learning.refresh_after_new_verified_learning, true);
assert.equal(contract.skill_evolution.requires.baseline, true);
assert.equal(contract.skill_evolution.requires.representative_eval, true);
assert.equal(contract.skill_evolution.requires.rollback_or_fallback, true);
assert.equal(contract.architecture_evolution.requires.compare_to_current, true);
assert.equal(contract.architecture_evolution.requires.migration_compatibility, true);
assert.equal(contract.architecture_evolution.requires.production_readback, true);
```

- [ ] **Step 2: Run the focused test and require failure before implementation**

Run:

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs
```

Expected: FAIL because the new contract fields/stage do not yet exist.

- [ ] **Step 3: Add the minimal machine-readable contract**

Extend `config/powerhouse-engineering-os.json` with:

```json
"shared_learning": {
  "fingerprint": "powerhouse-shared-learning-architecture-evolution-v1",
  "applies_to": ["all_existing_chats", "all_future_chats", "all_existing_agents", "all_future_agents", "all_material_workflows"],
  "preflight": {
    "read_current_architecture": true,
    "read_latest_verified_state": true,
    "read_open_obligations": true,
    "read_current_shared_context": true,
    "read_known_failed_approaches": true,
    "read_explicit_required_evidence": true
  },
  "outcome_classes": ["SUCCESS", "IMPROVEMENT", "RECOVERY", "ERROR", "NO_ACTION", "BLOCKED_HARD_BOUNDARY", "EXPERIMENT_RESULT"],
  "dedupe_before_write": true,
  "separate_audit_from_current_projection": true,
  "refresh_after_new_verified_learning": true,
  "explicit_evidence_not_replaceable_by_shared_context": true,
  "reuse_known_fix_before_experiment": true
},
"skill_evolution": {
  "lifecycle": ["OBSERVE", "CLUSTER", "HYPOTHESIZE", "BASELINE", "CANDIDATE", "EVAL", "REVIEW", "PROMOTE_OR_ROLLBACK", "PROD_OUTCOME", "WRITEBACK"],
  "requires": {
    "baseline": true,
    "representative_eval": true,
    "success_metric": true,
    "compatibility": true,
    "rollback_or_fallback": true,
    "post_promotion_outcome": true
  }
},
"architecture_evolution": {
  "fitness_dimensions": ["correctness", "reliability", "security", "tenant_isolation", "performance", "maintainability", "cognitive_load", "reuse", "observability", "deployability", "rollback_safety", "testability", "data_integrity", "lineage", "cost_capacity", "compatibility", "business_impact", "lead_time"],
  "requires": {
    "compare_to_current": true,
    "measurable_improvement": true,
    "migration_compatibility": true,
    "security_privacy_cost_review": true,
    "representative_tests_or_benchmarks": true,
    "rollback_or_recovery": true,
    "production_readback": true,
    "system_map_and_decision_lineage_update": true
  }
}
```

Add `SHARED-LEARNING` and `TEAM-OF-AGENTS` to `principles`; append `IMPROVE` after `LEARN` in the golden path.

- [ ] **Step 4: Run focused test**

Run the same Node test. Expected: contract assertions pass or reveal validator drift to fix in Task 2.

- [ ] **Step 5: Commit**

```bash
git add config/powerhouse-engineering-os.json tests/brain-powerhouse-engineering-os-contract.test.mjs
git commit -m "feat: add shared learning and evolution contract"
```

### Task 2: Make the Engineering OS validator fail closed on evolution drift

**Files:**
- Modify: `scripts/brain/powerhouse-engineering-os.mjs`
- Modify: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Consumes: the fields created in Task 1 and existing authority paths.
- Produces: validation errors for missing principles/stages/contracts and packet exposure of the effective rules.

- [ ] **Step 1: Add failing validator tests**

Assert `validateEngineeringOS()` verifies:

```js
assert.deepEqual(result.errors, []);
assert.equal(result.shared_learning_fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
```

Also verify `--packet` output includes `shared_learning`, `skill_evolution`, and `architecture_evolution`.

- [ ] **Step 2: Run focused test and confirm failure**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs
```

- [ ] **Step 3: Implement validation invariants**

In `validateEngineeringOS()` require:

```js
const requiredPrinciples = ['SHARED-LEARNING', 'TEAM-OF-AGENTS'];
for (const principle of requiredPrinciples) {
  if (!contract.principles?.includes(principle)) errors.push(`missing principle ${principle}`);
}
if (contract.golden_path?.at(-1) !== 'IMPROVE') errors.push('golden path must terminate in IMPROVE');
if (contract.shared_learning?.fingerprint !== 'powerhouse-shared-learning-architecture-evolution-v1') errors.push('shared learning fingerprint drift');
if (contract.shared_learning?.dedupe_before_write !== true) errors.push('learning dedupe-before-write drift');
if (contract.shared_learning?.refresh_after_new_verified_learning !== true) errors.push('shared context refresh drift');
if (contract.skill_evolution?.requires?.representative_eval !== true) errors.push('skill eval gate drift');
if (contract.skill_evolution?.requires?.rollback_or_fallback !== true) errors.push('skill rollback gate drift');
if (contract.architecture_evolution?.requires?.compare_to_current !== true) errors.push('architecture baseline comparison drift');
if (contract.architecture_evolution?.requires?.production_readback !== true) errors.push('architecture production readback drift');
```

Return the shared-learning fingerprint in validation output.

- [ ] **Step 4: Run the focused regression and CLI**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs
node scripts/brain/powerhouse-engineering-os.mjs --check
node scripts/brain/powerhouse-engineering-os.mjs --packet
```

Expected: PASS / `ENGINEERING_OS_READY`, and packet contains all three evolution contracts.

- [ ] **Step 5: Commit**

```bash
git add scripts/brain/powerhouse-engineering-os.mjs tests/brain-powerhouse-engineering-os-contract.test.mjs
git commit -m "test: enforce shared learning evolution gates"
```

### Task 3: Integrate the new lifecycle into human and agent operating instructions

**Files:**
- Modify: `docs/development-operating-system.md`
- Modify: `AGENTS.md` only if it lacks the existing Engineering OS bootstrap reference; otherwise leave it unchanged.
- Test: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Consumes: executable contract and validator from Tasks 1-2.
- Produces: one human-readable operating sequence aligned to the machine contract.

- [ ] **Step 1: Add failing documentation assertions**

Require `docs/development-operating-system.md` to contain:

```text
powerhouse-shared-learning-architecture-evolution-v1
SHARED-LEARNING
TEAM-OF-AGENTS
LEARN -> IMPROVE
Architecture Evolution
Skill Evolution
```

- [ ] **Step 2: Run regression and confirm documentation assertions fail**

```bash
node --test tests/brain-powerhouse-engineering-os-contract.test.mjs
```

- [ ] **Step 3: Add concise canonical sections**

Document that every material task:
1. reads existing state, current shared context, open obligations, known failures and explicit evidence;
2. reuses known fixes/capabilities before experimenting;
3. captures material outcome/root cause/evidence/prevention;
4. dedupes before learning write and refreshes current context only for new verified learning;
5. considers skill/architecture improvement after `LEARN`;
6. promotes skill/architecture candidates only after baseline/eval/compatibility/rollback/readback evidence;
7. respects state-of-the-art evidence and hard boundaries;
8. writes final evidence and documentation back to the existing authorities.

- [ ] **Step 4: Run focused regression**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/development-operating-system.md AGENTS.md tests/brain-powerhouse-engineering-os-contract.test.mjs
git commit -m "docs: integrate team learning and architecture evolution"
```

### Task 4: Verify existing learning authority compatibility and no parallel truth

**Files:**
- Read/validate: `config/brain-chat-learning-contract.json`
- Modify only if necessary for compatibility: `config/brain-chat-learning-contract.json`
- Test: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Consumes: existing `BRAIN-CHAT-LEARNING-v1` policy and lessons.
- Produces: explicit compatibility checks proving the new Engineering OS reuses the current learning authority.

- [ ] **Step 1: Add regression checks that existing learning invariants remain true**

Parse `config/brain-chat-learning-contract.json` and assert:

```js
assert.equal(learning.version, 'BRAIN-CHAT-LEARNING-v1');
assert.equal(learning.policy.reuseKnownFixBeforeExperimenting, true);
assert.equal(learning.policy.writeNewMaterialLearningBack, true);
assert.equal(learning.policy.refreshSharedContextAfterNewLearning, true);
assert.equal(learning.policy.keepAuditHistoryAppendOnly, true);
assert.equal(learning.policy.keepCurrentProjectionFreeOfTestArtifacts, true);
```

Assert the Engineering OS canonical authority still points to this file.

- [ ] **Step 2: Run regression**

If the existing contract already satisfies all assertions, do not modify it. If a required invariant is absent, add only that invariant without changing its version/authority.

- [ ] **Step 3: Add no-parallel-authority assertions**

Require that the new Engineering OS does not introduce any additional `learning_store`, `memory_store`, `agent_registry`, or `architecture_registry` authority path.

- [ ] **Step 4: Run regression**

Expected: PASS.

- [ ] **Step 5: Commit only if files changed**

```bash
git add config/brain-chat-learning-contract.json tests/brain-powerhouse-engineering-os-contract.test.mjs
git commit -m "test: preserve canonical team learning authority"
```

### Task 5: Run protected delivery and exact-candidate verification

**Files:**
- Existing: `.github/workflows/required-test.yml`
- Existing PR: feature branch to `main`

**Interfaces:**
- Consumes: exact branch head after Tasks 1-4.
- Produces: protected merge candidate with Required `test` green and exact SHA identity.

- [ ] **Step 1: Verify Required CI still executes the Engineering OS regression**

No new workflow should be required. Confirm `.github/workflows/required-test.yml` still includes `tests/brain-powerhouse-engineering-os-contract.test.mjs`.

- [ ] **Step 2: Run/observe PR checks on exact head**

Required evidence: GitHub workflow run associated with exact PR head SHA, terminal success for protected `test` and any BRAIN delivery check the repository requires.

- [ ] **Step 3: Inspect deploy preview/readback where generated**

For documentation/config-only changes, Netlify preview proves build compatibility but is not itself the canonical runtime authority. Record exact preview commit/deploy identity if present.

- [ ] **Step 4: Mark PR ready and merge only after terminal green checks**

Use expected head SHA to prevent merging a moving candidate.

- [ ] **Step 5: Read back `main`**

Confirm `main` contains the merge SHA and exact contract fingerprint/config/test/doc changes.

### Task 6: Canonical Powerhouse writeback and documentation projection

**Files/Surfaces:**
- Existing Notion: `Powerhouse Canonical System Map & Agent Update Contract`
- Existing Notion: `🧱 Powerhouse Engineering Constitution — Architecture, Quality & Learning Standard`
- Existing Notion: `Powerhouse Loop Constitution — alles is een gesloten feedbacklus`
- Existing Notion: `Powerhouse Menselijk Handboek — Processen, Data, Intelligentie, Algoritmen & Samenhang`
- Existing Notion: `Powerhouse — Master Build, Borging & Go-Live Register — 21 augustus 2026`
- Existing Notion: `Powerhouse Latest Verified State`
- Existing Notion: `Powerhouse Agent Activity Log`

**Interfaces:**
- Consumes: merged exact production/main identity and CI/readback evidence.
- Produces: human-readable current projection, verified-state record and reusable learning without creating new Notion authorities.

- [ ] **Step 1: Fetch each target and make the smallest targeted update**

Record:
- fingerprint `powerhouse-shared-learning-architecture-evolution-v1`;
- parent `powerhouse-engineering-os-v1`;
- shared learning lifecycle and no-parallel-memory rule;
- skill evolution promotion loop;
- architecture fitness/promotion gate;
- exact merged SHA/PR and Required CI evidence;
- state-of-the-art evidence rule;
- terminal status and open obligations.

- [ ] **Step 2: Update Latest Verified State and Agent Activity Log using existing schemas/patterns**

Do not invent a new database or status taxonomy.

- [ ] **Step 3: Re-fetch all structurally edited pages/records**

Verify the fingerprint, authority, merge identity and status are visible and internally consistent.

- [ ] **Step 4: Record reusable learning**

Learning: team knowledge/architecture evolution is an extension of existing Engineering OS and Brain learning authority; improvement candidates require evidence, dedupe, rollback and production/readback before promotion.

- [ ] **Step 5: Final status**

Return `LIVE & BEWEZEN` only if merge, Required CI, exact-main readback and canonical Notion/Powerhouse writeback all have direct evidence. Otherwise return the precise non-terminal status plus remaining obligation.