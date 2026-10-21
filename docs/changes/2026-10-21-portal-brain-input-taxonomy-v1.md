# V2 input → Brain and connector draft persistence

Obligation-ID: p0-4215-portal-brain-taxonomy-20261021
Parent-P0: #4215
Fingerprint: portal|business-input|postgres-taxonomy-and-native-request|v1

Production read-only pg_constraint inspection on project adhjwmvyoixzjtmiroln confirmed the original type/kind checks only admit the legacy whole-brain taxonomy plus Governance/governance. The current writer already emits SourceObservation/raw_source, BusinessInput/SourceTruth and ImpactAssessment/organism_impact. The first append therefore fails before customer projection. Existing HTTP-unit doubles did not enforce database checks.

The connector editor actually mounted in V2 is assets/js/koppelingen/view.js. Its API passes a native Fetch Request. The server incorrectly treated the Request.body ReadableStream as a parsed request object, so draft source configuration and mappings were silently lost. Read native requests via json(); keep support for the pre-parsed legacy transport.

The additive migration admits only the exact missing types/kinds. Legacy values remain admitted; unknown taxonomy drift aborts before replacement. The transaction uses a 2-second lock timeout and 20-second statement timeout. No customer rows, RLS, grants, tenants, service identity, scheduler or provider activation behavior is changed. No fake production input is inserted and no historical customer data is reassigned.

## Evidence

- Red: actual writer against versioned checks returned RAW_SOURCE_WRITE_FAILED/502.
- Red: browser API → native Request → actual connector handler → reopen lost source.config.
- Green: 45 targeted writer, connector runtime, isolation, activation and UI contracts pass.
- Isolated PostgreSQL (PGlite 0.3.14): original failure reproduced; migration applied twice; two fixture tenants each persist four actual writer records through brain_append_record; replay remains eight rows; unknown types still rejected; RLS remains enabled. This is not authenticated customer or production proof.
- New regression is explicitly included in the backend release lane.

Reproduce isolated SQL validation with a temporary installation of @electric-sql/pglite@0.3.14 outside the repository and `PGLITE_MODULE_URL` set to the absolute file URL of its dist/index.js, then run `node tests/brain-portal-input-taxonomy-postgres.mjs`. No production connection or credential is used.

## Release and acceptance

Protected Required/CodeQL, independent preview, provider migration readback and exact-main Netlify function readback remain mandatory. Final customer acceptance needs two separately authenticated identities submitting/reopening fields and connector drafts, checking source/revision/Brain/impact ACKs and rejecting cross-tenant reads. Fixtures never satisfy that requirement. Do not claim whole-system green from this recovery.

Reference: https://www.postgresql.org/docs/17/sql-altertable.html

## Live collection-route correction

Read-only production HTTP inspection also proved GET /api/connectors (with or without a trailing slash) returned 404 HTML, while /api/connectors/not-a-real-connector returned authenticated JSON401. The deployed wildcard did not cover the exact collection route used by the wizard. Register both `/api/connectors` and `/api/connectors/*` with the documented Netlify path-array form. Preserve `/api/connectors/readiness` exclusion. The new route regression was red before registration and green after; existing route-isolation checks now accept the array while still requiring the wildcard and exclusion. No auth bypass or static rewrite is introduced.

A broader unchanged test, `production truth remains exact-SHA and delivery-lane scoped`, expects `createDeliveryPlan` in the main production-readback workflow, which current main no longer contains. This preexisting assertion is recorded rather than hiding it; its source and policy are not weakened.
