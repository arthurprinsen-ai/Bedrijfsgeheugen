# Protected ONE BRAIN integration closure guard — 8 October 2026

**Obligation:** one-brain-integration-closure-guard-20261008-v1.
**Authority:** GitHub protected hygiene/admission and existing ONE BRAIN records, never a second authority.

## Root cause and correction

PR #4159 passed the protected required checks while the broader Required test failed on an incomplete canonical Brain learning contract. PR #4161 repaired this by adding learning validation to the required admission check. However, PR #4161's broader Required test reported INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE because the PR did not contain append-only development ledger or human documentation. Its auto-merge occurred before these could be added.

This guard reuses the existing compileClosurePlan and powerhouse-integration-bundle-v1 policy in the protection-required hygiene job after candidate identity is confirmed. If a material change lacks Brain learning, the ledger or human documentation, the required job fails. Nonmaterial changes retain the existing closureOnly behavior. The broader Required test gate remains in place.

The original PR histories are preserved. This follow-up documents their missing evidence and ensures recurrence is detected before protected merge.

## Verification boundaries

The regression verifies required workflow wiring and material closure classification. There is no direct production mutation, branch-protection bypass, external marketing send or unproven CSRD measurement. Protected merge, exact release and source readback remain separate obligations.
