# Development ledger — autonomous CI fan-out ratchet v1

- Date: 2026-10-06
- Failure class: autonomous control-plane jobs contributing to the PR fan-out they are meant to optimize.
- Fix: optimizer/self-evolution are schedule/manual only; Required owns their regression contracts.
- Telemetry: Required queue p95, Required total p95, workflow fan-out p95 and direct PR workflow count.
- Learning rule: direct PR workflow budget may only decrease automatically.
- Safety: release/security/protected merge/exact-SHA/production readback remain fail-closed.
