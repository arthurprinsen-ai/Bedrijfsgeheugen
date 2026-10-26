# Development ledger event — P0 #4215 canonical source routing

- Date: 2026-10-09
- Obligation-ID: `p0-4215-canonical-causal-routing-20261009-v1`
- Parent-P0: `#4215`
- Source audit: `portal-v2/input-impact-coverage.js`, `portal-v2/portal-impact-engine.js`, `portal-v2/strategic-models-core.js`, source/renderer matrix.
- Failure class: `PORTAL_CAUSAL_SOURCE_MAPPING_GAP`.
- Root causes: supplemental strategic model note UI not enumerated in source matrix; some canonical portal form paths lacked a source page in causality engine; source-level classifier falsely made the union appear complete.
- Repair: unify classification and causal source checks, enumerate twenty model-note paths from existing registry and mark relevant cross-domain model/page invalidations.
- Prevention: CI schema-to-renderer matrix now explicitly fails on missing source-page routing; regression asserts all twenty note paths and selected cross-domain effects.
- First admission run `37909502968`: `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE` due to missing `activity_ledger`, `brain_learning` and `human_documentation`. This same PR adds the three actual required closure artifacts rather than bypassing the existing policy.
- Verification boundary: source and unit tests are not actual signed-in browser sessions, two-tenant persistence, provider confirmations or validated statutory applicability.
- Release authority: protected Required/CodeQL, protected merge, exact main/Netlify production readback; no assertion of production success before observation.
