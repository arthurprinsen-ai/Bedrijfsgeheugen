# Compliance Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an evidence-first Compliance Command Center in the Bedrijfsgeheugen portal for Bedrijfsgeheugen and customer organisations, covering EU AI Act, NIS2/Cyberbeveiligingswet and cross-cutting privacy/data evidence, with risk prioritisation and audit output.

**Architecture:** Pure compliance evaluation logic lives in `portal-next/compliance-engine.js`; framework/control definitions are isolated in `portal-next/compliance-registry.js`; portal/customer state is adapted in `portal-next/compliance-input-adapter.js`; rendering and interaction live in `portal-next/compliance-command-center.js` with dedicated CSS. Existing portal-next navigation and content mapping are extended without rewriting legacy `klantportaal.html`.

**Tech Stack:** Vanilla ES modules, HTML/CSS, Node.js built-in test runner, existing portal-next Business OS patterns.

**Spec:** `docs/superpowers/specs/2026-09-08-compliance-command-center-design.md`

## Global Constraints

- No compliance claim without current evidence.
- NIS/Wbni is legacy/mapping only; do not double-count it beside NIS2/Cbw.
- Unknown applicability must remain visibly unknown.
- Customer missing input must create a reason and concrete next action.
- No production fact (hosting, data residency, provider status, legal scope) may be invented.
- Exact candidate identity must pass relevant portal/Required/BRAIN-delivery gates before production promotion.
- Legacy `klantportaal.html` remains intact unless a verified integration dependency makes a minimal change unavoidable.

---

### Task 1: Compliance evaluation engine

**Files:**
- Create: `tests/compliance-command-center.test.mjs`
- Create: `portal-next/compliance-engine.js`

**Interfaces:**
- Produces: `evaluateControl(control, options)`, `evaluatePortfolio(controls, options)`, `rankRisks(controls)`, `createAuditSnapshot(controls, options)`, `canonicalFramework(framework)`.

- [ ] **Step 1: Write the failing engine contract tests** covering VERIFIED evidence requirements, unknown applicability, legacy NIS mapping, deterministic risk ranking and audit snapshot structure.
- [ ] **Step 2: Run `node --test tests/compliance-command-center.test.mjs` and verify RED** because `portal-next/compliance-engine.js` does not yet exist.
- [ ] **Step 3: Implement the minimum pure engine** to satisfy the contracts; a control becomes VERIFIED only when applicability is `applicable`, the control exists, evidence exists and `verifiedAt` is valid/not expired under explicit evidence metadata.
- [ ] **Step 4: Run the focused test and verify GREEN.**
- [ ] **Step 5: Commit the engine and tests.**

### Task 2: Canonical control registry and customer input adapter

**Files:**
- Create: `portal-next/compliance-registry.js`
- Create: `portal-next/compliance-input-adapter.js`
- Modify: `tests/compliance-command-center.test.mjs`

**Interfaces:**
- Produces: `COMPLIANCE_CONTROL_TEMPLATES`, `buildCustomerControls(customerData)`, `buildBedrijfsgeheugenControls(evidenceData)`.
- Consumes: Task 1 statuses and framework mapping.

- [ ] **Step 1: Add failing tests** proving missing customer fields result in `UNKNOWN` plus `reason` and `nextAction`, and that NIS legacy requirements aggregate into NIS2/Cbw without duplicate scoring.
- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Add a minimal canonical registry** for AI Act governance/transparency/AI literacy/inventory and NIS2/Cbw scope/risk/incident/continuity/supply-chain/access controls, with GDPR/data cross-links where relevant.
- [ ] **Step 4: Add the input adapter** that consumes existing portal state when present and otherwise returns explicit unknowns. Never infer legal applicability solely from an unanswered field.
- [ ] **Step 5: Run focused tests and verify GREEN.**
- [ ] **Step 6: Commit registry + adapter.**

### Task 3: Compliance Command Center UI

**Files:**
- Create: `portal-next/compliance-command-center.js`
- Create: `portal-next/compliance-command-center.css`
- Modify: `tests/compliance-command-center.test.mjs`

**Interfaces:**
- Consumes: `evaluatePortfolio`, `rankRisks`, `createAuditSnapshot`, customer/self control builders.
- Produces: custom element `<bg-compliance-command-center>`.

- [ ] **Step 1: Add failing DOM/static contract tests** checking the module exposes Executive Pulse, Compliance Constellation, Control Matrix, Remediation Flightplan and Audit Room semantics.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement the custom element** with scope toggle (`Bedrijfsgeheugen` / `Uw organisatie`), explainable risk cards, framework pulse, control drill-down and evidence badges.
- [ ] **Step 4: Implement creative responsive styling**: radial compliance pulse, evidence constellation, dependency/risk flightplan, audit drawer; motion only for real evidence links; strong mobile touch targets.
- [ ] **Step 5: Implement `Waarom nu?` explanations** from deterministic risk output and single-next-action focus.
- [ ] **Step 6: Run focused tests and verify GREEN.**
- [ ] **Step 7: Commit UI.**

### Task 4: Audit Room and print/PDF-ready output

**Files:**
- Modify: `portal-next/compliance-command-center.js`
- Modify: `portal-next/compliance-command-center.css`
- Modify: `tests/compliance-command-center.test.mjs`

**Interfaces:**
- Consumes: `createAuditSnapshot()`.
- Produces: audit snapshot view and browser-print export.

- [ ] **Step 1: Add failing tests** requiring snapshot scope, timestamp, framework summaries, findings and evidence index plus a print action.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement Audit Room** with explicit audience modes (bestuur, accountant/auditor, toezichthouder/due diligence) without changing underlying facts.
- [ ] **Step 4: Add print CSS** that removes navigation/interaction chrome and prints a dated audit snapshot with open findings and evidence references.
- [ ] **Step 5: Verify GREEN and commit.**

### Task 5: Business OS portal integration

**Files:**
- Modify: `portal-next/portal-business-os-navigation.js`
- Modify: `portal-next/portal-content-map.js`
- Modify: `portal-next/index.html`
- Modify: `tests/compliance-command-center.test.mjs`

**Interfaces:**
- Produces: discoverable `Compliance Command Center` route under Trust & Governance and workspace mount.

- [ ] **Step 1: Add failing navigation/integration tests** requiring the route, content-map entry, stylesheet/module imports and workspace mount.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Add route under Trust & Governance** following current Business OS navigation patterns, preserving all existing routes.
- [ ] **Step 4: Add the command center workspace to `portal-next/index.html`** and load its CSS/module.
- [ ] **Step 5: Extend the content map** so legacy/live content links relevant to AI Act, governance, privacy, data sovereignty and due diligence remain reachable from the command center.
- [ ] **Step 6: Verify focused tests GREEN and run all relevant portal tests.**
- [ ] **Step 7: Commit portal integration.**

### Task 6: Evidence-first Bedrijfsgeheugen projection

**Files:**
- Modify: `portal-next/compliance-registry.js`
- Modify: `portal-next/compliance-input-adapter.js`
- Modify: `tests/compliance-command-center.test.mjs`

**Interfaces:**
- Consumes: verified repository/runtime evidence only.

- [ ] **Step 1: Add failing tests** that reject a green self-compliance status when a legal applicability decision or current evidence is missing.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Link only observable evidence** (for example delivery/readback or fail-closed readiness evidence) to relevant technical controls while leaving legal compliance status UNKNOWN/EVIDENCE_MISSING when not proven.
- [ ] **Step 4: Verify GREEN and commit.**

### Task 7: Release gates and exact-SHA production readback

**Files:**
- Modify only if a discovered gate exposes a real defect in this feature.

**Interfaces:**
- Consumes: repository CI and BRAIN delivery system.

- [ ] **Step 1: Run focused compliance tests plus relevant Portal V2/Business OS/Required gates on the exact feature SHA.**
- [ ] **Step 2: Diagnose and root-cause any failing feature-owned gate; do not bypass or weaken a gate.**
- [ ] **Step 3: Repeat until the exact candidate is green or a true hard boundary is reached.**
- [ ] **Step 4: Mark PR ready and merge only when exact-head required gates are green.**
- [ ] **Step 5: Verify production promotes the exact merge SHA through the authorised path and perform live readback of the command center route/content.**
- [ ] **Step 6: Record outcome/evidence/learning; if BG168→BG166 remains paused, preserve a deduplicated replay obligation rather than claiming Brain writeback.**
