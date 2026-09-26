# 2026-09-26 — social-provider-health-preflight-v1

- Failure class: SOCIAL_PROVIDER_AUTH_FALSE_POSITIVE
- Root cause: Composio ACTIVE metadata was treated as OAuth/provider readiness.
- Observed evidence: all three LinkedIn connections returned 401 REVOKED_ACCESS_TOKEN; Instagram ACTIVE connections did not establish the canonical bedrijfsgeheugen.nl identity.
- Change: health-verified account selection in LinkedIn/Instagram setup and pre-claim provider health gates in powerhouse-social-publisher.
- Duplicate policy: auth recovery reuses the same claim/artifact; no new provider side effect before health proof.
- Regression: tests/social-provider-health-preflight.test.mjs
- Production proof required: setup-state health_verified=true, canonical account identity, successful social publisher run, provider-side readback.
