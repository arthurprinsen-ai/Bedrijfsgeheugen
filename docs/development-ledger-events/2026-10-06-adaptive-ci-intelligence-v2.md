# Development ledger — Adaptive CI Intelligence v2

- Date: 2026-10-06
- Obligation: adaptive-ci-intelligence-v2-20261006
- Problem: CI optimization lacked Required-specific SLOs/direct-PR counts and generated self-induced PR fan-out/no-op tuning PRs.
- Change: CI Intelligence v2, monotone direct-PR ratchet, duplicate/successor-churn metrics, immutable critical-path SLOs.
- Fan-out: optimizer and Daily Self Evolution are schedule/manual only; PR verification is owned by Required.
- Safety: no autonomous gate weakening; Required, CodeQL, exact-SHA, protected merge and production readback stay mandatory.
- Regression: tests/brain-autonomous-engineering-fabric-v3.test.mjs and tests/powerhouse-daily-self-evolution.test.mjs.
