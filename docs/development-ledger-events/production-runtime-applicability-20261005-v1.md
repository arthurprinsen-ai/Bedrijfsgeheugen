# Development ledger — production-runtime-applicability-20261005-v1

- Parent obligation: production-readback-pricing-contract-drift-20261005-v2 / PR #3741 terminal closure.
- Main before recovery: 47ad59de1694409902bedc4d2395a80296b7a375.
- Live production at incident: f3917076d5dfd51042e929e962a0672fa72fcfc5.
- Delta f3917076..47ad59de: verifier/control-plane only.
- Incorrect behavior: Production Source Snapshot attempted exact-source Netlify upload.
- Provider result: 401 Unauthorized on three bounded fresh OIDC/proxy attempts.
- Correct behavior: no deploy for verifier-only delta; run current verifier against the safe live ancestor.
- Guardrail: ancestry + complete changed-path classification; one unknown/runtime path makes the shortcut invalid.
- Regression: tests/brain-production-runtime-applicability-v1.test.mjs.
- Terminal condition: exact-HEAD CI -> auto-merge -> non-deployment production readback + canonical shell live readback green.
