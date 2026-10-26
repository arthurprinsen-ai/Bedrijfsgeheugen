# Canonical Netlify phase test reconciliation

Obligation: baseline-netlify-phase-contract-20261021-v1. Parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742; related release https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573.

One of the 355 inherited BRAIN failures came from checking a retired inlined `netlify.toml` build command, while the actual production and preview commands delegate to `tools/ci/netlify-build-entry.mjs`. The latter implements normalizer → pricing restore → Bedrijfslek restore → i18n → localized routes with a nonzero-status error guard. This is source-verified on main 8f322681ba46045e5d65746c2b2f0fd5b40ffac1.

The test checks the same order against the actual runner, plus exact production/preview delegation, unique phase signatures and subprocess error behavior. No production code, migration, security gates, customer writes or workflow scopes changed. This is one scoped failure correction, not clearance of all 355 or customer A/B acceptance. Exact-head Required, BRAIN, CodeQL and protected provider readback remain mandatory.
