# 2026-10-20 — authenticated portal 502 operator-only classification

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: portal|upstream-failure-classification|20261020
Delivery-Lane: portal
Candidate-Type: recovery
Scope-Budget: 7
Base-SHA: 7664ef5251ad7974574a1097e93dd747588f38f7
Status: SOURCE_CANDIDATE / NOT_LIVE

Production evidence: authenticated checks in run #39430198530 attempt 3 returned 502 for 30 trials, even after both portal indexes and a healthy short DB window. Generic error handling hides whether failure is provider response, network fetch or tenant shape. Netlify target project URL and service-token presence were checked without exposing the token.

Change: bounded operator-only category, fail-closed response-shape; preserve status codes, tenant auth, cache no-store, scheduler and original route. Existing tests extended; no new database schema, second source, social sender or preview provisioned.

Next: Required CI, CodeQL and authorized preview, protected merge, exact Netlify production verification, authenticated tenant1/tenant2 true source data and outcome. No fabricated green.
