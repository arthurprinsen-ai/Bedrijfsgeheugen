# Powerhouse Canonical Truth Closure — Design

Date: 2026-09-16
Status: approved
Fingerprint: `powerhouse-canonical-truth-closure-v1`

## Goal

Close the Bedrijfsgeheugen Powerhouse without creating a parallel brain, queue, CRM, publication store, learning plane, or reconciliation authority. Existing Supabase production state and protected GitHub delivery remain canonical.

A historical issue, obligation, or blocker is a claim that must be reconciled against current authority; it is never current truth merely because it is open.

## Authorities

- Supabase: `brain_obligations`, `brain_blockers`, `brain_production_truth`, `brain_reconciliation_jobs`, existing runtime/publication/outcome/learning tables.
- GitHub: protected `main`, pull requests, checks, issues and source-controlled contracts.
- Provider readback: required for external publication/runtime completion.
- Make: retired; no recovery route may reintroduce it.

## Canonical classification

Every material open claim is classified against fresh evidence as exactly one of:

- `CURRENT_DEFECT`
- `CURRENT_EXTERNAL_BOUNDARY`
- `PROVEN_FIXED`
- `SYNTHETIC_TEST_STATE`
- `SUPERSEDED`
- `RETIRED_DEPENDENCY`
- `EVIDENCE_MISSING`

`CURRENT_DEFECT`, `CURRENT_EXTERNAL_BOUNDARY`, and `EVIDENCE_MISSING` are material blockers. The remaining terminal classifications do not block completion but retain historical lineage/evidence.

## Truth reconciler

The reconciler is deterministic and fail-closed. It consumes normalized claims plus fresh authority observations; it does not scrape prose to invent truth. Synthetic evidence must be explicit. Retired dependencies must be explicit. Fixed/superseded claims require an observation that contradicts or replaces the old claim with freshness/provenance.

Reconciliation results are projected into existing evidence/production-truth structures. Historical records are not deleted.

## Material Closure Supervisor

The supervisor aggregates current classified claims and evidence domains. `LIVE_BEWEZEN` is allowed only when:

1. no material current claim remains;
2. all required assurance domains are fresh and proven;
3. external actions that require provider confirmation have provider readback;
4. production runtime/decision evidence is current;
5. the commercial closed loop has real production lineage where applicable.

Synthetic/stale/superseded/retired records cannot keep the Powerhouse red. Unknown or stale material evidence cannot turn it green.

## Current closure lanes

### State hygiene

Resolve the four active `synthetic:*` blocker artefacts with explicit reconciliation evidence. Reconcile stale GitHub governance claims such as old `main unprotected` issues against current protected-main evidence.

### Cockpit ↔ Notion dagplan

Keep `cockpit-notion-dagplan-parity-v2` material while runtime cannot access the canonical datasource through `Bedrijfsgeheugen AI`. Manual 20↔20 reconciliation is useful evidence but cannot substitute for runtime API readback.

### Completion Supervisor

Replace stale recovery evidence with current material-closure evidence. The supervisor itself remains blocked while any required material lane is unresolved.

### Social publication

Creation/dispatch is not publication proof. Completion requires exact provider identity/readback and fail-closed identity gates.

### Security

Reconcile advisor findings against effective privileges before mutating production. RLS-without-policy findings are classified table-by-table; intentional deny-by-default/service-only tables are not given blanket client policies. Effective privilege tests outrank stale prose.

### Whole-Brain proof

Require production evidence for decision→execution, route-level RUM coverage, and legacy-calculation inventory/parity. Built code without runtime evidence remains incomplete.

### Content obligations

Old content/blog obligations are reconciled against current production/provider state. They are either re-proven and fulfilled or remain current defects/boundaries. Make-only replay clauses are retired, not replayed.

### Operations assurance

Maintain fresh evidence for backup→restore, DR/RPO/RTO, IAM/service accounts, credential rotation, dependency/SBOM/deprecation hygiene and alert/SLO failure drills. Missing evidence becomes `EVIDENCE_MISSING`, not an assumed defect and not green.

### Business outcome closure

The real production lineage is:

`prediction/decision → governed action → provider/runtime outcome → business impact/revenue → learning/calibration → changed next decision`.

Synthetic/test records cannot satisfy this lane. Existing runtime, sales outcome, growth outcome and revenue-learning authorities are reused.

## Safety invariants

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No direct protected-main mutation.
- No weakening release, identity, security, truth or provider-readback gates.
- No Make dependency or Make replay recovery.
- No blanket RLS policies merely to silence an advisor.
- Unknown is not green.
- Historical evidence remains immutable/auditable; operational state is reconciled separately.

## Test contract

Regression tests must prove classification, materiality and supervisor behavior for synthetic blockers, stale/fixed claims, retired dependencies, external boundaries, missing evidence and fully proven state. Tests also prove operations-assurance freshness and real-vs-synthetic business-lineage requirements.

## Definition of done

The implementation is done only after protected delivery, fresh production state reconciliation and readback. The total Powerhouse may remain `DEELS_LIVE` where an external boundary or genuinely missing production outcome remains; the implementation must make that state precise, actionable and impossible to confuse with stale history.