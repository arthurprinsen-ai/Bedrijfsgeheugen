# Adaptive Delivery Engine v1 — activity ledger

Date: 2026-09-28
Obligation: adaptive-delivery-engine-v1

Implemented the next GitHub delivery acceleration layer on top of the existing single-flight/lane/build-once foundation.

Material changes:
- R0–R4 risk classification before expensive CI.
- Test Impact Graph with capability-specific regression routing.
- Hot-path escalation for delivery-control-plane and production-sensitive files.
- Fail-closed R3 classification for unknown executable paths.
- Fast impact quality gate for low-risk non-runtime changes.
- Full shared regression suite retained for R2–R4 candidates.
- Adaptive delivery registered as a Powerhouse control-plane capability.
- Delivery self-optimization and concurrency skills updated.

Evidence:
- Regression: tests/brain-adaptive-delivery-engine-v1.test.mjs
- Canonical policy: config/powerhouse-adaptive-delivery-v1.json
- Compiler: tools/delivery/adaptive-delivery-engine.mjs
- Canonical gate: .github/workflows/required-test.yml
