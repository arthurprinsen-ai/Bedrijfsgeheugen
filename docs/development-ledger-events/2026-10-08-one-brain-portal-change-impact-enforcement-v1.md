# Development ledger — one-brain-portal-change-evidence-20261008-v1

- Date: 2026-10-08
- Scope: portal-v2/portal-impact-engine.js; portal-v2/domain-state.js; portal-v2/tests/one-brain-impact-contract.test.mjs; portal-v2/tests/portal-causal-propagation.test.mjs; .github/workflows/required-test.yml; docs/changes/2026-10-08-one-brain-portal-change-impact-enforcement-v1.md; this ledger; brain/learning/2026-10-08-one-brain-portal-change-impact-enforcement-v1.json
- Base: protected main 8a8870159dfb9b3d0181cf2f020d1a8f48bd8f74 (rebased from 51e6f601628384cde5db214526687efa94ce8d0d)
- Defect: silent false-negative non-calculator mutation + native page unmapped + unacknowledged write silently drained.
- Fix: all-page mapping, cross-domain impact review, canonical writeback acknowledgement, required PR gate.
- Tests: failing tests captured before implementation; check actual PR SHA and production deployment before closure.
- External effect: no mail, DM, publication, customer provider activation, database DDL, or changes to production secrets.
- Current state at authoring: candidate code only; `LIVE_BEWEZEN` not asserted. Complete immutable provider readback after merge before terminal closure.
