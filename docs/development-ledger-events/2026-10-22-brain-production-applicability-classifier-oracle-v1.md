# Append-only delivery evidence — 2026-10-22 production applicability source oracle

- Obligation: `ci-brain-production-applicability-oracle-drift-20261022`
- Fingerprint: `ci|brain|production-applicability-canonical-classifier-oracle-drift|20261022-v1`
- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
- Baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071 — TAP #2367 and #2370 fail within 355 failing assertions/runners.
- Root cause: obsolete inlined-YAML test oracles; both live workflows call the single existing `tools/delivery/netlify-deployment-applicability.mjs`.
- Contained change: `tests/brain-production-runtime-applicability-v1.test.mjs` plus Brain learning and documents; no production code or side effects.
- Preserved checks: seven verifier-only file paths, five Netlify runtime prefixes, shared AI dependency and website pricing browser/deploy, plus existing production-SHA supersession tests.
- Verification: **PENDING** exact-head Required/CodeQL/historical-shadow-canary and aggregate full Unified BRAIN 0 failures. Not merged and not live.
- Prevention: test actual canonical classifier and avoid reinserting stale inline path lists or weakening required deployment/security checks.
