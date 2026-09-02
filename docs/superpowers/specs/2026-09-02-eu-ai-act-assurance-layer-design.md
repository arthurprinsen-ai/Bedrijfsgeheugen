# EU AI Act Assurance Layer — Design

## Goal
Extend the existing evidence-driven Data & AI Passport into a canonical EU AI Act assurance and audit capability without creating a second source of truth or claiming blanket legal certification.

## Regulatory baseline
The control model is versioned against the EU AI Act regulatory state effective 2026-09-02. The general AI Act application/enforcement date and Article 50 transparency obligations apply from 2026-08-02. AI literacy and prohibited-practice obligations have applied since 2025-02-02. GPAI obligations have applied since 2025-08-02. High-risk Annex III rules are scheduled for 2027-12-02 and regulated-product high-risk rules for 2028-08-02 under the current EU implementation timeline.

Regulatory rules must therefore carry `effective_from`, `effective_until`, `source_url`, `source_version`, and `reviewed_at`; future-dated obligations may be shown as readiness controls but must not be represented as currently mandatory.

## Architecture
Use one canonical chain:

`brain_ai_governance_registry → AI Act policy/control engine → evidence ledger/read model → Data & AI Passport → audit report`

No independent compliance spreadsheet, hard-coded green badge, or second AI inventory is introduced.

### 1. AI inventory and role classification
Each active AI use case resolves its legal/operational role (`provider`, `deployer`, `downstream_provider`, or `not_determined`), purpose, model/provider, lifecycle, owner, data categories, human oversight, and risk classification. Missing role or classification is an evidence gap, never silently inferred as compliant.

### 2. Versioned obligation catalogue
A machine-readable catalogue maps applicable EU AI Act controls to articles and effective dates. Initial control families:
- Article 4 — AI literacy evidence.
- Article 5 — prohibited-practice screening.
- Article 50 — transparency/disclosure/marking applicability and evidence.
- AI inventory, role and risk classification.
- Human oversight.
- Data governance and prohibited-data constraints.
- Logging, traceability and audit evidence.
- Provider/model/version provenance.
- Subprocessors, processing geography and transfer evidence.
- DPIA/FRIA applicability and evidence where relevant.
- Incident/escalation and post-market monitoring readiness.
- High-risk readiness controls, explicitly future-dated until legally applicable to the assessed use case.

### 3. Evidence-backed control evaluation
Every evaluated control emits:
`control_id, article, applicability, effective_state, status, claim, evidence_ids, evidence_urls, owner, last_tested_at, next_review_at, finding_id`.

Allowed status values:
- `effective`
- `evidence_missing`
- `remediation_required`
- `not_applicable`
- `future_readiness`
- `not_determined`

A control can only be `effective` when required evidence is present and the deterministic test passes. Evidence completeness is not legal certification.

### 4. Findings and remediation
Every failed or indeterminate applicable control creates a dedupeable finding:
`Requirement → Control → Evidence → Test → Finding → Owner → Due date → Retest`.
Findings remain open until a later test closes them with evidence. No cosmetic dismissal.

### 5. Passport UX
Add a second mode to the existing spatial journey:
- `Data Flow`
- `AI Act Audit`

Audit mode projects the same AI inventory into an interactive compliance graph. Selecting an AI/use-case shows role, risk, applicable articles, control status, evidence, geography, human oversight, provider/subprocessor evidence and open findings. Missing evidence is visually connected to its affected node and audit finding.

The UI must distinguish:
- current legal obligations,
- future readiness obligations,
- not-applicable controls,
- unknown/not-determined controls.

Never display `EU AI Act compliant`, `certified`, or an equivalent blanket claim solely from internal evidence coverage.

### 6. Audit report
Generate a reproducible, timestamped audit read model from the same evaluation output. Sections:
1. Audit scope and regulatory baseline.
2. Executive conclusion.
3. AI inventory.
4. Role and risk classification.
5. Applicable obligations.
6. Control effectiveness.
7. Evidence index.
8. Findings and remediation.
9. Human oversight and accountability.
10. Data/processing/provider transparency.
11. Review/sign-off metadata.
12. Immutable evidence snapshot/hash where available.

Permitted overall conclusions are evidence-scoped, e.g. `No material non-conformities identified for assessed scope`, only when all currently applicable controls are effective or legitimately not applicable. Otherwise the conclusion states the number/severity of open findings and never hides unknowns.

### 7. Export
The portal provides a printable audit view and structured JSON export from the same audit read model. PDF can be produced from the print view downstream, but the canonical evidence is structured data, not the PDF.

## Data flow
1. Portal-state gateway loads tenant state plus canonical/tenant AI governance records.
2. Policy engine resolves regulatory baseline and use-case applicability.
3. Evidence evaluator tests each applicable control.
4. Findings are deterministically derived/deduped.
5. Passport renders graph + inspector from evaluation output.
6. Audit report renders the exact same output plus snapshot metadata.

## Failure behaviour
- Missing governance data → `not_determined` / finding.
- Missing evidence → `evidence_missing` / finding.
- Future obligation → `future_readiness`, never current non-compliance.
- Conflicting evidence → `remediation_required` and surface conflict.
- Regulatory catalogue stale beyond configured review date → assurance conclusion is blocked and marked `regulatory_review_required`.
- Runtime/API failure → do not reuse stale green state without visibly marking snapshot age/source.

## Testing
TDD coverage must prove:
- Article/effective-date applicability.
- No blanket compliance wording.
- Unknown evidence cannot become green.
- Future high-risk controls are not represented as currently mandatory.
- Article 4/5/50 controls are surfaced for applicable current scope.
- One evaluation powers both Passport and audit report.
- Findings dedupe and close only on passing retest evidence.
- Print/JSON audit output includes scope, baseline, controls, evidence and findings.
- Existing Passport/data-residency/training/cross-border truthfulness regressions remain green.

## Production gate
Candidate branch → PR → exact-SHA required tests → merge → exact main SHA Netlify production deploy → live route/readback evidence. A successful CI run alone is not production evidence.
