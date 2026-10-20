# Instagram canonical identity alias reconciliation

Date: 2026-10-19

- Observation: provider-verified Instagram business identity `bedrijfsgeheugen.nl` has a different alias from the setup's historical sole preferred alias.
- Failure: multiple active connections can block selection. Historical aliases for the personal Instagram identity must not be treated as publishing authority for the business identity.
- Correction: shared fail-closed provider-identity-plus-canonical-alias selection, proven with regression scenarios.
- Boundaries: no login/token sharing, no video safety override, no duplicate post, no direct deploy from a working branch.
- Acceptance gate: CI, protected merge, exact deployed provider readback, and separate approved final video evidence.
