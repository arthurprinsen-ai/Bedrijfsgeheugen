# Development ledger — durable terminal evidence recovery v2

- Date: 2026-10-06
- Obligation: terminal-evidence-timeout-retry-20261006-v1
- Incident 1: post-merge terminal closure returned HTTP 422 timeout after the database had already committed terminal state.
- Incident 2: rerun selected a different production readback mode and hit `OPERATION_CREATE_FAILED:IDEMPOTENCY_PAYLOAD_CONFLICT` for the same obligation/main identity.
- Proven durable state: obligation FULFILLED, operation VERIFIED, delivery evidence GREEN on merge `8223fcd78e33f1771dd8e6d983a9a2d18f0ed444`.
- Structural fix: OIDC-authenticated endpoint performs bounded durable cockpit recovery for exact timeout/idempotency-conflict signatures; one outer timeout retry remains in the workflow.
- Fail-closed boundaries: provider-readback obligations cannot use the fallback; exact obligation/main identity, verified operation/outcome, non-red evidence, migration condition and skill projection are preserved.
- Regression: `tests/brain-terminal-evidence-timeout-retry-v1.test.mjs`.
