# Development ledger — protected ONE BRAIN integration closure

- Date: 2026-10-08
- Obligation: one-brain-integration-closure-guard-20261008-v1
- Incident chain: PR #4159 merged while broader Required test was red; PR #4161 merged while broader Required test reported missing activity_ledger and human_documentation.
- Root cause: material integration closure was checked in a non-required workflow, not within the required hygiene/admission check.
- Correction: reuse the existing compileClosurePlan in protected hygiene; missing closure artifacts fail the required check with immutable evidence.
- Regression: tests/brain-protected-integration-closure-v1.test.mjs and existing learning / integration tests.
- Scope: .github/workflows/powerhouse-delivery-hygiene.yml; tests/brain-protected-integration-closure-v1.test.mjs; brain/learning/2026-10-08-protected-integration-closure-guard-v1.json; docs/changes/2026-10-08-protected-integration-closure-guard-v1.md; this ledger.
- Status: candidate until protected merge, exact deployed SHA and eligible production outcomes are verified.
- External effects: none.
