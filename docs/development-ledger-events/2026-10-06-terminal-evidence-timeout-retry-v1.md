# Development ledger — terminal evidence timeout retry v1

- Date: 2026-10-06
- Obligation: terminal-evidence-timeout-retry-20261006-v1
- Incident: post-merge terminal closure failed on HTTP 422 timeout after the database had already committed the terminal state.
- Proven durable state: obligation FULFILLED, operation VERIFIED, delivery evidence GREEN on merge 8223fcd78e33f1771dd8e6d983a9a2d18f0ed444.
- Structural fix: one idempotent retry only for the exact timeout-after-commit signature.
- Safety: every other HTTP failure remains fail-closed; final durable readback assertions are unchanged.
- Regression: tests/brain-terminal-evidence-timeout-retry-v1.test.mjs.
