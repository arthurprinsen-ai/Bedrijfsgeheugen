# Development ledger — Authenticated Portal production canary v1

- Obligation: `portal-authenticated-production-canary-v1`
- Date: 2026-10-07
- Failure class: `PORTAL_AUTHENTICATED_PRODUCTION_READBACK_GAP`
- Root cause: CI had no durable authenticated Netlify Identity session for the protected ondernemersdata production endpoint.
- Existing truth preserved: `portal-ondernemersdata.mjs` remains protected exclusively by normal Netlify Identity `getUser()` plus tenant resolution.
- Fix: short-lived GitHub Actions OIDC → verified Netlify canary session → real cookie-authenticated GET → tenant/read-model assertions → ephemeral user cleanup.
- Permanent test credentials: none.
- Business API auth bypass: none.
- Regression: `tests/portal-authenticated-production-canary.test.mjs`.
- Production closure: withheld until protected gates, merge, Netlify exact-main deployment and canary HTTP 200 artifact succeed.

- PR_MACHINE_METADATA_INVALID recovery: Required run 37684632285 correctly failed admission because the first PR body omitted the exact machine-readable delivery metadata preamble. The PR body now starts with Obligation-ID, Delivery-Lane, Candidate-Type, Base-SHA, Supersedes, Change-Scope and Scope-Budget; this is a prevention rule, not a gate bypass.
- Semantic learning closure: added top-level `failure_class` and `evaluation` after Required preflight correctly rejected the first learning artifact as semantically incomplete.
- OIDC subject customization: verifier now binds exact owner/repository numeric IDs and accepts only subject prefixes for this exact repo identity, while `ref`, `workflow_ref`, audience and signature stay independently exact.
