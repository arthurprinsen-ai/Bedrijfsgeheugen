# Development ledger event — personal LinkedIn life-only

- Date: 2026-09-20
- Obligation: `personal-linkedin-personal-life-only-v1`
- Delivery lane: social-content-identity
- Change: harden personal LinkedIn from semantic-personal to explicit personal-life-only.
- Root cause: business exception and missing end-to-end life-only fingerprint.
- Runtime surfaces: identity contract, platform gate, Supabase pre-publish review, content orchestrator.
- Regression: personal harmless event must pass; business wrapper, consultant/business signals and missing life-only verification must fail.
- Rollback: revert the candidate commit while retaining the previous v5 semantic gate.
- Terminal proof required: protected merge, exact main containment, Supabase production deployment/readback for affected functions, learning + skill projection readback.
