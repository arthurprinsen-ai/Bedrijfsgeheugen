# Development activity — 2026-10-10

Obligation-ID: p0-4198-linkedin-rotation-consumed-claim
Production owner: canonical POWERHOUSE (single writer)
Source: personal LinkedIn consumed capability without external post ID; company duplicate story family matched October 3.
Changes: keep uncertain consumed capability fenced; remember refused company recommendation and select next evidence-backed alternative; do not bypass global uniqueness.
Risk: authorized transport still requires actual provider OAuth consent and exact post IDs.
Validation: tests/brain-linkedin-source-rotation-and-consumed-capability-p0-4198.test.mjs, protected CI and production Edge source-parity check.
Expected result: no regeneration loops after ambiguous provider mutations; no same duplicate recommendation indefinitely; all future publishing still uses same canonical daily executor.
