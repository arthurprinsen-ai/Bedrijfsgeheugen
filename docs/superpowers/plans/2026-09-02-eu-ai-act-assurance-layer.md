# EU AI Act Assurance Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an evidence-backed EU AI Act control, findings, interactive audit and export layer on top of the canonical AI governance registry and existing Data & AI Passport.

**Architecture:** One versioned policy engine evaluates the existing governance/evidence read model. Its deterministic output powers both the Passport audit mode and the audit report, preventing divergent compliance truths. Missing evidence fails closed to an explicit gap/finding; future obligations remain readiness controls until their effective date.

**Tech Stack:** Node.js ESM, existing portal/read-model modules, vanilla browser JS/CSS, Netlify portal runtime, Supabase-backed governance registry, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-02-eu-ai-act-assurance-layer-design.md`

## Global Constraints
- Never emit blanket `EU AI Act compliant` or `certified` from evidence coverage alone.
- Regulatory catalogue baseline date is 2026-09-02 and every rule carries effective dates and official-source metadata.
- Current Article 4, Article 5 and applicable Article 50 controls must be distinguishable from future high-risk readiness controls.
- Existing data-residency, processing-region, training-use and cross-border transparency must remain evidence-driven.
- One evaluation output must power Passport and audit report.
- Production requires exact-SHA verification and exact-SHA Netlify readback.

---

### Task 1: Versioned AI Act obligation catalogue and evaluator

**Files:**
- Create: `platform/read-models/eu-ai-act-controls.mjs`
- Test: `tests/eu-ai-act-controls.test.mjs`

**Interfaces:**
- Produces: `evaluateEuAiAct({ governance, evidence, asOf }) -> { regulatoryBaseline, systems, controls, findings, summary }`
- Produces control statuses: `effective | evidence_missing | remediation_required | not_applicable | future_readiness | not_determined`

- [ ] **Step 1: Write failing tests** for Article 4/5/50 current applicability, future high-risk dates, missing evidence and forbidden blanket wording.
- [ ] **Step 2: Run** `node --test tests/eu-ai-act-controls.test.mjs` and verify failure.
- [ ] **Step 3: Implement** a data-driven obligation catalogue with `article`, `effective_from`, `source_url`, deterministic applicability predicates and evidence predicates; implement `evaluateEuAiAct` without network calls.
- [ ] **Step 4: Run** `node --test tests/eu-ai-act-controls.test.mjs` and verify pass.
- [ ] **Step 5: Commit** `feat: add versioned EU AI Act control engine`.

### Task 2: Derive findings and assurance conclusion

**Files:**
- Modify: `platform/read-models/eu-ai-act-controls.mjs`
- Test: `tests/eu-ai-act-controls.test.mjs`

**Interfaces:**
- `finding.id` is deterministic from tenant/use-case/control.
- `summary.conclusion` is scoped and blocked by unknown/current gaps or stale regulatory review.

- [ ] **Step 1: Add failing tests** proving gaps create stable findings, passing retest removes derived open finding, future-readiness does not count as current non-conformity, and unknowns block a clean conclusion.
- [ ] **Step 2: Run** the focused test and verify failure.
- [ ] **Step 3: Implement** deterministic findings plus summary counts and evidence-scoped conclusion.
- [ ] **Step 4: Re-run** focused tests and verify pass.
- [ ] **Step 5: Commit** `feat: derive AI Act findings and scoped assurance`.

### Task 3: Attach EU AI Act evaluation to Passport read model

**Files:**
- Modify: `platform/read-models/data-ai-runtime-evidence.mjs`
- Test: `tests/portal-governance-passport-live.test.mjs`
- Test: `tests/data-ai-passport.test.mjs`

**Interfaces:**
- Existing Passport read model gains `aiAct` containing the Task 1 evaluation output.
- Existing controls remain unchanged unless richer evidence is available.

- [ ] **Step 1: Add failing regression tests** requiring `aiAct.regulatoryBaseline`, systems, controls, findings and current/future distinction.
- [ ] **Step 2: Run** focused portal tests and verify failure.
- [ ] **Step 3: Integrate** `evaluateEuAiAct` using already-loaded governance evidence; do not introduce a second fetch path.
- [ ] **Step 4: Run** both focused portal tests and verify pass.
- [ ] **Step 5: Commit** `feat: expose AI Act assurance in Passport model`.

### Task 4: Interactive AI Act Audit mode

**Files:**
- Modify: `portal/data-ai-passport-view.mjs`
- Modify: `portal/data-ai-passport.html`
- Test: `tests/portal-governance-passport-live.test.mjs`

**Interfaces:**
- UI mode switch values: `data-flow` and `ai-act-audit`.
- Inspector consumes only `passport.aiAct` plus existing Passport evidence.

- [ ] **Step 1: Add failing DOM/source regression assertions** for `AI Act Audit`, current/future status semantics, Article 4/5/50 labels, evidence inspector and open findings.
- [ ] **Step 2: Run** the focused test and verify failure.
- [ ] **Step 3: Implement** spatial audit graph, selectable use-case/control nodes, progressive disclosure inspector, evidence-gap paths, keyboard navigation, mobile layout and `prefers-reduced-motion` fallback.
- [ ] **Step 4: Run** focused test and existing Passport regressions; verify pass.
- [ ] **Step 5: Commit** `feat: add interactive AI Act audit mode`.

### Task 5: Audit report and structured export

**Files:**
- Create: `portal/eu-ai-act-audit-report.mjs`
- Create: `portal/eu-ai-act-audit-report.html`
- Modify: `portal/data-ai-passport-view.mjs`
- Test: `tests/eu-ai-act-audit-report.test.mjs`

**Interfaces:**
- `buildEuAiActAuditReport(passport) -> { scope, baseline, conclusion, inventory, controls, evidenceIndex, findings, accountability, transparency, snapshot }`
- Browser actions: printable report and JSON export generated from this object.

- [ ] **Step 1: Write failing tests** requiring all report sections, snapshot timestamp, evidence references, findings and no blanket certification language.
- [ ] **Step 2: Run** `node --test tests/eu-ai-act-audit-report.test.mjs` and verify failure.
- [ ] **Step 3: Implement** report builder and print-first report page; add Passport CTA `Open EU AI Act audit report` and JSON export.
- [ ] **Step 4: Run** report and Passport tests and verify pass.
- [ ] **Step 5: Commit** `feat: add EU AI Act audit report and export`.

### Task 6: Full verification and production promotion

**Files:**
- No feature files unless a regression is found.

**Interfaces:**
- Candidate SHA must remain immutable between final verification and merge.

- [ ] **Step 1: Run** focused AI Act tests plus existing Passport tests.
- [ ] **Step 2: Run** repository-required/portal regression workflows through PR and record exact candidate SHA.
- [ ] **Step 3: Verify** PR is mergeable and required status is success on that exact SHA.
- [ ] **Step 4: Merge with expected-head SHA guard.**
- [ ] **Step 5: Verify** main SHA and Netlify production deploy `commit_ref` are identical and deploy state is `ready`.
- [ ] **Step 6: Read back** production route/report route and record truthful status; never equate CI with production.
