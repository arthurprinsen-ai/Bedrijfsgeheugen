# Verified tenant AI execution gate vs immutable review event

- Obligation-ID: tenant-ai-approved-review-execution-deadlock-20261008-v1
- Existing-state-first: tenant-ai-inference-handler, verified-ai-runtime, attested-cloud-ai.
- Failure: a REVIEW_REQUIRED audit flag had no compliant transition to a separate approval, permanently preventing authorized routing.
- Correction: compare exact tenant, change ID and version with signed receipt, then enforce independent all-scope approval with existing trusted runtime verifier.
- Regression: `tests/brain-tenant-ai-inference-gateway-v1.test.mjs` covers authorized approval, stale review version, cross-tenant mismatch and missing review.
- Guardrails: no user-provided provider URL, secret or receipt; no automatic fallback or green CSRD claim.
- Provider/customer production readback: pending protected merge and actual authorized provider credentials, with an inability to claim live inference until demonstrated.
