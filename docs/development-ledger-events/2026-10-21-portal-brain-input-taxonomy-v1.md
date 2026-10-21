# P0 #4215 — Portal persistence recovery

Obligation-ID: p0-4215-portal-brain-taxonomy-20261021
Base-SHA: 21f30f4dfd0c594758cfcd7af93d0f842a9052da
Fingerprint: portal|business-input|postgres-taxonomy-and-native-request|v1

Production constraints reject the actual V2 writer taxonomy. Native connector requests additionally lose JSON bodies because the transport normalizer uses the ReadableStream as decoded input. Both were reproduced before fixes. Added bounded versioned schema admission and native Request parsing, actual adapter roundtrip/tenant regression, backend lane inclusion and isolated SQL replay. 45 targeted checks pass; SQL replay confirms two fixture tenants and dedupe. Auth library inspection rejected the initial getUser(request) hypothesis: @netlify/identity 2.0.0 intentionally uses request context, so no speculative auth change was made.

No production mutation or customer write claimed. Continue exact-head protected release and actual tenant acceptance in #4215. PR #4571 remains owned by its existing SaaS writer; never mutate it from this recovery.

## Live collection-route correction

Read-only production HTTP inspection also proved GET /api/connectors (with or without a trailing slash) returned 404 HTML, while /api/connectors/not-a-real-connector returned authenticated JSON401. The deployed wildcard did not cover the exact collection route used by the wizard. Register both `/api/connectors` and `/api/connectors/*` with the documented Netlify path-array form. Preserve `/api/connectors/readiness` exclusion. The new route regression was red before registration and green after; existing route-isolation checks now accept the array while still requiring the wildcard and exclusion. No auth bypass or static rewrite is introduced.

A broader unchanged test, `production truth remains exact-SHA and delivery-lane scoped`, expects `createDeliveryPlan` in the main production-readback workflow, which current main no longer contains. This preexisting assertion is recorded rather than hiding it; its source and policy are not weakened.
