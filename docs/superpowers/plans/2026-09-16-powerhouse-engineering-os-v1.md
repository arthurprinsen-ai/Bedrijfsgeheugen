# Powerhouse Engineering OS v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Powerhouse engineering rules executable, drift-resistant and immediately consumable by every current and future agent without creating a parallel delivery system.

**Architecture:** Extend the existing Development OS and BRAIN-DELIVERY-v2 with one small machine-readable contract and one validator/bootstrap tool inside the existing Brain lane. Wire a focused Node regression contract into the existing protected Required test so documentation/version/wiring drift fails closed. Human documentation remains a projection of the same existing authorities.

**Tech Stack:** Node.js 22, JSON, GitHub Actions, existing BRAIN-DELIVERY-v2, Netlify, Supabase.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-engineering-os-v1-design.md`

## Global Constraints

- Fingerprint is exactly `powerhouse-engineering-os-v1`.
- Existing authorities remain authoritative; do not add a parallel registry, delivery engine, brain, queue or learning store.
- Development delivery contract is `BRAIN-DELIVERY-v2`.
- Protected `main` and Required `test` remain GitHub merge authority.
- Production acceptance requires exact candidate identity and production readback.
- Structural changes require existing Powerhouse documentation and learning writeback.
- Do not weaken security, permissions, RLS, rollback or outcome gates.
- New engineering capabilities must land inside an existing registered delivery lane when that lane semantically owns them; do not broaden the classifier merely to accommodate a new path.

---

### Task 1: Add the Engineering OS contract and bootstrap validator

**Files:**
- Create: `config/powerhouse-engineering-os.json`
- Create: `scripts/brain/powerhouse-engineering-os.mjs`
- Test: `tests/brain-powerhouse-engineering-os-contract.test.mjs`

**Interfaces:**
- Consumes: existing authority paths and `docs/development-operating-system.md`.
- Produces: `loadEngineeringContract()`, `validateEngineeringOS()` and CLI modes `--check` / `--packet`.

- [ ] **Step 1: Write the failing contract test**

Assert fingerprint/version, golden-path order, platform authority declarations, required canonical files, `BRAIN-DELIVERY-v2`, and Required-test wiring.

- [ ] **Step 2: Run it and prove failure**

Run: `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs`
Expected before implementation: failure because config/tool do not exist.

- [ ] **Step 3: Add the minimal machine contract and validator**

The validator must resolve paths from repository root, fail with a non-zero exit code on missing/drifted authority, and emit `ENGINEERING_OS_READY` only when all checks pass.

- [ ] **Step 4: Run the focused contract test**

Run: `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs`
Expected: PASS.

### Task 2: Consolidate Development OS and Required-test wiring

**Files:**
- Modify: `docs/development-operating-system.md`
- Modify: `.github/workflows/required-test.yml`

**Interfaces:**
- Consumes: `config/powerhouse-engineering-os.json` and `scripts/brain/powerhouse-engineering-os.mjs`.
- Produces: mandatory engineering bootstrap and protected regression execution.

- [ ] **Step 1: Replace stale `BRAIN-DELIVERY-v1` reference with `BRAIN-DELIVERY-v2`**

Preserve the independent-delivery/shared-intelligence semantics from `AGENTS.md`.

- [ ] **Step 2: Add the Engineering OS preflight to the mandatory sequence**

Required command: `node scripts/brain/powerhouse-engineering-os.mjs --check`.

- [ ] **Step 3: Wire the focused test into Required test**

Add `tests/brain-powerhouse-engineering-os-contract.test.mjs` to the existing composable release control-plane verification step; do not create a competing required workflow.

- [ ] **Step 4: Verify the validator and contract test together**

Run:
`node scripts/brain/powerhouse-engineering-os.mjs --check`
`node --test tests/brain-powerhouse-engineering-os-contract.test.mjs`
Expected: READY and PASS.

### Task 3: Protect through normal BRAIN delivery and close the loop

**Files:**
- No new authority files.
- Update existing Powerhouse/Notion documentation projections only after verified merge/runtime evidence.

**Interfaces:**
- Consumes: protected Required test, BRAIN-DELIVERY-v2, relevant runtime/provider readback and existing learning/writeback paths.
- Produces: exact-head green evidence, protected merge, exact-main evidence and canonical outcome/writeback.

- [ ] **Step 1: Open PR with exact change scope and fingerprint**

Declare changed source paths and verification paths so branch hygiene can classify the change without bypass.

- [ ] **Step 2: Use red preflight as diagnosis, not as a reason to weaken a gate**

If a new path is unclassified, first move the capability to the semantically correct registered lane when possible. Record the failure and prevention rule in the same lineage.

- [ ] **Step 3: Require exact-head Required/BRAIN gates and fix any red result at root cause**

Do not merge a different SHA than the tested candidate.

- [ ] **Step 4: Protected merge**

Merge only after the required checks are terminal green.

- [ ] **Step 5: Read back exact main/runtime state**

Verify the merged SHA and only the runtime surfaces materially changed by this release. Do not invent Netlify, Supabase or Buffer runtime evidence for components that were not changed.

- [ ] **Step 6: Canonical writeback**

Update the existing Human Handbook/System Map/Master Register/current-state/learning lineage as applicable, then read it back. Only then report `LIVE & BEWEZEN`; otherwise report the exact interim/hard-boundary state.
