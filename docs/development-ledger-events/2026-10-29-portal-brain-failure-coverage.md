# Development ledger — 2026-10-29 incident completeness in portal

Obligation: `portal|one-brain|failure-coverage|20261029`
Scope: `brain/observability/failure-coverage-projection.mjs`, `netlify/functions/powerhouse-observability.mjs`, `portal-v2/modules/powerhouse-observability.js`, test, System Map generated hash and docs.
Decision: expose **counts only** from existing canonical registry, through already authenticated admin API, never raw sensitive error payloads, connector tokens, or tenant data.
Evidence: local deterministic exact-count, partial provider, 403, privacy and UI-contract tests.
Risk: prod service role readback and dashboard browser check remain to verify after protected promotion.
No separate scheduler, third-party send, direct main write, or bypass.
