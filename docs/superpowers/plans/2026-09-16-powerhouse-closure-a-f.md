# Powerhouse Closure A-F — implementation plan

Date: 2026-09-16
Base production SHA: `35d4c9c5113877d204e3fb4945ce6c4bb6752cb6`
Branch: `powerhouse-closure-a-f`

## Goal
Close the remaining historical gaps without creating parallel brains, databases, queues, calendars or learning systems. Existing Powerhouse/Supabase/GitHub/Netlify authorities are extended in place under EXISTING-STATE-FIRST, REUSE-FIRST, CANONICAL-INTEGRATION and CLOSED-LOOP.

## A — Full Legacy Parity Closure
1. Build a machine-readable legacy capability registry from accepted legacy/current portal evidence.
2. Require every legacy capability to resolve to exactly one state: `native`, `superseded`, or `retired`.
3. Add BCG explicitly and fail closed while its V2 target/evidence is absent.
4. Add a validator that rejects missing target/evidence, duplicate IDs and unknown states.
5. Add browser-evidence contract fields so CI/runtime evidence can be attached per native capability.

## B — Canonical backend closed loop
1. Reuse existing `brain_decisions`, `brain_obligations`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_sales_learnings`, `growth_outcomes` and full-cycle evidence projections.
2. Introduce only the minimal tenant-scoped cycle identity/stage ledger necessary to connect signal → analysis → prediction → decision → execution → provider readback → outcome → realized value → calibration → next decision.
3. Enforce tenant identity, idempotency, stage ordering/provenance and evidence lineage.

## C — Real outcomes/value
1. Preserve `estimated`, `forecast`, and `realized` as distinct truth classes.
2. Persist realized-value observations with value type (revenue, cost saving, hours saved, risk reduction, conversion or custom), unit/currency, evidence and observed-at.
3. Calibration may consume only evidenced realized observations for realized-value learning.
4. Never synthesize/fabricate realized business value.

## D — Obligation reconciliation
1. Reconcile obligations against current canonical/runtime evidence instead of historical prose.
2. Preserve fingerprint and evidence when marking `resolved`, `superseded`, `stale_reconciled` or still-open.
3. GitHub issues are closed only when every original material acceptance condition has current evidence; otherwise rewrite/comment the residual delta.

## E — Legacy Make learning migration
1. Make remains retired; do not resurrect execution.
2. Map BG168/BG166/Make-era fingerprints to current Supabase/Powerhouse writeback authority.
3. Preserve historical evidence/fingerprint and record `superseded_by` lineage.
4. Update agent/runtime contracts so no new canonical learning path depends on Make.

## F — Autonomous Quality Intelligence
1. Production invariants are first-class and machine-checkable.
2. Escaped defects create a canonical learning record and mandatory regression guard descriptor.
3. Dynamic test selection uses affected capability/dependency lineage but keeps mandatory global security/truth/release gates.
4. Performance regressions capture root-cause evidence.
5. Fault injection/game-days are safe/non-production by default and cannot weaken security or mutate irreversible production data.

## Test-first acceptance
- Parity validator initially fails on unresolved BCG/evidence and passes only after an explicit disposition/target exists.
- Cross-tenant cycle references are rejected.
- Realized-value calibration rejects estimated/forecast-only data and missing evidence.
- Reconciliation is idempotent and cannot auto-close a partially satisfied obligation.
- Legacy Make mappings contain no executable Make dependency.
- Escaped defect without regression guard remains an open quality obligation.
- Existing release/security/truth gates remain additive and non-bypassable.

## Release
A-F changes remain on the closure branch until CI/preview/security gates are green. Production promotion must use the existing exact-candidate BG169/Netlify authority, followed by production readback and canonical learning/writeback.
