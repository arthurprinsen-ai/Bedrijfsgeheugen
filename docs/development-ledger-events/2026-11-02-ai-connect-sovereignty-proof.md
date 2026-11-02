# 2026-11-02 · AI Connect consent / provider-proof incident
Obligation: `portal-ai-connect-sovereignty-proof-20261102-v1`
Fingerprint: `portal|connectors|sample-dry-run-mistaken-for-live-verification|20261102-v1`
Owner: original Portal V2/Connector/ONE BRAIN/Security/Heartbeat, one protected integration writer.

Observed: local sample read/extraction/target test can return `TEST_PASSED` and an execution ID without contacting any real third-party source or destination. The existing portal might interpret this as activatable. Existing connector tables were empty at source inspection, so no real customer integration was independently proven.

Change: set provider-origin proof level in original engine, require source and target external provider verification before activation and before healthy portal label; default `CONNECTION_ONLY` per customer connector, offer `PORTAL_INSIGHTS` and `PORTAL_AI`, record policy inside existing tenant connector definition and reject prohibited model training and ungoverned routes. No source data or credentials included in this record.

Tests: `tests/connector-ai-sovereignty-consent-20261102.test.mjs`, `tests/connector-reference-flow.test.mjs`, `tests/connector-engine.test.mjs`, `tests/connector-koppelingen-status.test.mjs`, existing portal connector and sovereignty tests.

Proof: **SOURCE_CANDIDATE** only; protected exact-head Required/CodeQL/full BRAIN, merge, Netlify published SHA and authenticated two-tenant provider readback outstanding. UX/accessibility performance and actual cross-provider onboarding remain **EVIDENCE_DUE**. A full data-location route is **UNKNOWN** until every involved provider has documented processing/transfer/subprocessor proof. The original incident stays open to post-release independent rechecks.

Prevention: never conflate a sample or status-only green with a real connector; no silent storage/AI consent; preserve the original protected release and single-brain writeback authority.
